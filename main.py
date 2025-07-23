import asyncio
import threading
import time
import queue
from collections import defaultdict
from typing import Dict, Set, Optional
import signal
import sys

from pybit.unified_trading import HTTP, WebSocket
from aiogram import Bot
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

from db_sqlite import UserManager
from localization import get_text
from Exchange import ExchangeLinks
from config import TELEGRAM_TOKEN, TESTNET, logger


class PriceMonitor:
    """Класс для мониторинга цен криптовалют"""

    def __init__(self):
        self.bot = Bot(token=TELEGRAM_TOKEN)
        self.symbols: list = []
        self.user_prices: Dict[int, Dict[str, tuple]] = defaultdict(dict)
        self.user_settings: Dict[int, dict] = {}
        self.active_users: Set[int] = set()
        self.notification_queue = queue.Queue()
        self.is_running = True
        self.price_data_received = False  # Флаг для отслеживания получения данных

        # WebSocket соединение (одно для всех пользователей)
        self.ws: Optional[WebSocket] = None
        self.ws_lock = threading.Lock()

        # Потоки
        self.threads = []

        # Event loop для aiogram
        self.bot_loop = None

    @staticmethod
    def format_price(price: float) -> str:
        """Форматирование цены с удалением лишних нулей"""
        if price == 0:
            return "0"

        # Определяем количество значащих цифр
        if price >= 1000:
            # Для больших чисел показываем 2 знака после запятой
            formatted = f"{price:.2f}"
        elif price >= 1:
            # Для чисел от 1 до 1000 показываем 4 знака после запятой
            formatted = f"{price:.4f}"
        elif price >= 0.01:
            # Для чисел от 0.01 до 1 показываем 6 знаков после запятой
            formatted = f"{price:.6f}"
        else:
            # Для очень малых чисел показываем 8 знаков после запятой
            formatted = f"{price:.8f}"

        # Убираем лишние нули справа
        if '.' in formatted:
            formatted = formatted.rstrip('0').rstrip('.')

        return formatted

    @staticmethod
    def get_all_symbols() -> list:
        """Получение всех фьючерсных пар"""
        try:
            http = HTTP(testnet=TESTNET)
            response = http.get_instruments_info(category="linear", limit=1000)

            if response.get("result") and response["result"].get("list"):
                symbols = []
                for item in response["result"]["list"]:
                    if item.get("symbol") and item.get("status") == "Trading":
                        symbols.append(item["symbol"])

                # Убираем лимит - возвращаем все символы
                return symbols if symbols else []
            else:
                logger.error("Ошибка получения списка торговых пар или пустой результат")
                return []
        except Exception as e:
            logger.error(f"Error fetching symbols: {e}")
            return []

    @staticmethod
    def create_exchange_keyboard(symbol: str, user_exchange: str, language: str) -> InlineKeyboardMarkup:
        """Создание клавиатуры для торговой пары"""
        try:
            # Получаем данные клавиатуры от ExchangeLinks
            keyboard_data = ExchangeLinks.create_exchange_keyboard(symbol, user_exchange, language)

            # Создаем aiogram клавиатуру
            buttons = []
            for row in keyboard_data['inline_keyboard']:
                button_row = []
                for button in row:
                    button_row.append(InlineKeyboardButton(
                        text=button['text'],
                        url=button['url']
                    ))
                buttons.append(button_row)

            return InlineKeyboardMarkup(inline_keyboard=buttons)

        except Exception as e:
            logger.error(f"Error creating exchange keyboard: {e}")
            # В случае ошибки создаем простую клавиатуру с TradingView
            tradingview_link = ExchangeLinks.get_tradingview_link(symbol)
            button_text = ExchangeLinks.format_exchange_button(symbol, 'tradingview', language)

            return InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(text=button_text, url=tradingview_link)
            ]])

    @staticmethod
    def get_exchange_display_name(exchange: str, language: str) -> str:
        """Получение отображаемого имени биржи"""
        exchange_names = {
            'binance': 'Binance',
            'bybit': 'Bybit',
            'bingx': 'BingX',
            'okx': 'OKX',
            'bitget': 'Bitget',
            'tradingview': 'TradingView'
        }
        return exchange_names.get(exchange.lower(), exchange.upper())

    async def send_notification_async(self, user_id: int, symbol: str, old_price: float,
                                      new_price: float, percentage_change: float):
        """Асинхронная отправка уведомления в Telegram с учетом языка пользователя"""
        try:
            # Получаем язык и биржу пользователя
            user_language = UserManager.get_user_language(user_id)
            user_exchange = UserManager.get_user_exchange(user_id)

            # Определяем эмодзи для изменения цены
            change_emoji = "📈" if percentage_change > 0 else "📉"

            # Получаем локализованные тексты
            fixed_price_text = get_text('notification_fixed_price', user_language)
            current_price_text = get_text('notification_current_price', user_language)
            change_text = get_text('notification_change', user_language)
            time_text = get_text('notification_time', user_language)

            # Форматируем цены с удалением лишних нулей
            old_price_formatted = self.format_price(old_price)
            new_price_formatted = self.format_price(new_price)

            # Формируем основное сообщение
            message = (
                f"💰 *{symbol}* {change_emoji}\n\n"
                f"{fixed_price_text}: `{old_price_formatted}`\n"
                f"{current_price_text}: `{new_price_formatted}`\n"
                f"{change_text}: *{percentage_change:+.2f}%*\n"
                f"{time_text}: {time.strftime('%H:%M:%S')}"
            )

            # Проверяем доступность символа на выбранной бирже
            if (user_exchange.lower() != 'tradingview' and
                    not ExchangeLinks.check_symbol_availability(symbol, user_exchange)):

                # Добавляем информацию о недоступности
                exchange_display_name = self.get_exchange_display_name(user_exchange, user_language)

                if user_language == 'en':
                    unavailable_text = f"\n\n⚠️ *Not available on {exchange_display_name}*"
                else:
                    unavailable_text = f"\n\n⚠️ *Недоступно на {exchange_display_name}*"

                message += unavailable_text

            # Создаем клавиатуру для торговой пары
            keyboard = self.create_exchange_keyboard(symbol, user_exchange, user_language)

            # Отправляем сообщение с клавиатурой
            await self.bot.send_message(
                user_id,
                message,
                parse_mode='Markdown',
                reply_markup=keyboard
            )

            logger.info(
                f"Alert sent to user {user_id} ({user_language}, {user_exchange}): {symbol} {percentage_change:+.2f}%")

        except Exception as e:
            logger.error(f"Failed to send notification to user {user_id}: {e}")

    def send_notification_sync(self, user_id: int, symbol: str, old_price: float,
                               new_price: float, percentage_change: float):
        """Синхронная обертка для отправки уведомления"""
        try:
            # Создаем корутину
            coroutine = self.send_notification_async(user_id, symbol, old_price, new_price, percentage_change)

            # Если есть активный event loop, планируем выполнение
            if self.bot_loop and self.bot_loop.is_running():
                asyncio.run_coroutine_threadsafe(coroutine, self.bot_loop)
            else:
                # Создаем новый event loop для этого потока
                new_loop = asyncio.new_event_loop()
                asyncio.set_event_loop(new_loop)
                try:
                    new_loop.run_until_complete(coroutine)
                finally:
                    new_loop.close()

        except Exception as e:
            logger.error(f"Error in send_notification_sync: {e}")

    def notification_worker(self):
        """Воркер для отправки уведомлений"""
        logger.info("Notification worker started")

        while self.is_running:
            try:
                # Получаем уведомление из очереди с таймаутом
                notification = self.notification_queue.get(timeout=0.1)
                self.send_notification_sync(**notification)
                self.notification_queue.task_done()

                # Небольшая задержка чтобы не спамить
                time.sleep(0.1)

            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error in notification worker: {e}")

    async def bot_worker(self):
        """Асинхронный воркер для обработки уведомлений"""
        logger.info("Bot worker started")

        while self.is_running:
            try:
                await asyncio.sleep(0.1)

                # Обрабатываем уведомления из очереди
                notifications_to_process = []

                # Собираем все доступные уведомления
                while not self.notification_queue.empty():
                    try:
                        notification = self.notification_queue.get_nowait()
                        notifications_to_process.append(notification)
                        self.notification_queue.task_done()
                    except queue.Empty:
                        break

                # Отправляем уведомления асинхронно
                if notifications_to_process:
                    tasks = []
                    for notification in notifications_to_process:
                        task = self.send_notification_async(**notification)
                        tasks.append(task)

                    # Ждем выполнения всех задач
                    if tasks:
                        await asyncio.gather(*tasks, return_exceptions=True)

            except Exception as e:
                logger.error(f"Error in bot worker: {e}")
                await asyncio.sleep(1)

    def start_bot_worker(self):
        """Запуск асинхронного воркера бота в отдельном потоке"""

        def run_bot_worker():
            worker_loop = None
            try:
                # Создаем новый event loop для этого потока
                worker_loop = asyncio.new_event_loop()
                asyncio.set_event_loop(worker_loop)
                self.bot_loop = worker_loop

                # Запускаем bot worker
                worker_loop.run_until_complete(self.bot_worker())

            except Exception as e:
                logger.error(f"Bot worker thread error: {e}")
            finally:
                try:
                    if worker_loop is not None:
                        worker_loop.close()
                except Exception:
                    pass
                self.bot_loop = None

        bot_thread = threading.Thread(target=run_bot_worker, name="bot_worker", daemon=True)
        bot_thread.start()
        return bot_thread

    def update_user_settings(self):
        """Обновление настроек пользователей"""
        try:
            subscribed_users = UserManager.get_all_subscribed_users()
            current_active = set()

            logger.debug(f"Found {len(subscribed_users)} subscribed users")

            for user_data in subscribed_users:
                user_id = user_data['user_id']
                current_active.add(user_id)

                # Обновляем настройки если они изменились
                if (user_id not in self.user_settings or
                        self.user_settings[user_id]['period'] != user_data['period'] or
                        self.user_settings[user_id]['percent'] != user_data['percent'] or
                        self.user_settings[user_id]['language'] != user_data['language'] or
                        self.user_settings[user_id]['exchange'] != user_data['exchange']):

                    self.user_settings[user_id] = {
                        'period': user_data['period'],
                        'percent': user_data['percent'],
                        'language': user_data['language'],
                        'exchange': user_data['exchange']
                    }

                    # Сбрасываем цены для пользователя при изменении настроек
                    if user_id in self.user_prices:
                        current_time = time.time()
                        for symbol in self.user_prices[user_id]:
                            _, price = self.user_prices[user_id][symbol]
                            self.user_prices[user_id][symbol] = (current_time, price)

                    logger.info(f"Updated settings for user {user_id}: "
                                f"period={user_data['period']}, percent={user_data['percent']}, "
                                f"language={user_data['language']}, exchange={user_data['exchange']}")

            # Удаляем данные для неактивных пользователей
            inactive_users = self.active_users - current_active
            for user_id in inactive_users:
                if user_id in self.user_prices:
                    del self.user_prices[user_id]
                if user_id in self.user_settings:
                    del self.user_settings[user_id]
                logger.info(f"Removed data for inactive user {user_id}")

            self.active_users = current_active

        except Exception as e:
            logger.error(f"Error updating user settings: {e}")

    def process_price_update(self, symbol: str, price: float):
        """Обработка обновления цены по символу"""
        current_time = time.time()

        if not self.active_users:
            logger.debug("Нет активных пользователей для обработки обновления цены.")
            return

        for user_id in self.active_users:
            try:
                user_settings = self.user_settings.get(user_id)
                if not user_settings:
                    logger.debug(f"Настройки пользователя {user_id} не найдены, пропускаем.")
                    continue

                period_seconds = user_settings['period'] * 60
                percent_threshold = user_settings['percent']

                # Если символ ещё не отслеживается — инициализируем
                if symbol not in self.user_prices[user_id]:
                    self.user_prices[user_id][symbol] = (current_time, price)
                    logger.info(
                        f"[User {user_id}] Инициализация цены для {symbol}: {self.format_price(price)} в {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(current_time))}")
                    continue

                fixed_time, fixed_price = self.user_prices[user_id][symbol]
                elapsed = current_time - fixed_time

                # Вычисляем процент изменения
                if fixed_price > 0:
                    percentage_change = ((price - fixed_price) / fixed_price) * 100
                else:
                    percentage_change = 0

                logger.debug(
                    f"[User {user_id}] Обработка {symbol}: старая цена {self.format_price(fixed_price)}, новая цена {self.format_price(price)}, изменение {percentage_change:.2f}%, прошло {elapsed:.1f} сек")

                if abs(percentage_change) >= percent_threshold:
                    # Порог достигнут — отправляем уведомление и фиксируем новую цену
                    self.notification_queue.put_nowait({
                        'user_id': user_id,
                        'symbol': symbol,
                        'old_price': fixed_price,
                        'new_price': price,
                        'percentage_change': percentage_change
                    })
                    self.user_prices[user_id][symbol] = (current_time, price)
                    logger.info(
                        f"[User {user_id}] Порог {percent_threshold}% достигнут по {symbol}. Отправлено уведомление. Цена обновлена до {self.format_price(price)}")

                elif elapsed >= period_seconds:
                    # Время вышло без достижения порога — просто фиксируем новую цену
                    self.user_prices[user_id][symbol] = (current_time, price)
                    logger.info(
                        f"[User {user_id}] Период {period_seconds} сек истек для {symbol}. Цена обновлена до {self.format_price(price)} без уведомления.")

            except Exception as e:
                logger.error(f"Error processing price update for user {user_id}: {e}")

    def websocket_message_handler(self, message):
        """Обработчик сообщений WebSocket"""
        try:
            if not isinstance(message, dict):
                logger.debug(f"Received non-dict message: {type(message)}")
                return

            if "data" not in message:
                logger.debug(f"Message without 'data' field: {message}")
                return

            data_list = message["data"] if isinstance(message["data"], list) else [message["data"]]

            processed_count = 0
            for data in data_list:
                if not isinstance(data, dict):
                    continue

                symbol = data.get("symbol")
                last_price = data.get("lastPrice")

                if symbol and last_price:
                    try:
                        price = float(last_price)
                        self.process_price_update(symbol, price)
                        processed_count += 1

                        # Отмечаем что получили данные
                        if not self.price_data_received:
                            self.price_data_received = True
                            logger.info(f"First price data received: {symbol} = {self.format_price(price)}")

                    except (ValueError, TypeError) as e:
                        logger.warning(f"Invalid price data for {symbol}: {last_price} - {e}")

            if processed_count > 0:
                logger.debug(f"Processed {processed_count} price updates")

        except Exception as e:
            logger.error(f"Error in WebSocket message handler: {e}")

    def start_websocket(self):
        """Запуск WebSocket соединения"""
        max_retries = 100
        retry_delay = 5

        for attempt in range(max_retries):
            try:
                logger.info(f"Starting WebSocket connection (attempt {attempt + 1}/{max_retries})")

                with self.ws_lock:
                    self.ws = WebSocket(
                        testnet=TESTNET,
                        channel_type="linear",
                        retries=100
                    )

                # Подписываемся на тикеры символов по частям (WebSocket может не поддерживать большие списки)
                chunk_size = 50
                for i in range(0, len(self.symbols), chunk_size):
                    chunk = self.symbols[i:i + chunk_size]
                    logger.info(f"Subscribing to symbols {i + 1}-{min(i + chunk_size, len(self.symbols))}: {chunk}")

                    try:
                        self.ws.ticker_stream(
                            symbol=chunk,
                            callback=self.websocket_message_handler
                        )
                        time.sleep(0.5)  # Небольшая задержка между подписками
                    except Exception as e:
                        logger.error(f"Failed to subscribe to chunk {chunk}: {e}")

                logger.info("WebSocket connection established successfully")

                # Мониторим соединение
                last_data_time = time.time()
                while self.is_running:
                    current_time = time.time()

                    # Проверяем получение данных
                    if self.price_data_received:
                        last_data_time = current_time
                    elif current_time - last_data_time > 120:  # 2 минуты без данных
                        logger.warning("No price data received for 2 minutes, connection may be dead")
                        raise Exception("WebSocket connection seems dead")

                    time.sleep(1)

                break

            except Exception as e:
                logger.error(f"WebSocket error (attempt {attempt + 1}): {e}")

                with self.ws_lock:
                    if self.ws:
                        try:
                            self.ws.exit()
                        except Exception:
                            pass
                        self.ws = None

                if attempt < max_retries - 1:
                    logger.info(f"Retrying WebSocket connection in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay = min(retry_delay * 2, 30)  # Экспоненциальная задержка
                else:
                    logger.critical("Failed to establish WebSocket connection after all retries")
                    raise

    def settings_updater(self):
        """Периодическое обновление настроек пользователей"""
        logger.info("Settings updater started")

        while self.is_running:
            try:
                self.update_user_settings()

                # Очистка истекших подписок
                UserManager.cleanup_expired_subscriptions()

                # Выводим статистику каждые 5 минут
                current_time = int(time.time())
                if current_time % 300 == 0:
                    logger.info(f"Active users: {len(self.active_users)}, "
                                f"Tracked symbols: {len(self.symbols)}, "
                                f"Queue size: {self.notification_queue.qsize()}")

                # Обновляем каждые 30 секунд
                for _ in range(30):
                    if not self.is_running:
                        break
                    time.sleep(1)

            except Exception as e:
                logger.error(f"Error in settings updater: {e}")
                time.sleep(5)

    def start(self):
        """Запуск мониторинга"""
        logger.info("Starting price monitor...")

        # Получаем список символов
        self.symbols = self.get_all_symbols()
        if not self.symbols:
            logger.critical("No symbols found, cannot start monitoring")
            return

        logger.info(
            f"Will monitor {len(self.symbols)} symbols: {', '.join(self.symbols[:10])}{'...' if len(self.symbols) > 10 else ''}")

        # Запускаем потоки
        threads_to_start = [
            ("bot_worker", self.start_bot_worker),
            ("settings_updater", self.settings_updater),
            ("websocket", self.start_websocket)
        ]

        for name, target in threads_to_start:
            if name == "bot_worker":
                # Для bot_worker используем специальный метод
                thread = target()
            else:
                thread = threading.Thread(target=target, name=name, daemon=True)
                thread.start()

            self.threads.append(thread)
            logger.info(f"Started {name} thread")

        logger.info("Price monitor started successfully")

        # Главный цикл
        try:
            while self.is_running:
                # Проверяем состояние потоков
                for thread in self.threads:
                    if hasattr(thread, 'is_alive') and not thread.is_alive():
                        logger.error(f"Thread {getattr(thread, 'name', 'unknown')} died unexpectedly")

                time.sleep(10)

        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
        finally:
            self.stop()

    async def cleanup_bot(self):
        """Очистка ресурсов бота"""
        try:
            await self.bot.session.close()
            logger.info("Bot session closed")
        except Exception as e:
            logger.error(f"Error closing bot session: {e}")

    def stop(self):
        """Остановка мониторинга"""
        logger.info("Stopping price monitor...")

        self.is_running = False

        # Закрываем WebSocket
        with self.ws_lock:
            if self.ws:
                try:
                    self.ws.exit()
                except Exception:
                    pass

        # Закрываем bot session
        if self.bot_loop and self.bot_loop.is_running():
            asyncio.run_coroutine_threadsafe(self.cleanup_bot(), self.bot_loop)

        # Ждем завершения потоков
        for thread in self.threads:
            if hasattr(thread, 'is_alive') and thread.is_alive():
                if hasattr(thread, 'join'):
                    thread.join(timeout=5)

        logger.info("Price monitor stopped")


def signal_handler(signum, _):
    """Обработчик сигналов для graceful shutdown"""
    logger.info(f"Received signal {signum}, shutting down...")
    sys.exit(0)


def main():
    """Главная функция"""
    # Настройка обработчиков сигналов
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        # Создание и запуск монитора
        monitor = PriceMonitor()
        monitor.start()

    except Exception as e:
        logger.critical(f"Critical error in main: {e}")
        raise


if __name__ == "__main__":
    main()