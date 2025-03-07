// Initialize Telegram WebApp
let tg;
try {
    tg = window.Telegram.WebApp;
    tg.expand();
    console.log("Telegram WebApp initialized successfully");
} catch (e) {
    console.log("Error initializing Telegram WebApp:", e);
    // Создаем заглушку на случай тестирования вне Telegram
    tg = {
        close: function() { console.log("[Telegram.WebView] > postEvent", "web_app_close", {}); },
        enableClosingConfirmation: function() { 
            console.log("[Telegram.WebApp] Closing confirmation is not supported in version 6.0"); 
        },
        expand: function() { console.log("[Telegram.WebView] > postEvent", "web_app_expand", ""); }
    };
}

// Function to get URL parameters
function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    for (const [key, value] of urlParams) {
        params[key] = decodeURIComponent(value);
    }

    return params;
}

// Function to get ticket number from URL params or use default
function getTicketNumber(params) {
    if (params.ticket_number) {
        // Получаем номер из URL и удаляем лишние пробелы
        let ticketNum = params.ticket_number.trim();

        console.log("Получен номер билета из URL (должен использоваться):", ticketNum);
        
        // Всегда используем номер билета именно в том формате, в котором он пришел из бота
        console.log("Получен номер билета после обработки:", ticketNum);
        
        // Дополнительно выводим для отладки
        console.log("Финальный номер билета для отображения:", ticketNum);
        
        return ticketNum;
    }
    
    // Если номер не передан, используем дефолтный
    console.log("Номер билета не найден в URL, используем дефолтный");
    return "000 000 000";
}

// Function to generate expiration time if not provided
function generateExpiryTime() {
    const now = new Date();
    const expiryTime = new Date(now.getTime() + 30 * 60000); // 30 minutes later
    return expiryTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// Global variables for ticket state
let isQRView = false;
let startX = 0;
let endX = 0;
let countdownInterval;

// Add touch event handlers
document.addEventListener('DOMContentLoaded', function() {
    const ticketContainer = document.getElementById('ticketContainer');

    ticketContainer.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });

    ticketContainer.addEventListener('touchmove', (e) => {
        endX = e.touches[0].clientX;
    });

    ticketContainer.addEventListener('touchend', () => {
        const diffX = startX - endX;
        if (Math.abs(diffX) > 50) {
            if (diffX > 0 && !isQRView) {
                showQRView();
            } else if (diffX < 0 && isQRView) {
                showTicketView();
            }
        }
    });

    // Initialize the app immediately
    initApp();
});

// Function to show the ticket view
function showTicketView() {
    const ticketContainer = document.getElementById('ticketContainer');
    const qrTicketNumber = document.getElementById('qrTicketNumber');
    const controlTab = document.getElementById('controlTab');

    ticketContainer.style.transform = 'translateX(0)';
    qrTicketNumber.style.color = '#e31c1c';
    qrTicketNumber.style.borderBottom = 'none';
    qrTicketNumber.style.position = 'relative';

    // Update the ticket number with the appropriate icon
    qrTicketNumber.innerHTML = `<img src="https://i.imgur.com/yBrlpYO.png" style="width: 25px; height: 30px; vertical-align: middle; margin-right: 5px;"> <span id="qrTicketNum">${document.getElementById('qrTicketNum').textContent}</span>`;
    qrTicketNumber.style.paddingBottom = '0';

    // Remove existing underline if present
    const existingUnderline = qrTicketNumber.querySelector('#ticket-underline');
    if (existingUnderline) {
        existingUnderline.remove();
    }

    // Add red underline
    setTimeout(() => {
        const ticketUnderline = document.createElement('div');
        ticketUnderline.style.position = 'absolute';
        ticketUnderline.style.bottom = '-10px';
        ticketUnderline.style.left = '0';
        ticketUnderline.style.width = '100%';
        ticketUnderline.style.height = '2px';
        ticketUnderline.style.backgroundColor = '#e31c1c';
        ticketUnderline.id = 'ticket-underline';

        qrTicketNumber.appendChild(ticketUnderline);
    }, 10);

    controlTab.style.color = 'white';
    controlTab.style.borderBottom = 'none';
    controlTab.style.position = 'relative';

    // Remove underline from control tab
    const controlUnderline = controlTab.querySelector('#control-underline');
    if (controlUnderline) {
        controlUnderline.remove();
    }

    controlTab.innerHTML = `<img src="https://i.imgur.com/9nKXwQk.png" style="width: 25px; height: 30px; vertical-align: middle; margin-right: 5px;"> Контроль`;
    isQRView = false;
}

