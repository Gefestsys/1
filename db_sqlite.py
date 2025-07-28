import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from activation_manager import init_activation_system
from config import logger

# Пул соединений для многопоточности
_local = threading.local()


@contextmanager
def get_db_connection():
    """Контекстный менеджер для безопасной работы с БД"""
    if not hasattr(_local, 'connection'):
        _local.connection = sqlite3.connect("users.db", check_same_thread=False)
        _local.connection.row_factory = sqlite3.Row

    conn = _local.connection
    try:
        yield conn
    except Exception as e:
        logger.error(f"Database error: {e}")
        conn.rollback()
        raise
    else:
        conn.commit()


# Обновите функцию init_db() чтобы включить инициализацию промокодов
def init_db():
    """Инициализация базы данных с индексами"""
    with get_db_connection() as conn:
        c = conn.cursor()

        # Создание таблицы пользователей
        c.execute('''CREATE TABLE IF NOT EXISTS users (
                        user_id INTEGER PRIMARY KEY,
                        period INTEGER DEFAULT 10 CHECK(period > 0),
                        percent REAL DEFAULT 3.0 CHECK(percent > 0),
                        is_active INTEGER DEFAULT 0,
                        activation_code TEXT,
                        promo_code TEXT,
                        subscribe_until TEXT DEFAULT NULL,
                        language TEXT DEFAULT 'ru' CHECK(language IN ('ru', 'en')),
                        language_selected INTEGER DEFAULT 0,
                        exchange TEXT DEFAULT 'tradingview' CHECK(exchange IN ('tradingview', 'binance', 'bybit', 'bingx', 'okx', 'bitget')),
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )''')

        # Миграция: добавляем новые поля, если они не существуют
        try:
            c.execute("ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'ru' CHECK(language IN ('ru', 'en'))")
            logger.info("Added language column to users table")
        except sqlite3.OperationalError:
            # Поле уже существует
            pass

        try:
            c.execute("ALTER TABLE users ADD COLUMN language_selected INTEGER DEFAULT 0")
            logger.info("Added language_selected column to users table")
        except sqlite3.OperationalError:
            # Поле уже существует
            pass

        try:
            c.execute(
                "ALTER TABLE users ADD COLUMN exchange TEXT DEFAULT 'tradingview' CHECK(exchange IN ('tradingview', 'binance', 'bybit', 'bingx', 'okx', 'bitget'))")
            logger.info("Added exchange column to users table")
        except sqlite3.OperationalError:
            # Поле уже существует
            pass

        # Создание индексов для оптимизации
        c.execute('''CREATE INDEX IF NOT EXISTS idx_user_active 
                     ON users(user_id, is_active)''')
        c.execute('''CREATE INDEX IF NOT EXISTS idx_subscribe_until 
                     ON users(subscribe_until)''')
        c.execute('''CREATE INDEX IF NOT EXISTS idx_language 
                     ON users(language)''')
        c.execute('''CREATE INDEX IF NOT EXISTS idx_exchange 
                     ON users(exchange)''')

        # Триггер для автоматического обновления updated_at
        c.execute('''CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
                     AFTER UPDATE ON users
                     BEGIN
                         UPDATE users SET updated_at = CURRENT_TIMESTAMP 
                         WHERE user_id = NEW.user_id;
                     END''')

        logger.info("Database initialized successfully")

    # Инициализация системы активационных кодов
    try:
        init_activation_system()
    except ImportError:
        logger.warning("Activation manager not found, skipping activation database initialization")

    # Инициализация таблиц промокодов
    try:
        from promo_manager import init_promo_db
        init_promo_db()
    except ImportError:
        logger.warning("Promo manager not found, skipping promo database initialization")


