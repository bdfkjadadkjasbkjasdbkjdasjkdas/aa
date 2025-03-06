
// Получение данных из Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Функция для получения параметров из URL
function getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    
    for (const [key, value] of urlParams.entries()) {
        params[key] = value;
    }
    
    return params;
}

// Функция для отображения билета на основе полученных данных
function generateTicket() {
    // Получаем параметры из URL или используем тестовые данные если их нет
    const params = getUrlParameters();
    
    const carrier = decodeUrlParameter(params.carrier) || 'ИП Патрин Н. Н.';
    const routeNumber = decodeUrlParameter(params.route_number) || '21';
    const routeName = decodeUrlParameter(params.route_name) || 'Парк "Прищепка" - Спортзал';
    const busNumber = decodeUrlParameter(params.bus_number) || 'х312мв124';
    const ticketCount = parseInt(params.ticket_count || '1');
    
    // Используем предоставленные данные или генерируем новые
    let totalPrice;
    if (params.price) {
        totalPrice = parseFloat(params.price);
    } else {
        // Рассчитываем цену на основе типа маршрута
        const pricePerTicket = routeNumber.endsWith('т') ? 40 : 44;
        totalPrice = pricePerTicket * ticketCount;
    }
    
    // Используем предоставленный номер билета или генерируем новый
    let formattedTicketNumber;
    if (params.ticket_number) {
        formattedTicketNumber = params.ticket_number;
    } else {
        // Генерируем случайный номер билета
        const ticketNumber = Math.floor(Math.random() * (999999999 - 950000000 + 1)) + 950000000;
        formattedTicketNumber = ticketNumber.toString().replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    
    // Получаем дату и время из параметров URL или используем текущие
    let formattedDate, currentTime;
    
    if (params.date && params.time) {
        formattedDate = params.date;
        currentTime = params.time;
    } else {
        // Получаем текущее время
        const currentDate = new Date();
        
        // Форматируем дату
        formattedDate = currentDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        // Текущее время
        currentTime = currentDate.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Заполняем билет
    document.getElementById('ticketForm').style.display = 'none';
    document.getElementById('ticketOptions').style.display = 'none';
    
    const ticketContainer = document.getElementById('ticketContainer');
    const ticketContent = document.getElementById('ticketContent');
    
    ticketContent.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%;">
            <div style="flex: 1;">
                <div class="countdown-top" id="countdown" style="font-weight: normal; text-decoration: none; margin-bottom: 15px;">Действует: 15 сек.</div>
                <div style="display: flex; justify-content: center; gap: 50px; padding: 15px 0 0 0; margin-bottom: 0;">
                    <span onclick="showTicketView()" style="cursor: pointer; color: #e31c1c; padding-bottom: 0; font-size: 20px; position: relative;"><img src="Снимок7.PNG" style="width: 25px; height: 25px; vertical-align: middle; margin-right: 5px;"> ${formattedTicketNumber}<div style="position: absolute; bottom: -10px; left: 0; width: 100%; height: 2px; background-color: #e31c1c;"></div></span>
                    <span style="color: white; text-decoration: none; font-size: 20px; padding-bottom: 0; position: relative;" onclick="showQRView()"><img src="Снимок10.PNG" style="width: 25px; height: 30px; vertical-align: middle; margin-right: 5px;"> Контроль</span>
                </div>
                <div style="border-bottom: 1px solid rgba(255,255,255,0.1); margin-top: 10px; margin-bottom: 10px;"></div>
                <div class="ticket-info" style="padding: 10px 0 10px 0; margin-top: 10px;">
                    <div class="ticket-info-icon" style="width: 40px;"><img src="Снимок12.PNG" style="width: 28px; height: 35px;"></div>
                    <div class="ticket-info-content">
                        <div class="status-text" style="color: #999999;">Перевозчик</div>
                        <div class="value" style="font-size: 24px;">${carrier}</div>
                    </div>
                </div>
                <div class="ticket-info" style="padding: 6px 0;">
                    <div class="ticket-info-icon"><img src="Снимок.PNG" style="width: 40px; height: 40px;"></div>
                    <div class="ticket-info-content">
                        <div class="status-text">${routeNumber} ${routeName}</div>
                        <div class="value" style="font-size: 26px;">${busNumber}</div>
                    </div>
                </div>
                <div class="ticket-info" style="padding: 6px 0;">
                    <div class="ticket-info-icon"><img src="Снимок2.PNG" style="width: 30px; height: 30px;"></div>
                    <div class="ticket-info-content">
                        <div class="status-text">Стоимость</div>
                        <div class="value" style="display: flex; align-items: center;">${ticketCount} шт., Полный, <span style="margin-left: 5px;">${totalPrice}.00</span> <img src="снимок31.png" style="width: 15px; height: 20px; vertical-align: middle; position: relative; top: -1px;"></div>
                    </div>
                </div>
                <div class="ticket-info" style="padding: 22px 0;">
                    <div class="ticket-info-icon"><img src="Снимок3.PNG" style="width: 30px; height: 35px;"></div>
                    <div class="ticket-info-content">
                        <div class="status-text">Дата покупки</div>
                        <div class="value">${formattedDate}</div>
                    </div>
                </div>
                <div class="ticket-info">
                    <div class="ticket-info-icon"><img src="Снимок5.PNG" style="width: 35px; height: 35px;"></div>
                    <div class="ticket-info-content">
                        <div class="status-text">Время покупки:</div>
                        <div class="value">${currentTime}</div>
                    </div>
                </div>
            </div>
            <button class="close-button" onclick="closeTicket()">ЗАКРЫТЬ</button>
        </div>
    `;
    
    // Устанавливаем QR-код
    if (!qrCache[formattedTicketNumber]) {
        qrCache[formattedTicketNumber] = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${formattedTicketNumber}`;
    }
    document.getElementById('qrCode').src = qrCache[formattedTicketNumber];
    document.getElementById('qrTicketNumber').innerHTML = `<img src="Снимок6.PNG" style="width: 28px; height: 32px; vertical-align: middle; margin-right: 5px;"> ${formattedTicketNumber}`;
    document.getElementById('qrNumberDisplay').textContent = `№ ${formattedTicketNumber}`;
    
    // Показываем билет
    ticketContainer.style.display = 'block';
    startCountdown();
    
    // Сохраняем билет в историю
    const newTicket = {
        ticketContent: ticketContent.innerHTML,
        qrCodeSrc: document.getElementById('qrCode').src,
        qrTicketNumber: document.getElementById('qrTicketNumber').textContent,
        qrNumberDisplay: document.getElementById('qrNumberDisplay').textContent
    };
    
    lastTickets.unshift(newTicket);
    if (lastTickets.length > 3) lastTickets.pop();
    localStorage.setItem('lastTickets', JSON.stringify(lastTickets));
}

// Запускаем генерацию билета при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Получаем параметры URL
    const params = getUrlParameters();
    
    // Проверяем, открыта ли страница из Telegram Web App
    if (tg.initData && tg.initData.length > 0) {
        // Если страница открыта через Telegram и есть параметр auto_generate
        if (params.auto_generate === 'true') {
            // Генерируем билет на основе данных из URL
            generateTicket();
        } else {
            // Если нет параметра auto_generate, показываем обычные опции
            showTicketOptions();
        }
    } else {
        // Проверяем, есть ли параметры для автоматической генерации билета
        if (params.auto_generate === 'true') {
            // Генерируем билет на основе данных из URL
            generateTicket();
        } else {
            // Иначе показываем обычные опции
            showTicketOptions();
        }
    }
});
