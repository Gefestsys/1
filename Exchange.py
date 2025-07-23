import re
import time
from typing import Dict, List

import requests

from config import logger


class ExchangeLinks:
    """Класс для генерации ссылок на торговые пары на различных биржах"""

    # Кэш для хранения доступных символов на биржах
    _symbol_cache: Dict[str, Dict[str, bool]] = {}
    _cache_timestamp: Dict[str, float] = {}
    _cache_duration = 3600  # 1 час кэширования

    @staticmethod
    def normalize_symbol(symbol: str) -> str:
        """Нормализация символа для использования в ссылках"""
        if symbol.endswith('USDT'):
            return symbol[:-4].upper()
        return symbol.upper()

    @staticmethod
    def is_valid_futures_symbol(symbol: str) -> bool:
        """Проверка что символ является валидным фьючерсом USDT"""
        return bool(re.match(r'^[A-Z0-9]+USDT$', symbol))

    @staticmethod
    def get_tradingview_link(symbol: str) -> str:
        """Генерация ссылки для TradingView"""
        normalized = ExchangeLinks.normalize_symbol(symbol)
        return f"https://www.tradingview.com/chart/?symbol=BYBIT%3A{normalized}USDT.P"

    @staticmethod
    def get_binance_link(symbol: str, language: str = 'ru') -> str:
        """Генерация ссылки для Binance с учетом языка"""
        normalized = ExchangeLinks.normalize_symbol(symbol)
        base_symbol = f"{normalized}USDT"

        # Определяем язык для ссылки
        if language == 'en':
            lang_param = 'en'
        elif language == 'ru':
            lang_param = 'ru'
        else:
            lang_param = 'en'  # по умолчанию английский

        return f"https://www.binance.com/{lang_param}/futures/{base_symbol}"

    @staticmethod
    def get_bybit_links(symbol: str) -> dict:
        """Генерация ссылок для Bybit с поддержкой мобильной версии"""
        normalized = ExchangeLinks.normalize_symbol(symbol)
        base_symbol = f"{normalized}USDT"

        return {
            'web': f"https://www.bybit.com/trade/usdt/{base_symbol}",
            # Deep link для мобильного приложения Bybit
            'mobile': f"https://bybit.onelink.me/EhY6?af_xp=custom&pid=uj&af_dp=bybitapp%3A%2F%2Fopen%2Fhome%3Ftab%3D2%26symbol%3D{base_symbol}&is_retargeting=true&c=h5_trading_popup&af_force_deeplink=true"
        }

    @staticmethod
    def get_bingx_link(symbol: str, language: str = 'ru') -> str:
        """Генерация ссылки для BingX с учетом языка"""
        normalized = ExchangeLinks.normalize_symbol(symbol)

        # Определяем язык для ссылки
        if language == 'en':
            lang_param = 'en-us'
        elif language == 'ru':
            lang_param = 'ru-ru'
        else:
            lang_param = 'en-us'  # по умолчанию английский

        return f"https://bingx.com/{lang_param}/perpetual/{normalized}-USDT"

    @staticmethod
    def get_okx_link(symbol: str) -> str:
        """Генерация ссылки для OKX"""
        normalized = ExchangeLinks.normalize_symbol(symbol)
        return f"https://www.okx.com/trade-swap/{normalized.lower()}-usdt-swap"

    @staticmethod
    def get_bitget_link(symbol: str) -> str:
        """Генерация ссылки для Bitget"""
        normalized = ExchangeLinks.normalize_symbol(symbol)
        base_symbol = f"{normalized}USDT"
        return f"https://www.bitget.com/futures/usdt/{base_symbol}"

    @staticmethod
    def _get_binance_symbols() -> List[str]:
        """Получение списка доступных символов с Binance"""
        try:
            response = requests.get(
                'https://fapi.binance.com/fapi/v1/exchangeInfo',
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                symbols = []
                for item in data.get('symbols', []):
                    if (item.get('status') == 'TRADING' and
                            item.get('contractType') == 'PERPETUAL' and
                            item.get('symbol', '').endswith('USDT')):
                        symbols.append(item['symbol'])
                return symbols
        except Exception as e:
            logger.error(f"Error fetching Binance symbols: {e}")
        return []

    @staticmethod
    def _get_bybit_symbols() -> List[str]:
        """Получение списка доступных символов с Bybit"""
        try:
            response = requests.get(
                'https://api.bybit.com/v5/market/instruments-info?category=linear',
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                symbols = []
                for item in data.get('result', {}).get('list', []):
                    if (item.get('status') == 'Trading' and
                            item.get('symbol', '').endswith('USDT')):
                        symbols.append(item['symbol'])
                return symbols
        except Exception as e:
            logger.error(f"Error fetching Bybit symbols: {e}")
        return []

    @staticmethod
    def _get_bingx_symbols() -> List[str]:
        """Получение списка доступных символов с BingX"""
        try:
            response = requests.get(
                'https://open-api.bingx.com/openApi/swap/v2/quote/contracts',
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                symbols = []
                for item in data.get('data', []):
                    if (item.get('status') == 1 and
                            item.get('symbol', '').endswith('-USDT')):
                        symbol = item['symbol'].replace('-', '')
                        symbols.append(symbol)
                return symbols
        except Exception as e:
            logger.error(f"Error fetching BingX symbols: {e}")
        return []

    @staticmethod
    def _get_okx_symbols() -> List[str]:
        """Получение списка доступных символов с OKX"""
        try:
            response = requests.get(
                'https://www.okx.com/api/v5/market/tickers?instType=SWAP',
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                symbols = []
                for item in data.get('data', []):
                    inst_id = item.get('instId', '')
                    if inst_id.endswith('-USDT-SWAP'):
                        symbol = inst_id.replace('-USDT-SWAP', 'USDT')
                        symbols.append(symbol)
                return symbols
        except Exception as e:
            logger.error(f"Error fetching OKX symbols: {e}")
        return []

    @staticmethod
    def _get_bitget_symbols() -> List[str]:
        """Получение списка доступных символов с Bitget"""
        try:
            response = requests.get(
                'https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES',
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                symbols = []
                for item in data.get('data', []):
                    symbol = item.get('symbol', '')
                    if symbol.endswith('USDT'):
                        symbols.append(symbol)
                return symbols
        except Exception as e:
            logger.error(f"Error fetching Bitget symbols: {e}")
        return []

    @staticmethod
    def _update_symbol_cache(exchange: str) -> None:
        """Обновление кэша символов для биржи"""
        try:
            current_time = time.time()

            if (exchange in ExchangeLinks._cache_timestamp and
                    current_time - ExchangeLinks._cache_timestamp[exchange] < ExchangeLinks._cache_duration):
                return

            logger.info(f"Updating symbol cache for {exchange}")

            if exchange == 'binance':
                symbols = ExchangeLinks._get_binance_symbols()
            elif exchange == 'bybit':
                symbols = ExchangeLinks._get_bybit_symbols()
            elif exchange == 'bingx':
                symbols = ExchangeLinks._get_bingx_symbols()
            elif exchange == 'okx':
                symbols = ExchangeLinks._get_okx_symbols()
            elif exchange == 'bitget':
                symbols = ExchangeLinks._get_bitget_symbols()
            else:
                symbols = []

            if exchange not in ExchangeLinks._symbol_cache:
                ExchangeLinks._symbol_cache[exchange] = {}

            ExchangeLinks._symbol_cache[exchange].clear()

            for symbol in symbols:
                ExchangeLinks._symbol_cache[exchange][symbol] = True

            ExchangeLinks._cache_timestamp[exchange] = current_time

            logger.info(f"Updated cache for {exchange}: {len(symbols)} symbols")

        except Exception as e:
            logger.error(f"Error updating symbol cache for {exchange}: {e}")

    @staticmethod
    def check_symbol_availability(symbol: str, exchange: str) -> bool:
        """Проверка доступности символа на бирже через API"""
        try:
            if not ExchangeLinks.is_valid_futures_symbol(symbol):
                return False

            exchange = exchange.lower()

            if exchange == 'tradingview':
                return True

            ExchangeLinks._update_symbol_cache(exchange)

            if exchange in ExchangeLinks._symbol_cache:
                return ExchangeLinks._symbol_cache[exchange].get(symbol, False)

            return False

        except Exception as e:
            logger.error(f"Error checking symbol availability for {symbol} on {exchange}: {e}")
            return False

    @staticmethod
    def get_exchange_link(symbol: str, exchange: str, is_mobile: bool = False, language: str = 'ru') -> str:
        """Получение ссылки для конкретной биржи с учетом языка"""
        try:
            if not ExchangeLinks.is_valid_futures_symbol(symbol):
                logger.warning(f"Invalid futures symbol: {symbol}")
                return ExchangeLinks.get_tradingview_link(symbol)

            exchange = exchange.lower()

            if exchange != 'tradingview' and not ExchangeLinks.check_symbol_availability(symbol, exchange):
                logger.warning(f"Symbol {symbol} not available on {exchange}, using TradingView")
                return ExchangeLinks.get_tradingview_link(symbol)

            if exchange == 'binance':
                return ExchangeLinks.get_binance_link(symbol, language)
            elif exchange == 'bybit':
                links = ExchangeLinks.get_bybit_links(symbol)
                return links['mobile'] if is_mobile else links['web']
            elif exchange == 'bingx':
                return ExchangeLinks.get_bingx_link(symbol, language)
            elif exchange == 'okx':
                return ExchangeLinks.get_okx_link(symbol)
            elif exchange == 'bitget':
                return ExchangeLinks.get_bitget_link(symbol)
            elif exchange == 'tradingview':
                return ExchangeLinks.get_tradingview_link(symbol)
            else:
                logger.warning(f"Unknown exchange: {exchange}, using TradingView")
                return ExchangeLinks.get_tradingview_link(symbol)

        except Exception as e:
            logger.error(f"Error generating exchange link for {symbol} on {exchange}: {e}")
            return ExchangeLinks.get_tradingview_link(symbol)

    @staticmethod
    def format_exchange_button(symbol: str, exchange: str, language: str = 'ru', is_mobile: bool = False) -> str:
        """Форматирование кнопки для обмена с учетом языка"""
        exchange_names = {
            'binance': 'Binance',
            'bybit': 'Bybit',
            'bingx': 'BingX',
            'okx': 'OKX',
            'bitget': 'Bitget',
            'tradingview': 'TradingView'
        }

        exchange_name = exchange_names.get(exchange.lower(), exchange.upper())

        # Добавляем эмодзи для мобильных устройств (только для Bybit)
        if exchange.lower() == 'bybit' and is_mobile:
            mobile_emoji = "📱"
            if language == 'en':
                return f"{mobile_emoji} Open in App {exchange_name}"
            else:
                return f"{mobile_emoji} В приложении {exchange_name}"
        else:
            if language == 'en':
                return f"🌐 Open on {exchange_name}"
            else:
                return f"🌐 Открыть на {exchange_name}"

    @staticmethod
    def create_exchange_keyboard(symbol: str, exchange: str, language: str = 'ru') -> dict:
        """Создание inline клавиатуры для торговой пары с учетом языка"""
        try:
            if not ExchangeLinks.is_valid_futures_symbol(symbol):
                web_link = ExchangeLinks.get_tradingview_link(symbol)
                button_text = ExchangeLinks.format_exchange_button(symbol, 'tradingview', language, False)

                return {
                    'inline_keyboard': [[
                        {
                            'text': button_text,
                            'url': web_link
                        }
                    ]]
                }

            exchange = exchange.lower()

            if not ExchangeLinks.check_symbol_availability(symbol, exchange):
                web_link = ExchangeLinks.get_tradingview_link(symbol)
                button_text = ExchangeLinks.format_exchange_button(symbol, 'tradingview', language, False)

                logger.info(f"Symbol {symbol} not available on {exchange}, using TradingView")

                return {
                    'inline_keyboard': [[
                        {
                            'text': button_text,
                            'url': web_link
                        }
                    ]]
                }

            # Для Bybit создаем две кнопки (web и mobile)
            if exchange == 'bybit':
                web_link = ExchangeLinks.get_exchange_link(symbol, exchange, False, language)
                mobile_link = ExchangeLinks.get_exchange_link(symbol, exchange, True, language)

                web_button_text = ExchangeLinks.format_exchange_button(symbol, exchange, language, False)
                mobile_button_text = ExchangeLinks.format_exchange_button(symbol, exchange, language, True)

                keyboard = [
                    [{
                        'text': web_button_text,
                        'url': web_link
                    }],
                    [{
                        'text': mobile_button_text,
                        'url': mobile_link
                    }]
                ]
            else:
                # Для остальных бирж только web ссылка с учетом языка
                web_link = ExchangeLinks.get_exchange_link(symbol, exchange, False, language)
                web_button_text = ExchangeLinks.format_exchange_button(symbol, exchange, language, False)

                keyboard = [[{
                    'text': web_button_text,
                    'url': web_link
                }]]

            return {'inline_keyboard': keyboard}

        except Exception as e:
            logger.error(f"Error creating exchange keyboard for {symbol} on {exchange}: {e}")
            web_link = ExchangeLinks.get_tradingview_link(symbol)
            button_text = ExchangeLinks.format_exchange_button(symbol, 'tradingview', language, False)

            return {
                'inline_keyboard': [[
                    {
                        'text': button_text,
                        'url': web_link
                    }
                ]]
            }

    @staticmethod
    def clear_cache():
        """Очистка кэша символов"""
        ExchangeLinks._symbol_cache.clear()
        ExchangeLinks._cache_timestamp.clear()
        logger.info("Symbol cache cleared")

    @staticmethod
    def get_cache_info() -> dict:
        """Получение информации о кэше"""
        info = {}
        current_time = time.time()

        for exchange in ExchangeLinks._symbol_cache:
            symbol_count = len(ExchangeLinks._symbol_cache[exchange])
            last_update = ExchangeLinks._cache_timestamp.get(exchange, 0)
            age = current_time - last_update

            info[exchange] = {
                'symbol_count': symbol_count,
                'last_update': last_update,
                'age_seconds': age,
                'is_fresh': age < ExchangeLinks._cache_duration
            }

        return info


# Функция для тестирования
def test_exchange_links():
    """Тестирование генерации ссылок с разными языками"""
    test_symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOGEUSDT', 'XRPUSDT']
    exchanges = ['binance', 'bybit', 'bingx', 'okx', 'bitget', 'tradingview']
    languages = ['ru', 'en']

    for symbol in test_symbols:
        print(f"\n=== Testing {symbol} ===")

        for exchange in exchanges:
            available = ExchangeLinks.check_symbol_availability(symbol, exchange)
            print(f"\n{exchange.upper()}: Available: {available}")

            for language in languages:
                web_link = ExchangeLinks.get_exchange_link(symbol, exchange, False, language)
                mobile_link = ExchangeLinks.get_exchange_link(symbol, exchange, True, language)
                web_button = ExchangeLinks.format_exchange_button(symbol, exchange, language, False)
                mobile_button = ExchangeLinks.format_exchange_button(symbol, exchange, language, True)
                keyboard = ExchangeLinks.create_exchange_keyboard(symbol, exchange, language)

                print(f"  {language.upper()}:")
                print(f"    Web: {web_link}")
                print(f"    Mobile: {mobile_link}")
                print(f"    Web Button: {web_button}")
                print(f"    Mobile Button: {mobile_button}")
                print(f"    Keyboard: {keyboard}")

    print(f"\n=== Cache Info ===")
    cache_info = ExchangeLinks.get_cache_info()
    for exchange, info in cache_info.items():
        print(f"{exchange.upper()}: {info['symbol_count']} symbols, "
              f"age: {info['age_seconds']:.1f}s, fresh: {info['is_fresh']}")


if __name__ == "__main__":
    test_exchange_links()