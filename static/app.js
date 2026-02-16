console.log('📊 Crypto Tracker Dashboard JavaScript loaded');

// Global variables
let priceChart = null;
let currentCoin = 'bitcoin';
// Global variables for indicators
let currentIndicator = null;
let originalPrices = [];
let originalTimestamps = [];

// Function to initialize the chart
function initChart() {
    console.log('🎨 Initializing chart...');
    
    const ctx = document.getElementById('priceChart');
    if (!ctx) {
        console.error('❌ Canvas element not found!');
        return;
    }
    
    try {
        priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Loading...'],
                datasets: [{
                    label: 'Price (USD)',
                    data: [0],
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `$${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        },
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        },
                        title: {
                            display: true,
                            text: 'Price (USD)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
        console.log('✅ Chart initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing chart:', error);
    }
}

// Fetch current prices
async function fetchPrices() {
    console.log('📡 Fetching current prices...');
    
    try {
        const response = await fetch('/api/prices');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Prices response:', data);
        
        if (data.status === 'success') {
            displayPrices(data.data);
            updateLastUpdate();
            fetchHistoricalData(currentCoin);
            document.getElementById('api-status').className = 'badge bg-success rounded-pill';
            document.getElementById('api-status').textContent = 'Online';
        } else {
            console.error('API error:', data.message);
        }
    } catch (error) {
        console.error('❌ Error fetching prices:', error);
        document.getElementById('api-status').className = 'badge bg-danger rounded-pill';
        document.getElementById('api-status').textContent = 'Offline';
    }
}

// Dark Mode Toggle
function toggleDarkMode() {
    const body = document.body;
    const button = document.getElementById('darkModeToggle');
    const icon = document.getElementById('themeIcon');
    const text = document.getElementById('themeText');
    
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        // Dark mode enabled
        icon.textContent = '☀️';
        text.textContent = 'Light';
        localStorage.setItem('darkMode', 'enabled');
    } else {
        // Light mode enabled
        icon.textContent = '🌙';
        text.textContent = 'Dark';
        localStorage.setItem('darkMode', 'disabled');
    }
}

// Load dark mode preference on page load
function loadDarkModePreference() {
    const darkMode = localStorage.getItem('darkMode');
    const body = document.body;
    const icon = document.getElementById('themeIcon');
    const text = document.getElementById('themeText');
    
    if (darkMode === 'enabled') {
        body.classList.add('dark-mode');
        icon.textContent = '☀️';
        text.textContent = 'Light';
    } else {
        body.classList.remove('dark-mode');
        icon.textContent = '🌙';
        text.textContent = 'Dark';
    }
}

// Display prices in hybrid mode (5 cards + table)
function displayPrices(prices) {
    console.log('📊 Displaying hybrid view with', prices.length, 'coins');
    
    if (!prices || prices.length === 0) {
        document.getElementById('prices-container').innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">
                    No price data available. Make sure the data fetcher is running!
                </div>
            </div>
        `;
        document.getElementById('table-view').innerHTML = '';
        return;
    }
    
    // Ορισμός της σειράς των top coins (με βάση market cap rank)
    const topCoinOrder = [
        'bitcoin',      // #1
        'ethereum',     // #2
        'solana',       // #5
        'ripple',       // #6
        'cardano'       // #8
    ];
    
    // Βρες τα top 5 coins με βάση τη λίστα (αν υπάρχουν)
    const topCoins = [];
    const otherCoins = [];
    
    // Πρώτα βάλε τα top 5 με τη σωστή σειρά
    topCoinOrder.forEach(coinId => {
        const found = prices.find(p => p.coin === coinId);
        if (found) {
            topCoins.push(found);
        }
    });
    
    // Μετά βάλε όλα τα υπόλοιπα coins
    prices.forEach(coin => {
        if (!topCoinOrder.includes(coin.coin)) {
            otherCoins.push(coin);
        }
    });
    
    console.log(`📈 Top 5 coins: ${topCoins.length}, Others: ${otherCoins.length}`);
    
    // --- TOP 5 CARDS (με τη σωστή σειρά) ---
    let cardsHtml = '';
    topCoins.forEach(coin => {
        cardsHtml += `
            <div class="col-6 col-md-4 col-lg-2 mb-2 mb-md-3">
                <div class="card crypto-card h-100 ${coin.coin === currentCoin ? 'selected-coin' : ''}" 
                     onclick="selectCoin('${coin.coin}')" style="cursor: pointer;">
                    <div class="card-body text-center">
                        <h5 class="card-title">${formatCoinName(coin.coin)}</h5>
                        <h4 class="card-text fw-bold ${getPriceChangeClass()}">
                            $${formatPrice(coin.price)}
                        </h4>
                        <small class="text-muted">${formatTimestamp(coin.timestamp)}</small>
                    </div>
                </div>
            </div>
        `;
    });
    
    document.getElementById('prices-container').innerHTML = cardsHtml;
    
    // --- TABLE FOR ALL COINS (top5 + others) ---
    // Βάλε όλα τα coins μαζί (πρώτα τα top5 με σειρά, μετά τα υπόλοιπα)
    const allCoinsForTable = [...topCoins, ...otherCoins];
    
    let tableHtml = `
        <div class="card mt-4">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0">📋 All Cryptocurrencies (${prices.length} coins)</h5>
                <span class="badge bg-light text-dark">Click any row to view chart</span>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                    <table class="table table-hover table-striped mb-0">
                        <thead class="sticky-top bg-light">
                            <tr>
                                <th class="d-none d-sm-table-cell">#</th>
                                <th>Coin</th>
                                <th class="d-none d-sm-table-cell">Symbol</th>
                                <th>Price</th>
                                <th class="d-none d-md-table-cell">24h</th>
                                <th class="d-none d-lg-table-cell">Update</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    allCoinsForTable.forEach((coin, index) => {
        // Random 24h change for demo (in real app would come from API)
        const change = (Math.random() * 10 - 5).toFixed(2);
        const changeClass = change >= 0 ? 'text-success' : 'text-danger';
        const changeIcon = change >= 0 ? '▲' : '▼';
        
        tableHtml += `
            <tr onclick="selectCoin('${coin.coin}')" style="cursor: pointer;"
                class="${coin.coin === currentCoin ? 'table-primary' : ''}">
                <td class="d-none d-sm-table-cell">${index + 1}</td>
                <td><strong>${window.innerWidth < 576 ? formatCoinNameShort(coin.coin) : formatCoinName(coin.coin)}</strong></td>
                <td class="d-none d-sm-table-cell"><code>${getSymbol(coin.coin)}</code></td>
                <td class="fw-bold">$${formatPrice(coin.price)}</td>
                <td class="d-none d-md-table-cell ${changeClass}">${changeIcon} ${Math.abs(change)}%</td>
                <td class="d-none d-lg-table-cell"><small>${formatTimestamp(coin.timestamp)}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="event.stopPropagation(); selectCoin('${coin.coin}')">
                        <span class="d-none d-sm-inline">📊 Chart</span>
                        <span class="d-sm-none">📊</span>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHtml += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('table-view').innerHTML = tableHtml;
}

// Get coin symbol
function getSymbol(coinId) {
    const symbols = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH', 
        'cardano': 'ADA',
        'dogecoin': 'DOGE',
        'solana': 'SOL',
        'ripple': 'XRP',
        'polkadot': 'DOT',
        'litecoin': 'LTC',
        'chainlink': 'LINK',
        'stellar': 'XLM',
        'monero': 'XMR',
        'tron': 'TRX',
        'vechain': 'VET',
        'tezos': 'XTZ',
        'cosmos': 'ATOM',
        'avalanche-2': 'AVAX',
        'algorand': 'ALGO',
        'filecoin': 'FIL',
        'aave': 'AAVE',
        'maker': 'MKR'
    };
    return symbols[coinId] || coinId.substring(0, 4).toUpperCase();
}

// Fetch historical data for charts
async function fetchHistoricalData(coinName) {
    console.log(`📈 Fetching historical data for ${coinName}...`);
    
    try {
        const response = await fetch(`/api/history/${coinName}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`📊 Historical data for ${coinName}:`, data);
        
        if (data.status === 'success' && data.prices && data.prices.length > 0) {
            console.log(`✅ Got ${data.prices.length} data points`);
            updateChart(data.prices, data.timestamps, coinName);
            document.getElementById('data-points').textContent = data.prices.length;
        } else {
            console.warn('⚠️ No historical data available');
            document.getElementById('chart-title').textContent = 
                `${formatCoinName(coinName)} - No data available`;
        }
    } catch (error) {
        console.error(`❌ Error fetching historical data for ${coinName}:`, error);
    }
}

// Update the chart with new data
function updateChart(prices, timestamps, coinName) {
    if (!priceChart) {
        console.error('❌ Chart not initialized!');
        return;
    }
    
    console.log(`🔄 Updating chart with ${prices.length} points`);
    
    // Format timestamps
    const formattedTimestamps = timestamps.map(ts => {
        const date = new Date(ts);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    });
    
    // Update chart data
    priceChart.data.labels = formattedTimestamps;
    priceChart.data.datasets[0].data = prices;
    priceChart.data.datasets[0].label = `${formatCoinName(coinName)} Price`;
    
    // Update colors based on price trend
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const isUp = lastPrice > firstPrice;
    
    priceChart.data.datasets[0].borderColor = isUp ? '#00c853' : '#ff4444';
    priceChart.data.datasets[0].backgroundColor = isUp ? 
        'rgba(0, 200, 83, 0.1)' : 'rgba(255, 68, 68, 0.1)';

    const isDarkMode = document.body.classList.contains('dark-mode');

    // Προσαρμογή χρωμάτων για dark mode
    if (isDarkMode) {
        priceChart.options.scales.x.grid.color = 'rgba(255,255,255,0.1)';
        priceChart.options.scales.y.grid.color = 'rgba(255,255,255,0.1)';
        priceChart.options.scales.x.ticks.color = '#e0e0e0';
        priceChart.options.scales.y.ticks.color = '#e0e0e0';
        priceChart.options.plugins.legend.labels.color = '#e0e0e0';
    } else {
        priceChart.options.scales.x.grid.color = 'rgba(0,0,0,0.05)';
        priceChart.options.scales.y.grid.color = 'rgba(0,0,0,0.05)';
        priceChart.options.scales.x.ticks.color = '#666';
        priceChart.options.scales.y.ticks.color = '#666';
        priceChart.options.plugins.legend.labels.color = '#666';
    }
    
    // Update chart
    priceChart.update();
    
    // Update title
    document.getElementById('chart-title').textContent = 
        `${formatCoinName(coinName)} - Last ${prices.length} prices`;
    
    // Update coin info
    updateCoinInfo(coinName, prices[prices.length - 1]);
}

// Update coin information panel
function updateCoinInfo(coinName, currentPrice) {
    const infoDiv = document.getElementById('coin-info');
    
    const coinInfo = {
        'bitcoin': { symbol: 'BTC', description: 'First decentralized cryptocurrency' },
        'ethereum': { symbol: 'ETH', description: 'Blockchain with smart contracts' },
        'cardano': { symbol: 'ADA', description: 'Proof-of-stake blockchain' },
        'dogecoin': { symbol: 'DOGE', description: 'Meme-based cryptocurrency' },
        'solana': { symbol: 'SOL', description: 'High-performance blockchain' },
        'ripple': { symbol: 'XRP', description: 'Digital payment protocol for banks' },
        'polkadot': { symbol: 'DOT', description: 'Multi-chain blockchain platform' },
        'litecoin': { symbol: 'LTC', description: 'Peer-to-peer cryptocurrency' },
        'chainlink': { symbol: 'LINK', description: 'Decentralized oracle network' },
        'stellar': { symbol: 'XLM', description: 'Open network for money transfers' },
        'monero': { symbol: 'XMR', description: 'Privacy-focused cryptocurrency' },
        'tron': { symbol: 'TRX', description: 'Blockchain for digital entertainment' },
        'vechain': { symbol: 'VET', description: 'Supply chain management blockchain' },
        'tezos': { symbol: 'XTZ', description: 'Self-amending blockchain' },
        'cosmos': { symbol: 'ATOM', description: 'Internet of Blockchains' },
        'avalanche-2': { symbol: 'AVAX', description: 'High-speed blockchain platform' },
        'algorand': { symbol: 'ALGO', description: 'Pure proof-of-stake blockchain' },
        'filecoin': { symbol: 'FIL', description: 'Decentralized storage network' },
        'aave': { symbol: 'AAVE', description: 'Decentralized lending protocol' },
        'maker': { symbol: 'MKR', description: 'Stablecoin governance token' }
    };
    
    const info = coinInfo[coinName] || { 
        symbol: getSymbol(coinName), 
        description: 'Cryptocurrency' 
    };
    
    infoDiv.innerHTML = `
        <div class="alert alert-primary">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="mb-0">${formatCoinName(coinName)}</h5>
                <span class="badge bg-secondary">${info.symbol}</span>
            </div>
            <p class="mb-2 small">${info.description}</p>
            <hr class="my-2">
            <div class="d-flex justify-content-between">
                <span>Current Price:</span>
                <strong class="${getPriceChangeClass()}">$${formatPrice(currentPrice)}</strong>
            </div>
            <div class="d-flex justify-content-between">
                <span>Market Cap Rank:</span>
                <strong>#${getRank(coinName)}</strong>
            </div>
        </div>
    `;
}

// Select a coin
function selectCoin(coinId) {
    console.log(`🎯 Selected coin: ${coinId}`);
    currentCoin = coinId;
    
    // Update card highlights
    document.querySelectorAll('.crypto-card').forEach(card => {
        card.classList.remove('selected-coin');
    });
    event.currentTarget.classList.add('selected-coin');
    
    // Fetch new historical data
    fetchHistoricalData(coinId);
}

// Helper functions
function formatCoinName(coinId) {
    const names = {
        'bitcoin': 'Bitcoin (BTC)',
        'ethereum': 'Ethereum (ETH)', 
        'cardano': 'Cardano (ADA)',
        'dogecoin': 'Dogecoin (DOGE)',
        'solana': 'Solana (SOL)',
        'ripple': 'Ripple (XRP)',
        'polkadot': 'Polkadot (DOT)',
        'litecoin': 'Litecoin (LTC)',
        'chainlink': 'Chainlink (LINK)',
        'stellar': 'Stellar (XLM)',
        'monero': 'Monero (XMR)',
        'tron': 'TRON (TRX)',
        'vechain': 'VeChain (VET)',
        'tezos': 'Tezos (XTZ)',
        'cosmos': 'Cosmos (ATOM)',
        'avalanche-2': 'Avalanche (AVAX)',
        'algorand': 'Algorand (ALGO)',
        'filecoin': 'Filecoin (FIL)',
        'aave': 'Aave (AAVE)',
        'maker': 'Maker (MKR)'
    };
    return names[coinId] || coinId.charAt(0).toUpperCase() + coinId.slice(1);
}

// Short coin names for mobile
function formatCoinNameShort(coinId) {
    const shortNames = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH', 
        'cardano': 'ADA',
        'dogecoin': 'DOGE',
        'solana': 'SOL',
        'ripple': 'XRP',
        'polkadot': 'DOT',
        'litecoin': 'LTC',
        'chainlink': 'LINK',
        'stellar': 'XLM',
        'monero': 'XMR',
        'tron': 'TRX',
        'vechain': 'VET',
        'tezos': 'XTZ',
        'cosmos': 'ATOM',
        'avalanche-2': 'AVAX',
        'algorand': 'ALGO',
        'filecoin': 'FIL',
        'aave': 'AAVE',
        'maker': 'MKR'
    };
    return shortNames[coinId] || coinId.substring(0, 4).toUpperCase();
}

function formatPrice(price) {
    if (price >= 1000) {
        return price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } else if (price >= 1) {
        return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    }
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateLastUpdate() {
    const now = new Date();
    document.getElementById('last-update').textContent = 
        `Last update: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
}

function getPriceChangeClass() {
    return Math.random() > 0.5 ? 'price-up' : 'price-down';
}

function getRank(coinName) {
    const ranks = {
        'bitcoin': 1,
        'ethereum': 2,
        'solana': 5,
        'cardano': 8,
        'dogecoin': 10,
        'ripple': 6,
        'polkadot': 11,
        'litecoin': 14,
        'chainlink': 15,
        'stellar': 24,
        'monero': 26,
        'tron': 17,
        'vechain': 28,
        'tezos': 35,
        'cosmos': 20,
        'avalanche-2': 9,
        'algorand': 30,
        'filecoin': 32,
        'aave': 38,
        'maker': 45
    };
    return ranks[coinName] || 'N/A';
}

// Start auto-refresh
function startAutoRefresh() {
    console.log('🔄 Starting auto-refresh (30s interval)');
    fetchPrices(); // Initial load
    setInterval(fetchPrices, 30000); // Refresh every 30 seconds
}

// Alert form submission
document.getElementById('alert-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const alertData = {
        email: document.getElementById('alert-email').value,
        coin: document.getElementById('alert-coin').value,
        condition: document.getElementById('alert-condition').value,
        price: parseFloat(document.getElementById('alert-price').value)
    };
    
    try {
        const response = await fetch('/api/alerts/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(alertData)
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showAlertMessage('success', `✅ Alert set! You'll be notified when ${formatCoinName(alertData.coin)} ${alertData.condition} $${alertData.price}`);
            document.getElementById('alert-form').reset();
            loadActiveAlerts(); // Refresh the list
        } else {
            showAlertMessage('danger', `❌ Error: ${data.message}`);
        }
        
    } catch (error) {
        showAlertMessage('danger', `❌ Error: ${error.message}`);
    }
});

// Show alert message
function showAlertMessage(type, message) {
    const msgDiv = document.getElementById('alert-message');
    msgDiv.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        msgDiv.innerHTML = '';
    }, 5000);
}

