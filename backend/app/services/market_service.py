import ccxt.async_support as ccxt
import ccxt as ccxt_sync 
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app import models
from app.constants import VALID_TIMEFRAMES 
import asyncio

class MarketService:
    def __init__(self):
        self._markets_cache = {} 

    def timeframe_to_ms(self, timeframe):
        seconds = 0
        if timeframe.endswith('s'): seconds = int(timeframe[:-1])
        elif timeframe.endswith('m'): seconds = int(timeframe[:-1]) * 60
        elif timeframe.endswith('h'): seconds = int(timeframe[:-1]) * 3600
        elif timeframe.endswith('d'): seconds = int(timeframe[:-1]) * 86400
        elif timeframe.endswith('w'): seconds = int(timeframe[:-1]) * 604800
        elif timeframe.endswith('M'): seconds = int(timeframe[:-1]) * 2592000
        return seconds * 1000

    async def fetch_and_store_candles(self, db: Session, symbol: str, timeframe: str, start_date: str = None, end_date: str = None, limit: int = 1000):
        # 1. Exchange Setup
        exchange = ccxt.binance({
            'enableRateLimit': True, # অটোমেটিক রেট লিমিট হ্যান্ডেল করবে
        })
        
        try:
            # 2. Check if timeframe is supported by Binance
            await exchange.load_markets()
            if timeframe not in exchange.timeframes:
                # যদি 45m হয় যা Binance এ নেই, তখন আমরা এরর দিব। 
                # ইউজারকে 15m ডাটা সিঙ্ক করতে হবে, ব্যাকটেস্টার সেটা কনভার্ট করে নিবে।
                return {
                    "status": "error", 
                    "message": f"Binance does not support '{timeframe}'. Please sync '15m' or '1m' instead, and the Backtester will resample it."
                }

            since_ts = None
            end_ts = int(datetime.utcnow().timestamp() * 1000)

            if start_date:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                since_ts = int(start_dt.timestamp() * 1000)
            
            if end_date:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                end_dt = end_dt.replace(hour=23, minute=59, second=59)
                end_ts = int(end_dt.timestamp() * 1000)

            # 3. Latest Data (No Loop)
            if not since_ts:
                 try:
                    ohlcv = await exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
                    count = self._save_candles(db, ohlcv, symbol, timeframe)
                    return {"status": "success", "message": "Latest data synced", "count": count}
                 except Exception as e:
                     return {"status": "error", "message": f"Fetch Error: {str(e)}"}

            # 4. Historical Data Loop
            total_saved = 0
            tf_ms = self.timeframe_to_ms(timeframe)
            current_since = since_ts

            while current_since < end_ts:
                try:
                    ohlcv = await exchange.fetch_ohlcv(symbol, timeframe, limit=1000, since=current_since)
                except Exception as e:
                    print(f"Error fetching batch: {e}")
                    break # নেটওয়ার্ক এরর হলে লুপ থামিয়ে যতটুকু হয়েছে সেভ থাকবে

                if not ohlcv:
                    break
                
                filtered_ohlcv = [c for c in ohlcv if c[0] <= end_ts]
                saved_count = self._save_candles(db, filtered_ohlcv, symbol, timeframe)
                total_saved += saved_count
                
                if not filtered_ohlcv:
                    break

                last_time = filtered_ohlcv[-1][0]
                
                if last_time == current_since:
                    current_since += tf_ms * 1000
                else:
                    current_since = last_time + tf_ms
                
                # ✅ রেট লিমিট এড়ানোর জন্য ছোট বিরতি
                await asyncio.sleep(0.1)

            return {
                "status": "success", 
                "new_candles_stored": total_saved, 
                "range": f"{start_date} to {end_date or 'Now'}",
                "note": "For large date ranges, ensure this task runs in background."
            }

        except Exception as e:
            print(f"Sync Error: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            await exchange.close()

    def _save_candles(self, db: Session, ohlcv: list, symbol: str, timeframe: str):
        # বাল্ক ইনসার্ট ব্যবহার করলে অনেক দ্রুত হবে
        candles_to_insert = []
        for candle in ohlcv:
            timestamp_ms = candle[0]
            dt_object = datetime.fromtimestamp(timestamp_ms / 1000.0)
            
            # ডুপ্লিকেট চেক করার জন্য আমরা এখানে সিম্পল লজিক রাখছি, 
            # কিন্তু প্রোডাকশনে `ON CONFLICT DO NOTHING` ব্যবহার করা উচিত
            existing = db.query(models.MarketData.id).filter(
                models.MarketData.symbol == symbol,
                models.MarketData.timeframe == timeframe,
                models.MarketData.timestamp == dt_object
            ).first()

            if not existing:
                candles_to_insert.append(models.MarketData(
                    exchange='binance',
                    symbol=symbol,
                    timeframe=timeframe,
                    timestamp=dt_object,
                    open=candle[1],
                    high=candle[2],
                    low=candle[3],
                    close=candle[4],
                    volume=candle[5]
                ))
        
        if candles_to_insert:
            db.bulk_save_objects(candles_to_insert)
            db.commit()
        
        return len(candles_to_insert)

    async def get_exchange_markets(self, exchange_id: str):
        if exchange_id in self._markets_cache:
            return self._markets_cache[exchange_id]

        try:
            if hasattr(ccxt, exchange_id):
                exchange_class = getattr(ccxt, exchange_id)
                temp_exchange = exchange_class()
                try:
                    markets = await temp_exchange.load_markets()
                    symbols = list(markets.keys())
                    self._markets_cache[exchange_id] = symbols
                    return symbols
                finally:
                    await temp_exchange.close()
            return []
        except Exception as e:
            print(f"Error fetching markets for {exchange_id}: {e}")
            return []

    def get_supported_exchanges(self):
        return ['binance', 'kraken', 'kucoin', 'bybit', 'okx', 'gateio', 'bitget', 'coinbase']
            
    def get_candles_from_db(self, db: Session, symbol: str, timeframe: str, start_date: str = None, end_date: str = None):
        query = db.query(models.MarketData).filter(
            models.MarketData.symbol == symbol,
            models.MarketData.timeframe == timeframe
        )
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                query = query.filter(models.MarketData.timestamp >= start_dt)
            except: pass
        if end_date:
             try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                end_dt = end_dt.replace(hour=23, minute=59, second=59)
                query = query.filter(models.MarketData.timestamp <= end_dt)
             except: pass
             
        return query.order_by(models.MarketData.timestamp.asc()).all()

    def cleanup_old_data(self, db: Session, retention_rules: dict = None):
        """
        পুরানো ডাটা মুছে ফেলার জন্য।
        retention_rules: { '1s': 7, '1m': 30 } (days)
        """
        if not retention_rules:
            # ডিফল্ট রুলস
            retention_rules = {
                '1s': 7,    # ১ সেকেন্ড ডাটা ৭ দিন থাকবে
                '5s': 7,
                '10s': 7,
                '15s': 7,
                '30s': 7,
                '1m': 30,   # ১ মিনিট ডাটা ৩০ দিন
                '3m': 30,
                '5m': 30,
                '15m': 30,
                '30m': 30,
                '1h': 365,  # ১ ঘণ্টা ডাটা ১ বছর
                '2h': 365,
                '4h': 365,
                '6h': 365,
                '8h': 365,
                '12h': 365,
                '1d': 365*5, # ১ দিন ডাটা ৫ বছর
                '3d': 365*5,
                '1w': 365*5,
                '1M': 365*5
            }
        
        total_deleted = 0
        
        for tf, days in retention_rules.items():
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # বাল্ক ডিলিট (খুব বেশি ডাটা হলে ব্যাচে করা ভালো, তবে এখানে সিম্পল রাখা হলো)
            deleted = db.query(models.MarketData).filter(
                models.MarketData.timeframe == tf,
                models.MarketData.timestamp < cutoff_date
            ).delete(synchronize_session=False)
            
            if deleted > 0:
                print(f"Deleted {deleted} old candles for timeframe {tf} (older than {days} days)")
                total_deleted += deleted
                
        db.commit()
        return total_deleted