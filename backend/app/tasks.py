from .celery_app import celery_app
from .database import SessionLocal
from .services.backtest_engine import BacktestEngine
import sys
import math
import time
from . import utils 
from app.strategies import STRATEGY_MAP

# ✅ নতুন হেল্পার ফাংশন: NaN চেক করার জন্য
def clean_metric(value):
    try:
        if isinstance(value, (int, float)):
            if math.isnan(value) or math.isinf(value):
                return 0  # NaN বা Infinity হলে 0 রিটার্ন করবে
        return value
    except:
        return 0

# ✅ সুন্দর করে প্রিন্ট করার ফাংশন
def print_pretty_result(result):
    if result.get("status") != "success":
        print(f"❌ Backtest Failed: {result.get('message')}")
        return

    print("\n" + "="*50)
    print(f"🚀 BACKTEST RESULTS: {result['symbol']} ({result['strategy']})")
    print("="*50)
    print(f"💰 Initial Cash  : ${result['initial_cash']:,.2f}")
    print(f"🏁 Final Value   : ${result['final_value']:,.2f}")
    
    profit = result['profit_percent']
    color = "\033[92m" if profit >= 0 else "\033[91m" 
    reset = "\033[0m"
    
    print(f"📈 Profit/Loss   : {color}{profit}%{reset}")
    print(f"🔄 Total Trades  : {result['total_trades']}")
    
    metrics = result.get('advanced_metrics', {})
    print("-" * 30)
    print(f"📊 Win Rate      : {metrics.get('win_rate', 0)}%")
    print(f"📉 Max Drawdown  : {metrics.get('max_drawdown', 0)}%")
    print(f"⚖️ Sharpe Ratio  : {metrics.get('sharpe', 0)}")
    print("="*50 + "\n")

# টাস্কটি ব্যাকগ্রাউন্ডে রান হবে
@celery_app.task(bind=True)
def run_backtest_task(self, symbol: str, timeframe: str, strategy_name: str, initial_cash: float, params: dict, start_date: str = None, end_date: str = None, custom_data_file: str = None, commission: float = 0.001, slippage: float = 0.0):
    db = SessionLocal()
    engine = BacktestEngine()
    
    last_percent = -1
    def on_progress(percent):
        nonlocal last_percent
        if percent != last_percent:
            last_percent = percent
            self.update_state(
                state='PROGRESS',
                meta={'percent': percent, 'status': 'Running Strategy...'}
            )
            if percent % 10 == 0:
                print(f"⏳ Backtest Progress: {percent}%", flush=True)

    try:
        result = engine.run(
            db=db,
            symbol=symbol,
            timeframe=timeframe,
            strategy_name=strategy_name,
            initial_cash=initial_cash,
            params=params,
            start_date=start_date,
            end_date=end_date,
            custom_data_file=custom_data_file,
            progress_callback=on_progress,
            commission=commission,
            slippage=slippage
        )
        print_pretty_result(result)
        return result
        
    except Exception as e:
        import traceback
        print(f"❌ Backtest Error Traceback:\n{traceback.format_exc()}", flush=True)
        return {"status": "error", "message": str(e)}
        
    finally:
        db.close()

