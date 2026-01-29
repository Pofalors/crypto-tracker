import sqlite3
import datetime

def init_db():
    """Δημιουργεί τη βάση δεδομένων και τον πίνακα αν δεν υπάρχουν"""
    conn = sqlite3.connect('crypto_prices.db')
    c = conn.cursor()
    
    # Δημιουργία πίνακα
    c.execute('''
        CREATE TABLE IF NOT EXISTS prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            coin_name TEXT NOT NULL,
            price REAL NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Βάση δεδομένων αρχικοποιήθηκε successfully!")

def insert_price(coin_name, price):
    """Εισάγει μια νέα τιμή στη βάση"""
    conn = sqlite3.connect('crypto_prices.db')
    c = conn.cursor()
    
    c.execute('''
        INSERT INTO prices (coin_name, price)
        VALUES (?, ?)
    ''', (coin_name, price))
    
    conn.commit()
    conn.close()
    print(f"Inserted {coin_name}: ${price}")

def get_latest_prices():
    """Παίρνει τις τελευταίες τιμές για όλα τα νομίσματα"""
    conn = sqlite3.connect('crypto_prices.db')
    c = conn.cursor()
    
    # Παίρνουμε την τελευταία εγγραφή για κάθε νόμισμα
    c.execute('''
        SELECT p1.coin_name, p1.price, p1.timestamp
        FROM prices p1
        WHERE p1.timestamp = (
            SELECT MAX(timestamp)
            FROM prices p2
            WHERE p2.coin_name = p1.coin_name
        )
        ORDER BY p1.coin_name
    ''')
    
    results = c.fetchall()
    conn.close()
    return results

def get_historical_data(coin_name, limit=50):
    """Παίρνει τα τελευταία 'limit' δεδομένα για ένα συγκεκριμένο νόμισμα"""
    conn = sqlite3.connect('crypto_prices.db')
    c = conn.cursor()
    
    c.execute('''
        SELECT price, timestamp 
        FROM prices 
        WHERE coin_name = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
    ''', (coin_name, limit))
    
    results = c.fetchall()
    conn.close()
    
    # Αντιστρέφουμε για να έχουμε παλιό -> νέο
    results.reverse()
    return results

if __name__ == "__main__":
    init_db()