# activation_manager.py
import sqlite3
# Пул соединений для многопоточности
import threading
from contextlib import contextmanager
from typing import List, Dict, Any

from config import logger

_local = threading.local()


@contextmanager
def get_activation_db_connection():
    """Контекстный менеджер для безопасной работы с БД активационных кодов"""
    if not hasattr(_local, 'activation_connection'):
        _local.activation_connection = sqlite3.connect("users.db", check_same_thread=False)
        _local.activation_connection.row_factory = sqlite3.Row

    conn = _local.activation_connection
    try:
        yield conn
    except Exception as e:
        logger.error(f"Activation database error: {e}")
        conn.rollback()
        raise
    else:
        conn.commit()


def init_activation_db():
    """Инициализация таблицы активационных кодов"""
    with get_activation_db_connection() as conn:
        c = conn.cursor()

        # Создание таблицы активационных кодов
        c.execute('''CREATE TABLE IF NOT EXISTS activation_codes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        code TEXT UNIQUE NOT NULL,
                        is_permanent INTEGER DEFAULT 0,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        created_by_admin TEXT,
                        is_active INTEGER DEFAULT 1
                    )''')

        # Создание индексов
        c.execute('''CREATE INDEX IF NOT EXISTS idx_activation_code 
                     ON activation_codes(code)''')
        c.execute('''CREATE INDEX IF NOT EXISTS idx_activation_active 
                     ON activation_codes(is_active)''')

        # Добавляем постоянный код "Spike" если его нет
        c.execute(
            "INSERT OR IGNORE INTO activation_codes (code, is_permanent, created_by_admin) VALUES (?, 1, 'system')",
            ("Spike",))

        logger.info("Activation codes database initialized successfully")


class ActivationCodeManager:
    """Класс для управления кодами активации"""

    @staticmethod
    def add_activation_code(code: str, created_by_admin: str) -> bool:
        """Добавить новый код активации"""
        try:
            with get_activation_db_connection() as conn:
                c = conn.cursor()
                c.execute("""
                    INSERT INTO activation_codes (code, created_by_admin) 
                    VALUES (?, ?)
                """, (code.strip(), created_by_admin))

                logger.info(f"Activation code '{code}' added by {created_by_admin}")
                return True

        except sqlite3.IntegrityError:
            logger.warning(f"Activation code '{code}' already exists")
            return False
        except Exception as e:
            logger.error(f"Error adding activation code '{code}': {e}")
            return False

    @staticmethod
    def remove_activation_code(code: str) -> bool:
        """Удалить код активации (кроме постоянных)"""
        try:
            with get_activation_db_connection() as conn:
                c = conn.cursor()

                # Проверяем, является ли код постоянным
                c.execute("SELECT is_permanent FROM activation_codes WHERE code = ?", (code,))
                result = c.fetchone()

                if not result:
                    return False  # Код не найден

                if result['is_permanent']:
                    logger.warning(f"Cannot remove permanent activation code '{code}'")
                    return False  # Нельзя удалить постоянный код

                c.execute("DELETE FROM activation_codes WHERE code = ? AND is_permanent = 0", (code,))

                if c.rowcount > 0:
                    logger.info(f"Activation code '{code}' removed")
                    return True
                else:
                    return False

        except Exception as e:
            logger.error(f"Error removing activation code '{code}': {e}")
            return False

    @staticmethod
    def is_valid_activation_code(code: str) -> bool:
        """Проверить валидность кода активации"""
        try:
            with get_activation_db_connection() as conn:
                c = conn.cursor()
                c.execute("""
                    SELECT COUNT(*) as count FROM activation_codes 
                    WHERE code = ? AND is_active = 1
                """, (code.strip(),))

                result = c.fetchone()
                return result['count'] > 0

        except Exception as e:
            logger.error(f"Error checking activation code '{code}': {e}")
            return False

    @staticmethod
    def get_all_activation_codes() -> List[Dict[str, Any]]:
        """Получить все коды активации"""
        try:
            with get_activation_db_connection() as conn:
                c = conn.cursor()
                c.execute("""
                    SELECT code, is_permanent, created_at, created_by_admin, is_active
                    FROM activation_codes 
                    WHERE is_active = 1
                    ORDER BY is_permanent DESC, created_at DESC
                """)

                return [dict(row) for row in c.fetchall()]

        except Exception as e:
            logger.error(f"Error getting activation codes: {e}")
            return []

    @staticmethod
    def get_activation_stats() -> Dict[str, int]:
        """Получить статистику по кодам активации"""
        try:
            with get_activation_db_connection() as conn:
                c = conn.cursor()

                # Общее количество активных кодов
                c.execute("SELECT COUNT(*) as total FROM activation_codes WHERE is_active = 1")
                total = c.fetchone()['total']

                # Количество постоянных кодов
                c.execute("SELECT COUNT(*) as permanent FROM activation_codes WHERE is_permanent = 1 AND is_active = 1")
                permanent = c.fetchone()['permanent']

                # Количество временных кодов
                temporary = total - permanent

                return {
                    'total': total,
                    'permanent': permanent,
                    'temporary': temporary
                }

        except Exception as e:
            logger.error(f"Error getting activation stats: {e}")
            return {'total': 0, 'permanent': 0, 'temporary': 0}

    @staticmethod
    def deactivate_activation_code(code: str) -> bool:
        """Деактивировать код активации (не удаляя из БД)"""
        try:
            with get_activation_db_connection() as conn:
                c = conn.cursor()

                # Проверяем, является ли код постоянным
                c.execute("SELECT is_permanent FROM activation_codes WHERE code = ?", (code,))
                result = c.fetchone()

                if not result:
                    return False  # Код не найден

                if result['is_permanent']:
                    logger.warning(f"Cannot deactivate permanent activation code '{code}'")
                    return False  # Нельзя деактивировать постоянный код

                c.execute("UPDATE activation_codes SET is_active = 0 WHERE code = ? AND is_permanent = 0", (code,))

                if c.rowcount > 0:
                    logger.info(f"Activation code '{code}' deactivated")
                    return True
                else:
                    return False

        except Exception as e:
            logger.error(f"Error deactivating activation code '{code}': {e}")
            return False


# Функция для инициализации (вызывается из db_sqlite.py)
def init_activation_system():
    """Инициализация системы активационных кодов"""
    init_activation_db()


if __name__ == '__main__':
    init_activation_db()
    print("✅ База данных активационных кодов инициализирована")