import ccxt
import time
import json
from datetime import datetime
from app.services.websocket_manager import manager
from app import models
from app.utils import get_redis_client
import asyncio

class LiveBotEngine:
    def __init__(self, bot: models.Bot, db_session):
        self.bot = bot
        self.db = db_session
        self.symbol = bot.market
        self.timeframe = bot.timeframe
        self.exchange_id = "binance"  # ডিফল্ট, আপনি চাইলে বটের কনফিগ থেকে নিতে পারেন
        self.redis = get_redis_client()
        
        # CCXT এক্সচেঞ্জ ইনিশিয়ালাইজেশন (পাবলিক ডাটার জন্য)
        # রিয়েল ট্রেডিং-এর জন্য এখানে API Key/Secret লাগবে
        self.exchange = getattr(ccxt, self.exchange_id)({
            'enableRateLimit': True,
            'options': {'defaultType': 'spot'}
        })

    async def run_loop(self):
        """
        এটি বটের মেইন লুপ। এটি প্রতি পিরিয়ডে মার্কেট চেক করবে।
        """
        task_key = f"bot_task:{self.bot.id}"
        print(f"🚀 Bot {self.bot.name} started on {self.symbol}")
        
        # ফ্রন্টএন্ডে স্ট্যাটাস আপডেট পাঠানো
        await manager.broadcast_to_symbol(f"bot_{self.bot.id}", {
            "status": "active", 
            "message": "Bot Engine Started"
        })

        while True:
            # ১. স্টপ সিগন্যাল চেক করা (Redis থেকে)
            if not self.redis.exists(task_key):
                print(f"🛑 Stopping Bot {self.bot.name}...")
                break

            try:
                # ২. লাইভ প্রাইস আনা (Ticker)
                # Note: fetch_ticker is blocking in non-async ccxt, but we are in async function.
                # To keep it simple as per request, we are calling it directly. 
                # Ideally, run_in_executor or async ccxt should be used.
                ticker = self.exchange.fetch_ticker(self.symbol)
                current_price = ticker['last']
                
                # ৩. PnL সিমুলেশন (আসল লজিক বা স্ট্র্যাটেজি এখানে বসবে)
                # আপাতত ডেমো হিসেবে রেন্ডম PnL আপডেট করছি
                simulated_pnl = self.bot.pnl + (current_price * 0.0001)  # ডামি লজিক
                self.bot.pnl = simulated_pnl
                self.bot.pnl_percent = (simulated_pnl / self.bot.initial_capital) * 100
                self.db.commit()

                # ৪. ফ্রন্টএন্ডে লাইভ আপডেট পাঠানো (WebSocket)
                update_payload = {
                    "bot_id": self.bot.id,
                    "price": current_price,
                    "pnl": self.bot.pnl,
                    "pnl_percent": self.bot.pnl_percent,
                    "timestamp": datetime.now().isoformat()
                }
                
                # Websocket এর মাধ্যমে ডাটা পাঠানো
                await manager.broadcast_to_symbol(f"bot_updates", update_payload)
                
                # ৫. কনসোল লগ
                print(f"✅ {self.bot.name}: Price {current_price} | PnL {self.bot.pnl:.2f}")

                # ৬. বিরতি (Timeframe অনুযায়ী বা ফিক্সড ১০ সেকেন্ড)
                await asyncio.sleep(5) 

            except Exception as e:
                print(f"❌ Error in Bot Loop: {e}")
                await asyncio.sleep(5)
        
        # লুপ ব্রেক হলে স্ট্যাটাস আপডেট
        await manager.broadcast_to_symbol(f"bot_{self.bot.id}", {"status": "stopped"})
