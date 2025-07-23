"""
Система интернационализации для Telegram бота
Поддержка русского и английского языков
"""

from typing import Dict
from config import logger

# Словари переводов
TRANSLATIONS = {
    'ru': {
        # Основные сообщения
        'welcome_message': "👋 Привет! Добро пожаловать в бота для отслеживания криптовалют!",
        'main_menu_message': "🏠 Главное меню\n\nЧто бы вы хотели сделать?",
        'language_selected': "✅ Язык изменён на русский!\n\nЧто бы вы хотели сделать?",

        # Кнопки главного меню
        'btn_activate': "🚀 Активировать",
        'btn_settings': "⚙ Настройки",
        'btn_profile': "👤 Профиль",
        'btn_help': "📘 Помощь",
        'btn_back': "⬅ Назад",
        'btn_language': "🌍 Язык",

        # Активация
        'activation_code_prompt': "🔐 Введите код активации:",
        'activation_success': "✅ Код активации принят! Теперь вы можете использовать все функции бота.\n\nЧто бы вы хотели сделать?",
        'activation_error': "❌ Неверный код активации. Попробуйте снова.\n\n🔐 Введите код активации:",
        'activation_required': "❗ Сначала активируйте бота с помощью кода активации.",

        # Подписка
        'subscription_menu': "💎 Выберите тип подписки:",
        'btn_subscribe': "💳 Подписка на 1 месяц - 90$",
        'btn_enter_promo': "🎁 Ввести промокод",
        'subscription_info': "💳 Вы выбрали подписку на 1 месяц за 90$.\n\n📞 Для оформления подписки свяжитесь с администратором: @admin_username",
        'promo_prompt': "🎁 Введите промокод:",
        'promo_success': "🎉 Промокод '{code}' активирован!\n📅 Подписка активна на {days} дней.\n📝 {description}\n\nЧто бы вы хотели сделать?",
        'promo_error': "❌ Неверный промокод. Попробуйте снова.\n\n🎁 Введите промокод:",
        'promo_activation_error': "❌ Ошибка активации промокода.",
        'promo_save_error': "❌ Ошибка сохранения промокода.",

        # Настройки
        'settings_menu': "⚙ Настройки бота:",
        'btn_set_period': "🕒 Период",
        'btn_set_percent': "📊 Процент",
        'btn_exchange': "🏦 Биржа",
        'period_prompt': "🕒 Введите новый период проверки (в минутах, от 1 до 1440):",
        'period_success': "✅ Период проверки обновлён: {period} минут.\n\nЧто бы вы хотели сделать?",
        'period_error': "❌ Период должен быть от 1 до 1440 минут.\n\n🕒 Введите новый период проверки (в минутах, от 1 до 1440):",
        'period_format_error': "❌ Введите корректное число.\n\n🕒 Введите новый период проверки (в минутах, от 1 до 1440):",
        'percent_prompt': "📊 Введите новый порог изменения цены (в процентах, от 0.1 до 100):",
        'percent_success': "✅ Порог изменения обновлён: {percent}%.\n\nЧто бы вы хотели сделать?",
        'percent_error': "❌ Процент должен быть от 0.1 до 100.\n\n📊 Введите новый порог изменения цены (в процентах, от 0.1 до 100):",
        'percent_format_error': "❌ Введите корректное число (например: 3.5).\n\n📊 Введите новый порог изменения цены (в процентах, от 0.1 до 100):",
        'settings_update_error': "❌ Ошибка обновления настроек.",

        # Биржи
        'exchange_menu': "🏦 Выберите биржу для отслеживания:\n\n📊 Текущая биржа: {current_exchange}",
        'exchange_selected': "✅ Выбрана биржа: {exchange}\n\nЧто бы вы хотели сделать?",
        'exchange_error': "❌ Ошибка выбора биржи.",
        'profile_exchange': "🏦 Биржа: {exchange}",

        # Помощь
        'help_text': (
            "📘 *Помощь по использованию бота*\n\n"
            "🔹 *Активация* — введите код активации для доступа к функциям\n"
            "🔹 *Настройки* — настройте период проверки и порог изменения цены\n"
            "🔹 *Профиль* — просмотр информации о вашем аккаунте\n\n"
            "📊 *Как работает бот:*\n"
            "• Отслеживает изменения цен на фьючерсных парах\n"
            "• Уведомляет при превышении заданного порога\n"
            "• Проверяет цены с заданным интервалом\n\n"
            "🆘 *Поддержка:* @support\\_username"
        ),

        # Профиль
        'profile_title': "👤 *Профиль пользователя*",
        'profile_id': "🆔 ID: `{user_id}`",
        'profile_name': "👥 Имя: *{name}*",
        'profile_settings': "⚙ *Настройки:*",
        'profile_period': "🕒 Период проверки: {period} мин",
        'profile_percent': "📊 Порог изменения: {percent}%",
        'profile_error': "❗ Не удалось получить данные профиля.",

        # Подписка статусы
        'subscription_inactive': "❌ Подписка: не активна",
        'subscription_active': "✅ Подписка: активна до {date} (осталось {days} дн)",
        'subscription_expired': "❌ Подписка: истекла {date}",
        'subscription_error': "⚠️ Ошибка при определении подписки",

        # Уведомления о ценах
        'notification_fixed_price': "📌 Фикс. цена",
        'notification_current_price': "💲 Текущая цена",
        'notification_change': "📊 Изменение",
        'notification_time': "⏰ Время",

        # Общие сообщения
        'error_occurred': "❗ Произошла ошибка. Попробуйте позже.",
        'use_menu_buttons': "❗ Пожалуйста, используйте кнопки меню для выбора действия.\n\nЧто бы вы хотели сделать?",
        'unknown_data': "Неизвестно",

        # Языки
        'btn_russian': "🇷🇺 Русский",
        'btn_english': "🇺🇸 English",
        'language_menu': "🌍 Выберите язык:",
    },

    'en': {
        # Basic messages
        'welcome_message': "👋 Hello! Welcome to the cryptocurrency tracking bot!",
        'main_menu_message': "🏠 Main Menu\n\nWhat would you like to do?",
        'language_selected': "✅ Language changed to English!\n\nWhat would you like to do?",

        # Main menu buttons
        'btn_activate': "🚀 Activate",
        'btn_settings': "⚙ Settings",
        'btn_profile': "👤 Profile",
        'btn_help': "📘 Help",
        'btn_back': "⬅ Back",
        'btn_language': "🌍 Language",

        # Activation
        'activation_code_prompt': "🔐 Enter activation code:",
        'activation_success': "✅ Activation code accepted! Now you can use all bot functions.\n\nWhat would you like to do?",
        'activation_error': "❌ Invalid activation code. Please try again.\n\n🔐 Enter activation code:",
        'activation_required': "❗ Please activate the bot first using an activation code.",

        # Subscription
        'subscription_menu': "💎 Choose subscription type:",
        'btn_subscribe': "💳 1 Month Subscription - $90",
        'btn_enter_promo': "🎁 Enter Promo Code",
        'subscription_info': "💳 You selected 1 month subscription for $90.\n\n📞 To complete subscription contact administrator: @admin_username",
        'promo_prompt': "🎁 Enter promo code:",
        'promo_success': "🎉 Promo code '{code}' activated!\n📅 Subscription active for {days} days.\n📝 {description}\n\nWhat would you like to do?",
        'promo_error': "❌ Invalid promo code. Please try again.\n\n🎁 Enter promo code:",
        'promo_activation_error': "❌ Promo code activation error.",
        'promo_save_error': "❌ Promo code save error.",

        # Settings
        'settings_menu': "⚙ Bot Settings:",
        'btn_set_period': "🕒 Period",
        'btn_set_percent': "📊 Percentage",
        'btn_exchange': "🏦 Exchange",
        'period_prompt': "🕒 Enter new check period (in minutes, from 1 to 1440):",
        'period_success': "✅ Check period updated: {period} minutes.\n\nWhat would you like to do?",
        'period_error': "❌ Period must be from 1 to 1440 minutes.\n\n🕒 Enter new check period (in minutes, from 1 to 1440):",
        'period_format_error': "❌ Please enter a valid number.\n\n🕒 Enter new check period (in minutes, from 1 to 1440):",
        'percent_prompt': "📊 Enter new price change threshold (in percent, from 0.1 to 100):",
        'percent_success': "✅ Change threshold updated: {percent}%.\n\nWhat would you like to do?",
        'percent_error': "❌ Percentage must be from 0.1 to 100.\n\n📊 Enter new price change threshold (in percent, from 0.1 to 100):",
        'percent_format_error': "❌ Please enter a valid number (e.g.: 3.5).\n\n📊 Enter new price change threshold (in percent, from 0.1 to 100):",
        'settings_update_error': "❌ Settings update error.",

        # Exchanges
        'exchange_menu': "🏦 Select exchange for tracking:\n\n📊 Current exchange: {current_exchange}",
        'exchange_selected': "✅ Selected exchange: {exchange}\n\nWhat would you like to do?",
        'exchange_error': "❌ Exchange selection error.",
        'profile_exchange': "🏦 Exchange: {exchange}",

        # Help
        'help_text': (
            "📘 *Bot Usage Help*\n\n"
            "🔹 *Activation* — enter activation code to access functions\n"
            "🔹 *Settings* — configure check period and price change threshold\n"
            "🔹 *Profile* — view your account information\n\n"
            "📊 *How the bot works:*\n"
            "• Tracks price changes on futures pairs\n"
            "• Notifies when threshold is exceeded\n"
            "• Checks prices at set intervals\n\n"
            "🆘 *Support:* @support\\_username"
        ),

        # Profile
        'profile_title': "👤 *User Profile*",
        'profile_id': "🆔 ID: `{user_id}`",
        'profile_name': "👥 Name: *{name}*",
        'profile_settings': "⚙ *Settings:*",
        'profile_period': "🕒 Check period: {period} min",
        'profile_percent': "📊 Change threshold: {percent}%",
        'profile_error': "❗ Failed to get profile data.",

        # Subscription statuses
        'subscription_inactive': "❌ Subscription: inactive",
        'subscription_active': "✅ Subscription: active until {date} ({days} days left)",
        'subscription_expired': "❌ Subscription: expired {date}",
        'subscription_error': "⚠️ Error determining subscription",

        # Price notifications
        'notification_fixed_price': "📌 Fixed Price",
        'notification_current_price': "💲 Current Price",
        'notification_change': "📊 Change",
        'notification_time': "⏰ Time",

        # General messages
        'error_occurred': "❗ An error occurred. Please try later.",
        'use_menu_buttons': "❗ Please use menu buttons to select an action.\n\nWhat would you like to do?",
        'unknown_data': "Unknown",

        # Languages
        'btn_russian': "🇷🇺 Русский",
        'btn_english': "🇺🇸 English",
        'language_menu': "🌍 Select language:",
    }
}


