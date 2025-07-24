# config.py
import os
import sys
import logging

# Настройки из переменных окружения
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "7671454193:AAFS2qJjK-LXvkIYmRu65P8dSgm6hrkiAKM")
TESTNET = os.getenv("TESTNET", "false").lower() == "true"

# Валидные коды активации (лучше хранить в БД с хешированием)
VALID_ACTIVATION_CODES = {"Spike"}

# Валидные промокоды с параметрами (УСТАРЕЛО - теперь используется база данных)
# Оставлено для обратной совместимости
PROMO_CODES = {
    "1день": {"days": 1, "description": "Тестовый доступ на 1 день"},
    "30дней": {"days": 30, "description": "Полный доступ на месяц"},
    "7дней": {"days": 7, "description": "Пробный период"}
}

# Настройки промокодов
PROMO_CODE_SETTINGS = {
    "default_length": 8,  # Длина генерируемых промокодов
    "allow_custom_codes": True,  # Разрешить создание кастомных промокодов
    "max_bulk_create": 100,  # Максимальное количество промокодов за раз
    "cleanup_interval_hours": 24,  # Интервал очистки истекших промокодов
    "one_promo_per_user": True  # Один промокод на пользователя
}

# Права администратора (ID пользователей Telegram)
ADMIN_IDS = {
    538361798
}

# Настройки по умолчанию
DEFAULT_PERIOD = 10  # минут
DEFAULT_PERCENT = 3.0  # процент изменения
MAX_RETRIES = 50
RETRY_DELAY = 1

# Настройка кодировки для Windows
if os.name == 'nt':  # Windows
    # Принудительно устанавливаем UTF-8 для stdout/stderr
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')


# Создание логгера с правильной кодировкой
def setup_logger():
    logger = logging.getLogger('config')
    logger.setLevel(logging.INFO)

    # Создаем обработчик для файла с UTF-8 кодировкой
    file_handler = logging.FileHandler('bot.log', encoding='utf-8')
    file_handler.setLevel(logging.INFO)

    # Создаем обработчик для консоли
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)

    # Формат сообщения
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    # Добавляем обработчики
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger


logger = setup_logger()


def is_admin(user_id: int) -> bool:
    """Проверить, является ли пользователь администратором"""
    return user_id in ADMIN_IDS