    import os
    import logging
    import datetime
    import random
    import pytz
    import asyncio
    from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, ContextTypes, ConversationHandler, filters
    from telegram.ext.filters import TEXT as TEXT_FILTER
    from telegram.ext.filters import COMMAND as COMMAND_FILTER
    from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
    from telegram._update import Update

    # Enable logging
    logging.basicConfig(
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        level=logging.INFO
    )

    # Bot token
    BOT_TOKEN = "7756382051:AAEQgOGbPRF490J944eqKEFuqTzN3-m_eFY"

    # Authorized users (add usernames or user IDs)
    AUTHORIZED_USERS = [
        # Add Telegram usernames (without @) or user IDs
        "evgen87654321",
        "user2",
        123456789,
    ]

    # Define conversation states
    ROUTE, CARRIER, BUS_NUMBER, TICKETS_COUNT = range(4)

    # Define carriers dictionary
    CARRIERS = {
        "2": ['ООО "Экипаж-ГО"', 'ИП Галченкова Е. А.', 'ИП Багаев Д.Б.'],
        "3": ['ООО "СТК"', 'ИП Патрин Н. Н.'],
        "5": ['ИП Долгушина Г.И.'],
        "6": ['ИП Тагачаков В.Г.'],
        "7": ['ООО "Экипаж-ГО"', 'ИП Галченкова Е. А.'],
        "8": ['ООО "Перевозчик"'],
        "9": ['ООО "СКАД"'],
        "10": ['КПАТП-7'],
        "11": ['КПАТП-5'],
        "12": ['КПАТП-7'],
        "14": ['АО "СТК"'],
        "19": ['КПАТП-7'],
        "21": ['ООО "СТК"', 'ИП Патрин Н. Н.'],
        "22": ['КПАТП-7'],
        "23": ['ООО "Ветеран"'],
        "26": ['КПАТП-5'],
        "27": ['ИП Ялтонский А.М.'],
        "30": ['КПАТП-5'],
        "31": ['КПАТП-7'],
        "37": ['КПАТП-7'],
        "38": ['АО "СТК"'],
        "43": ['ООО "Вавулин-К"'],
        "49": ['КПАТП-5'],
        "50": ['ИП Читашвили Н.С.'],
        "52": ['КПАТП-5'],
        "55": ['КПАТП-7'],
        "56": ['КПАТП-7'],
        "58": ['ИП Кривоногов И.Г.', 'ИП Голунцов С.В.'],
        "60": ['ИП Цугленок М.М.'],
        "61": ['КПАТП'],
        "63": ['КПАТП'],
        "64": ['КПАТП-5'],
        "65": ['ИП Ялтонский А.М.'],
        "71": ['ООО "Экипаж-ГО"', 'ИП Галченкова О.Г.'],
        "77": ['ООО "Практик"', 'ООО "Сибирь-Авто"'],
        "78": ['ИП Бронников А.И.', 'ИП Бронников М.А.'],
        "80": ['ИП Долгушин Д.Г.'],
        "81": ['ООО "Сирена"'],
        "83": ['ИП Цугленок М.М.'],
        "85": ['ООО "СКАД"', 'ООО "СТК"'],
        "87": ['КПАТП-5'],
        "88": ['ИП Тагачаков В.Г.'],
        "90": ['ИП Патрин Н. Н.'],
        "92": ['ИП Патрин Н. Н.'],
        "94": ['ООО "Практик"', 'ООО "МаршрутАвто"', 'ИП Карасева Н.Н.'],
        "95": ['КПАТП-7'],
        "98": ['ИП Гнетов Ю.Н.'],
        "99": ['ООО "СТК"', 'ИП Патрин Н. Н.'],
        "4т": ['МП Городской транспорт'],
        "5т": ['МП Городской транспорт'],
        "6т": ['МП Городской транспорт'],
        "13т": ['МП Городской транспорт'],
        "15т": ['МП Городской транспорт']
    }

    # Define routes dictionary
    ROUTES = {
        "2": "Дом ученых - А/В Восточный",
        "3": "Студгородок - а.вокз. Восточный",
        "5": "Спорткомплекс Радуга - ОАО Красфарма",
        "6": "Кардиоцентр - ДК Кировский",
        "7": "Агротерминал - ДК Кировский",
        "8": "Станция Красноярск-Северный - пос. Водников",
        "9": "Междугородный автовокзал - Верхняя Базаиха",
        "10": "ОАО Красфарма - пос. Энергетиков",
        "11": "3-я Дальневосточная - Молодёжная",
        "12": "с/х Удачный - Станция Красноярск-Северный",
        "14": "Ж/д больница - пос. Овинный",
        "19": "С/О Южное - Причал",
        "21": "Парк \"Прищепка\" - Спортзал",
        "22": "ж/к Ясный - ИТК",
        "23": "ЛДК - Микрорайон Солнечный",
        "26": "Ж/д больница - Плодово-ягодная станция",
        "27": "Полигон - Микрорайон Преображенский",
        "30": "Спортзал - Микрорайон Тихие Зори",
        "31": "Академия биатлона - ЛДК",
        "37": "Гренада - Комбайновый завод",
        "38": "Дом учёных - пос. Таймыр",
        "43": "Восточный-Сельхозкомплекс",
        "49": "Спорткомплекс Радуга - Кардиоцентр",
        "50": "Микрорайон Солнечный - Стела",
        "52": "ЛДК - Озеро-парк",
        "55": "Комбайновый завод - пос. Цементников",
        "56": "Железнодорожный вокзал - Шинное кладбище",
        "58": "Поликлиника - Спортзал",
        "60": "А/В Восточный - мкрн. Солнечный",
        "61": "Шинное кладбище - мкрн. Солнечный",
        "63": "Академгородок - мкрн. Солнечный",
        "64": "мкрн Солнечный - мкрн. Тихие Зори",
        "65": "ДК Кировский - Агротерминал",
        "71": "Спортзал - пос Таймыр",
        "77": "Ж/д больница - пос. Песчанка",
        "78": "Стела - Контейнерный двор",
        "80": "пос.Таймыр-мкрн. Тихие Зори",
        "81": "Ж/д больница - Сибирский элемент",
        "83": "Дом учёных - Профилакторий з-да КраМЗ",
        "85": "Сельхозкомплекс - мкрн. Верхние Черёмушки",
        "87": "Солнечный – Молодежная",
        "88": "Академия биатлона - Спортзал",
        "90": "Верхняя Базаиха - Академия биатлона",
        "92": "ОАО Красфарма - Химкомбинат Енисей",
        "94": "ЛДК - ТЭЦ-3",
        "95": "мкрн. Верхние Черёмушки - ЛДК",
        "98": "ЛДК - ОАО Русал",
        "99": "Северный-Цимлянская",
        "4т": "Комбайновый завод - Комбайновый завод",
        "5т": "ст.Красноярск-Северный - Экопарк Гремячая грива",
        "6т": "Студгородок - Студгородок",
        "13т": "Комбайновый завод - Северо-Западный район",
        "15т": "ОАО Русал - Сельхозкомплекс"
    }

    # User data storage
    user_data = {}

    # Функция для хранения сообщения бота
    def store_message(context, message_id, chat_id):
        """Сохраняет ID сообщения бота в контексте (для постоянных сообщений)."""
        if not context.user_data.get('bot_messages'):
            context.user_data['bot_messages'] = []

        context.user_data['bot_messages'].append({'message_id': message_id, 'chat_id': chat_id})

    # Функция для сохранения промежуточного сообщения
    def store_temp_message(context, message_id, chat_id):
        """Сохраняет ID промежуточного сообщения, которое будет удалено после создания билета."""
        if 'temp_messages' not in context.user_data:
            context.user_data['temp_messages'] = []

        context.user_data['temp_messages'].append({'message_id': message_id, 'chat_id': chat_id})

    # Функция для удаления промежуточных сообщений
    async def delete_temp_messages(context):
        """Удаляет промежуточные сообщения из процесса создания билета."""
        if context.user_data.get('temp_messages'):
            for msg in context.user_data['temp_messages']:
                try:
                    await context.bot.delete_message(
                        chat_id=msg['chat_id'],
                        message_id=msg['message_id']
                    )
                except Exception as e:
                    logging.error(f"Ошибка при удалении промежуточного сообщения: {e}")

            context.user_data['temp_messages'] = []

    # Функция для удаления предыдущих сообщений бота (не используется, но оставлена для совместимости)
    async def delete_previous_messages(context):
        """Удаляет предыдущие сообщения бота из чата."""
        if context.user_data.get('bot_messages'):
            for msg in context.user_data['bot_messages']:
                try:
                    await context.bot.delete_message(
                        chat_id=msg['chat_id'],
                        message_id=msg['message_id']
                    )
                except Exception as e:
                    logging.error(f"Ошибка при удалении сообщения: {e}")

            context.user_data['bot_messages'] = []

    async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Send a message when the command /start is issued."""
        user = update.effective_user
        user_id = user.id
        username = user.username

        # Инициализируем список промежуточных сообщений, если его нет
        if 'temp_messages' not in context.user_data:
            context.user_data['temp_messages'] = []

        # Проверяем, авторизован ли пользователь
        is_authorized = (user_id in AUTHORIZED_USERS) or (username in AUTHORIZED_USERS)

        if not is_authorized:
            # Пользователь не авторизован
            message = await update.message.reply_text(
                "Доступ запрещен. Обратитесь к владельцу: @evgen87654321"
            )
            store_message(context, message.message_id, update.effective_chat.id)
            return ConversationHandler.END

        # Если пользователь авторизован, продолжаем
        # Удаляем сообщение пользователя с командой, если возможно
        try:
            await context.bot.delete_message(
                chat_id=update.effective_chat.id,
                message_id=update.message.message_id
            )
        except Exception as e:
            logging.error(f"Ошибка при удалении сообщения пользователя: {e}")

        # Удаляем все предыдущие промежуточные сообщения
        await delete_temp_messages(context)

        # Создаем список популярных маршрутов для кнопок
        popular_routes = ["21", "90", "3", "99"]
        keyboard = []

        # Создаем строки с 2 кнопками в каждой
        for i in range(0, len(popular_routes), 2):
            row = []
            for j in range(2):
                if i + j < len(popular_routes):
                    route = popular_routes[i + j]
                    row.append(InlineKeyboardButton(f"{route}: {ROUTES[route]}", callback_data=f"route_{route}"))
            keyboard.append(row)

        # Добавляем кнопку для ручного ввода маршрута
        keyboard.append([InlineKeyboardButton("Ввести номер маршрута вручную", callback_data="manual_route")])

        reply_markup = InlineKeyboardMarkup(keyboard)

        message = await update.message.reply_text(
            "Добро пожаловать в бот покупки билетов на автобус!\n\n"
            "Пожалуйста, выберите маршрут:",
            reply_markup=reply_markup
        )

        # Сохраняем ID сообщения как промежуточное сообщение
        store_temp_message(context, message.message_id, update.effective_chat.id)

        return ROUTE

    async def handle_route_selection(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Обработка выбора маршрута из кнопок."""
        query = update.callback_query
        await query.answer()

        if query.data == "manual_route":
            await query.edit_message_text(
                "Пожалуйста, введите номер маршрута (например, 21):"
            )
            return ROUTE

        # Извлекаем номер маршрута из callback_data
        route_number = query.data.split("_")[1]

        user_id = update.effective_user.id
        if user_id not in user_data:
            user_data[user_id] = {}

        user_data[user_id]['route_number'] = route_number
        user_data[user_id]['route_name'] = ROUTES[route_number]

        # Создаем клавиатуру с перевозчиками для выбранного маршрута
        carriers_list = CARRIERS[route_number]
        keyboard = []

        # Создаем строки с 1 перевозчиком на строку
        for carrier in carriers_list:
            keyboard.append([InlineKeyboardButton(carrier, callback_data=carrier)])

        reply_markup = InlineKeyboardMarkup(keyboard)

        await query.edit_message_text(
            f"Выбран маршрут {route_number}: {ROUTES[route_number]}\n\n"
            "Выберите перевозчика:",
            reply_markup=reply_markup
        )
        return CARRIER

    async def enter_route(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Обработка ручного ввода маршрута."""
        user_id = update.effective_user.id
        route_number = update.message.text.strip()

        # Удаляем сообщение пользователя с номером маршрута
        try:
            await context.bot.delete_message(
                chat_id=update.effective_chat.id,
                message_id=update.message.message_id
            )
        except Exception as e:
            logging.error(f"Ошибка при удалении сообщения пользователя: {e}")

        # Больше не удаляем предыдущие сообщения бота

        if route_number not in ROUTES:
            message = await update.message.reply_text(
                "Такого маршрута нет. Пожалуйста, введите корректный номер маршрута:"
            )
            store_temp_message(context, message.message_id, update.effective_chat.id)
            return ROUTE

        if user_id not in user_data:
            user_data[user_id] = {}

        user_data[user_id]['route_number'] = route_number
        user_data[user_id]['route_name'] = ROUTES[route_number]

        # Создаем клавиатуру с перевозчиками для выбранного маршрута
        carriers_list = CARRIERS[route_number]
        keyboard = []

        # Создаем строки с перевозчиками
        for carrier in carriers_list:
            keyboard.append([InlineKeyboardButton(carrier, callback_data=carrier)])

        reply_markup = InlineKeyboardMarkup(keyboard)

        message = await update.message.reply_text(
            f"Выбран маршрут {route_number}: {ROUTES[route_number]}\n\n"
            "Выберите перевозчика:",
            reply_markup=reply_markup
        )
        store_temp_message(context, message.message_id, update.effective_chat.id)
        return CARRIER

    async def select_carrier(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Обработка выбора перевозчика."""
        query = update.callback_query
        await query.answer()

        user_id = update.effective_user.id
        carrier = query.data

        user_data[user_id]['carrier'] = carrier

        await query.edit_message_text(
            f"Выбран маршрут: {user_data[user_id]['route_number']} {user_data[user_id]['route_name']}\n"
            f"Выбран перевозчик: {carrier}\n\n"
            "Теперь введите номер автобуса (например, х312мв124):"
        )
        return BUS_NUMBER

    async def enter_bus_number(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Обработка ввода номера автобуса."""
        user_id = update.effective_user.id
        bus_number = update.message.text.strip()

        # Удаляем сообщение пользователя с номером автобуса
        try:
            await context.bot.delete_message(
                chat_id=update.effective_chat.id,
                message_id=update.message.message_id
            )
        except Exception as e:
            logging.error(f"Ошибка при удалении сообщения пользователя: {e}")

        # Больше не удаляем предыдущие сообщения бота

        user_data[user_id]['bus_number'] = bus_number

        keyboard = [
            [
                InlineKeyboardButton("1", callback_data="1"),
                InlineKeyboardButton("2", callback_data="2"),
                InlineKeyboardButton("3", callback_data="3"),
                InlineKeyboardButton("4", callback_data="4"),
                InlineKeyboardButton("5", callback_data="5")
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        message = await update.message.reply_text(
            "Выберите количество билетов:",
            reply_markup=reply_markup
        )
        store_temp_message(context, message.message_id, update.effective_chat.id)
        return TICKETS_COUNT

    async def select_ticket_count(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Обработка выбора количества билетов."""
        query = update.callback_query
        await query.answer()

        user_id = update.effective_user.id
        ticket_count = int(query.data)
        user_data[user_id]['ticket_count'] = ticket_count

        # Получаем данные пользователя
        data = user_data[user_id]

        # Генерируем билет
        ticket = generate_ticket(user_id)

        # Генерируем детали билета для веб-приложения
        carrier = data['carrier']
        route_number = data['route_number']
        route_name = data['route_name']
        bus_number = data['bus_number']

        # Рассчитываем стоимость в зависимости от типа маршрута
        price_per_ticket = 40 if route_number.endswith('т') else 44
        total_price = price_per_ticket * ticket_count

        # Генерируем новый случайный номер билета при каждом создании билета
        formatted_ticket_number = generate_ticket_number()
        # Сохраняем номер билета в данных пользователя
        user_data[user_id]['ticket_number'] = formatted_ticket_number

        # Получаем текущее время и время истечения с учетом +4 часа от Москвы
        moscow_tz = pytz.timezone('Europe/Moscow')
        now = datetime.datetime.now(moscow_tz) + datetime.timedelta(hours=4, minutes=-30)

        # Словарь с переводом названий месяцев на русский
        months_ru = {
            'January': 'января',
            'February': 'февраля',
            'March': 'марта',
            'April': 'апреля',
            'May': 'мая',
            'June': 'июня',
            'July': 'июля',
            'August': 'августа',
            'September': 'сентября',
            'October': 'октября',
            'November': 'ноября',
            'December': 'декабря'
        }

        # Форматируем дату на русском
        month_eng = now.strftime("%B")
        month_ru = months_ru.get(month_eng, month_eng)
        current_date = f"{now.day} {month_ru} {now.year}"

        current_time = now.strftime("%H:%M")
        expiration_time = (now + datetime.timedelta(minutes=30)).strftime("%H:%M")

        # Создаем URL для веб-приложения со всеми параметрами
        base_url = "https://bdfkjadadkjasbkjasdbkjdasjkdas.github.io/aa/index14.html"

        # URL кодируем параметры
        from urllib.parse import quote

        # Получаем части номера билета из formatted_ticket_number (в формате "XXX XXX XXX")
        ticket_parts = formatted_ticket_number.split()
        # Форматируем номер билета без пробелов для URL (но не используем его)
        ticket_number_raw = ''.join(ticket_parts)

        # Логгирование для отладки
        logging.info(f"Отправка номера билета в мини-приложение: {formatted_ticket_number}")
        logging.info(f"Билет должен отображаться с номером: {formatted_ticket_number}")

        # Двойное кодирование для обеспечения корректной передачи номера билета
        # Это особенно важно для номеров с пробелами
        encoded_ticket_number = quote(quote(formatted_ticket_number))

        # Выводим логи для проверки кодирования
        logging.info(f"Исходный номер билета: {formatted_ticket_number}")
        logging.info(f"Закодированный номер билета: {encoded_ticket_number}")

        # Добавляем специальный параметр для указания, что номер билета пришел от бота
        # и передаем номер билета в формате, который должен отображаться
        webapp_url = (
            f"{base_url}"
            f"?carrier={quote(carrier)}"
            f"&route_number={quote(route_number)}"
            f"&route_name={quote(data['route_name'])}"
            f"&bus_number={quote(bus_number)}"
            f"&ticket_count={ticket_count}"
            f"&ticket_number={encoded_ticket_number}"  # Используем закодированный номер билета
            f"&price={total_price}"
            f"&date={quote(current_date)}"
            f"&time={expiration_time}"
            f"&from_bot=true"  # Явно указываем, что номер пришел от бота
            f"&auto_generate=false"  # Указываем, что не нужно генерировать новый номер
        )

        # Для дополнительной гарантии правильного номера билета, добавляем его еще раз
        # в конце URL с другим именем параметра, для подстраховки
        webapp_url += f"&ticket_num_direct={encoded_ticket_number}"

        # Логируем финальный URL для отладки
        logging.info(f"Финальный URL для мини-приложения: {webapp_url}")

        # Кнопка для открытия Mini App
        keyboard = [
            [InlineKeyboardButton(
                "Открыть билет",
                web_app=WebAppInfo(url=webapp_url)
            )]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        # Сначала создаем новое сообщение с билетом (это сообщение останется в чате)
        chat_id = update.effective_chat.id
        await context.bot.send_message(
            chat_id=chat_id,
            text=ticket,
            reply_markup=reply_markup
        )

        # Затем удаляем все промежуточные сообщения процесса создания билета,
        # включая последнее сообщение с выбором количества билетов
        await delete_temp_messages(context)

        # Добавляем текущее сообщение в список промежуточных для удаления
        try:
            store_temp_message(context, query.message.message_id, chat_id)
            await delete_temp_messages(context)
        except Exception as e:
            logging.error(f"Ошибка при удалении сообщения выбора количества билетов: {e}")

        return ConversationHandler.END

    def generate_ticket_number():
        """
        Генерирует номер билета в формате XXX XXX XXX, где:
        - первые 3 цифры от 900 до 999
        - вторые 3 цифры от 100 до 999
        - третьи 3 цифры от 100 до 999

        Эта функция вызывается каждый раз при генерации билета,
        что гарантирует новые номера для каждого билета.
        """
        # Используем время в миллисекундах как seed для случайного генератора
        # Это гарантирует, что даже при быстрой генерации билетов номера будут разными
        random.seed(datetime.datetime.now().microsecond)

        part1 = random.randint(900, 999)
        part2 = random.randint(100, 999)
        part3 = random.randint(100, 999)
        return f"{part1} {part2} {part3}"

    def generate_ticket(user_id: int) -> str:
        """Генерация билета на основе выбора пользователя."""
        # Получаем данные пользователя
        data = user_data[user_id]
        carrier = data['carrier']
        route_number = data['route_number']
        route_name = data['route_name']
        bus_number = data['bus_number']
        ticket_count = data['ticket_count']

        # Рассчитываем стоимость в зависимости от типа маршрута
        price_per_ticket = 40 if route_number.endswith('т') else 44
        total_price = price_per_ticket * ticket_count

        # Всегда генерируем новый номер билета
        formatted_ticket_number = generate_ticket_number()
        data['ticket_number'] = formatted_ticket_number

        # Получаем текущее время и время истечения (+5 часов)
        moscow_tz = pytz.timezone('Europe/Moscow')
        now = datetime.datetime.now(moscow_tz)
        expiration_time = (now + datetime.timedelta(hours=5)).strftime("%H:%M")

        # Форматируем текст билета
        ticket_text = (
            f"Билет куплен успешно.\n"
            f"{carrier}\n"
            f"🚏 {route_number} {route_name}\n"
            f"🚌 {bus_number}\n"
            f"🪙 Тариф: Полный {total_price},00 ₽\n"
            f"🎫 Билет № {formatted_ticket_number}\n"
            f"🕑 Действует до {expiration_time}"
        )

        return ticket_text

    async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Отмена и завершение диалога."""
        # Удаляем сообщение пользователя с командой отмены
        try:
            await context.bot.delete_message(
                chat_id=update.effective_chat.id,
                message_id=update.message.message_id
            )
        except Exception as e:
            logging.error(f"Ошибка при удалении сообщения пользователя: {e}")

        # Больше не удаляем предыдущие сообщения бота

        message = await update.message.reply_text('Операция отменена.')

        # Удаляем и это сообщение через 3 секунды
        await asyncio.sleep(3)
        try:
            await message.delete()
        except Exception as e:
            logging.error(f"Ошибка при удалении сообщения: {e}")

        return ConversationHandler.END

    def main() -> None:
        """Запуск бота."""
        # Создаем приложение и передаем ему токен бота
        application = Application.builder().token(BOT_TOKEN).build()

        # Добавляем обработчик диалога
        conv_handler = ConversationHandler(
            entry_points=[
                CommandHandler("start", start),
                CommandHandler("buy", start)
            ],
            states={
                ROUTE: [
                    CallbackQueryHandler(handle_route_selection),
                    MessageHandler(TEXT_FILTER & ~COMMAND_FILTER, enter_route)
                ],
                CARRIER: [
                    CallbackQueryHandler(select_carrier)
                ],
                BUS_NUMBER: [
                    MessageHandler(TEXT_FILTER & ~COMMAND_FILTER, enter_bus_number)
                ],
                TICKETS_COUNT: [
                    CallbackQueryHandler(select_ticket_count)
                ],
            },
            fallbacks=[CommandHandler("cancel", cancel)],
        )

        application.add_handler(conv_handler)

        # Запускаем бота в режиме постоянной работы
        application.run_polling(allowed_updates=Update.ALL_TYPES, drop_pending_updates=True, close_loop=False)

    if __name__ == '__main__':
        main()
        #сделай так, чтобы в мини приложении новые цифры номера билета не генерировались, а брались от тг бота в созданном билете (🎫 Билет № {formatted_ticket_number})
