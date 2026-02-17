from flask import Flask, jsonify, render_template, request
from database import get_latest_prices, init_db
import json
from datetime import datetime
from alerts import AlertSystem
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
import sqlite3
from trading import TradingBot

app = Flask(__name__)

def check_alerts_job():
    """Background job για έλεγχο alerts"""
    with app.app_context():
        try:
            # Παίρνουμε τελευταίες τιμές
            from database import get_latest_prices
            prices = get_latest_prices()
            
            current_prices = {}
            for coin_name, price, _ in prices:
                current_prices[coin_name] = price
            
            # Ελέγχουμε alerts
            triggered = alert_system.check_alerts(current_prices)
            
            for alert_id, email, coin, price, target, condition in triggered:
                alert_system.send_email_alert(email, coin, price, target, condition)
                alert_system.deactivate_alert(alert_id)
                
            if triggered:
                print(f"🎯 Triggered {len(triggered)} alerts at {datetime.now()}")
                
        except Exception as e:
            print(f"❌ Error in alert job: {e}")

# Initialize alert system
alert_system = AlertSystem()
# Initialize trading bot
trading_bot = TradingBot()

# Background scheduler για έλεγχο alerts κάθε λεπτό
scheduler = BackgroundScheduler()
scheduler.add_job(func=check_alerts_job, trigger="interval", seconds=60)
scheduler.start()

# Σταμάτα scheduler όταν κλείνει η εφαρμογή
atexit.register(lambda: scheduler.shutdown())

# Αρχικοποίηση βάσης δεδομένων όταν ξεκινάει η εφαρμογή
# Αυτό είναι το νέο τρόπο αντί για before_first_request
with app.app_context():
    init_db()

# Βασική σελίδα - απλά εμφανίζει μήνυμα
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/dashboard')
def dashboard():
    return render_template('index.html')

# Trading endpoints
@app.route('/api/trading/balance')
def get_trading_balance():
    """Επιστρέφει το τρέχον υπόλοιπο"""
    balance = trading_bot.get_balance()
    return jsonify({
        "status": "success",
        "balance": balance
    })

@app.route('/api/trading/portfolio')
def get_portfolio():
    """Επιστρέφει το portfolio"""
    portfolio = trading_bot.get_portfolio()
    return jsonify({
        "status": "success",
        "portfolio": portfolio
    })

@app.route('/api/trading/transactions')
def get_transactions():
    """Επιστρέφει το ιστορικό συναλλαγών"""
    transactions = trading_bot.get_transactions()
    return jsonify({
        "status": "success",
        "transactions": transactions
    })