class Localization:
    """Класс для работы с локализацией"""

    def __init__(self):
        self.translations = TRANSLATIONS
        self.default_language = 'ru'

    def get_text(self, key: str, language: str = None, **kwargs) -> str:
        """
        Получить переведенный текст

        Args:
            key: Ключ перевода
            language: Язык (если не указан, используется русский)
            **kwargs: Параметры для форматирования строки

        Returns:
            Переведенный текст
        """
        if language is None:
            language = self.default_language

        if language not in self.translations:
            language = self.default_language

        text = self.translations[language].get(key, key)

        try:
            if kwargs:
                return text.format(**kwargs)
            return text
        except Exception as e:
            logger.error(f"Error formatting translation key '{key}': {e}")
            return key

    def get_available_languages(self) -> Dict[str, str]:
        """Получить список доступных языков"""
        return {
            'ru': self.get_text('btn_russian', 'ru'),
            'en': self.get_text('btn_english', 'en')
        }

    def is_valid_language(self, language: str) -> bool:
        """Проверить, является ли язык валидным"""
        return language in self.translations


# Глобальный экземпляр локализации
localization = Localization()


def get_text(key: str, language: str = None, **kwargs) -> str:
    """Упрощенная функция для получения переведенного текста"""
    return localization.get_text(key, language, **kwargs)