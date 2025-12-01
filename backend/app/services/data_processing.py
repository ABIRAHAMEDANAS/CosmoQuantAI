import pandas as pd
import os

def convert_trades_to_candles_logic(timeframe='1s'):
    """
    Converts all trade files in the data_feeds directory to candle files.
    """
    feed_dir = "app/data_feeds/"
    
    # Ensure directory exists
    if not os.path.exists(feed_dir):
        return {"message": "Data feeds directory not found.", "status": "error"}

    files = [f for f in os.listdir(feed_dir) if f.startswith("trades_") and f.endswith(".csv")]
    
    if not files:
        return {"message": "No trade files found to convert.", "status": "warning"}

    converted_files = []
    errors = []

    for trade_file_name in files:
        file_path = os.path.join(feed_dir, trade_file_name)
        
        try:
            print(f"Processing {trade_file_name}...")
            # Read data
            df = pd.read_csv(file_path, usecols=['datetime', 'price', 'amount'])
            
            # Convert datetime and set index
            df['datetime'] = pd.to_datetime(df['datetime'])
            df.set_index('datetime', inplace=True)

            # Resample
            ohlc = df['price'].resample(timeframe).ohlc()
            volume = df['amount'].resample(timeframe).sum()

            # Merge
            candles = pd.concat([ohlc, volume], axis=1)
            candles.columns = ['open', 'high', 'low', 'close', 'volume']

            # Handle missing data
            candles['close'] = candles['close'].ffill()
            candles['open'] = candles['open'].fillna(candles['close'])
            candles['high'] = candles['high'].fillna(candles['close'])
            candles['low'] = candles['low'].fillna(candles['close'])
            candles['volume'] = candles['volume'].fillna(0)

            # Save output
            output_filename = trade_file_name.replace('trades_', f'candles_{timeframe}_')
            output_path = os.path.join(feed_dir, output_filename)
            
            candles.reset_index(inplace=True)
            candles.to_csv(output_path, index=False)
            
            converted_files.append(output_filename)
            
        except Exception as e:
            error_msg = f"Error converting {trade_file_name}: {str(e)}"
            print(error_msg)
            errors.append(error_msg)

    return {
        "message": "Conversion process completed.",
        "converted_files": converted_files,
        "errors": errors,
        "status": "success" if not errors else "partial_success"
    }