class UserManager:
    """Класс для управления пользователями"""

    @staticmethod
    def add_or_update_user(user_id: int, **kwargs) -> bool:
        """Добавить или обновить пользователя"""
        try:
            with get_db_connection() as conn:
                c = conn.cursor()

                # Проверяем существование пользователя
                c.execute("SELECT user_id FROM users WHERE user_id = ?", (user_id,))
                exists = c.fetchone()

                if exists:
                    # Обновляем существующего пользователя
                    set_clauses = []
                    params = []
                    for key, value in kwargs.items():
                        if value is not None:
                            set_clauses.append(f"{key} = ?")
                            params.append(value)

                    if set_clauses:
                        params.append(user_id)
                        query = f"UPDATE users SET {', '.join(set_clauses)} WHERE user_id = ?"
                        c.execute(query, params)
                else:
                    # Создаем нового пользователя
                    defaults = {
                        'period': 10,
                        'percent': 3.0,
                        'language': 'ru',
                        'language_selected': 0,
                        'exchange': 'tradingview'
                    }
                    defaults.update(kwargs)

                    columns = ['user_id'] + list(defaults.keys())
                    values = [user_id] + list(defaults.values())
                    placeholders = ', '.join(['?'] * len(columns))

                    query = f"INSERT INTO users ({', '.join(columns)}) VALUES ({placeholders})"
                    c.execute(query, values)

                logger.info(f"User {user_id} {'updated' if exists else 'created'}")
                return True

        except Exception as e:
            logger.error(f"Error adding/updating user {user_id}: {e}")
            return False

    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
        """Получить пользователя по ID"""
        try:
            with get_db_connection() as conn:
                c = conn.cursor()
                c.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
                row = c.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error getting user {user_id}: {e}")
            return None

    @staticmethod
    def update_user_settings(user_id: int, period: int = None, percent: float = None) -> bool:
        """Обновить настройки пользователя"""
        updates = {}
        if period is not None:
            updates['period'] = period
        if percent is not None:
            updates['percent'] = percent

        return UserManager.add_or_update_user(user_id, **updates)

    @staticmethod
    def set_user_active(user_id: int, active: bool = True) -> bool:
        """Активировать/деактивировать пользователя"""
        return UserManager.add_or_update_user(user_id, is_active=1 if active else 0)

    @staticmethod
    def activate_subscription(user_id: int, days: int) -> bool:
        """Активировать подписку на определенное количество дней"""
        try:
            subscribe_until = (datetime.now(timezone.utc) + timedelta(days=days)).strftime('%Y-%m-%d %H:%M:%S')
            success = UserManager.add_or_update_user(user_id, subscribe_until=subscribe_until)

            if success:
                logger.info(f"Subscription activated for user {user_id} for {days} days")

            return success
        except Exception as e:
            logger.error(f"Error activating subscription for user {user_id}: {e}")
            return False

    @staticmethod
    def is_user_subscribed(user_id: int) -> bool:
        """Проверить активность подписки"""
        user = UserManager.get_user_by_id(user_id)
        if not user or not user.get('subscribe_until'):
            return False

        try:
            end_date = datetime.strptime(user['subscribe_until'], '%Y-%m-%d %H:%M:%S').replace(tzinfo=timezone.utc)
            return datetime.now(timezone.utc) < end_date
        except Exception as e:
            logger.error(f"Error checking subscription for user {user_id}: {e}")
            return False

    @staticmethod
    def get_subscription_status(user_id: int, language: str = 'ru') -> str:
        """Получить статус подписки в читаемом виде"""
        from localization import get_text

        user = UserManager.get_user_by_id(user_id)
        if not user or not user.get('subscribe_until'):
            return get_text('subscription_inactive', language)

        try:
            end_date = datetime.strptime(user['subscribe_until'], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)

            if end_date > now:
                days_left = (end_date - now).days + 1  # +1 для включения текущего дня
                return get_text('subscription_active', language,
                                date=end_date.strftime('%d.%m.%Y %H:%M'),
                                days=days_left)
            else:
                return get_text('subscription_expired', language,
                                date=end_date.strftime('%d.%m.%Y %H:%M'))
        except Exception as e:
            logger.error(f"Error formatting subscription status for user {user_id}: {e}")
            return get_text('subscription_error', language)

    @staticmethod
    def get_all_subscribed_users() -> list:
        """Получить всех пользователей с активной подпиской"""
        try:
            with get_db_connection() as conn:
                c = conn.cursor()
                c.execute("""
                    SELECT user_id, period, percent, language, exchange 
                    FROM users 
                    WHERE subscribe_until IS NOT NULL 
                    AND datetime(subscribe_until) > datetime('now')
                """)
                return [dict(row) for row in c.fetchall()]
        except Exception as e:
            logger.error(f"Error getting subscribed users: {e}")
            return []

    @staticmethod
    def cleanup_expired_subscriptions():
        """Очистка истекших подписок"""
        try:
            with get_db_connection() as conn:
                c = conn.cursor()
                c.execute("""
                    UPDATE users 
                    SET subscribe_until = NULL 
                    WHERE subscribe_until IS NOT NULL 
                    AND datetime(subscribe_until) <= datetime('now')
                """)

                if c.rowcount > 0:
                    logger.info(f"Cleaned up {c.rowcount} expired subscriptions")
        except Exception as e:
            logger.error(f"Error cleaning up expired subscriptions: {e}")

    @staticmethod
    def get_user_language(user_id: int) -> str:
        """Получить язык пользователя"""
        try:
            user = UserManager.get_user_by_id(user_id)
            if user and user.get('language'):
                return user['language']
            return 'ru'  # По умолчанию русский
        except Exception as e:
            logger.error(f"Error getting user language: {e}")
            return 'ru'

    @staticmethod
    def set_user_language(user_id: int, language: str) -> bool:
        """Установить язык пользователя"""
        try:
            if language not in ['ru', 'en']:
                return False

            return UserManager.add_or_update_user(
                user_id,
                language=language,
                language_selected=1
            )
        except Exception as e:
            logger.error(f"Error setting user language: {e}")
            return False

    @staticmethod
    def is_language_selected(user_id: int) -> bool:
        """Проверить, выбрал ли пользователь язык"""
        try:
            user = UserManager.get_user_by_id(user_id)
            if user:
                return bool(user.get('language_selected', 0))
            return False
        except Exception as e:
            logger.error(f"Error checking language selection: {e}")
            return False

    @staticmethod
    def get_users_by_language(language: str) -> list:
        """Получить всех пользователей определенного языка"""
        try:
            with get_db_connection() as conn:
                c = conn.cursor()
                c.execute("""
                    SELECT user_id, period, percent, exchange 
                    FROM users 
                    WHERE language = ?
                    AND subscribe_until IS NOT NULL 
                    AND datetime(subscribe_until) > datetime('now')
                """, (language,))
                return [dict(row) for row in c.fetchall()]
        except Exception as e:
            logger.error(f"Error getting users by language {language}: {e}")
            return []

    @staticmethod
    def get_user_exchange(user_id: int) -> str:
        """Получить выбранную биржу пользователя"""
        try:
            user = UserManager.get_user_by_id(user_id)
            if user and user.get('exchange'):
                return user['exchange']
            return 'tradingview'  # По умолчанию TradingView
        except Exception as e:
            logger.error(f"Error getting user exchange: {e}")
            return 'tradingview'

    @staticmethod
    def set_user_exchange(user_id: int, exchange: str) -> bool:
        """Установить биржу пользователя"""
        try:
            valid_exchanges = ['tradingview', 'binance', 'bybit', 'bingx', 'okx', 'bitget']
            if exchange not in valid_exchanges:
                return False

            return UserManager.add_or_update_user(user_id, exchange=exchange)
        except Exception as e:
            logger.error(f"Error setting user exchange: {e}")
            return False

    @staticmethod
    def get_users_by_exchange(exchange: str) -> list:
        """Получить всех пользователей определенной биржи"""
        try:
            with get_db_connection() as conn:
                c = conn.cursor()
                c.execute("""
                    SELECT user_id, period, percent, language 
                    FROM users 
                    WHERE exchange = ?
                    AND subscribe_until IS NOT NULL 
                    AND datetime(subscribe_until) > datetime('now')
                """, (exchange,))
                return [dict(row) for row in c.fetchall()]
        except Exception as e:
            logger.error(f"Error getting users by exchange {exchange}: {e}")
            return []

    @staticmethod
    def get_users_by_exchange_and_language(exchange: str, language: str) -> list:
        """Получить всех пользователей определенной биржи и языка"""
        try:
            with get_db_connection() as conn:
                c = conn.cursor()
                c.execute("""
                    SELECT user_id, period, percent 
                    FROM users 
                    WHERE exchange = ? AND language = ?
                    AND subscribe_until IS NOT NULL 
                    AND datetime(subscribe_until) > datetime('now')
                """, (exchange, language))
                return [dict(row) for row in c.fetchall()]
        except Exception as e:
            logger.error(f"Error getting users by exchange {exchange} and language {language}: {e}")
            return []

    # Добавьте эти методы в класс UserManager в db_sqlite.py

    @staticmethod
    def has_used_promo_code(user_id: int) -> bool:
        """Проверить, использовал ли пользователь уже промокод"""
        try:
            with get_db_connection() as conn:
                c = conn.cursor()
                # Проверяем в таблице промокодов
                c.execute("""
                    SELECT COUNT(*) as count FROM promo_codes 
                    WHERE used_by_user_id = ? AND is_used = 1
                """, (user_id,))

                result = c.fetchone()
                return result['count'] > 0 if result else False

        except Exception as e:
            logger.error(f"Error checking promo usage for user {user_id}: {e}")
            return False

    @staticmethod
    def get_user_promo_code(user_id: int) -> Optional[str]:
        """Получить промокод, использованный пользователем"""
        try:
            with get_db_connection() as conn:
                c = conn.cursor()
                c.execute("""
                    SELECT code FROM promo_codes 
                    WHERE used_by_user_id = ? AND is_used = 1
                    ORDER BY used_at DESC
                    LIMIT 1
                """, (user_id,))

                result = c.fetchone()
                return result['code'] if result else None

        except Exception as e:
            logger.error(f"Error getting user promo code for {user_id}: {e}")
            return None

    @staticmethod
    def update_user_promo_usage(user_id: int, promo_code: str) -> bool:
        """Обновить информацию об использовании промокода (для обратной совместимости)"""
        try:
            return UserManager.add_or_update_user(user_id, promo_code=promo_code)
        except Exception as e:
            logger.error(f"Error updating promo usage for user {user_id}: {e}")
            return False


if __name__ == '__main__':
    init_db()
    print("✅ База данных инициализирована")