import asyncio
import threading
from functools import wraps
from typing import Dict, Optional

from aiogram import Bot, Dispatcher, F
from aiogram.exceptions import TelegramAPIError
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, CallbackQuery, Message

from config import TELEGRAM_TOKEN, VALID_ACTIVATION_CODES, PROMO_CODES, MAX_RETRIES, RETRY_DELAY, logger
from db_sqlite import UserManager, init_db
from localization import get_text


class UserStates(StatesGroup):
    """Состояния FSM для пользователя"""
    awaiting_code = State()
    awaiting_period = State()
    awaiting_percent = State()
    awaiting_promo = State()
    selecting_language = State()
    selecting_exchange = State()


# Список доступных бирж с улучшенными иконками
EXCHANGES = {
    'tradingview': '📈 TradingView',
    'binance': '🟡 Binance',
    'bybit': '🟠 Bybit',
    'bingx': '🔵 BingX',
    'okx': '⚫ OKX',
    'bitget': '🟢 Bitget'
}

# Инициализация бота
bot = Bot(token=TELEGRAM_TOKEN)
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# Кэш для хранения последних сообщений меню
user_menu_messages: Dict[int, int] = {}


def get_user_language(user_id: int) -> str:
    """Получить язык пользователя из БД"""
    try:
        return UserManager.get_user_language(user_id)
    except Exception as e:
        logger.error(f"Error getting user language for {user_id}: {e}")
        return 'ru'


def set_user_language(user_id: int, language: str) -> bool:
    """Установить язык пользователя"""
    try:
        return UserManager.set_user_language(user_id, language)
    except Exception as e:
        logger.error(f"Error setting user language for {user_id}: {e}")
        return False


def get_user_exchange(user_id: int) -> str:
    """Получить выбранную биржу пользователя из БД"""
    try:
        return UserManager.get_user_exchange(user_id)
    except Exception as e:
        logger.error(f"Error getting user exchange for {user_id}: {e}")
        return 'tradingview'


def set_user_exchange(user_id: int, exchange: str) -> bool:
    """Установить биржу пользователя в БД"""
    try:
        return UserManager.set_user_exchange(user_id, exchange)
    except Exception as e:
        logger.error(f"Error setting user exchange for {user_id}: {e}")
        return False


def get_exchange_display_name(exchange_key: str) -> str:
    """Получить отображаемое имя биржи"""
    return EXCHANGES.get(exchange_key, exchange_key.title())


def error_handler(func):
    """Декоратор для обработки ошибок"""

    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {e}")
            try:
                if args and hasattr(args[0], 'chat'):
                    user_id = args[0].chat.id
                    user_lang = get_user_language(user_id)
                    await update_menu_message(
                        user_id,
                        get_text('error_occurred', user_lang),
                        create_main_menu(user_id)
                    )
                elif args and hasattr(args[0], 'message'):
                    user_id = args[0].message.chat.id
                    user_lang = get_user_language(user_id)
                    await update_menu_message(
                        user_id,
                        get_text('error_occurred', user_lang),
                        create_main_menu(user_id)
                    )
            except Exception:
                pass
            return None

    return wrapper


