import requests
import time
from database import insert_price, init_db

# Λίστα με τα νομίσματα που θέλουμε να παρακολουθούμε
COINS = ['bitcoin', 'ethereum', 'cardano', 'dogecoin', 'solana']

def fetch_crypto_prices():
    """Τραβάει τις τιμές από το CoinGecko API"""
    url = "https://api.coingecko.com/api/v3/simple/price"
    
    params = {
        'ids': ','.join(COINS),
        'vs_currencies': 'usd'
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        # Επανάληψη σε κάθε νόμισμα και αποθήκευση στη βάση
        for coin_id in COINS:
            if coin_id in data:
                price = data[coin_id]['usd']
                insert_price(coin_id, price)
                print(f"✅ {coin_id}: ${price}")
            else:
                print(f"❌ Δεν βρέθηκε τιμή για: {coin_id}")
        
        return data
        
    except Exception as e:
        print(f"❌ Σφάλμα: {e}")
        return None

def continuous_fetch(interval=60):
    """Τραβάει δεδομένα κάθε 'interval' δευτερόλεπτα"""
    print(f"🚀 Starting continuous data fetch every {interval} seconds...")
    print("Press Ctrl+C to stop")
    
    init_db()  # Βεβαιώνουμε ότι η βάση υπάρχει
    
    try:
        while True:
            print(f"\n🕒 Fetching data at {time.strftime('%Y-%m-%d %H:%M:%S')}")
            fetch_crypto_prices()
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n⏹️ Data fetching stopped")

if __name__ == "__main__":
    # Για δοκιμή, τράβα δεδομένα μια φορά
    fetch_crypto_prices()