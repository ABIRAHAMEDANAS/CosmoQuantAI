import ccxt
import time
import os
import csv
from datetime import datetime
from tqdm import tqdm

# ফাইল থেকে শেষ টাইমস্ট্যাম্প পড়ার ফাংশন (পুরো ফাইল না পড়েই)
def get_last_timestamp(file_path):
    try:
        with open(file_path, 'rb') as f:
            try:
                f.seek(-2, os.SEEK_END)
                while f.read(1) != b'\n':
                    f.seek(-2, os.SEEK_CUR)
            except OSError:
                f.seek(0)
            
            last_line = f.readline().decode().strip()
            if not last_line: return None
            
            # CSV কলামগুলো: id, timestamp, datetime, ...
            # আমাদের timestamp (index 1) দরকার
            data = last_line.split(',')
            if len(data) > 1 and data[1].isdigit():
                return int(data[1])
    except Exception:
        return None
    return None

def download_tick_data(exchange_id, symbol, start_date_str):
    try:
        # ১. এক্সচেঞ্জ সেটআপ
        if exchange_id not in ccxt.exchanges:
            print(f"❌ Error: Exchange '{exchange_id}' not found.")
            return
            
        exchange_class = getattr(ccxt, exchange_id)
        exchange = exchange_class({'enableRateLimit': True})
        
        # ফাইলের নাম ও পাথ
        safe_symbol = symbol.replace('/', '-')
        filename = f"trades_{exchange_id}_{safe_symbol}.csv"
        save_path = f"backend/app/data_feeds/{filename}"
        os.makedirs(os.path.dirname(save_path), exist_ok=True)

        # ২. রিজুউম লজিক (Resume Logic)
        since = None
        file_exists = os.path.isfile(save_path)

        if file_exists:
            print(f"🔍 Checking existing file for resume...")
            last_ts = get_last_timestamp(save_path)
            if last_ts:
                since = last_ts + 1 # শেষ সময়ের ঠিক পরের ms থেকে শুরু
                resume_date = datetime.fromtimestamp(last_ts/1000)
                print(f"✅ Found existing data! Resuming from: {resume_date}")
            else:
                print("⚠️ File exists but empty or unreadable. Starting fresh.")
        
        # যদি ফাইল না থাকে বা রিজুউম না হয়, তবে ইউজার ইনপুট তারিখ ব্যবহার হবে
        if since is None:
            since = exchange.parse8601(start_date_str)
            print(f"🆕 Starting fresh download from: {start_date_str}")

        if since is None:
            print("❌ Error: Invalid date format.")
            return

        # ৩. প্রোগ্রেস বারের জন্য ক্যালকুলেশন
        now = exchange.milliseconds()
        total_duration = now - since
        
        print("----------------------------------------------------------------")
        print("⚠️  Press 'Ctrl + C' to pause/stop anytime.")
        print("----------------------------------------------------------------")

        # ৪. ডাউনলোড লুপ
        with open(save_path, 'a', newline='') as f:
            writer = csv.writer(f)
            
            # নতুন ফাইল হলে হেডার লিখবে
            if not file_exists or os.path.getsize(save_path) == 0:
                writer.writerow(['id', 'timestamp', 'datetime', 'symbol', 'side', 'price', 'amount', 'cost'])
            
            total_trades_session = 0
            
            with tqdm(total=total_duration, unit="ms", bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt} ms") as pbar:
                last_loop_ts = since

                while True:
                    try:
                        trades = exchange.fetch_trades(symbol, since, limit=1000)
                        
                        if not trades:
                            print("\n✅ No more trades found. You are up to date!")
                            break

                        rows = []
                        for t in trades:
                            rows.append([
                                t['id'], t['timestamp'], t['datetime'], 
                                t['symbol'], t['side'], t['price'], 
                                t['amount'], t['cost']
                            ])
                        
                        writer.writerows(rows)
                        f.flush() # সাথে সাথে সেভ করা

                        # আপডেট
                        count = len(trades)
                        total_trades_session += count
                        
                        current_ts = trades[-1]['timestamp']
                        pbar.update(current_ts - last_loop_ts)
                        last_loop_ts = current_ts
                        
                        since = current_ts + 1
                        
                        if current_ts > time.time() * 1000:
                            break
                            
                    except KeyboardInterrupt:
                        print(f"\n\n⏸️  Paused! Resumable from: {datetime.fromtimestamp(last_loop_ts/1000)}")
                        return
                    except Exception as e:
                        print(f"\n⚠️ Network Error: {e}. Retrying in 5s...")
                        time.sleep(5)
                        continue

        print("\n" + "="*50)
        print(f"🎉 DONE! Saved to: {save_path}")
        print(f"🔢 Trades collected this session: {total_trades_session}")
        print("="*50)

    except Exception as e:
        print(f"\n❌ Critical Error: {str(e)}")

if __name__ == "__main__":
    # ইউজার ইনপুট
    ex_name = input("Exchange (e.g. binance): ").strip().lower()
    sym_name = input("Pair (e.g. PEPE/USDT): ").strip().upper()
    
    # তারিখ ইনপুট চাইবে, কিন্তু ফাইল থাকলে সেটা ইগনোর করে অটো রিজুউম করবে
    start_input = input("Start Date (YYYY-MM-DD) [If starting new]: ").strip()
    start_dt = start_input + " 00:00:00" if start_input else "2024-01-01 00:00:00"

    download_tick_data(ex_name, sym_name, start_dt)
