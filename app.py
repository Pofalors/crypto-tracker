from flask import Flask, jsonify, render_template
from database import get_latest_prices, init_db
import json
from datetime import datetime

app = Flask(__name__)

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