import sqlite3
import secrets
import string
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List, Any
from contextlib import contextmanager

from config import logger

# Пул соединений для многопоточности
import threading

_local = threading.local()


@contextmanager
def get_promo_db_connection():
    """Контекстный менеджер для безопасной работы с БД промокодов"""
    if not hasattr(_local, 'promo_connection'):
        _local.promo_connection = sqlite3.connect("users.db", check_same_thread=False)
        _local.promo_connection.row_factory = sqlite3.Row

    conn = _local.promo_connection
    try:
        yield conn
    except Exception as e:
        logger.error(f"Promo database error: {e}")
        conn.rollback()
        raise
    else:
        conn.commit()


def init_promo_db():
    """Инициализация таблиц для промокодов"""
    with get_promo_db_connection() as conn:
        c = conn.cursor()

        # Создание таблицы промокодов
        c.execute('''CREATE TABLE IF NOT EXISTS promo_codes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        code TEXT UNIQUE NOT NULL,
                        days INTEGER NOT NULL CHECK(days > 0),
                        description TEXT,
                        is_used INTEGER DEFAULT 0,
                        used_by_user_id INTEGER,
                        used_at TEXT,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        expires_at TEXT,
                        created_by_admin TEXT
                    )''')

        # Создание индексов
        c.execute('''CREATE INDEX IF NOT EXISTS idx_promo_code 
                     ON promo_codes(code)''')
        c.execute('''CREATE INDEX IF NOT EXISTS idx_promo_used 
                     ON promo_codes(is_used)''')
        c.execute('''CREATE INDEX IF NOT EXISTS idx_promo_expires 
                     ON promo_codes(expires_at)''')

        logger.info("Promo codes database initialized successfully")


