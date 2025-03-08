// Initialize Telegram WebApp
let tg;
try {
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.expand();
        console.log("Telegram WebApp initialized successfully");
    } else {
        throw new Error("Telegram WebApp not available");
    }
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
    let queryString = window.location.search;

    // Telegram иногда помещает параметры после хэша, проверяем это
    if (window.location.hash && window.location.hash.includes('?')) {
        queryString = window.location.hash.substring(window.location.hash.indexOf('?'));
    }

    if (!queryString || queryString === "?") {
        console.log("URL не содержит параметров");
        // Еще один способ получить параметры через Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
            console.log("Пробуем получить данные из Telegram.WebApp.initData");
            try {
                const initData = new URLSearchParams(window.Telegram.WebApp.initData);
                if (initData.has('start_param')) {
                    const startParam = initData.get('start_param');
                    if (startParam.includes('ticket_number=')) {
                        const ticketNumber = startParam.split('ticket_number=')[1].split('&')[0];
                        params.ticket_number = ticketNumber;
                        console.log("Получен номер билета из Telegram.WebApp.initData:", ticketNumber);
                    }
                }
            } catch (e) {
                console.error("Ошибка при разборе initData:", e);
            }
        }

        return params;
    }

    try {
        const urlParams = new URLSearchParams(queryString);

        // Выводим все параметры для отладки
        console.log("Полный список параметров в URL:");
        for (const [key, value] of urlParams) {
            console.log(`- ${key}: ${value}`);
            // Дополнительно декодируем значение, так как оно может быть закодировано дважды
            try {
                const decodedValue = decodeURIComponent(value);
                params[key] = decodedValue;
                console.log(`Декодированное значение для ${key}:`, decodedValue);
            } catch (e) {
                params[key] = value;
                console.log(`Используем исходное значение для ${key}:`, value);
            }
        }
    } catch (e) {
        console.error("Ошибка при разборе параметров URL:", e);
    }

    return params;
}

// Function to get ticket number from URL params or use default
function getTicketNumber(params) {
    // Проверяем все возможные источники данных

    // 1. Проверяем параметр ticket_num_direct (имеет высший приоритет)
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const directTicketNum = urlParams.get('ticket_num_direct');
        if (directTicketNum) {
            const decodedNum = decodeURIComponent(directTicketNum);
            console.log("Получен прямой номер билета:", decodedNum);
            return decodedNum.trim();
        }
    } catch (e) {
        console.error("Ошибка при получении прямого номера билета:", e);
    }

    // 2. Проверяем хэш (Telegram часто помещает параметры после хэша)
    let hashParams = null;
    if (window.location.hash && window.location.hash.includes('?')) {
        try {
            const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?'));
            hashParams = new URLSearchParams(hashQuery);
            const hashTicketNumber = hashParams.get('ticket_number');
            if (hashTicketNumber) {
                console.log("Получен номер билета из хэша URL:", hashTicketNumber);
                return decodeURIComponent(hashTicketNumber.trim());
            }
        } catch (e) {
            console.error("Ошибка при получении параметров из хэша:", e);
        }
    }

    // 3. Проверяем параметры URL напрямую
    try {
        // Проверяем все возможные варианты URL
        const urlVariants = [
            window.location.search, // Стандартный URL query
            window.location.hash.replace('#', '?'), // Хэш как query
            `?${window.location.hash.substring(1)}` // Хэш без # как query
        ];

        for (const urlVariant of urlVariants) {
            if (!urlVariant || urlVariant === '?' || urlVariant === '#') continue;

            const urlParams = new URLSearchParams(urlVariant);
            const directTicketNumber = urlParams.get('ticket_number');

            if (directTicketNumber) {
                const cleanTicketNumber = decodeURIComponent(directTicketNumber.trim());
                console.log("Получен номер билета из варианта URL:", cleanTicketNumber);
                return cleanTicketNumber;
            }
        }
    } catch (e) {
        console.error("Ошибка при проверке вариантов URL:", e);
    }

    // 4. Проверяем параметр из объекта params
    if (params.ticket_number) {
        let ticketNum = params.ticket_number.trim();
        try {
            ticketNum = decodeURIComponent(ticketNum);
        } catch (e) {
            console.error("Ошибка при декодировании номера билета из params:", e);
        }
        console.log("Получен номер билета из params объекта:", ticketNum);
        return ticketNum;
    }

    // 5. Проверяем Telegram WebApp initData
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
        try {
            const initDataParams = new URLSearchParams(window.Telegram.WebApp.initData);
            // Проверяем start_param или другие параметры
            if (initDataParams.has('start_param')) {
                const startParamStr = initDataParams.get('start_param');
                const startParam = new URLSearchParams(startParamStr);
                if (startParam.has('ticket_number')) {
                    const ticketNumber = startParam.get('ticket_number').trim();
                    console.log("Получен номер билета из Telegram initData:", ticketNumber);
                    return ticketNumber;
                }
            }
        } catch (e) {
            console.error("Ошибка при разборе Telegram initData:", e);
        }
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