// Load active alerts
async function loadActiveAlerts() {
    try {
        const response = await fetch('/api/alerts');
        const data = await response.json();
        
        const container = document.getElementById('active-alerts');
        
        if (data.alerts.length === 0) {
            container.innerHTML = '<p class="text-muted">No active alerts</p>';
            return;
        }
        
        let html = '<ul class="list-group">';
        data.alerts.forEach(alert => {
            html += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${formatCoinName(alert.coin)}</strong>
                        <span class="badge bg-${alert.condition === 'above' ? 'success' : 'danger'} ms-2">
                            ${alert.condition} $${alert.price}
                        </span>
                    </div>
                    <div>
                        <small class="text-muted me-3">${alert.email}</small>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteAlert(${alert.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

// Global variable για το alert που θα διαγραφεί
let alertToDelete = null;

// Delete alert με modal
async function deleteAlert(alertId) {
    alertToDelete = alertId;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

// Επιβεβαίωση διαγραφής
document.getElementById('confirmDeleteBtn').addEventListener('click', async function() {
    if (!alertToDelete) return;
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    modal.hide();
    
    try {
        const response = await fetch(`/api/alerts/${alertToDelete}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showAlertMessage('success', '✅ Alert deleted successfully');
            loadActiveAlerts();
        } else {
            showAlertMessage('danger', `❌ Error: ${data.message}`);
        }
        
    } catch (error) {
        console.error('Error deleting alert:', error);
        showAlertMessage('danger', `❌ Error: ${error.message}`);
    }
    
    alertToDelete = null;
});

// Calculate Simple Moving Average (SMA)
function calculateSMA(data, period = 7) {
    let sma = [];
    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j];
        }
        sma.push(sum / period);
    }
    return sma;
}

// Calculate Exponential Moving Average (EMA)
function calculateEMA(data, period = 7) {
    let ema = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA is SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += data[i];
    }
    ema.push(sum / period);
    
    // Calculate subsequent EMAs
    for (let i = period; i < data.length; i++) {
        const value = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
        ema.push(value);
    }
    return ema;
}

// Calculate Relative Strength Index (RSI)
function calculateRSI(data, period = 14) {
    let rsi = [];
    let gains = [];
    let losses = [];
    
    // Calculate price changes
    for (let i = 1; i < data.length; i++) {
        const change = data[i] - data[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? -change : 0);
    }
    
    // Calculate RSI for each point after the period
    for (let i = period; i < gains.length; i++) {
        let avgGain = 0;
        let avgLoss = 0;
        
        for (let j = 0; j < period; j++) {
            avgGain += gains[i - j];
            avgLoss += losses[i - j];
        }
        
        avgGain /= period;
        avgLoss /= period;
        
        if (avgLoss === 0) {
            rsi.push(100);
        } else {
            const rs = avgGain / avgLoss;
            rsi.push(100 - (100 / (1 + rs)));
        }
    }
    
    return rsi;
}

// Toggle indicator on/off
function toggleIndicator(indicator) {
    // Reset button styles
    document.getElementById('smaBtn').classList.remove('active');
    document.getElementById('emaBtn').classList.remove('active');
    document.getElementById('rsiBtn').classList.remove('active');
    
    if (currentIndicator === indicator) {
        // Turn off indicator
        currentIndicator = null;
        updateChart(originalPrices, originalTimestamps, currentCoin);
    } else {
        // Turn on new indicator
        currentIndicator = indicator;
        document.getElementById(indicator + 'Btn').classList.add('active');
        
        // Calculate and add indicator to chart
        addIndicatorToChart(indicator);
    }
}

// Add indicator to chart
function addIndicatorToChart(indicator) {
    if (!priceChart || originalPrices.length === 0) return;
    
    let indicatorData = [];
    let indicatorLabel = '';
    let indicatorColor = '';
    
    switch(indicator) {
        case 'sma':
            indicatorData = calculateSMA(originalPrices, 7);
            indicatorLabel = 'SMA (7)';
            indicatorColor = '#ff9800';  // Orange
            break;
        case 'ema':
            indicatorData = calculateEMA(originalPrices, 7);
            indicatorLabel = 'EMA (7)';
            indicatorColor = '#9c27b0';  // Purple
            break;
        case 'rsi':
            indicatorData = calculateRSI(originalPrices, 14);
            indicatorLabel = 'RSI (14)';
            indicatorColor = '#f44336';  // Red
            break;
    }
    
    // Adjust dataset for RSI (different scale)
    if (indicator === 'rsi') {
        // Remove price dataset temporarily
        priceChart.data.datasets = priceChart.data.datasets.filter(d => d.label !== 'Price (USD)');
        
        // Add RSI dataset
        priceChart.data.datasets.push({
            label: indicatorLabel,
            data: indicatorData,
            borderColor: indicatorColor,
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 2,
            yAxisID: 'y-rsi'
        });
        
        // Add RSI y-axis
        priceChart.options.scales['y-rsi'] = {
            position: 'right',
            min: 0,
            max: 100,
            grid: {
                drawOnChartArea: false,
            },
            title: {
                display: true,
                text: 'RSI'
            }
        };
        
        // Adjust main y-axis title
        priceChart.options.scales.y.title.text = 'Price (USD)';
    } else {
        // For SMA/EMA, add as new dataset
        priceChart.data.datasets.push({
            label: indicatorLabel,
            data: indicatorData,
            borderColor: indicatorColor,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.3,
            pointRadius: 0
        });
        
        // Remove RSI axis if exists
        if (priceChart.options.scales['y-rsi']) {
            delete priceChart.options.scales['y-rsi'];
        }
    }
    
    priceChart.update();
}

// Modify updateChart to store original data
function updateChart(prices, timestamps, coinName) {
    if (!priceChart) {
        console.error('❌ Chart not initialized!');
        return;
    }
    
    console.log(`🔄 Updating chart with ${prices.length} points`);
    
    // Store original data for indicators
    originalPrices = [...prices];
    originalTimestamps = [...timestamps];
    
    // Format timestamps
    const formattedTimestamps = timestamps.map(ts => {
        const date = new Date(ts);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    });
    
    // Clear existing datasets except the first one (price)
    if (priceChart.data.datasets.length > 1) {
        priceChart.data.datasets = [priceChart.data.datasets[0]];
    }
    
    // Update main price dataset
    priceChart.data.labels = formattedTimestamps;
    priceChart.data.datasets[0].data = prices;
    priceChart.data.datasets[0].label = `${formatCoinName(coinName)} Price`;
    
    // Update colors based on price trend
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const isUp = lastPrice > firstPrice;
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Update chart colors based on theme
    if (isDarkMode) {
        priceChart.options.scales.x.grid.color = 'rgba(255,255,255,0.1)';
        priceChart.options.scales.y.grid.color = 'rgba(255,255,255,0.1)';
        priceChart.options.scales.x.ticks.color = '#e0e0e0';
        priceChart.options.scales.y.ticks.color = '#e0e0e0';
        priceChart.options.plugins.legend.labels.color = '#e0e0e0';
    } else {
        priceChart.options.scales.x.grid.color = 'rgba(0,0,0,0.05)';
        priceChart.options.scales.y.grid.color = 'rgba(0,0,0,0.05)';
        priceChart.options.scales.x.ticks.color = '#666';
        priceChart.options.scales.y.ticks.color = '#666';
        priceChart.options.plugins.legend.labels.color = '#666';
    }
    
    priceChart.data.datasets[0].borderColor = isUp ? '#00c853' : '#ff4444';
    priceChart.data.datasets[0].backgroundColor = isUp ? 
        'rgba(0, 200, 83, 0.1)' : 'rgba(255, 68, 68, 0.1)';
    
    // Remove RSI axis if exists
    if (priceChart.options.scales['y-rsi']) {
        delete priceChart.options.scales['y-rsi'];
    }
    
    // Update chart
    priceChart.update();
    
    // Update title
    document.getElementById('chart-title').textContent = 
        `${formatCoinName(coinName)} - Last ${prices.length} prices`;
    
    // Update coin info
    updateCoinInfo(coinName, prices[prices.length - 1]);
    
    // Reapply current indicator if exists
    if (currentIndicator) {
        addIndicatorToChart(currentIndicator);
    }
}

// Load alerts when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM fully loaded');
    
    // Initialize chart
    if (typeof initChart === 'function') {
        initChart();
    } else {
        console.error('❌ initChart function not found!');
    }
    
    // Start auto-refresh
    if (typeof startAutoRefresh === 'function') {
        startAutoRefresh();
    }
    
    // Load active alerts
    loadActiveAlerts();
    // Load dark mode preference when page loads
    loadDarkModePreference();
    
    // Update current time
    function updateCurrentTime() {
        const now = new Date();
        document.getElementById('current-time').textContent = 
            `Current time: ${now.toLocaleTimeString()}`;
    }
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});

// Make functions available globally
window.selectCoin = selectCoin;
window.initChart = initChart;
window.startAutoRefresh = startAutoRefresh;
window.deleteAlert = deleteAlert;