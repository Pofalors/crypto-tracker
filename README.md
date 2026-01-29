# 🚀 Crypto Tracker - Real-Time Cryptocurrency Dashboard

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.3.3-green.svg)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

A full-stack web application for tracking cryptocurrency prices in real-time with interactive charts and analytics.

![Dashboard Screenshot](screenshot.png)

## ✨ Features

- **📊 Real-Time Prices**: Live cryptocurrency prices from CoinGecko API
- **📈 Interactive Charts**: Dynamic charts with Chart.js
- **🔧 REST API**: Fully documented RESTful endpoints
- **💾 SQLite Database**: Local data storage with historical tracking
- **🎨 Modern UI**: Responsive design with Bootstrap 5
- **🔄 Auto-Refresh**: Automatic updates every 30 seconds

## 🏗️ Architecture
```
crypto-tracker/
├── app.py # Flask application
├── database.py # Database operations
├── data_fetcher.py # API data fetching
├── requirements.txt # Python dependencies
├── README.md # This file
├── .gitignore # Git ignore rules
├── static/
│ └── app.js # Frontend JavaScript
└── templates/
├── index.html # Dashboard template
└── home.html # Landing page template
```
## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- pip

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Pofalors/crypto-tracker.git
cd crypto-tracker

```

2. **Create virtual environment**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Initialize database**
```bash
python database.py
```

5. **Run the application**
```bash
python app.py
```

6. **Access the application**

- Dashboard: http://localhost:5000/dashboard
- API Health: http://localhost:5000/api/health

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/prices` | Get latest cryptocurrency prices |
| GET | `/api/history/{coin_name}` | Get historical data for specific coin |
| GET | `/api/health` | Check API health status |
| GET | `/dashboard` | Interactive dashboard |


## Technologies Used

- Backend: Python, Flask, SQLite
- Frontend: HTML5, CSS3, JavaScript, Bootstrap 5, Chart.js
- APIs: CoinGecko AP
- Tools: Git, VS Code

## 📊 Supported Cryptocurrencies

- Bitcoin (BTC)
- Ethereum (ETH)
- Cardano (ADA)
- Dogecoin (DOGE)
- Solana (SOL)

## 🤝 Contributing

-Fork the project
-Create your feature branch (git checkout -b feature/AmazingFeature)
-Commit your changes (git commit -m 'Add some AmazingFeature')
-Push to the branch (git push origin feature/AmazingFeature)
-Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

Fanis Spanos
- GitHub: @Pofalors
- LinkedIn: /in/fanis-spanos-049ab6244/

## 🙏 Acknowledgments

- CoinGecko for the cryptocurrency API
- Chart.js for beautiful charts
- Bootstrap for responsive design

# ⭐ Star this repo if you find it useful!
