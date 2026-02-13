import sqlite3
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class AlertSystem:
    def __init__(self, db_path='crypto_prices.db'):
        self.db_path = db_path
        self.init_alerts_table()
    
    def init_alerts_table(self):
        """Δημιουργεί πίνακα για alerts"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        c.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                coin_name TEXT NOT NULL,
                target_price REAL NOT NULL,
                condition TEXT NOT NULL,  -- 'above' or 'below'
                active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_triggered TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ Alerts table initialized")
    
    def add_alert(self, email, coin_name, target_price, condition):
        """Προσθέτει νέο alert"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        c.execute('''
            INSERT INTO alerts (email, coin_name, target_price, condition)
            VALUES (?, ?, ?, ?)
        ''', (email, coin_name, target_price, condition))
        
        conn.commit()
        alert_id = c.lastrowid
        conn.close()
        
        print(f"✅ Alert added for {coin_name} at ${target_price}")
        return alert_id
    
    def get_active_alerts(self):
        """Παίρνει όλα τα ενεργά alerts"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        c.execute('''
            SELECT id, email, coin_name, target_price, condition
            FROM alerts
            WHERE active = 1
        ''')
        
        alerts = c.fetchall()
        conn.close()
        return alerts
    
    def check_alerts(self, current_prices):
        """Ελέγχει ποια alerts ενεργοποιούνται"""
        triggered = []
        alerts = self.get_active_alerts()
        
        for alert_id, email, coin, target, condition in alerts:
            if coin in current_prices:
                price = current_prices[coin]
                
                if condition == 'above' and price >= target:
                    triggered.append((alert_id, email, coin, price, target, 'above'))
                elif condition == 'below' and price <= target:
                    triggered.append((alert_id, email, coin, price, target, 'below'))
        
        return triggered
    
    def send_email_alert(self, to_email, coin_name, current_price, target_price, condition):
        """Στέλνει email alert"""
        # Για δοκιμή, απλά τυπώνουμε
        print(f"""
        📧 EMAIL ALERT
        To: {to_email}
        Subject: 🚀 Crypto Alert: {coin_name} {condition} ${target_price}
        
        Hello!
        
        Your alert for {coin_name} has been triggered!
        
        Current price: ${current_price}
        Target price: ${target_price}
        Condition: Price is {condition} target
        
        Check the dashboard: http://localhost:5000/dashboard
        
        Happy trading! 📈
        """)
        
        # Εδώ θα μπει το πραγματικό email (θα το κάνουμε μετά)
        return True
    
    def deactivate_alert(self, alert_id):
        """Απενεργοποιεί alert που ενεργοποιήθηκε"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        c.execute('''
            UPDATE alerts 
            SET active = 0, last_triggered = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (alert_id,))
        
        conn.commit()
        conn.close()