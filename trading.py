import sqlite3
from datetime import datetime

class TradingBot:
    def __init__(self, db_path='crypto_prices.db'):
        self.db_path = db_path
        self.init_trading_tables()
    
    def init_trading_tables(self):
        """Δημιουργεί πίνακες για το trading bot"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        # Πίνακας για το portfolio του χρήστη
        c.execute('''
            CREATE TABLE IF NOT EXISTS portfolio (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                coin_name TEXT NOT NULL UNIQUE,
                amount REAL DEFAULT 0,
                avg_buy_price REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Πίνακας για το ιστορικό συναλλαγών
        c.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,  -- 'buy' or 'sell'
                coin_name TEXT NOT NULL,
                amount REAL NOT NULL,
                price REAL NOT NULL,
                total REAL NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Πίνακας για το υπόλοιπο (balance)
        c.execute('''
            CREATE TABLE IF NOT EXISTS balance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usd_balance REAL DEFAULT 10000,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Αρχικοποίηση balance αν δεν υπάρχει
        c.execute('SELECT * FROM balance')
        if not c.fetchone():
            c.execute('INSERT INTO balance (usd_balance) VALUES (10000)')
        
        conn.commit()
        conn.close()
        print("✅ Trading tables initialized")
    
    def get_balance(self):
        """Επιστρέφει το τρέχον υπόλοιπο σε USD"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('SELECT usd_balance FROM balance ORDER BY id DESC LIMIT 1')
        balance = c.fetchone()
        conn.close()
        return balance[0] if balance else 10000
    
    def update_balance(self, new_balance):
        """Ενημερώνει το υπόλοιπο"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('UPDATE balance SET usd_balance = ?, updated_at = CURRENT_TIMESTAMP', (new_balance,))
        conn.commit()
        conn.close()
    
    def get_portfolio(self):
        """Επιστρέφει όλα τα coins στο portfolio"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('SELECT coin_name, amount, avg_buy_price FROM portfolio WHERE amount > 0')
        portfolio = c.fetchall()
        conn.close()
        
        result = []
        for coin_name, amount, avg_price in portfolio:
            result.append({
                'coin': coin_name,
                'amount': amount,
                'avg_price': avg_price
            })
        return result
    
    def buy_coin(self, coin_name, amount, current_price):
        """Αγοράζει ένα coin"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        total_cost = amount * current_price
        balance = self.get_balance()
        
        if total_cost > balance:
            conn.close()
            return {'success': False, 'message': 'Insufficient funds'}
        
        # Ενημέρωση portfolio
        c.execute('SELECT amount, avg_buy_price FROM portfolio WHERE coin_name = ?', (coin_name,))
        existing = c.fetchone()
        
        if existing:
            # Υπάρχει ήδη - υπολογισμός νέου μέσου όρου
            old_amount, old_avg = existing
            new_amount = old_amount + amount
            new_avg = ((old_amount * old_avg) + (amount * current_price)) / new_amount
            
            c.execute('''
                UPDATE portfolio 
                SET amount = ?, avg_buy_price = ?, updated_at = CURRENT_TIMESTAMP
                WHERE coin_name = ?
            ''', (new_amount, new_avg, coin_name))
        else:
            # Νέο coin
            c.execute('''
                INSERT INTO portfolio (coin_name, amount, avg_buy_price)
                VALUES (?, ?, ?)
            ''', (coin_name, amount, current_price))
        
        # Καταγραφή συναλλαγής
        c.execute('''
            INSERT INTO transactions (type, coin_name, amount, price, total)
            VALUES (?, ?, ?, ?, ?)
        ''', ('buy', coin_name, amount, current_price, total_cost))
        
        # Ενημέρωση balance
        new_balance = balance - total_cost
        c.execute('UPDATE balance SET usd_balance = ?, updated_at = CURRENT_TIMESTAMP', (new_balance,))
        
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'message': f'Bought {amount} {coin_name} at ${current_price}',
            'new_balance': new_balance,
            'total_cost': total_cost
        }
    
    def sell_coin(self, coin_name, amount, current_price):
        """Πουλάει ένα coin"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        # Έλεγχος αν υπάρχει το coin
        c.execute('SELECT amount, avg_buy_price FROM portfolio WHERE coin_name = ?', (coin_name,))
        existing = c.fetchone()
        
        if not existing or existing[0] < amount:
            conn.close()
            return {'success': False, 'message': 'Insufficient coins'}
        
        old_amount, old_avg = existing
        total_value = amount * current_price
        balance = self.get_balance()
        
        # Ενημέρωση portfolio
        new_amount = old_amount - amount
        
        if new_amount == 0:
            c.execute('DELETE FROM portfolio WHERE coin_name = ?', (coin_name,))
        else:
            c.execute('UPDATE portfolio SET amount = ?, updated_at = CURRENT_TIMESTAMP WHERE coin_name = ?', 
                     (new_amount, coin_name))
        
        # Καταγραφή συναλλαγής
        c.execute('''
            INSERT INTO transactions (type, coin_name, amount, price, total)
            VALUES (?, ?, ?, ?, ?)
        ''', ('sell', coin_name, amount, current_price, total_value))
        
        # Ενημέρωση balance
        new_balance = balance + total_value
        c.execute('UPDATE balance SET usd_balance = ?, updated_at = CURRENT_TIMESTAMP', (new_balance,))
        
        # Υπολογισμός profit/loss
        cost_basis = amount * old_avg
        profit_loss = total_value - cost_basis
        
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'message': f'Sold {amount} {coin_name} at ${current_price}',
            'new_balance': new_balance,
            'total_value': total_value,
            'profit_loss': profit_loss
        }
    
    def get_transactions(self, limit=20):
        """Επιστρέφει το ιστορικό συναλλαγών"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            SELECT type, coin_name, amount, price, total, timestamp
            FROM transactions
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (limit,))
        
        transactions = c.fetchall()
        conn.close()
        
        result = []
        for t in transactions:
            result.append({
                'type': t[0],
                'coin': t[1],
                'amount': t[2],
                'price': t[3],
                'total': t[4],
                'timestamp': t[5]
            })
        return result
    
    def get_portfolio_value(self, current_prices):
        """Υπολογίζει τη συνολική αξία του portfolio"""
        portfolio = self.get_portfolio()
        total_value = 0
        holdings = []
        
        for item in portfolio:
            coin = item['coin']
            if coin in current_prices:
                current_price = current_prices[coin]
                value = item['amount'] * current_price
                profit_loss = value - (item['amount'] * item['avg_price'])
                
                total_value += value
                holdings.append({
                    'coin': coin,
                    'amount': item['amount'],
                    'avg_price': item['avg_price'],
                    'current_price': current_price,
                    'value': value,
                    'profit_loss': profit_loss,
                    'profit_loss_pct': (profit_loss / (item['amount'] * item['avg_price'])) * 100 if item['avg_price'] > 0 else 0
                })
        
        return {
            'total_value': total_value,
            'holdings': holdings
        }