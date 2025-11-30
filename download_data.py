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
            
            # CSV কলাম: datetime, open, high, low, close, volume
            # কিন্তু আমরা datetime কলামে স্ট্রিং সেভ করছি, তাই আমাদের কনভার্ট করতে হবে
            # অথবা আমরা সুবিধার্থে ফাইলের শেষে টাইমস্ট্যাম্প চেক করার লজিক একটু সিম্পল রাখছি
            
            # এখানে আমরা ধরে নিচ্ছি ইউজার আগের বার এই স্ক্রিপ্ট দিয়েই ডাটা নামিয়েছে
            # তাই শেষ লাইনের প্রথম ভ্যালুটিই টাইমস্ট্যাম্প হওয়ার কথা (যদি আমরা timestamp কলাম রাখি)
            
            # আগের ভার্সনে আমরা 'datetime' স্ট্রিং রাখতাম। রিজুউম সহজ করতে আমরা
            # এখন থেকে 'timestamp' (ms) কলামটাও রাখব বা স্ট্রিং পার্স করব।
            
            data = last_line.split(',')
            if len(data) > 0:
                # যদি প্রথম কলামটি টাইমস্ট্যাম্প সংখ্যা হয়
                if data[0].isdigit():
                     return int(data[0])
                # যদি স্ট্রিং হয় (2024-01-01...), তবে পার্স করতে হবে।
                # কিন্তু সবচেয়ে সেইফ হলো ফাইলের সাথে মিল রেখে লজিক সাজানো।
                # নিচে আমরা timestamp (ms) কলামটি প্রথমে রাখব।
                try:
                    # চেষ্টা করি স্ট্রিং থেকে টাইমস্ট্যাম্প বের করার
                    dt_obj = datetime.strptime(data[0], "%Y-%m-%d %H:%M:%S")
                    return int(dt_obj.timestamp() * 1000)
                except:
                    pass
    except Exception:
        return None
    return None

def download_data(exchange_id, symbol, timeframe, start_date_str):
    try:
        # ১. এক্সচেঞ্জ সেটআপ
        if exchange_id not in ccxt.exchanges:
            print(f"❌ Error: Exchange '{exchange_id}' not found.")
            return
            
        exchange_class = getattr(ccxt, exchange_id)
        exchange = exchange_class({'enableRateLimit': True})
        
        # ফাইলের নাম ও পাথ
        safe_symbol = symbol.replace('/', '-')
        filename = f"{exchange_id}_{safe_symbol}_{timeframe}.csv"
        save_path = f"backend/app/data_feeds/{filename}"
        os.makedirs(os.path.dirname(save_path), exist_ok=True)

        # ২. রিজুউম লজিক (Resume Logic)
        since = None
        file_exists = os.path.isfile(save_path)

        if file_exists:
            print(f"🔍 Checking existing file for resume...")
            # শেষ লাইন পড়ে টাইমস্ট্যাম্প বের করার চেষ্টা
            # নোট: আমরা এই স্ক্রিপ্টে এখন থেকে datetime এর পাশাপাশি timestamp (ms) সেভ করব না, 
            # বরং standard format বজায় রাখব। তাই datetime string পার্স করব।
            
            with open(save_path, 'r') as f:
                lines = f.readlines()
                if len(lines) > 1:
                    last_line = lines[-1].strip().split(',')
                    try:
                        # আমাদের আগের ফরম্যাট ছিল: datetime, open, high, low, close, volume
                        last_date_str = last_line[0] 
                        last_ts = exchange.parse8601(last_date_str)
                        if last_ts:
                            since = last_ts + 1 # পরের ক্যান্ডেল থেকে শুরু
                            print(f"✅ Found existing data! Resuming from: {last_date_str}")
                    except:
                        print("⚠️ Could not parse last line. Starting fresh.")
        
        if since is None:
            since = exchange.parse8601(start_date_str)
            print(f"🆕 Starting fresh download from: {start_date_str}")

        if since is None:
            print("❌ Error: Invalid date format.")
            return

        # ৩. প্রোগ্রেস বারের জন্য
        now = exchange.milliseconds()
        total_duration = now - since
        
        print(f"📥 Downloading OHLCV for {symbol} ({timeframe})")
        print("----------------------------------------------------------------")
        print("⚠️  Press 'Ctrl + C' to pause/stop anytime.")
        print("----------------------------------------------------------------")

        # ৪. ডাউনলোড লুপ
        # Append mode 'a' তে ওপেন করছি
        with open(save_path, 'a', newline='') as f:
            writer = csv.writer(f)
            
            # নতুন ফাইল হলে হেডার লিখবে
            if not file_exists or os.path.getsize(save_path) == 0:
                writer.writerow(['datetime', 'open', 'high', 'low', 'close', 'volume'])
            
            total_candles = 0
            
            with tqdm(total=total_duration, unit="ms", bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt} ms") as pbar:
                last_loop_ts = since

                while True:
                    try:
                        candles = exchange.fetch_ohlcv(symbol, timeframe, since, limit=1000)
                        
                        if not candles:
                            print("\n✅ No more candles found. Up to date!")
                            break

                        rows = []
                        for c in candles:
                            # c = [timestamp, open, high, low, close, volume]
                            dt_str = datetime.fromtimestamp(c[0]/1000).strftime('%Y-%m-%d %H:%M:%S')
                            rows.append([dt_str, c[1], c[2], c[3], c[4], c[5]])
                        
                        writer.writerows(rows)
                        f.flush() # সেইফ সেভ

                        # আপডেট
                        count = len(candles)
                        total_candles += count
                        
                        current_ts = candles[-1][0]
                        pbar.update(current_ts - last_loop_ts)
                        last_loop_ts = current_ts
                        
                        since = current_ts + 1
                        
                        if current_ts > time.time() * 1000:
                            break
                            
                    except KeyboardInterrupt:
                        print(f"\n\n⏸️  Paused! Resumable from: {datetime.fromtimestamp(last_loop_ts/1000)}")
                        return
                    except Exception as e:
                        print(f"\n⚠️ Network/Exchange Error: {e}. Retrying in 5s...")
                        time.sleep(5)
                        continue

        print("\n" + "="*50)
        print(f"🎉 DONE! Saved to: {save_path}")
        print(f"🔢 Candles collected this session: {total_candles}")
        print("="*50)

    except Exception as e:
        print(f"\n❌ Critical Error: {str(e)}")

if __name__ == "__main__":
    ex_name = input("Exchange (e.g. binance): ").strip().lower()
    sym_name = input("Pair (e.g. BTC/USDT): ").strip().upper()
    tf = input("Timeframe (e.g. 15m, 1h): ").strip()
    
    # ইনপুট নিবে কিন্তু ফাইল থাকলে অটো রিজুউম করবে
    start_input = input("Start Date (YYYY-MM-DD) [If new]: ").strip()
    start_dt = start_input + " 00:00:00" if start_input else "2023-01-01 00:00:00"

    download_data(ex_name, sym_name, tf, start_dt)