@celery_app.task(bind=True)
def run_optimization_task(self, symbol: str, timeframe: str, strategy_name: str, initial_cash: float, params: dict, start_date: str = None, end_date: str = None, method="grid", population_size=50, generations=10, commission: float = 0.001, slippage: float = 0.0):
    db = SessionLocal()
    engine = BacktestEngine()
    
    def on_progress(current, total):
        percent = int((current / total) * 100)
        bar_length = 30 
        filled_length = int(bar_length * current // total)
        bar = '█' * filled_length + '-' * (bar_length - filled_length)
        print(f"Optimization: |{bar}| {percent}% Complete ({current}/{total})", flush=True)

        if current == total:
            print() 

        self.update_state(
            state='PROGRESS',
            meta={
                'current': current,
                'total': total,
                'percent': percent,
                'status': 'Processing'
            }
        )

    def check_abort():
        try:
            r = utils.get_redis_client()
            if r.exists(f"abort_task:{self.request.id}"):
                return True
        except Exception:
            pass
        return False

    try:
        results = engine.optimize(
            db=db,
            symbol=symbol,
            timeframe=timeframe,
            strategy_name=strategy_name,
            initial_cash=initial_cash,
            params=params,
            start_date=start_date,
            end_date=end_date,
            method=method,
            population_size=population_size,
            generations=generations,
            progress_callback=on_progress,
            abort_callback=check_abort,
            commission=commission,
            slippage=slippage
        )
        
        try:
            r = utils.get_redis_client()
            r.delete(f"abort_task:{self.request.id}")
        except: pass

        return results
        
    except Exception as e:
        print(f"❌ Optimization Error: {e}", flush=True)
        return {"status": "error", "message": str(e)}
        
    finally:
        db.close()

@celery_app.task(bind=True)
def run_batch_backtest_task(self, symbol: str, timeframe: str, initial_cash: float, strategies: list = None, start_date: str = None, end_date: str = None, commission: float = 0.001, slippage: float = 0.0):
    db = SessionLocal()
    engine = BacktestEngine()
    
    results = []
    errors = []
    
    # ✅ ফিক্স: ফ্রন্টএন্ড থেকে পাঠানো স্ট্র্যাটেজি লিস্ট ব্যবহার করা হবে
    if strategies and len(strategies) > 0:
        # শুধু মাত্র ভ্যালিড স্ট্র্যাটেজিগুলো নেওয়া হবে যা আমাদের ম্যাপে আছে
        available_strategies = [s for s in strategies if s in STRATEGY_MAP]
        
        # যদি কোনো কারণে লিস্ট না মিলে, তবে সব রান করবে (ফলব্যাক)
        if not available_strategies:
            available_strategies = list(STRATEGY_MAP.keys())
    else:
        # কোনো লিস্ট না দিলে সব স্ট্র্যাটেজি রান হবে (স্ট্যান্ডার্ড + কাস্টম)
        available_strategies = list(STRATEGY_MAP.keys())

    total = len(available_strategies)
    
    print(f"🚀 Starting Batch Task for {total} strategies on {symbol}")

    for i, strategy_name in enumerate(available_strategies):
        # ১. প্রোগ্রেস ক্যালকুলেশন
        current_progress = int((i / total) * 100)
        
        # ২. কনসোলে প্রিন্ট
        print(f"🔄 [{i+1}/{total}] Testing {strategy_name}... ({current_progress}%)", flush=True)

        # ৩. Celery স্টেট আপডেট
        self.update_state(
            state='PROGRESS',
            meta={
                'current': i + 1,
                'total': total,
                'percent': current_progress,
                'status': f"Testing {strategy_name}..."
            }
        )
        
        time.sleep(0.1) 

        try:
            result = engine.run(
                db=db,
                symbol=symbol,
                timeframe=timeframe,
                strategy_name=strategy_name,
                initial_cash=initial_cash,
                params={}, 
                start_date=start_date,
                end_date=end_date,
                commission=commission,
                slippage=slippage
            )
            
            if result.get("status") == "error":
                errors.append({"strategy": strategy_name, "error": result.get("message", "Unknown error")})
            else:
                metrics = result.get('advanced_metrics', {})
                summary = {
                    "strategy": strategy_name,
                    "profit_percent": clean_metric(result.get("profit_percent")),
                    "total_trades": result["total_trades"],
                    "final_value": clean_metric(result.get("final_value")),
                    "win_rate": clean_metric(metrics.get('win_rate')),
                    "max_drawdown": clean_metric(metrics.get('max_drawdown')),
                    "sharpe_ratio": clean_metric(metrics.get('sharpe'))
                }
                results.append(summary)
                
        except Exception as e:
            print(f"❌ Batch Error for {strategy_name}: {e}")
            errors.append({"strategy": strategy_name, "error": str(e)})

    db.close()
    
    # ৫. প্রফিট অনুযায়ী সর্ট করা
    results.sort(key=lambda x: x['profit_percent'], reverse=True)
    
    print(f"✅ Batch Task Completed! Scanned {len(results)} strategies.")

    return {
        "status": "completed",
        "symbol": symbol,
        "total_tested": total,
        "results": results,
        "errors": errors
    }

import ccxt
import os
import csv
# time is already imported at top
from datetime import datetime
from .celery_app import celery_app
from celery import current_task
from tqdm import tqdm
from .utils import get_redis_client

DATA_FEED_DIR = "app/data_feeds"
os.makedirs(DATA_FEED_DIR, exist_ok=True)

# --- Helper: শেষ টাইমস্ট্যাম্প বের করার ফাংশন ---
def get_last_timestamp(file_path):
    try:
        if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
            return None
        with open(file_path, 'rb') as f:
            try:
                f.seek(-2, os.SEEK_END)
                while f.read(1) != b'\n':
                    f.seek(-2, os.SEEK_CUR)
            except OSError:
                f.seek(0)
            
            last_line = f.readline().decode().strip()
            if not last_line: return None
            data = last_line.split(',')
            
            if len(data) > 0:
                 try:
                    # আপনার CSV তে ডেট ফরম্যাট 'YYYY-MM-DD HH:MM:SS' হিসেবে সেভ হচ্ছে
                    dt_obj = datetime.strptime(data[0], "%Y-%m-%d %H:%M:%S")
                    return int(dt_obj.timestamp() * 1000)
                 except ValueError:
                    # যদি কোনো কারণে ফরম্যাট না মিলে
                    pass
    except Exception:
        return None
    return None

# ✅ Helper to safe parse date
def safe_parse_date(exchange, date_str):
    if not date_str: return None
    # 1. Try ccxt parse8601
    ts = exchange.parse8601(date_str)
    if ts is not None:
        return ts
    
    # 2. Try manual parsing if ccxt fails (e.g. "2024-01-01 00:00:00")
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
        return int(dt.timestamp() * 1000)
    except:
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            return int(dt.timestamp() * 1000)
        except:
            return None

# --- Task 1: Download Candles (OHLCV) ---
@celery_app.task(bind=True)
def download_candles_task(self, exchange_id, symbol, timeframe, start_date, end_date=None):
    try:
        if exchange_id not in ccxt.exchanges:
            return {"status": "failed", "error": f"Exchange {exchange_id} not found"}
            
        exchange_class = getattr(ccxt, exchange_id)
        exchange = exchange_class({
            'enableRateLimit': True,
            'userAgent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'timeout': 10000,
        })
        redis_client = get_redis_client()
        
        safe_symbol = symbol.replace('/', '-')
        filename = f"{exchange_id}_{safe_symbol}_{timeframe}.csv"
        save_path = f"{DATA_FEED_DIR}/{filename}"
        
        # ✅ ২. সময় ক্যালকুলেশন (FIXED)
        since = safe_parse_date(exchange, start_date)
        if since is None:
            return {"status": "failed", "error": f"Invalid start_date format: {start_date}"}
        
        if end_date:
            end_ts = safe_parse_date(exchange, end_date)
            if end_ts is None:
                return {"status": "failed", "error": f"Invalid end_date format: {end_date}"}
        else:
            end_ts = exchange.milliseconds()

        # ৩. রিজুউম লজিক
        if os.path.exists(save_path):
            with open(save_path, 'r') as f:
                lines = f.readlines()
                if len(lines) > 1:
                    last_line = lines[-1].strip().split(',')
                    try:
                        last_ts_obj = datetime.strptime(last_line[0], "%Y-%m-%d %H:%M:%S")
                        last_ts = int(last_ts_obj.timestamp() * 1000)
                        if last_ts:
                            since = last_ts + 1
                            print(f"🔄 Resuming {symbol} download from {last_line[0]}")
                    except: pass

        total_duration = end_ts - since
        if total_duration <= 0:
             return {"status": "completed", "message": "Data is already up to date."}

        start_ts = since
        mode = 'a' if os.path.exists(save_path) else 'w'
        
        print(f"🚀 Starting download: {symbol} ({timeframe}) | Target: {end_date or 'NOW'}")

        with open(save_path, mode, newline='') as f:
            writer = csv.writer(f)
            if mode == 'w' or os.path.getsize(save_path) == 0:
                writer.writerow(['datetime', 'open', 'high', 'low', 'close', 'volume'])
            
            with tqdm(total=total_duration, unit="ms", desc=f"📥 {symbol}", ncols=80) as pbar:
                while True:
                    # ✅ ১. স্টপ চেক: লুপের শুরুতে
                    if self.request.id and redis_client.exists(f"abort_task:{self.request.id}"):
                        print(f"🛑 Stop signal received via Redis for task {self.request.id}")
                        return {"status": "Revoked", "message": "Stopped by user"}

                    try:
                        if since >= end_ts: break

                        # ✅ ২. ফেচ করার সময় টাইমআউট সেট করুন যাতে এটি হ্যাং না হয়
                        exchange.timeout = 10000 # 10 seconds timeout
                        candles = exchange.fetch_ohlcv(symbol, timeframe, since, limit=1000)
                        
                        # ✅ ৩. স্টপ চেক: প্রসেসিং এর পরে আবার চেক
                        if self.request.id and redis_client.exists(f"abort_task:{self.request.id}"):
                             return {"status": "Revoked", "message": "Stopped by user"}
                        
                        if not candles: break
                        
                        rows = []
                        for c in candles:
                            if c[0] > end_ts: continue
                            dt_str = datetime.fromtimestamp(c[0]/1000).strftime('%Y-%m-%d %H:%M:%S')
                            rows.append([dt_str, c[1], c[2], c[3], c[4], c[5]])
                        
                        if rows:
                            writer.writerows(rows)
                            f.flush()
                        
                        current_ts = candles[-1][0]
                        step = current_ts - since
                        pbar.update(step)
                        since = current_ts + 1
                        
                        progress_pct = min(100, int(((current_ts - start_ts) / total_duration) * 100))
                        self.update_state(state='PROGRESS', meta={'percent': progress_pct, 'status': 'Downloading...'})
                        
                        if current_ts >= end_ts: break
                        
                    except Exception as e:
                        print(f"Fetch Error: {e}")
                        time.sleep(2) # এরর হলে একটু অপেক্ষা
                        continue

        return {"status": "completed", "filename": filename}

    except Exception as e:
        return {"status": "failed", "error": str(e)}

# --- Task 2: Download Trades (Tick Data) ---
@celery_app.task(bind=True)
def download_trades_task(self, exchange_id, symbol, start_date, end_date=None):
    try:
        if exchange_id not in ccxt.exchanges:
             return {"status": "failed", "error": f"Exchange {exchange_id} not found"}
        
        exchange_class = getattr(ccxt, exchange_id)
        exchange = exchange_class({
            'enableRateLimit': True,
            'userAgent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'timeout': 10000,
        })
        redis_client = get_redis_client() 
        
        safe_symbol = symbol.replace('/', '-')
        filename = f"trades_{exchange_id}_{safe_symbol}.csv"
        save_path = f"{DATA_FEED_DIR}/{filename}"
        
        # ✅ FIX: Safe parse
        since = safe_parse_date(exchange, start_date)
        if since is None:
            return {"status": "failed", "error": f"Invalid start_date format: {start_date}"}

        if end_date:
            end_ts = safe_parse_date(exchange, end_date)
        else:
            end_ts = exchange.milliseconds()

        if os.path.exists(save_path):
            last_ts = get_last_timestamp(save_path)
            if last_ts: 
                since = last_ts + 1
                print(f"🔄 Resuming Trades {symbol} from timestamp {last_ts}")
        
        total_duration = end_ts - since
        if total_duration <= 0:
             return {"status": "completed", "message": "Trades already up to date."}

        start_ts = since
        mode = 'a' if os.path.exists(save_path) else 'w'
        
        print(f"🚀 Starting Trade DL: {symbol} | Target: {end_date or 'NOW'}")

        with open(save_path, mode, newline='') as f:
            writer = csv.writer(f)
            if mode == 'w' or os.path.getsize(save_path) == 0:
                writer.writerow(['id', 'timestamp', 'datetime', 'symbol', 'side', 'price', 'amount', 'cost'])
            
            with tqdm(total=total_duration, unit="ms", desc=f"Tick {symbol}", ncols=80) as pbar:
                while True:
                    # ✅ ১. স্টপ চেক
                    if self.request.id and redis_client.exists(f"abort_task:{self.request.id}"):
                          return {"status": "Revoked", "message": "Stopped by user"}

                    try:
                        if since >= end_ts: break
                        
                        # ✅ ২. টাইমআউট
                        exchange.timeout = 10000 
                        trades = exchange.fetch_trades(symbol, since, limit=1000)
                        
                        # ✅ ৩. স্টপ চেক
                        if self.request.id and redis_client.exists(f"abort_task:{self.request.id}"):
                             return {"status": "Revoked", "message": "Stopped by user"}
                        
                        if not trades: break
                        
                        rows = []
                        for t in trades:
                            if t['timestamp'] > end_ts: continue
                            rows.append([t['id'], t['timestamp'], t['datetime'], t['symbol'], t['side'], t['price'], t['amount'], t['cost']])
                        
                        if rows:
                            writer.writerows(rows)
                            f.flush()
                        
                        current_ts = trades[-1]['timestamp']
                        step = current_ts - since
                        pbar.update(step)
                        since = current_ts + 1
                        
                        progress_pct = min(100, int(((current_ts - start_ts) / total_duration) * 100))
                        self.update_state(state='PROGRESS', meta={'percent': progress_pct, 'status': 'Fetching Trades...'})
                        
                        if current_ts >= end_ts: break
                        
                    except Exception as e:
                        print(f"Fetch Trades Error: {e}")
                        time.sleep(2)
                        continue
                    
        return {"status": "completed", "filename": filename}

    except Exception as e:
        return {"status": "failed", "error": str(e)}