// Initialize the app immediately when scripts are loaded
window.onload = function() {
    try {
        // Сначала инициализируем приложение
        initApp();

        // Затем добавляем обработчики событий
        setTimeout(() => {
            // Add touch event handlers
            const ticketContainer = document.getElementById('ticketContainer');
            if (ticketContainer) {
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
            }
        }, 100); // Небольшая задержка для гарантии загрузки DOM
    } catch (e) {
        console.error("Ошибка при инициализации:", e);
    }
};

// Function to show the ticket view
function showTicketView() {
    const ticketContainer = document.getElementById('ticketContainer');
    const qrTicketNumber = document.getElementById('qrTicketNumber');
    const controlTab = document.getElementById('controlTab');

    ticketContainer.style.transform = 'translateX(0)';
    qrTicketNumber.style.color = '#e31c1c';
    qrTicketNumber.style.borderBottom = 'none';
    qrTicketNumber.style.position = 'relative';

    // Обновляем номер билета с соответствующей иконкой
    qrTicketNumber.innerHTML = `<img src="Снимок7.PNG" style="width: 28px; height: 32px; vertical-align: middle; margin-right: 5px;"> <span id="qrTicketNum">${document.getElementById('qrTicketNum').textContent}</span>`;
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

    controlTab.innerHTML = `<img src="Снимок10.PNG" style="width: 25px; height: 30px; vertical-align: middle; margin-right: 5px;"> Контроль`;
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

    // Обновляем контроль кнопку с соответствующей иконкой
    controlTab.innerHTML = `<img src="Снимок11.PNG" style="width: 25px; height: 25px; vertical-align: middle; margin-right: 5px;"> Контроль`;

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

    qrTicketNumber.innerHTML = `<img src="Снимок6.PNG" style="width: 28px; height: 32px; vertical-align: middle; margin-right: 5px;"> <span id="qrTicketNum">${document.getElementById('qrTicketNum').textContent}</span>`;

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

    // Show loading overlay
    document.getElementById('loading').style.display = 'flex';

    // Check if we have URL parameters with ticket data
    const urlParams = getUrlParams();
    console.log("URL parameters:", urlParams);

    // Проверяем флаг, указывающий, что данные пришли из бота
    const isFromBot = urlParams.from_bot === "true";
    console.log("Is from bot:", isFromBot);

    // ВАЖНО: Всегда запрещаем автогенерацию номера билета, всегда используем номер из URL
    const autoGenerateDisabled = true; 
    console.log("Auto generate disabled:", autoGenerateDisabled);

    // Получаем номер билета из URL параметров
    let ticketNumber = getTicketNumber(urlParams);
    console.log("Получен номер билета из URL:", ticketNumber);

    // Get current date and time with +4 hours offset from Moscow, -30 minutes, and -3 hours for purchase time
    const now = new Date();
    // Добавляем 4 часа от текущего времени для +4 UTC и отнимаем 30 минут
    now.setHours(now.getHours() + 4);
    now.setMinutes(now.getMinutes() - 30);

    // Создаем копию времени для покупки (на 3 часа раньше)
    const purchaseTime = new Date(now);
    purchaseTime.setHours(purchaseTime.getHours() - 3);

    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    // Всегда форматируем день с ведущим нулем
    const day = now.getDate().toString().padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const currentDate = `${day} ${month} ${year}`;

    // Используем время с -3 часами для времени покупки
    const currentTime = purchaseTime.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Проверяем все возможные параметры с номером билета
    console.log("Проверка всех возможных источников номера билета:");
    console.log("1. URL параметр ticket_number:", urlParams.ticket_number);
    console.log("2. URL параметр ticket_num_direct:", urlParams.ticket_num_direct);

    // Проверяем прямой параметр ticket_number в URL
    const searchParams = new URLSearchParams(window.location.search);
    console.log("3. Прямой URL параметр ticket_number:", searchParams.get('ticket_number'));
    console.log("4. Прямой URL параметр ticket_num_direct:", searchParams.get('ticket_num_direct'));

    // Итоговый номер билета - приоритет у прямого параметра от бота
    let finalTicketNumber = ticketNumber;

    // Декодируем номер билета, если он закодирован
    try {
        if (finalTicketNumber) {
            finalTicketNumber = decodeURIComponent(finalTicketNumber);
            console.log("Декодированный итоговый номер билета:", finalTicketNumber);
        }
    } catch (e) {
        console.error("Ошибка при декодировании итогового номера билета:", e);
    }

    // Get ticket data from URL parameters with absolute priority to the ticket number from bot
    const ticketData = {
        carrier: urlParams.carrier || 'ИП Патрин Н. Н.',
        route_number: urlParams.route_number || '21',
        route_name: urlParams.route_name || 'Парк "Прищепка" - Спортзал',
        bus_number: urlParams.bus_number || 'х312мв124',
        ticket_count: urlParams.ticket_count || 1,
        // ВАЖНО: используем только номер билета из URL (от бота)
        ticket_number: finalTicketNumber,
        price: urlParams.price || 44,
        date: urlParams.date || currentDate,
        time: urlParams.time || currentTime
    };

    // Проверяем наличие данных
    console.log("ФИНАЛЬНЫЕ ДАННЫЕ БИЛЕТА:", ticketData);
    console.log("ИТОГОВЫЙ НОМЕР БИЛЕТА ДЛЯ ОТОБРАЖЕНИЯ:", ticketData.ticket_number);

    // Форматируем дату
    const dateRegex = /(\d+)\s+(\w+)\s+(\d+)/;
    const match = ticketData.date.match(dateRegex);
    if (match) {
        const day = match[1].padStart(2, '0');
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

        const dayNum = parseInt(day, 10);
        const formattedDay = dayNum.toString().padStart(2, '0');
        const monthRus = monthsMapping[monthName] || monthName;
        ticketData.date = `${formattedDay} ${monthRus} ${year}`;
    }

    // Update UI with ticket data
    document.getElementById('carrier').textContent = ticketData.carrier;
    document.getElementById('route-name').textContent = `${ticketData.route_name}`;
    document.getElementById('bus').textContent = ticketData.bus_number;

    const pricePerTicket = ticketData.route_number && ticketData.route_number.endsWith('т') ? 40 : 44;
    const ticketCount = parseInt(ticketData.ticket_count);
    const totalPrice = pricePerTicket * ticketCount;

    document.getElementById('price').innerHTML = `${ticketCount} шт., Полный, <span style="margin-left: 5px;">${totalPrice}.00</span> <img src="снимок32.png" style="width: 15px; height: 20px; vertical-align: middle; position: relative; top: -1px; margin-left: 5px;">`;

    // Форматируем дату с годом
    const dateParts = ticketData.date.split(' ');
    if (dateParts.length >= 3) {
        let day = dateParts[0];
        day = parseInt(day).toString().padStart(2, '0');
        const month = dateParts[1];
        const year = dateParts[2];
        document.getElementById('purchase-date').textContent = `${day} ${month} ${year} г.`;
    } else {
        document.getElementById('purchase-date').textContent = ticketData.date;
    }

    document.getElementById('purchase-time').textContent = ticketData.time;

    // Проверяем корректность номера билета
    if (!ticketData.ticket_number || ticketData.ticket_number === "undefined" || ticketData.ticket_number === "null") {
        console.error("ОШИБКА: Номер билета отсутствует или некорректный!");
        ticketData.ticket_number = "000 000 000";
    }

    console.log("ИТОГОВЫЙ НОМЕР БИЛЕТА ДЛЯ ОТОБРАЖЕНИЯ:", ticketData.ticket_number);

    // Обновляем все элементы DOM с номером билета
    const ticketElements = [
        { id: 'mainTicketNumber', prefix: '' },
        { id: 'qrTicketNum', prefix: '' },
        { id: 'qrNumberDisplay', prefix: '№ ' }
    ];

    ticketElements.forEach(element => {
        const domElement = document.getElementById(element.id);
        if (domElement) {
            domElement.textContent = element.prefix + ticketData.ticket_number;
            console.log(`Обновлен элемент ${element.id} значением: ${element.prefix + ticketData.ticket_number}`);
        } else {
            console.error(`Элемент с ID ${element.id} не найден в DOM!`);
        }
    });

    // Generate QR code with the ticket number from URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(ticketData.ticket_number)}`;
    document.getElementById('qrCode').src = qrCodeUrl;

    // Скрываем оверлей загрузки
    document.getElementById('loading').style.display = 'none';

    // Start countdown
    startCountdown();

    // Enable closing confirmation if supported
    try {
        tg.enableClosingConfirmation();
    } catch (e) {
        console.log("Подтверждение закрытия не поддерживается в данной версии");
    }
}
