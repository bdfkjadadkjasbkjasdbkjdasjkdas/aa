// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

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

// Function to generate a random ticket number if not provided
function generateRandomTicketNumber() {
    const range = Math.random() < 0.5 ? (Math.random() < 0.5 ? 100 : 1000) : (Math.random() < 0.5 ? 100 : 900); //Choose a range randomly
    const min = Math.random() < 0.5 ? 100 : 900;
    const max = Math.random() < 0.5 ? 900 : 999;

    const ticketNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return ticketNumber;
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

    // Get or generate ticket number
    let ticketNumber;
    if (urlParams.ticket_number) {
        ticketNumber = urlParams.ticket_number;
    } else {
        ticketNumber = generateRandomTicketNumber();
    }

    // Get current date and time
    const now = new Date();
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const currentDate = `${day} ${month} ${year}`;

    const currentTime = now.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Set ticket data from URL parameters or use defaults
    const ticketData = {
        carrier: urlParams.carrier || 'ИП Патрин Н. Н.',
        route_number: urlParams.route_number || '21',
        route_name: urlParams.route_name || 'Парк "Прищепка" - Спортзал',
        bus_number: urlParams.bus_number || 'х312мв124',
        ticket_count: urlParams.ticket_count || 1,
        ticket_number: ticketNumber,
        price: urlParams.price || 44,
        date: urlParams.date || currentDate,
        time: urlParams.time || currentTime
    };

    // Update UI with ticket data
    document.getElementById('carrier').textContent = ticketData.carrier;
    document.getElementById('route-name').textContent = `${ticketData.route_number ? ticketData.route_number + ' ' : ''}${ticketData.route_name}`;
    document.getElementById('bus').textContent = ticketData.bus_number;

    const pricePerTicket = ticketData.route_number && ticketData.route_number.endsWith('т') ? 40 : 44;
    const ticketCount = parseInt(ticketData.ticket_count);
    const totalPrice = pricePerTicket * ticketCount;

    document.getElementById('price').innerHTML = `${ticketCount} шт., Полный, <span style="margin-left: 5px;">${totalPrice}.00</span> <img src="https://i.imgur.com/DRNquWr.png" style="width: 15px; height: 20px; vertical-align: middle; position: relative; top: -1px;">`;
    document.getElementById('purchase-date').textContent = ticketData.date;
    document.getElementById('purchase-time').textContent = ticketData.time;

    // Update ticket numbers
    document.getElementById('mainTicketNumber').textContent = ticketData.ticket_number;
    document.getElementById('qrTicketNum').textContent = ticketData.ticket_number;
    document.getElementById('qrNumberDisplay').textContent = `№ ${ticketData.ticket_number}`;

    // Generate QR code
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticketData.ticket_number}`;
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
