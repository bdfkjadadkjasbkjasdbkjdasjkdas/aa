
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
    const ticketNumber = Math.floor(Math.random() * (999999999 - 950000000) + 950000000);
    const millions = Math.floor(ticketNumber / 1000000);
    const thousands = Math.floor((ticketNumber / 1000) % 1000);
    const remainder = ticketNumber % 1000;
    
    return `${millions} ${thousands} ${remainder}`;
}

// Function to generate expiration time if not provided
function generateExpiryTime() {
    const now = new Date();
    const expiryTime = new Date(now.getTime() + 30 * 60000); // 30 minutes later
    return expiryTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// Function to display ticket info
function displayTicket(ticketData) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('ticket-container').style.display = 'block';
    
    // Fill in ticket information
    document.getElementById('carrier').textContent = ticketData.carrier || 'ИП Патрин Н. Н.';
    
    const routeText = ticketData.route_number && ticketData.route_name 
        ? `🚏 ${ticketData.route_number} ${ticketData.route_name}`
        : '🚏 21 Парк "Прищепка" - Спортзал';
    document.getElementById('route').textContent = routeText;
    
    document.getElementById('bus').textContent = `🚌 ${ticketData.bus_number || 'х312мв124'}`;
    
    const pricePerTicket = ticketData.route_number && ticketData.route_number.endsWith('т') ? 40 : 44;
    const ticketCount = ticketData.ticket_count || 1;
    const totalPrice = ticketData.price || (pricePerTicket * ticketCount);
    document.getElementById('price').textContent = `🪙 Тариф: Полный ${pricePerTicket},00 ₽`;
    
    document.getElementById('ticket-number').textContent = `🎫 Билет № ${ticketData.ticket_number || generateRandomTicketNumber()}`;
    document.getElementById('expiry').textContent = `🕑 Действует до ${ticketData.expiry || generateExpiryTime()}`;
    
    // Enable closing confirmation
    tg.enableClosingConfirmation();
}

// Main function to initialize the app
function initApp() {
    console.log("Начинаем предзагрузку изображений...");
    
    // Check if we have URL parameters with ticket data
    const urlParams = getUrlParams();
    
    if (urlParams.auto_generate === 'true' || urlParams.carrier) {
        // We have ticket data in URL, use it
        const ticketData = {
            carrier: urlParams.carrier,
            route_number: urlParams.route_number,
            route_name: urlParams.route_name,
            bus_number: urlParams.bus_number,
            ticket_count: urlParams.ticket_count,
            ticket_number: urlParams.ticket_number,
            price: urlParams.price,
            expiry: urlParams.time,
            date: urlParams.date
        };
        
        // Display the ticket with data from URL
        displayTicket(ticketData);
    } else {
        // No data in URL, generate default ticket
        const defaultTicketData = {
            carrier: 'ИП Патрин Н. Н.',
            route_number: '21',
            route_name: 'Парк "Прищепка" - Спортзал',
            bus_number: 'х312мв124',
            ticket_count: 1,
            ticket_number: generateRandomTicketNumber(),
            price: 44,
            expiry: generateExpiryTime()
        };
        
        // Display default ticket
        displayTicket(defaultTicketData);
    }
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);
</script>