def create_initial_language_menu() -> InlineKeyboardMarkup:
    """Создать меню выбора языка при первом запуске"""
    keyboard = [
        [
            InlineKeyboardButton(text="🇷🇺 Русский", callback_data="initial_lang_ru"),
            InlineKeyboardButton(text="🇺🇸 English", callback_data="initial_lang_en")
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def create_language_menu(user_id: int) -> InlineKeyboardMarkup:
    """Создать меню выбора языка"""
    user_lang = get_user_language(user_id)
    current_lang = get_user_language(user_id)

    keyboard = [
        [
            InlineKeyboardButton(
                text="🇷🇺 Русский" + (" ✅" if current_lang == 'ru' else ""),
                callback_data="lang_ru"
            ),
            InlineKeyboardButton(
                text="🇺🇸 English" + (" ✅" if current_lang == 'en' else ""),
                callback_data="lang_en"
            )
        ],
        [InlineKeyboardButton(text=get_text('btn_back', user_lang), callback_data="back_to_settings")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def create_exchange_menu(user_id: int) -> InlineKeyboardMarkup:
    """Создать меню выбора биржи"""
    user_lang = get_user_language(user_id)
    current_exchange = get_user_exchange(user_id)

    keyboard = []
    # Создаем кнопки для бирж по 2 в ряд
    exchanges_list = list(EXCHANGES.items())
    for i in range(0, len(exchanges_list), 2):
        row = []
        for j in range(2):
            if i + j < len(exchanges_list):
                exchange_key, exchange_name = exchanges_list[i + j]
                # Добавляем галочку для текущей выбранной биржи
                display_name = f"{exchange_name} ✅" if exchange_key == current_exchange else exchange_name
                row.append(InlineKeyboardButton(
                    text=display_name,
                    callback_data=f"exchange_{exchange_key}"
                ))
        keyboard.append(row)

    keyboard.append([InlineKeyboardButton(text=get_text('btn_back', user_lang), callback_data="back_to_settings")])
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def create_main_menu(user_id: int) -> InlineKeyboardMarkup:
    """Создать главное меню"""
    try:
        user = UserManager.get_user_by_id(user_id)
        user_lang = get_user_language(user_id)

        if not user:
            UserManager.add_or_update_user(user_id)
            user = UserManager.get_user_by_id(user_id)

        keyboard = []

        if user and user.get('is_active'):
            keyboard.extend([
                [
                    InlineKeyboardButton(text=get_text('btn_activate', user_lang), callback_data="activation_active"),
                    InlineKeyboardButton(text=get_text('btn_settings', user_lang), callback_data="settings")
                ],
                [
                    InlineKeyboardButton(text=get_text('btn_profile', user_lang), callback_data="profile"),
                    InlineKeyboardButton(text=get_text('btn_help', user_lang), callback_data="help")
                ]
            ])
        else:
            keyboard.extend([
                [
                    InlineKeyboardButton(text=get_text('btn_activate', user_lang), callback_data="activate"),
                    InlineKeyboardButton(text=get_text('btn_help', user_lang), callback_data="help")
                ]
            ])

        return InlineKeyboardMarkup(inline_keyboard=keyboard)

    except Exception as e:
        logger.error(f"Error creating main menu for user {user_id}: {e}")
        # Возвращаем базовое меню с русским языком
        keyboard = [
            [InlineKeyboardButton(text="🔓 Активировать", callback_data="activate")],
            [InlineKeyboardButton(text="❓ Помощь", callback_data="help")]
        ]
        return InlineKeyboardMarkup(inline_keyboard=keyboard)


def create_settings_menu(user_id: int) -> InlineKeyboardMarkup:
    """Создать меню настроек"""
    user_lang = get_user_language(user_id)

    keyboard = [
        [
            InlineKeyboardButton(text=get_text('btn_set_period', user_lang), callback_data="set_period"),
            InlineKeyboardButton(text=get_text('btn_set_percent', user_lang), callback_data="set_percent")
        ],
        [
            InlineKeyboardButton(text=get_text('btn_exchange', user_lang),callback_data="exchange"),
            InlineKeyboardButton(text=get_text('btn_language', user_lang), callback_data="language")
        ],
        [InlineKeyboardButton(text=get_text('btn_back', user_lang), callback_data="back")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def create_activation_menu(user_id: int) -> InlineKeyboardMarkup:
    """Создать меню активации"""
    user_lang = get_user_language(user_id)
    keyboard = [
        [
            InlineKeyboardButton(text=get_text('btn_subscribe', user_lang), callback_data="subscribe"),
            InlineKeyboardButton(text=get_text('btn_enter_promo', user_lang), callback_data="enter_promo")
        ],
        [InlineKeyboardButton(text=get_text('btn_back', user_lang), callback_data="back")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def create_back_menu(user_id: int, callback_data: str = "back") -> InlineKeyboardMarkup:
    """Создать меню с кнопкой Назад"""
    user_lang = get_user_language(user_id)
    keyboard = [[InlineKeyboardButton(text=get_text('btn_back', user_lang), callback_data=callback_data)]]
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


async def safe_delete_message(chat_id: int, message_id: int) -> bool:
    """Безопасное удаление сообщения"""
    try:
        await bot.delete_message(chat_id=chat_id, message_id=message_id)
        return True
    except Exception:
        return False


async def update_menu_message(chat_id: int, text: str, reply_markup: InlineKeyboardMarkup,
                              parse_mode: Optional[str] = None) -> bool:
    """Обновить сообщение меню или создать новое"""
    try:
        if chat_id in user_menu_messages:
            try:
                await bot.edit_message_text(
                    chat_id=chat_id,
                    message_id=user_menu_messages[chat_id],
                    text=text,
                    reply_markup=reply_markup,
                    parse_mode=parse_mode
                )
                return True
            except Exception:
                await safe_delete_message(chat_id, user_menu_messages[chat_id])

        message = await bot.send_message(
            chat_id=chat_id,
            text=text,
            reply_markup=reply_markup,
            parse_mode=parse_mode
        )
        user_menu_messages[chat_id] = message.message_id
        return True

    except Exception as e:
        logger.error(f"Error updating menu message: {e}")
        return False


@dp.message(Command("start"))
@error_handler
async def handle_start(message: Message, state: FSMContext):
    """Обработка команды /start"""
    user_id = message.chat.id
    logger.info(f"User {user_id} started the bot")

    await state.clear()
    await safe_delete_message(user_id, message.message_id)

    # Удаляем предыдущее меню если оно существует
    if user_id in user_menu_messages:
        await safe_delete_message(user_id, user_menu_messages[user_id])
        del user_menu_messages[user_id]

    try:
        # Проверяем, существует ли пользователь в базе
        user = UserManager.get_user_by_id(user_id)

        if not user:
            # Новый пользователь - создаем запись в базе
            UserManager.add_or_update_user(user_id)

            # Показываем приветствие и выбор языка
            await state.set_state(UserStates.selecting_language)
            message_obj = await bot.send_message(
                chat_id=user_id,
                text="👋 Welcome! Please select your language.\n\n👋 Добро пожаловать! Выберите язык.",
                reply_markup=create_initial_language_menu()
            )
            user_menu_messages[user_id] = message_obj.message_id
        else:
            # Проверяем, выбран ли язык
            if not UserManager.is_language_selected(user_id):
                # Язык не выбран - показываем выбор языка
                await state.set_state(UserStates.selecting_language)
                message_obj = await bot.send_message(
                    chat_id=user_id,
                    text="👋 Welcome! Please select your language.\n\n👋 Добро пожаловать! Выберите язык.",
                    reply_markup=create_initial_language_menu()
                )
                user_menu_messages[user_id] = message_obj.message_id
            else:
                # Язык выбран - показываем главное меню
                user_lang = get_user_language(user_id)
                message_obj = await bot.send_message(
                    chat_id=user_id,
                    text=get_text('main_menu_message', user_lang),
                    reply_markup=create_main_menu(user_id)
                )
                user_menu_messages[user_id] = message_obj.message_id
    except Exception as e:
        logger.error(f"Error in handle_start for user {user_id}: {e}")
        # Показываем базовое меню с выбором языка
        await state.set_state(UserStates.selecting_language)
        message_obj = await bot.send_message(
            chat_id=user_id,
            text="👋 Welcome! Please select your language.\n\n👋 Добро пожаловать! Выберите язык.",
            reply_markup=create_initial_language_menu()
        )
        user_menu_messages[user_id] = message_obj.message_id


@dp.callback_query(F.data.startswith("initial_lang_"))
@error_handler
async def handle_initial_language_selection(callback: CallbackQuery, state: FSMContext):
    """Обработка выбора языка при первом запуске"""
    user_id = callback.message.chat.id
    language = callback.data.split("_")[2]  # initial_lang_ru -> ru

    success = set_user_language(user_id, language)
    if success:
        await state.clear()
        await update_menu_message(
            user_id,
            get_text('welcome_message', language),
            create_main_menu(user_id)
        )
        logger.info(f"User {user_id} selected initial language: {language}")
    else:
        await update_menu_message(
            user_id,
            "Error occurred / Произошла ошибка",
            create_initial_language_menu()
        )

    await callback.answer()


@dp.callback_query(F.data.startswith("lang_"))
@error_handler
async def handle_language_selection(callback: CallbackQuery, state: FSMContext):
    """Обработка выбора языка в настройках"""
    user_id = callback.message.chat.id
    language = callback.data.split("_")[1]

    success = set_user_language(user_id, language)
    if success:
        await update_menu_message(
            user_id,
            get_text('language_selected', language),
            create_settings_menu(user_id)
        )
        logger.info(f"User {user_id} selected language: {language}")
    else:
        await update_menu_message(
            user_id,
            get_text('error_occurred', language),
            create_settings_menu(user_id)
        )

    await callback.answer()


@dp.callback_query(F.data.startswith("exchange_"))
@error_handler
async def handle_exchange_selection(callback: CallbackQuery, state: FSMContext):
    """Обработка выбора биржи"""
    user_id = callback.message.chat.id
    user_lang = get_user_language(user_id)
    exchange = callback.data.split("_")[1]  # exchange_binance -> binance

    if exchange in EXCHANGES:
        success = set_user_exchange(user_id, exchange)
        if success:
            exchange_name = get_exchange_display_name(exchange)
            await update_menu_message(
                user_id,
                get_text('exchange_selected', user_lang, exchange=exchange_name),
                create_exchange_menu(user_id)  # Показываем обновленное меню с галочкой
            )
            logger.info(f"User {user_id} selected exchange: {exchange}")
        else:
            await update_menu_message(
                user_id,
                get_text('error_occurred', user_lang),
                create_exchange_menu(user_id)
            )
    else:
        await update_menu_message(
            user_id,
            get_text('error_occurred', user_lang),
            create_exchange_menu(user_id)
        )

    await callback.answer()


@dp.callback_query(F.data == "exchange")
@error_handler
async def handle_exchange_menu(callback: CallbackQuery):
    """Обработка меню выбора биржи"""
    user_id = callback.message.chat.id
    user_lang = get_user_language(user_id)
    current_exchange = get_user_exchange(user_id)
    exchange_display = get_exchange_display_name(current_exchange)

    await update_menu_message(
        user_id,
        get_text('exchange_menu', user_lang, current_exchange=exchange_display),
        create_exchange_menu(user_id)
    )
    await callback.answer()


@dp.callback_query(F.data == "language")
@error_handler
async def handle_language_menu(callback: CallbackQuery):
    """Обработка меню языка"""
    user_id = callback.message.chat.id
    user_lang = get_user_language(user_id)

    await update_menu_message(
        user_id,
        get_text('language_menu', user_lang),
        create_language_menu(user_id)
    )
    await callback.answer()


@dp.callback_query(F.data == "activate")
@error_handler
async def handle_activate(callback: CallbackQuery, state: FSMContext):
    """Обработка активации"""
    user_id = callback.message.chat.id
    user_lang = get_user_language(user_id)

    await state.set_state(UserStates.awaiting_code)
    await update_menu_message(
        user_id,
        get_text('activation_code_prompt', user_lang),
        create_back_menu(user_id)
    )
    await callback.answer()


@dp.callback_query(F.data == "activation_active")
@error_handler
async def handle_activation_active(callback: CallbackQuery):
    """Обработка активации для активных пользователей"""
    user_id = callback.message.chat.id
    user_lang = get_user_language(user_id)

    await update_menu_message(
        user_id,
        get_text('subscription_menu', user_lang),
        create_activation_menu(user_id)
    )
    await callback.answer()


@dp.callback_query(F.data == "subscribe")
@error_handler
async def handle_subscribe(callback: CallbackQuery):
    """Обработка подписки"""
    user_id = callback.message.chat.id
    user_lang = get_user_language(user_id)

    await update_menu_message(
        user_id,
        get_text('subscription_info', user_lang),
        create_activation_menu(user_id)
    )
    await callback.answer()


@dp.callback_query(F.data == "enter_promo")
@error_handler
async def handle_enter_promo(callback: CallbackQuery, state: FSMContext):
    """Обработка ввода промокода"""
    user_id = callback.message.chat.id
    user_lang = get_user_language(user_id)

    await state.set_state(UserStates.awaiting_promo)
    await update_menu_message(
        user_id,
        get_text('promo_prompt', user_lang),
        create_back_menu(user_id)
    )
    await callback.answer()


@dp.callback_query(F.data == "settings")
@error_handler
async def handle_settings(callback: CallbackQuery):
    """Обработка настроек"""
    user_id = callback.message.chat.id
    user_lang = get_user_language(user_id)

    try:
        user = UserManager.get_user_by_id(user_id)

        if not user or not user.get('is_active'):
            await update_menu_message(
                user_id,
                get_text('activation_required', user_lang),
                create_main_menu(user_id)
            )
            await callback.answer()
            return

        await update_menu_message(
            user_id,
            get_text('settings_menu', user_lang),
            create_settings_menu(user_id)
        )
        await callback.answer()
    except Exception as e:
        logger.error(f"Error in handle_settings for user {user_id}: {e}")
        await update_menu_message(
            user_id,
            get_text('error_occurred', user_lang),
            create_main_menu(user_id)
        )
        await callback.answer()


@dp.callback_query(F.data == "set_period")
@error_handler
async def handle_set_period(callback: CallbackQuery, state: FSMContext):
    """Обработка настройки периода"""
    user_id = callback.message.chat.id
    user_lang = get_user_language(user_id)

    await state.set_state(UserStates.awaiting_period)
    await update_menu_message(
        user_id,
        get_text('period_prompt', user_lang),
        create_back_menu(user_id, "back_to_settings")
    )
    await callback.answer()


@dp.callback_query(F.data == "set_percent")
@error_handler
async def handle_set_percent(callback: CallbackQuery, state: FSMContext):
    """Обработка настройки процента"""
    user_id = callback.message.chat.id
    user_lang = get_user_language(user_id)

    await state.set_state(UserStates.awaiting_percent)
    await update_menu_message(
        user_id,
        get_text('percent_prompt', user_lang),
        create_back_menu(user_id, "back_to_settings")
    )
    await callback.answer()


@dp.callback_query(F.data == "help")
@error_handler
async def handle_help(callback: CallbackQuery):
    """Обработка помощи"""
    user_id = callback.message.chat.id
    user_lang = get_user_language(user_id)

    await update_menu_message(
        user_id,
        get_text('help_text', user_lang),
        create_back_menu(user_id),
        parse_mode='Markdown'
    )
    await callback.answer()


@dp.callback_query(F.data == "profile")
@error_handler
async def handle_profile(callback: CallbackQuery):
    """Обработка профиля"""
    await show_profile(callback.message.chat.id, callback.from_user)
    await callback.answer()


@dp.callback_query(F.data == "back")
@error_handler
async def handle_back(callback: CallbackQuery, state: FSMContext):
    """Обработка кнопки Назад"""
    user_id = callback.message.chat.id
    user_lang = get_user_language(user_id)

    await state.clear()
    await update_menu_message(
        user_id,
        get_text('main_menu_message', user_lang),
        create_main_menu(user_id)
    )
    await callback.answer()


@dp.callback_query(F.data == "back_to_settings")
@error_handler
async def handle_back_to_settings(callback: CallbackQuery, state: FSMContext):
    """Обработка кнопки Назад в настройки"""
    user_id = callback.message.chat.id
    user_lang = get_user_language(user_id)

    await state.clear()
    await update_menu_message(
        user_id,
        get_text('settings_menu', user_lang),
        create_settings_menu(user_id)
    )
    await callback.answer()


async def show_profile(user_id: int, tg_user) -> bool:
    """Показать профиль пользователя"""
    try:
        user = UserManager.get_user_by_id(user_id)
        user_lang = get_user_language(user_id)

        if not user:
            await update_menu_message(
                user_id,
                get_text('profile_error', user_lang),
                create_back_menu(user_id)
            )
            return False

        # Формирование имени пользователя
        name_parts = [tg_user.first_name or ""]
        if tg_user.last_name:
            name_parts.append(tg_user.last_name)
        full_name = " ".join(name_parts).strip()
        username = f"@{tg_user.username}" if tg_user.username else ""
        display_name = f"{full_name} ({username})" if username else full_name

        subscription_status = UserManager.get_subscription_status(user_id, user_lang)
        current_exchange = get_user_exchange(user_id)
        exchange_display = get_exchange_display_name(current_exchange)

        user_info = (
            f"{get_text('profile_title', user_lang)}\n\n"
            f"{get_text('profile_id', user_lang, user_id=user_id)}\n"
            f"{get_text('profile_name', user_lang, name=display_name)}\n\n"
            f"{subscription_status}\n\n"
            f"{get_text('profile_settings', user_lang)}\n"
            f"{get_text('profile_period', user_lang, period=user['period'])}\n"
            f"{get_text('profile_percent', user_lang, percent=user['percent'])}\n"
            f"{get_text('profile_exchange', user_lang, exchange=exchange_display)}\n"
        )

        await update_menu_message(
            user_id,
            user_info,
            create_back_menu(user_id),
            parse_mode='Markdown'
        )
        return True
    except Exception as e:
        logger.error(f"Error showing profile for user {user_id}: {e}")
        user_lang = get_user_language(user_id)
        await update_menu_message(
            user_id,
            get_text('profile_error', user_lang),
            create_back_menu(user_id)
        )
        return False


@dp.message(StateFilter(UserStates.awaiting_code))
@error_handler
async def handle_activation_code(message: Message, state: FSMContext):
    """Обработка кода активации"""
    user_id = message.chat.id
    user_lang = get_user_language(user_id)
    code = message.text.strip()

    await safe_delete_message(user_id, message.message_id)

    if code in VALID_ACTIVATION_CODES:
        success = UserManager.add_or_update_user(user_id, activation_code=code)
        if success:
            UserManager.set_user_active(user_id)
            await state.clear()
            await update_menu_message(
                user_id,
                get_text('activation_success', user_lang),
                create_main_menu(user_id)
            )
            logger.info(f"User {user_id} successfully activated with code {code}")
        else:
            await update_menu_message(
                user_id,
                get_text('error_occurred', user_lang),
                create_main_menu(user_id)
            )
    else:
        await update_menu_message(
            user_id,
            get_text('activation_error', user_lang),
            create_back_menu(user_id)
        )


@dp.message(StateFilter(UserStates.awaiting_period))
@error_handler
async def handle_period_input(message: Message, state: FSMContext):
    """Обработка ввода периода"""
    user_id = message.chat.id
    user_lang = get_user_language(user_id)

    await safe_delete_message(user_id, message.message_id)

    try:
        period = int(message.text.strip())
        if 1 <= period <= 1440:
            success = UserManager.update_user_settings(user_id, period=period)
            if success:
                await state.clear()
                await update_menu_message(
                    user_id,
                    get_text('period_success', user_lang, period=period),
                    create_settings_menu(user_id)
                )
                logger.info(f"User {user_id} updated period to {period}")
            else:
                await update_menu_message(
                    user_id,
                    get_text('settings_update_error', user_lang),
                    create_settings_menu(user_id)
                )
        else:
            await update_menu_message(
                user_id,
                get_text('period_error', user_lang),
                create_back_menu(user_id, "back_to_settings")
            )
    except ValueError:
        await update_menu_message(
            user_id,
            get_text('period_format_error', user_lang),
            create_back_menu(user_id, "back_to_settings")
        )


@dp.message(StateFilter(UserStates.awaiting_percent))
@error_handler
async def handle_percent_input(message: Message, state: FSMContext):
    """Обработка ввода процента"""
    user_id = message.chat.id
    user_lang = get_user_language(user_id)

    await safe_delete_message(user_id, message.message_id)

    try:
        percent = float(message.text.strip().replace(',', '.'))
        if 0.1 <= percent <= 100:
            success = UserManager.update_user_settings(user_id, percent=percent)
            if success:
                await state.clear()
                await update_menu_message(
                    user_id,
                    get_text('percent_success', user_lang, percent=percent),
                    create_settings_menu(user_id)
                )
                logger.info(f"User {user_id} updated percent to {percent}")
            else:
                await update_menu_message(
                    user_id,
                    get_text('settings_update_error', user_lang),
                    create_settings_menu(user_id)
                )
        else:
            await update_menu_message(
                user_id,
                get_text('percent_error', user_lang),
                create_back_menu(user_id, "back_to_settings")
            )
    except ValueError:
        await update_menu_message(
            user_id,
            get_text('percent_format_error', user_lang),
            create_back_menu(user_id, "back_to_settings")
        )


@dp.message(StateFilter(UserStates.awaiting_promo))
@error_handler
async def handle_promo_input(message: Message, state: FSMContext):
    """Обработка ввода промокода"""
    user_id = message.chat.id
    user_lang = get_user_language(user_id)
    promo_code = message.text.strip()

    await safe_delete_message(user_id, message.message_id)

    if promo_code in PROMO_CODES:
        promo_info = PROMO_CODES[promo_code]
        success = UserManager.add_or_update_user(user_id, promo_code=promo_code)

        if success:
            activation_success = UserManager.activate_subscription(user_id, promo_info["days"])
            if activation_success:
                await state.clear()
                await update_menu_message(
                    user_id,
                    get_text('promo_success', user_lang,
                             code=promo_code,
                             days=promo_info['days'],
                             description=promo_info['description']),
                    create_main_menu(user_id)
                )
                logger.info(f"User {user_id} activated promo code {promo_code}")
            else:
                await update_menu_message(
                    user_id,
                    get_text('promo_activation_error', user_lang),
                    create_activation_menu(user_id)
                )
        else:
            await update_menu_message(
                user_id,
                get_text('promo_save_error', user_lang),
                create_activation_menu(user_id)
            )
    else:
        await update_menu_message(
            user_id,
            get_text('promo_error', user_lang),
            create_back_menu(user_id)
        )


@dp.message(StateFilter(UserStates.selecting_language))
@error_handler
async def handle_language_selection_text(message: Message, state: FSMContext):
    """Обработка текстовых сообщений во время выбора языка"""
    user_id = message.chat.id

    await safe_delete_message(user_id, message.message_id)

    # Показываем сообщение с просьбой использовать кнопки
    await update_menu_message(
        user_id,
        "Please use the buttons to select your language.\n\nПожалуйста, используйте кнопки для выбора языка.",
        create_initial_language_menu()
    )


@dp.message()
@error_handler
async def handle_other_messages(message: Message):
    """Обработка всех остальных сообщений"""
    user_id = message.chat.id
    user_lang = get_user_language(user_id)

    await safe_delete_message(user_id, message.message_id)
    await update_menu_message(
        user_id,
        get_text('use_menu_buttons', user_lang),
        create_main_menu(user_id)
    )


async def start_bot() -> None:
    """Запуск бота с обработкой ошибок и переподключением"""
    retries = 0

    while retries < MAX_RETRIES:
        try:
            logger.info("Starting Telegram bot...")

            # Запуск polling
            await dp.start_polling(bot, skip_updates=True)
            break

        except TelegramAPIError as e:
            logger.error(f"Telegram API error: {e}")
            if retries < MAX_RETRIES - 1:
                logger.info(f"Retrying in {RETRY_DELAY} seconds... (attempt {retries + 1}/{MAX_RETRIES})")
                await asyncio.sleep(RETRY_DELAY)
            retries += 1

        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            if retries < MAX_RETRIES - 1:
                logger.info(f"Retrying in {RETRY_DELAY} seconds... (attempt {retries + 1}/{MAX_RETRIES})")
                await asyncio.sleep(RETRY_DELAY)
            retries += 1
    else:
        logger.critical("Maximum retry attempts reached. Bot cannot connect.")
        raise Exception("Bot failed to start after maximum retries")


# Функция для запуска в отдельном потоке
def run_bot() -> None:
    """Запуск бота в новом event loop"""
    event_loop = None
    try:
        # Инициализация базы данных
        init_db()

        # Создаем новый event loop для этого потока
        event_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(event_loop)

        # Запускаем бота
        event_loop.run_until_complete(start_bot())

    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.critical(f"Bot crashed: {e}")
        raise
    finally:
        if event_loop:
            try:
                event_loop.close()
            except Exception:
                pass


def start_bot_thread():
    """Запуск бота в отдельном потоке"""
    bot_thread = threading.Thread(target=run_bot, daemon=True)
    bot_thread.start()
    return bot_thread


if __name__ == "__main__":
    run_bot()