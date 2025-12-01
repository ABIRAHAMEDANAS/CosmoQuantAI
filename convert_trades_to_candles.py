import pandas as pd
import os

def convert_trades_to_ohlcv(trade_file_name, timeframe='1s'):
    # ১. ফাইলের পাথ চেক করা
    file_path = f"backend/app/data_feeds/{trade_file_name}"
    
    if not os.path.exists(file_path):
        print(f"❌ Error: File '{file_path}' not found!")
        return

    print(f"📂 Reading Trade Data: {trade_file_name}...")
    print("⏳ Processing... This might take a moment depending on file size.")

    try:
        # ২. ডাটা রিড করা (শুধু দরকারি কলামগুলো)
        # Trade CSV Headers: id, timestamp, datetime, symbol, side, price, amount, cost
        df = pd.read_csv(file_path, usecols=['datetime', 'price', 'amount'])
        
        # Datetime কলামকে ইনডেক্স বানানো
        df['datetime'] = pd.to_datetime(df['datetime'])
        df.set_index('datetime', inplace=True)

        # ৩. রিস্যাম্পলিং (Magic Happens Here!) 🪄
        # '1s' = 1 Second, '1min' = 1 Minute, etc.
        ohlc = df['price'].resample(timeframe).ohlc()
        volume = df['amount'].resample(timeframe).sum()

        # ৪. ডাটা মার্জ করা
        candles = pd.concat([ohlc, volume], axis=1)
        candles.columns = ['open', 'high', 'low', 'close', 'volume']

        # ফাঁকা ক্যান্ডেল হ্যান্ডেল করা (যে সেকেন্ডে কোনো ট্রেড হয়নি)
        # নিয়ম: যদি ট্রেড না থাকে, তবে আগের ক্লোজ প্রাইস হবে বর্তমানের OHLC
        candles['close'] = candles['close'].ffill()
        candles['open'] = candles['open'].fillna(candles['close'])
        candles['high'] = candles['high'].fillna(candles['close'])
        candles['low'] = candles['low'].fillna(candles['close'])
        candles['volume'] = candles['volume'].fillna(0)

        # ৫. ফাইল সেভ করা
        output_filename = trade_file_name.replace('trades_', f'candles_{timeframe}_')
        output_path = f"backend/app/data_feeds/{output_filename}"
        
        # ইনডেক্স রিসেট করে CSV বানানো
        candles.reset_index(inplace=True)
        candles.to_csv(output_path, index=False)

        print("\n" + "="*50)
        print(f"🎉 CONVERSION COMPLETE!")
        print(f"📄 Generated: {output_filename}")
        print(f"📊 Total Candles: {len(candles)}")
        print("="*50)

    except Exception as e:
        print(f"❌ Error during conversion: {e}")

if __name__ == "__main__":
    print("\n🔄 Trade to Candle Converter")
    print("===========================")
    
    # ফোল্ডারের সব ট্রেড ফাইল দেখাবে
    feed_dir = "backend/app/data_feeds/"
    files = [f for f in os.listdir(feed_dir) if f.startswith("trades_") and f.endswith(".csv")]
    
    if not files:
        print("❌ No trade files found in data_feeds folder.")
    else:
        print("Available Trade Files:")
        for i, f in enumerate(files):
            print(f"{i+1}. {f}")
        
        choice = int(input("\nSelect file number: ")) - 1
        tf = input("Enter Timeframe (e.g. 1s, 5s, 100ms): ").strip()
        
        if 0 <= choice < len(files):
            convert_trades_to_ohlcv(files[choice], tf)
        else:
            print("❌ Invalid selection.")