// Function to show the QR view
function showQRView() {
    const ticketContainer = document.getElementById('ticketContainer');
    const qrTicketNumber = document.getElementById('qrTicketNumber');
    const controlTab = document.getElementById('controlTab');

    ticketContainer.style.transform = 'translateX(-50%)';
    qrTicketNumber.style.color = 'white';
    qrTicketNumber.style.borderBottom = 'none';

    // Remove underline from ticket number
    const ticketUnderline = qrTicketNumber.querySelector('#ticket-underline');
    if (ticketUnderline) {
        ticketUnderline.remove();
    }

    controlTab.style.color = '#e31c1c';
    controlTab.style.borderBottom = 'none';
    controlTab.style.position = 'relative';
    controlTab.style.paddingBottom = '0';

    // Update control button with appropriate icon
    controlTab.innerHTML = `<img src="https://i.imgur.com/yBrlpYO.png" style="width: 25px; height: 30px; vertical-align: middle; margin-right: 5px;"> Контроль`;

    // Remove existing underline if present
    const existingUnderline = controlTab.querySelector('#control-underline');
    if (existingUnderline) {
        existingUnderline.remove();
    }

    // Add red underline
    setTimeout(() => {
        const controlUnderline = document.createElement('div');
        controlUnderline.style.position = 'absolute';
        controlUnderline.style.bottom = '-10px';
        controlUnderline.style.left = '0';
        controlUnderline.style.width = '100%';
        controlUnderline.style.height = '2px';
        controlUnderline.style.backgroundColor = '#e31c1c';
        controlUnderline.id = 'control-underline';

        controlTab.appendChild(controlUnderline);
    }, 10);

    qrTicketNumber.innerHTML = `<img src="https://i.imgur.com/TLZcW19.png" style="width: 25px; height: 25px; vertical-align: middle; margin-right: 5px;"> <span id="qrTicketNum">${document.getElementById('qrTicketNum').textContent}</span>`;

    isQRView = true;
}

// Function to start the countdown timer
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    const countdownElements = document.querySelectorAll('.countdown-top');
    let timeLeft = 15;

    countdownElements.forEach(element => {
        element.textContent = `Действует: ${timeLeft} сек.`;
        element.style.fontSize = '24px';
    });

    countdownInterval = setInterval(() => {
        timeLeft--;
        countdownElements.forEach(element => {
            element.textContent = `Действует: ${timeLeft} сек.`;
        });

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            closeTicket();
        }
    }, 1000);
}

// Function to close the ticket
function closeTicket() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    try {
        tg.close();
    } catch (e) {
        console.log("Ошибка при закрытии WebApp:", e);
    }
}