class PromoCodeManager:
    """Класс для управления промокодами"""

    @staticmethod
    def generate_promo_code(length: int = 8) -> str:
        """Генерировать уникальный промокод"""
        characters = string.ascii_uppercase + string.digits
        while True:
            code = ''.join(secrets.choice(characters) for _ in range(length))
            # Проверяем уникальность
            if not PromoCodeManager._code_exists(code):
                return code

    @staticmethod
    def _code_exists(code: str) -> bool:
        """Проверить существование промокода"""
        try:
            with get_promo_db_connection() as conn:
                c = conn.cursor()
                c.execute("SELECT id FROM promo_codes WHERE code = ?", (code,))
                return c.fetchone() is not None
        except Exception:
            return True  # В случае ошибки считаем, что код существует

    @staticmethod
    def create_promo_code(days: int, description: str = "", expires_in_days: Optional[int] = None,
                          created_by_admin: str = "system", custom_code: Optional[str] = None) -> Optional[str]:
        """Создать новый промокод"""
        try:
            code = custom_code if custom_code else PromoCodeManager.generate_promo_code()

            # Проверяем уникальность пользовательского кода
            if custom_code and PromoCodeManager._code_exists(custom_code):
                return None

            expires_at = None
            if expires_in_days:
                expires_at = (datetime.now(timezone.utc) + timedelta(days=expires_in_days)).strftime(
                    '%Y-%m-%d %H:%M:%S')

            with get_promo_db_connection() as conn:
                c = conn.cursor()
                c.execute("""
                    INSERT INTO promo_codes (code, days, description, expires_at, created_by_admin)
                    VALUES (?, ?, ?, ?, ?)
                """, (code, days, description, expires_at, created_by_admin))

                logger.info(f"Created promo code: {code} for {days} days by {created_by_admin}")
                return code

        except Exception as e:
            logger.error(f"Error creating promo code: {e}")
            return None

    @staticmethod
    def create_bulk_promo_codes(count: int, days: int, description: str = "",
                                expires_in_days: Optional[int] = None,
                                created_by_admin: str = "system") -> List[str]:
        """Создать несколько промокодов"""
        created_codes = []

        for _ in range(count):
            code = PromoCodeManager.create_promo_code(
                days=days,
                description=description,
                expires_in_days=expires_in_days,
                created_by_admin=created_by_admin
            )
            if code:
                created_codes.append(code)

        logger.info(f"Created {len(created_codes)} promo codes by {created_by_admin}")
        return created_codes

    @staticmethod
    def get_promo_code_info(code: str) -> Optional[Dict[str, Any]]:
        """Получить информацию о промокоде"""
        try:
            with get_promo_db_connection() as conn:
                c = conn.cursor()
                c.execute("SELECT * FROM promo_codes WHERE code = ?", (code,))
                row = c.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error getting promo code info for {code}: {e}")
            return None

    @staticmethod
    def use_promo_code(code: str, user_id: int) -> Dict[str, Any]:
        """Использовать промокод"""
        try:
            with get_promo_db_connection() as conn:
                c = conn.cursor()

                # Получаем информацию о промокоде
                c.execute("""
                    SELECT id, days, description, is_used, expires_at 
                    FROM promo_codes 
                    WHERE code = ?
                """, (code,))

                promo_data = c.fetchone()

                if not promo_data:
                    return {"success": False, "error": "PROMO_NOT_FOUND", "message": "Промокод не найден"}

                if promo_data['is_used']:
                    return {"success": False, "error": "PROMO_USED", "message": "Промокод уже использован"}

                # Проверяем срок действия
                if promo_data['expires_at']:
                    expires_date = datetime.strptime(promo_data['expires_at'], '%Y-%m-%d %H:%M:%S').replace(
                        tzinfo=timezone.utc)
                    if datetime.now(timezone.utc) > expires_date:
                        return {"success": False, "error": "PROMO_EXPIRED", "message": "Срок действия промокода истек"}

                # Проверяем, не использовал ли пользователь уже другой промокод
                c.execute("""
                    SELECT code FROM promo_codes 
                    WHERE used_by_user_id = ? AND is_used = 1
                """, (user_id,))

                existing_usage = c.fetchone()
                if existing_usage:
                    return {
                        "success": False,
                        "error": "USER_ALREADY_USED_PROMO",
                        "message": f"Вы уже использовали промокод: {existing_usage['code']}"
                    }

                # Отмечаем промокод как использованный
                used_at = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
                c.execute("""
                    UPDATE promo_codes 
                    SET is_used = 1, used_by_user_id = ?, used_at = ? 
                    WHERE code = ?
                """, (user_id, used_at, code))

                logger.info(f"User {user_id} successfully used promo code: {code}")

                return {
                    "success": True,
                    "days": promo_data['days'],
                    "description": promo_data['description'] or f"Доступ на {promo_data['days']} дней",
                    "code": code
                }

        except Exception as e:
            logger.error(f"Error using promo code {code} by user {user_id}: {e}")
            return {"success": False, "error": "DATABASE_ERROR", "message": "Ошибка базы данных"}

    @staticmethod
    def cleanup_expired_promo_codes():
        """Удалить истекшие неиспользованные промокоды"""
        try:
            with get_promo_db_connection() as conn:
                c = conn.cursor()
                c.execute("""
                    DELETE FROM promo_codes 
                    WHERE expires_at IS NOT NULL 
                    AND datetime(expires_at) <= datetime('now') 
                    AND is_used = 0
                """)

                if c.rowcount > 0:
                    logger.info(f"Cleaned up {c.rowcount} expired promo codes")

                return c.rowcount

        except Exception as e:
            logger.error(f"Error cleaning up expired promo codes: {e}")
            return 0

    @staticmethod
    def get_promo_stats() -> Dict[str, int]:
        """Получить статистику по промокодам"""
        try:
            with get_promo_db_connection() as conn:
                c = conn.cursor()

                # Общее количество
                c.execute("SELECT COUNT(*) as total FROM promo_codes")
                total = c.fetchone()['total']

                # Использованные
                c.execute("SELECT COUNT(*) as used FROM promo_codes WHERE is_used = 1")
                used = c.fetchone()['used']

                # Активные (не использованные и не истекшие)
                c.execute("""
                    SELECT COUNT(*) as active FROM promo_codes 
                    WHERE is_used = 0 
                    AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
                """)
                active = c.fetchone()['active']

                # Истекшие
                c.execute("""
                    SELECT COUNT(*) as expired FROM promo_codes 
                    WHERE is_used = 0 
                    AND expires_at IS NOT NULL 
                    AND datetime(expires_at) <= datetime('now')
                """)
                expired = c.fetchone()['expired']

                return {
                    "total": total,
                    "used": used,
                    "active": active,
                    "expired": expired
                }

        except Exception as e:
            logger.error(f"Error getting promo stats: {e}")
            return {"total": 0, "used": 0, "active": 0, "expired": 0}

    @staticmethod
    def get_all_promo_codes(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Получить список всех промокодов"""
        try:
            with get_promo_db_connection() as conn:
                c = conn.cursor()
                c.execute("""
                    SELECT * FROM promo_codes 
                    ORDER BY created_at DESC 
                    LIMIT ? OFFSET ?
                """, (limit, offset))

                return [dict(row) for row in c.fetchall()]

        except Exception as e:
            logger.error(f"Error getting all promo codes: {e}")
            return []

    @staticmethod
    def delete_promo_code(code: str) -> bool:
        """Удалить промокод"""
        try:
            with get_promo_db_connection() as conn:
                c = conn.cursor()
                c.execute("DELETE FROM promo_codes WHERE code = ? AND is_used = 0", (code,))

                if c.rowcount > 0:
                    logger.info(f"Deleted unused promo code: {code}")
                    return True
                else:
                    logger.warning(f"Could not delete promo code {code} (not found or already used)")
                    return False

        except Exception as e:
            logger.error(f"Error deleting promo code {code}: {e}")
            return False


if __name__ == '__main__':
    # Инициализация БД промокодов
    init_promo_db()

    # Примеры использования
    manager = PromoCodeManager()

    # Создание одного промокода
    code = manager.create_promo_code(days=30, description="Тестовый промокод на месяц")
    print(f"Created promo code: {code}")

    # Создание нескольких промокодов
    codes = manager.create_bulk_promo_codes(
        count=5,
        days=7,
        description="Пробный период на неделю",
        expires_in_days=30
    )
    print(f"Created bulk promo codes: {codes}")

    # Статистика
    stats = manager.get_promo_stats()
    print(f"Promo statistics: {stats}")