console.log('📊 Crypto Tracker Dashboard JavaScript loaded');

// Global variables
let priceChart = null;
let currentCoin = 'bitcoin';

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

// Display prices in cards
function displayPrices(prices) {
    const container = document.getElementById('prices-container');
    
    if (!prices || prices.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">
                    No price data available. Make sure the data fetcher is running!
                </div>
            </div>
        `;
        return;
    }
    
    console.log(`📈 Displaying ${prices.length} coins`);
    
    container.innerHTML = prices.map(coin => `
        <div class="col-md-4 col-lg-2">
            <div class="card crypto-card h-100 ${coin.coin === currentCoin ? 'selected-coin' : ''}" 
                 onclick="selectCoin('${coin.coin}')" style="cursor: pointer;">
                <div class="card-body text-center">
                    <h5 class="card-title">${formatCoinName(coin.coin)}</h5>
                    <h3 class="card-text fw-bold ${getPriceChangeClass()}">
                        $${formatPrice(coin.price)}
                    </h3>
                    <small class="text-muted">${formatTimestamp(coin.timestamp)}</small>
                </div>
            </div>
        </div>
    `).join('');
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
        'solana': { symbol: 'SOL', description: 'High-performance blockchain' }
    };
    
    const info = coinInfo[coinName] || { symbol: coinName.toUpperCase(), description: 'Cryptocurrency' };
    
    infoDiv.innerHTML = `
        <div class="alert alert-primary">
            <h5>${formatCoinName(coinName)} (${info.symbol})</h5>
            <p class="mb-1">${info.description}</p>
            <hr>
            <div class="d-flex justify-content-between">
                <span>Current Price:</span>
                <strong>$${formatPrice(currentPrice)}</strong>
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
        'bitcoin': 'Bitcoin',
        'ethereum': 'Ethereum', 
        'cardano': 'Cardano',
        'dogecoin': 'Dogecoin',
        'solana': 'Solana'
    };
    return names[coinId] || coinId.charAt(0).toUpperCase() + coinId.slice(1);
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
        'dogecoin': 10
    };
    return ranks[coinName] || 'N/A';
}

// Start auto-refresh
function startAutoRefresh() {
    console.log('🔄 Starting auto-refresh (30s interval)');
    fetchPrices(); // Initial load
    setInterval(fetchPrices, 30000); // Refresh every 30 seconds
}

// Make functions available globally
window.selectCoin = selectCoin;
window.initChart = initChart;
window.startAutoRefresh = startAutoRefresh;