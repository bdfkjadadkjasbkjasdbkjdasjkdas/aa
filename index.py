
import telebot
from telebot import types
import random
import time
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# Инициализация Flask и Telegram-бота
app = Flask(__name__)
CORS(app)
bot = telebot.TeleBot('7756382051:AAEQgOGbPRF490J944eqKEFuqTzN3-m_eFY')

# Константы
ADMIN_LOGIN = "admin"
ADMIN_PASSWORD = "admin"
TARIFF = 44

# Маршруты и перевозчики
ROUTES = {
    "2": ["Дом ученых - А/В Восточный", ['ООО "Экипаж-ГО"', 'ИП Галченкова Е. А.', 'ИП Багаев Д.Б.']],
    "3": ["Студгородок - а.вокз. Восточный", ['ООО "СТК"', 'ИП Патрин Н. Н.']],
    "21": ['Парк "Прищепка" - Спортзал', ['ООО "СТК"', 'ИП Патрин Н. Н.']],
    "87": ["Солнечный – Молодежная", ['КПАТП-5']]
}

# REST API для Mini App
@app.route('/generate_ticket', methods=['POST'])
def generate_ticket_api():
    data = request.json

    # Получаем данные из запроса
    bus_number2 = data.get('company')
    bus_name = data.get('route')
    bus_number = data.get('busNumber')
    quantity = int(data.get('quantity', 1))

    # Генерация номера билета
    ticket_number = random.randint(990, 999)
    ticket_number2 = random.randint(100, 999)
    ticket_number3 = random.randint(100, 999)

    # Форматирование номера билета
    full_ticket_number = f"{ticket_number} {ticket_number2} {ticket_number3}"

    # Время действия билета
    duration = time.time()
    one_hour_later = duration + 28800  # 8 часов
    formatted_time = time.strftime("%H:%M:%S", time.localtime(one_hour_later))
    valid_until = formatted_time[:-3]

    # Расчет стоимости
    route_number = bus_name.split()[0]
    price = quantity * (40 if route_number.endswith('т') else 44)

    # Формирование текущей даты и времени
    current_date = time.strftime("%d %B %Y", time.localtime())
    current_time = time.strftime("%H:%M", time.localtime())

    # Подготовка ответа
    response = {
        'success': True,
        'ticket': {
            'company': bus_number2,
            'route': bus_name,
            'busNumber': bus_number,
            'ticketNumber': full_ticket_number,
            'price': price,
            'quantity': quantity,
            'date': current_date,
            'time': current_time,
            'validUntil': valid_until
        }
    }

    return jsonify(response)

# Обработчик команды /start для бота
@bot.message_handler(commands=['start'])
def start(message):
    url = "https://amam5242amamtyuioprewq.github.io/myFirstRep/index.html"  # Замените на URL вашего Mini App

    # Создаем инлайн кнопку для открытия Mini App
    markup = types.InlineKeyboardMarkup()
    btn = types.InlineKeyboardButton(text="Купить билет", web_app=types.WebAppInfo(url=url))
    markup.add(btn)

    bot.send_message(message.chat.id, "Добро пожаловать! Нажмите кнопку ниже, чтобы купить билет:", reply_markup=markup)

# Запуск сервера Flask
if __name__ == '__main__':
    import threading

    # Запуск Flask сервера в отдельном потоке
    def run_flask():
        app.run(host='0.0.0.0', port=8080)

    flask_thread = threading.Thread(target=run_flask)
    flask_thread.start()

    # Запуск бота
    bot.polling(none_stop=True)