@app.route('/api/trading/buy', methods=['POST'])
def buy_coin():
    """Αγοράζει ένα coin"""
    try:
        data = request.json
        coin = data.get('coin')
        amount = float(data.get('amount'))
        
        # Παίρνουμε τρέχουσα τιμή
        from database import get_latest_prices
        prices = get_latest_prices()
        current_price = None
        for c, p, _ in prices:
            if c == coin:
                current_price = p
                break
        
        if not current_price:
            return jsonify({
                "status": "error",
                "message": "Coin not found"
            }), 404
        
        result = trading_bot.buy_coin(coin, amount, current_price)
        
        if result['success']:
            return jsonify({
                "status": "success",
                "message": result['message'],
                "new_balance": result['new_balance'],
                "total_cost": result['total_cost']
            })
        else:
            return jsonify({
                "status": "error",
                "message": result['message']
            }), 400
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/trading/sell', methods=['POST'])
def sell_coin():
    """Πουλάει ένα coin"""
    try:
        data = request.json
        coin = data.get('coin')
        amount = float(data.get('amount'))
        
        # Παίρνουμε τρέχουσα τιμή
        from database import get_latest_prices
        prices = get_latest_prices()
        current_price = None
        for c, p, _ in prices:
            if c == coin:
                current_price = p
                break
        
        if not current_price:
            return jsonify({
                "status": "error",
                "message": "Coin not found"
            }), 404
        
        result = trading_bot.sell_coin(coin, amount, current_price)
        
        if result['success']:
            return jsonify({
                "status": "success",
                "message": result['message'],
                "new_balance": result['new_balance'],
                "total_value": result['total_value'],
                "profit_loss": result['profit_loss']
            })
        else:
            return jsonify({
                "status": "error",
                "message": result['message']
            }), 400
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/trading/portfolio-value')
def get_portfolio_value():
    """Υπολογίζει την αξία του portfolio"""
    try:
        # Παίρνουμε τρέχουσες τιμές
        from database import get_latest_prices
        prices = get_latest_prices()
        
        current_prices = {}
        for coin_name, price, _ in prices:
            current_prices[coin_name] = price
        
        value_info = trading_bot.get_portfolio_value(current_prices)
        balance = trading_bot.get_balance()
        
        total_net_worth = balance + value_info['total_value']
        
        return jsonify({
            "status": "success",
            "balance": balance,
            "portfolio_value": value_info['total_value'],
            "total_net_worth": total_net_worth,
            "holdings": value_info['holdings']
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/alerts/add', methods=['POST'])
def add_alert():
    """Προσθέτει νέο alert"""
    try:
        data = request.json
        email = data.get('email')
        coin = data.get('coin')
        price = float(data.get('price'))
        condition = data.get('condition')  # 'above' or 'below'
        
        alert_id = alert_system.add_alert(email, coin, price, condition)
        
        return jsonify({
            "status": "success",
            "alert_id": alert_id,
            "message": f"Alert set for {coin} at ${price}"
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/alerts')
def get_alerts():
    """Επιστρέφει όλα τα alerts"""
    alerts = alert_system.get_active_alerts()
    
    result = []
    for alert_id, email, coin, price, condition in alerts:
        result.append({
            "id": alert_id,
            "email": email,
            "coin": coin,
            "price": price,
            "condition": condition
        })
    
    return jsonify({
        "status": "success",
        "alerts": result
    })
    
@app.route('/api/alerts/<int:alert_id>', methods=['DELETE'])
def delete_alert(alert_id):
    """Διαγράφει ένα alert"""
    try:
        conn = sqlite3.connect('crypto_prices.db')
        c = conn.cursor()
        
        # Έλεγχος αν υπάρχει το alert
        c.execute('SELECT id FROM alerts WHERE id = ?', (alert_id,))
        if not c.fetchone():
            return jsonify({
                "status": "error",
                "message": "Alert not found"
            }), 404
        
        # Διαγραφή
        c.execute('DELETE FROM alerts WHERE id = ?', (alert_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            "status": "success",
            "message": f"Alert {alert_id} deleted successfully"
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Endpoint για health check
@app.route('/api/health')
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

# Endpoint για τις τελευταίες τιμές
@app.route('/api/prices')
def get_prices():
    try:
        prices = get_latest_prices()
        
        # Μετατροπή σε λεξικό για JSON
        result = []
        for coin_name, price, timestamp in prices:
            result.append({
                'coin': coin_name,
                'price': price,
                'timestamp': timestamp
            })
        
        return jsonify({
            "status": "success",
            "data": result,
            "count": len(result)
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Endpoint για ιστορικά δεδομένα (για τα γραφήματα)
@app.route('/api/history/<coin_name>')
def get_history(coin_name):
    try:
        # Χρησιμοποιούμε τη νέα συνάρτηση από το database.py
        from database import get_historical_data
        historical_data = get_historical_data(coin_name, limit=20)
        
        # Διαχωρίζουμε τιμές και timestamps
        prices = [data[0] for data in historical_data]
        timestamps = [data[1] for data in historical_data]
        
        return jsonify({
            "status": "success",
            "coin": coin_name,
            "prices": prices,
            "timestamps": timestamps,
            "count": len(prices)
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)