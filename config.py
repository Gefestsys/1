# config.py
import os
import sys
import logging

# Настройки из переменных окружения
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "7671454193:AAFS2qJjK-LXvkIYmRu65P8dSgm6hrkiAKM")
TESTNET = os.getenv("TESTNET", "false").lower() == "true"

# Валидные коды активации (лучше хранить в БД с хешированием)
VALID_ACTIVATION_CODES = {"12345", "TEST123", "DEMO456"}

# Валидные промокоды с параметрами
PROMO_CODES = {
    "1день": {"days": 1, "description": "Тестовый доступ на 1 день"},
    "30дней": {"days": 30, "description": "Полный доступ на месяц"},
    "7дней": {"days": 7, "description": "Пробный период"}
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
