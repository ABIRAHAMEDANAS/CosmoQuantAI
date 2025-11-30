from .celery_app import celery_app
from .database import SessionLocal
from .services.backtest_engine import BacktestEngine
import sys
from . import utils # ✅ utils ইম্পোর্ট করুন

# টাস্কটি ব্যাকগ্রাউন্ডে রান হবে
@celery_app.task(bind=True)
def run_backtest_task(self, symbol: str, timeframe: str, strategy_name: str, initial_cash: float, params: dict, start_date: str = None, end_date: str = None, custom_data_file: str = None):
    # প্রতিটি টাস্কের জন্য নতুন ডিবি সেশন খুলতে হবে
    db = SessionLocal()
    engine = BacktestEngine()
    
    try:
        # ব্যাকটেস্ট ইঞ্জিন কল করা
        result = engine.run(
            db=db,
            symbol=symbol,
            timeframe=timeframe,
            strategy_name=strategy_name,
            initial_cash=initial_cash,
            params=params,
            start_date=start_date,
            end_date=end_date,
            custom_data_file=custom_data_file
        )
        return result
        
    except Exception as e:
        # এরর হলে সেটি রিটার্ন করা
        return {"status": "error", "message": str(e)}
        
    finally:
        db.close()

@celery_app.task(bind=True)
def run_optimization_task(self, symbol: str, timeframe: str, strategy_name: str, initial_cash: float, params: dict, start_date: str = None, end_date: str = None, method="grid", population_size=50, generations=10):
    db = SessionLocal()
    engine = BacktestEngine()
    
    # ✅ প্রগ্রেস আপডেট এবং টার্মিনালে প্রিন্ট করার ফাংশন
    def on_progress(current, total):
        percent = int((current / total) * 100)
        
        # বারের দৈর্ঘ্য (কতটি ক্যারেক্টার হবে)
        bar_length = 30 
        filled_length = int(bar_length * current // total)
        
        # বার তৈরি করা: █ ক্যারেক্টার দিয়ে পূর্ণ অংশ, - দিয়ে বাকি অংশ
        bar = '█' * filled_length + '-' * (bar_length - filled_length)
        
        # 🖥️ টার্মিনালে সুন্দর আউটপুট
        # \r ব্যবহার করা হয়নি কারণ Docker লগে এটি সবসময় ঠিকঠাক কাজ করে না, নতুন লাইনই নিরাপদ
        print(f"Optimization: |{bar}| {percent}% Complete ({current}/{total})", flush=True)

        if current == total:
            print() # কাজ শেষ হলে নতুন লাইন

        # ফ্রন্টএন্ডের জন্য স্টেট আপডেট
        self.update_state(
            state='PROGRESS',
            meta={
                'current': current,
                'total': total,
                'percent': percent,
                'status': 'Processing'
            }
        )

    # ✅ নতুন: অ্যাবর্ট চেক ফাংশন
    def check_abort():
        try:
            r = utils.get_redis_client()
            # যদি Redis এ এই টাস্ক আইডির ফ্ল্যাগ থাকে, তবে True রিটার্ন করো
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
            abort_callback=check_abort # ✅ কলব্যাক পাঠানো হলো
        )
        
        # কাজ শেষে বা মাঝপথে থামলে ফ্ল্যাগ ক্লিনআপ
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
