import ccxt.async_support as ccxt
import os
import ccxt as ccxt_sync 
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert # ✅ এই ইমপোর্টটি খুব গুরুত্বপূর্ণ
from datetime import datetime, timedelta
from app import models
from app.constants import VALID_TIMEFRAMES 
import asyncio
from tqdm import tqdm
from app.services.websocket_manager import manager
from fastapi.concurrency import run_in_threadpool

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
            'userAgent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # ✅ সেফ সিম্বল জেনারেট করা (স্ল্যাশ ছাড়া) - ফ্রন্টএন্ডের সাথে মিল রাখার জন্য
        safe_symbol = symbol.replace('/', '') 

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
                    # শুরুতেই একটা ০% মেসেজ পাঠানো
                    await self._broadcast_progress(symbol, safe_symbol, 0, "Fetching latest data...")

                    ohlcv = await exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
                    count = await run_in_threadpool(self._save_candles, db, ohlcv, symbol, timeframe)
                    
                    # শেষ হলে ১০০% মেসেজ পাঠানো
                    await self._broadcast_progress(symbol, safe_symbol, 100, "Latest data synced!")
                    
                    return {"status": "success", "message": "Latest data synced", "count": count}
                 except Exception as e:
                     return {"status": "error", "message": f"Fetch Error: {str(e)}"}

            # 4. Historical Data Loop with Progress Bar
            total_saved = 0
            tf_ms = self.timeframe_to_ms(timeframe)
            current_since = since_ts
            
            # মোট কত সময় বাকি তা হিসাব করা (প্রোগ্রেস এর জন্য)
            total_duration = end_ts - since_ts
            
            # শুরুতেই একটা ০% মেসেজ পাঠানো যাতে UI রেডি হয়
            await self._broadcast_progress(symbol, safe_symbol, 0, f"Starting sync for {symbol}...")

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
                    saved_count = await run_in_threadpool(self._save_candles, db, filtered_ohlcv, symbol, timeframe)
                    total_saved += saved_count
                    
                    if not filtered_ohlcv:
                        break

                    last_time = filtered_ohlcv[-1][0]
                    
                    # প্রোগ্রেস ক্যালকুলেশন
                    progress_percent = int(((last_time - since_ts) / total_duration) * 100)
                    progress_percent = min(100, max(0, progress_percent))

                    # TQDM আপডেট
                    pbar.update(last_time - current_since)

                    # ✅ WebSocket মেসেজ পাঠানো (সব চ্যানেলে)
                    await self._broadcast_progress(symbol, safe_symbol, progress_percent, f"Syncing {symbol}... {progress_percent}%")

                    # পরবর্তী লুপের জন্য সময় সেট করা
                    if last_time == current_since:
                        current_since += tf_ms
                    else:
                        current_since = last_time + tf_ms
                    
                    # ইভেন্ট লুপ ব্লক না করার জন্য ছোট বিরতি
                    await asyncio.sleep(0.1)

            # ফাইনাল ১০০% মেসেজ পাঠানো
            await self._broadcast_progress(symbol, safe_symbol, 100, "Sync Completed Successfully!")

            return {
                "status": "success", 
                "new_candles_stored": total_saved, 
                "range": f"{start_date} to {end_date or 'Now'}",
            }

        except Exception as e:
            print(f"Sync Error: {e}")
            # এরর মেসেজ পাঠানো
            await self._broadcast_progress(symbol, safe_symbol, 0, f"Sync Failed: {str(e)}")
            return {"status": "error", "message": str(e)}
        finally:
            await exchange.close()

    # ✅ হেল্পার মেথড: সব পসিবল চ্যানেলে ব্রডকাস্ট করার জন্য
    async def _broadcast_progress(self, symbol: str, safe_symbol: str, percent: int, status_msg: str):
        message = {
            "type": "sync_progress",
            "percent": percent,
            "status": status_msg
        }
        # ১. জেনারেল চ্যানেলে (যদি কেউ থাকে)
        await manager.broadcast_to_symbol("general", message)
        # ২. অরিজিনাল সিম্বল (যেমন: 'BTC/USDT')
        await manager.broadcast_to_symbol(symbol, message)
        # ৩. সেফ সিম্বল (যেমন: 'BTCUSDT') - এটিই ফ্রন্টএন্ড সাধারণত ব্যবহার করে
        if safe_symbol != symbol:
            await manager.broadcast_to_symbol(safe_symbol, message)


    # ✅ আপডেটেড _save_candles মেথড (বাল্ক ইনসার্ট)
    def _save_candles(self, db: Session, ohlcv: list, symbol: str, timeframe: str):
        if not ohlcv:
            return 0
            
        candles_data = []
        for candle in ohlcv:
            timestamp_ms = candle[0]
            dt_object = datetime.fromtimestamp(timestamp_ms / 1000.0)
            
            candles_data.append({
                "exchange": "binance",
                "symbol": symbol,
                "timeframe": timeframe,
                "timestamp": dt_object,
                "open": candle[1],
                "high": candle[2],
                "low": candle[3],
                "close": candle[4],
                "volume": candle[5]
            })

        if candles_data:
            # PostgreSQL Efficient Upsert (DO NOTHING on Conflict)
            stmt = insert(models.MarketData).values(candles_data)
            
            # প্রাইমারি কি (exchange, symbol, timeframe, timestamp) মিলে গেলে ইগনোর করবে
            stmt = stmt.on_conflict_do_nothing(
                index_elements=['exchange', 'symbol', 'timeframe', 'timestamp']
            )
            
            try:
                db.execute(stmt)
                db.commit()
            except Exception as e:
                db.rollback()
                print(f"Bulk Insert Error: {e}")
                return 0
        
        return len(candles_data)

    async def get_exchange_markets(self, exchange_id: str):
        if exchange_id in self._markets_cache:
            return self._markets_cache[exchange_id]

        try:
            if hasattr(ccxt, exchange_id):
                exchange_class = getattr(ccxt, exchange_id)
                
                # কনফিগারেশন
                config = {
                    'enableRateLimit': True,
                    'userAgent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }

                # ঐচ্ছিক: .env থেকে API Key চেক করা (যদি থাকে)
                env_api_key = os.getenv(f"{exchange_id.upper()}_API_KEY")
                env_secret = os.getenv(f"{exchange_id.upper()}_SECRET")
                if env_api_key and env_secret:
                    config['apiKey'] = env_api_key
                    config['secret'] = env_secret
                    
                    # ✅ Fix: Alpaca Paper Trading support
                    if exchange_id == 'alpaca' and env_api_key.startswith('PK'):
                        config['options'] = {'defaultType': 'paper'}  # Use paper trading endpoint

                # এক্সচেঞ্জ ইনিশিয়ালাইজ করার চেষ্টা
                try:
                    temp_exchange = exchange_class(config)
                except Exception as e:
                    # Alpaca বা অন্য এক্সচেঞ্জ ক্রেডেনশিয়াল ছাড়া ইনিশিলাইজ না হলে এখানে থামবে
                    print(f"Skipping {exchange_id}: Init failed (Needs keys?). Error: {e}")
                    return []

                # মার্কেট লোড করার চেষ্টা
                try:
                    markets = await temp_exchange.load_markets()
                    symbols = list(markets.keys())
                    
                    # সফল হলে ক্যাশে সেভ করুন
                    self._markets_cache[exchange_id] = symbols
                    return symbols
                except Exception as e:
                    print(f"Could not load markets for {exchange_id}: {e}")
                    return []
                finally:
                    if temp_exchange:
                        await temp_exchange.close()
            return []
        except Exception as e:
            print(f"Critical Error fetching {exchange_id}: {e}")
            return []

    def get_supported_exchanges(self):
        # ccxt লাইব্রেরিতে থাকা সব এক্সচেঞ্জ রিটার্ন করবে
        return ccxt.exchanges
            
    def get_candles_from_db(self, db: Session, symbol: str, timeframe: str, start_date: str = None, end_date: str = None):
        query = db.query(
            models.MarketData.timestamp,
            models.MarketData.open,
            models.MarketData.high,
            models.MarketData.low,
            models.MarketData.close,
            models.MarketData.volume
        ).filter(
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