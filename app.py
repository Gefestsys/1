import signal
import sys
import threading
import time
from typing import Optional

from config import logger
from db_sqlite import init_db
from interface_bot import start_bot_thread
from main import PriceMonitor


class Application:
    """Главное приложение, координирующее работу всех компонентов"""

    def __init__(self):
        self.interface_thread: Optional[threading.Thread] = None
        self.monitor: Optional[PriceMonitor] = None
        self.monitor_thread: Optional[threading.Thread] = None
        self.is_running = True

    def setup_signal_handlers(self):
        """Настройка обработчиков сигналов"""

        def signal_handler(signum, _):
            logger.info(f"Received signal {signum}, shutting down...")
            self.stop()
            sys.exit(0)

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

    def start_interface_bot(self):
        """Запуск интерфейсного бота"""
        try:
            logger.info("Starting interface bot...")
            self.interface_thread = start_bot_thread()
            logger.info("Interface bot started successfully")
        except Exception as e:
            logger.error(f"Failed to start interface bot: {e}")
            raise

    def start_price_monitor(self):
        """Запуск монитора цен"""

        def run_monitor():
            try:
                logger.info("Starting price monitor...")
                self.monitor = PriceMonitor()
                self.monitor.start()
            except Exception as E:
                logger.error(f"Price monitor error: {E}")

        try:
            self.monitor_thread = threading.Thread(
                target=run_monitor,
                name="price_monitor",
                daemon=True
            )
            self.monitor_thread.start()
            logger.info("Price monitor thread started")
        except Exception as e:
            logger.error(f"Failed to start price monitor: {e}")
            raise

    def start(self):
        """Запуск всего приложения"""
        logger.info("=" * 50)
        logger.info("Starting Crypto Price Monitor Bot")
        logger.info("=" * 50)

        try:
            # Настройка обработчиков сигналов
            self.setup_signal_handlers()

            # Инициализация базы данных
            logger.info("Initializing database...")
            init_db()

            # Запуск интерфейсного бота
            self.start_interface_bot()

            # Небольшая задержка перед запуском монитора
            time.sleep(2)

            # Запуск монитора цен
            self.start_price_monitor()

            logger.info("All components started successfully!")
            logger.info("Bot is running... Press Ctrl+C to stop")

            # Главный цикл мониторинга состояния
            self.monitor_health()

        except KeyboardInterrupt:
            logger.info("Received keyboard interrupt")
        except Exception as e:
            logger.critical(f"Critical error during startup: {e}")
            raise
        finally:
            self.stop()

    def monitor_health(self):
        """Мониторинг состояния компонентов"""
        last_health_check = time.time()

        while self.is_running:
            try:
                current_time = time.time()

                # Проверяем состояние каждые 30 секунд
                if current_time - last_health_check >= 30:
                    self.check_components_health()
                    last_health_check = current_time

                time.sleep(1)

            except Exception as e:
                logger.error(f"Error in health monitor: {e}")
                time.sleep(5)

    def check_components_health(self):
        """Проверка состояния компонентов"""
        try:
            # Проверка интерфейсного бота
            if self.interface_thread and not self.interface_thread.is_alive():
                logger.warning("Interface bot thread is dead")
                # Можно добавить логику перезапуска

            # Проверка монитора цен
            if self.monitor_thread and not self.monitor_thread.is_alive():
                logger.warning("Price monitor thread is dead")
                # Можно добавить логику перезапуска

            # Проверка состояния монитора
            if self.monitor and not self.monitor.is_running:
                logger.warning("Price monitor is not running")

            logger.debug("Health check completed")

        except Exception as e:
            logger.error(f"Error during health check: {e}")

    def stop(self):
        """Остановка всех компонентов"""
        logger.info("Stopping application...")

        self.is_running = False

        try:
            # Остановка монитора цен
            if self.monitor:
                logger.info("Stopping price monitor...")
                self.monitor.stop()

            # Ожидание завершения потоков
            if self.monitor_thread and self.monitor_thread.is_alive():
                logger.info("Waiting for price monitor thread to finish...")
                self.monitor_thread.join(timeout=10)

            if self.interface_thread and self.interface_thread.is_alive():
                logger.info("Waiting for interface bot thread to finish...")
                self.interface_thread.join(timeout=10)

            logger.info("Application stopped successfully")

        except Exception as e:
            logger.error(f"Error during shutdown: {e}")


def main():
    """Точка входа в приложение"""
    app = Application()
    app.start()


if __name__ == "__main__":
    main()