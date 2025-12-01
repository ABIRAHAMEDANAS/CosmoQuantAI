import ccxt.async_support as ccxt
import ccxt as ccxt_sync 
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app import models
from app.constants import VALID_TIMEFRAMES 
import asyncio
from tqdm import tqdm  # ✅ কনসোল প্রোগ্রেস বারের জন্য
from app.services.websocket_manager import manager # ✅ ওয়েব সকেট ম্যানেজার

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
            'enableRateLimit': True,
        })
        
        try:
            # 2. Check if timeframe is supported
            await exchange.load_markets()
            if timeframe not in exchange.timeframes:
                return {
                    "status": "error", 
                    "message": f"Binance does not support '{timeframe}'. Please sync '15m' or '1m' instead."
                }

            # টাইম রেঞ্জ ক্যালকুলেশন
            since_ts = None
            end_ts = int(datetime.utcnow().timestamp() * 1000)

            if start_date:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                since_ts = int(start_dt.timestamp() * 1000)
            
            if end_date:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                end_dt = end_dt.replace(hour=23, minute=59, second=59)
                end_ts = int(end_dt.timestamp() * 1000)

            # 3. Latest Data (No Loop if start_date is not provided)
            if not since_ts:
                 try:
                    ohlcv = await exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
                    count = self._save_candles(db, ohlcv, symbol, timeframe)
                    return {"status": "success", "message": "Latest data synced", "count": count}
                 except Exception as e:
                     return {"status": "error", "message": f"Fetch Error: {str(e)}"}

            # 4. Historical Data Loop with Progress Bar
            total_saved = 0
            tf_ms = self.timeframe_to_ms(timeframe)
            current_since = since_ts
            
            # মোট কত সময় বাকি তা হিসাব করা (প্রোগ্রেস এর জন্য)
            total_duration = end_ts - since_ts
            
            # ✅ TQDM এবং WebSocket লজিক শুরু
            with tqdm(total=total_duration, desc=f"Syncing {symbol}", unit="ms") as pbar:
                while current_since < end_ts:
                    try:
                        ohlcv = await exchange.fetch_ohlcv(symbol, timeframe, limit=1000, since=current_since)
                    except Exception as e:
                        print(f"Error fetching batch: {e}")
                        break 

                    if not ohlcv:
                        break
                    
                    filtered_ohlcv = [c for c in ohlcv if c[0] <= end_ts]
                    saved_count = self._save_candles(db, filtered_ohlcv, symbol, timeframe)
                    total_saved += saved_count
                    
                    if not filtered_ohlcv:
                        break

                    last_time = filtered_ohlcv[-1][0]
                    
                    # ✅ প্রোগ্রেস ক্যালকুলেশন
                    progress_percent = int(((last_time - since_ts) / total_duration) * 100)
                    progress_percent = min(100, max(0, progress_percent)) # 0-100 এর মধ্যে রাখা

                    # ✅ TQDM আপডেট (ব্যাকএন্ড কনসোলে)
                    pbar.update(last_time - current_since)

                    # ✅ ফ্রন্টএন্ডে WebSocket মেসেজ পাঠানো
                    await manager.broadcast({
                        "type": "sync_progress",
                        "percent": progress_percent,
                        "status": f"Syncing {symbol}... {progress_percent}%"
                    })

                    # পরবর্তী লুপের জন্য সময় সেট করা
                    if last_time == current_since:
                        current_since += tf_ms * 1000
                    else:
                        current_since = last_time + tf_ms
                    
                    # ✅ ইভেন্ট লুপ ব্লক না করার জন্য ছোট বিরতি
                    await asyncio.sleep(0.1)

            # ✅ ফাইনাল ১০০% মেসেজ পাঠানো
            await manager.broadcast({
                "type": "sync_progress",
                "percent": 100,
                "status": "Sync Completed!"
            })

            return {
                "status": "success", 
                "new_candles_stored": total_saved, 
                "range": f"{start_date} to {end_date or 'Now'}",
            }

        except Exception as e:
            print(f"Sync Error: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            await exchange.close()

    def _save_candles(self, db: Session, ohlcv: list, symbol: str, timeframe: str):
        candles_to_insert = []
        for candle in ohlcv:
            timestamp_ms = candle[0]
            dt_object = datetime.fromtimestamp(timestamp_ms / 1000.0)
            
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
        if not retention_rules:
            retention_rules = {
                '1s': 7, '1m': 30, '1h': 365, '1d': 365*5
            }
        
        total_deleted = 0
        for tf, days in retention_rules.items():
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            deleted = db.query(models.MarketData).filter(
                models.MarketData.timeframe == tf,
                models.MarketData.timestamp < cutoff_date
            ).delete(synchronize_session=False)
            if deleted > 0:
                total_deleted += deleted
        db.commit()
        return total_deleted