// Main function to initialize the app
function initApp() {
    console.log("Начинаем инициализацию приложения...");

    // Check if we have URL parameters with ticket data
    const urlParams = getUrlParams();
    console.log("URL parameters:", urlParams);
    
    // Проверяем флаг, указывающий, что данные пришли из бота
    const isFromBot = urlParams.from_bot === "true";
    console.log("Is from bot:", isFromBot);
    
    // Проверяем флаг отключения автогенерации
    const autoGenerateDisabled = urlParams.auto_generate === "false";
    console.log("Auto generate disabled:", autoGenerateDisabled);
    
    // Получаем номер билета из URL параметров
    let ticketNumber = getTicketNumber(urlParams);

    // Get current date and time with +4 hours offset from Moscow and -30 minutes
    const now = new Date();
    // Добавляем 4 часа от текущего времени для +4 UTC и отнимаем 30 минут
    now.setHours(now.getHours() + 4);
    now.setMinutes(now.getMinutes() - 30);

    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const currentDate = `${day} ${month} ${year}`;

    const currentTime = now.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Get ticket data from URL parameters or use defaults
    const ticketData = {
        carrier: urlParams.carrier || 'ИП Патрин Н. Н.',
        route_number: urlParams.route_number || '21',
        route_name: urlParams.route_name || 'Парк "Прищепка" - Спортзал',
        bus_number: urlParams.bus_number || 'х312мв124',
        ticket_count: urlParams.ticket_count || 1,
        ticket_number: ticketNumber,  // Используем форматированный номер из URL без изменений
        price: urlParams.price || 44,
        date: urlParams.date || currentDate,
        time: urlParams.time || currentTime
    };

    // ВАЖНО: Используем ТОЛЬКО номер билета из URL, не генерируем новый!
    console.log("Номер билета из бота (будет использован для отображения):", ticketData.ticket_number);

    // Всегда преобразуем дату на русский язык, независимо от формата
    const dateRegex = /(\d+)\s+(\w+)\s+(\d+)/;
    const match = ticketData.date.match(dateRegex);
    if (match) {
        const day = match[1];
        let monthName = match[2].toLowerCase();
        const year = match[3];

        const monthsMapping = {
            'january': 'января',
            'february': 'февраля',
            'march': 'марта',
            'april': 'апреля',
            'may': 'мая',
            'june': 'июня',
            'july': 'июля',
            'august': 'августа',
            'september': 'сентября',
            'october': 'октября',
            'november': 'ноября',
            'december': 'декабря',

            // Английские аббревиатуры
            'jan': 'января',
            'feb': 'февраля',
            'mar': 'марта',
            'apr': 'апреля',
            'jun': 'июня',
            'jul': 'июля',
            'aug': 'августа',
            'sep': 'сентября',
            'oct': 'октября',
            'nov': 'ноября',
            'dec': 'декабря'
        };

        const monthRus = monthsMapping[monthName] || monthName;
        ticketData.date = `${day} ${monthRus} ${year}`;
    }

    // Update UI with ticket data
    document.getElementById('carrier').textContent = ticketData.carrier;
    document.getElementById('route-name').textContent = `${ticketData.route_name}`;
    document.getElementById('bus').textContent = ticketData.bus_number;

    const pricePerTicket = ticketData.route_number && ticketData.route_number.endsWith('т') ? 40 : 44;
    const ticketCount = parseInt(ticketData.ticket_count);
    const totalPrice = pricePerTicket * ticketCount;

    document.getElementById('price').innerHTML = `${ticketCount} шт., Полный, <span style="margin-left: 5px;">${totalPrice}.00</span> <img src="https://i.imgur.com/DRNquWr.png" style="width: 15px; height: 20px; vertical-align: middle; position: relative; top: -1px;">`;
    document.getElementById('purchase-date').textContent = ticketData.date;
    document.getElementById('purchase-time').textContent = ticketData.time;

    // ВАЖНО: Используем номер билета, который пришел из URL без повторной генерации
    const originalTicketNumber = ticketData.ticket_number;
    console.log("Номер билета из бота (будет использован для отображения):", originalTicketNumber);

    // Выводим в консоль для отладки
    if (urlParams.ticket_number) {
        console.log("Используем номер билета из URL параметра:", urlParams.ticket_number);
    }

    // Обновляем номер билета во всех местах страницы
    document.getElementById('mainTicketNumber').textContent = originalTicketNumber;
    document.getElementById('qrTicketNum').textContent = originalTicketNumber;
    document.getElementById('qrNumberDisplay').textContent = `№ ${originalTicketNumber}`;

    // Generate QR code - используем оригинальный номер для QR кода
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(originalTicketNumber)}`;
    document.getElementById('qrCode').src = qrCodeUrl;

    // Start countdown
    startCountdown();

    // Enable closing confirmation if supported
    try {
        tg.enableClosingConfirmation();
    } catch (e) {
        console.log("Подтверждение закрытия не поддерживается в данной версии");
    }
}
