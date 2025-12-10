import ccxt
import time
import pandas as pd
import pandas_ta as ta
from datetime import datetime
import asyncio
import json
import redis # ✅ Redis ইমপোর্ট
from app import models
from app.utils import get_redis_client
from app.core.config import settings

# ✅ Sync Redis Client (লগ পাঠানোর জন্য)
redis_log_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

class LiveBotEngine:
    def __init__(self, bot: models.Bot, db_session):
        self.bot = bot
        self.db = db_session
        self.symbol = bot.market
        self.timeframe = bot.timeframe
        self.redis = get_redis_client()
        
        # কনফিগারেশন লোড...
        self.config = bot.config or {}
        self.deployment_target = self.config.get('deploymentTarget', 'Spot').lower()
        if 'future' in self.deployment_target: self.deployment_target = 'future'
        self.trade_value = bot.trade_value or 100.0
        self.trade_unit = bot.trade_unit or "QUOTE"
        self.order_type = self.config.get('orderType', 'Market').lower()
        
        # Risk Params
        risk_params = self.config.get('riskParams', {})
        self.stop_loss_pct = float(risk_params.get('stopLoss', 0))
        self.take_profits = []
        raw_tp = risk_params.get('takeProfit')
        if isinstance(raw_tp, list):
            self.take_profits = sorted(raw_tp, key=lambda x: x['target'])
        elif raw_tp and float(raw_tp) > 0:
            self.take_profits = [{"target": float(raw_tp), "amount": 100}]

        # Position State
        self.position = { "amount": 0.0, "entry_price": 0.0, "tp_hits": [] }

        # Exchange Setup
        exchange_options = { 'enableRateLimit': True, 'options': {'defaultType': self.deployment_target} }
        self.exchange = ccxt.binance(exchange_options)

    # ✅ সেন্ট্রাল লগিং সিস্টেম (Redis দিয়ে)
    def log(self, message: str, type: str = "INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # ১. কনসোল লগ (Worker Terminal এর জন্য)
        print(f"[{type}] {self.symbol}: {message}", flush=True)

        # ২. রেডিস পাবলিস (Backend এর জন্য)
        log_payload = {
            "channel": f"logs_{self.bot.id}", # এই চ্যানেলে Backend লিসেন করবে
            "data": {
                "time": timestamp,
                "type": type,
                "message": message
            }
        }
        try:
            # 'bot_logs' নামক মেইন চ্যানেলে সব লগ পাঠানো হচ্ছে
            redis_log_client.publish("bot_logs", json.dumps(log_payload))
        except Exception as e:
            print(f"⚠️ Redis Publish Error: {e}")

    # ... (setup_futures_settings, fetch_market_data, check_strategy_signal, monitor_risk_management, execute_trade আগের মতোই থাকবে) ...
    # এখানে সংক্ষেপ করা হয়েছে, আপনি আপনার লজিকগুলো অপরিবর্তিত রাখুন

    def setup_futures_settings(self):
        if self.deployment_target == 'future':
            try:
                self.exchange.load_markets()
                try: self.exchange.set_margin_mode(self.margin_mode, self.symbol)
                except: pass
                try: self.exchange.set_leverage(self.leverage, self.symbol)
                except: pass
            except Exception: pass

    def fetch_market_data(self, limit=100):
        try:
            candles = self.exchange.fetch_ohlcv(self.symbol, self.timeframe, limit=limit)
            df = pd.DataFrame(candles, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            return df
        except Exception as e:
            self.log(f"Data Fetch Error: {e}", "ERROR")
            return None

    def check_strategy_signal(self, df):
        # ... (আপনার স্ট্র্যাটেজি লজিক এখানে থাকবে) ...
        # ডেমো হিসেবে RSI:
        df['rsi'] = ta.rsi(df['close'], length=14)
        rsi = df['rsi'].iloc[-1]
        if rsi < 30: return "BUY", f"RSI Oversold ({rsi:.2f})", df.iloc[-1]['close']
        return "HOLD", "", df.iloc[-1]['close']

    async def monitor_risk_management(self, current_price):
        # ... (আপনার রিস্ক লজিক) ...
        pass

    async def execute_trade(self, signal, price, reason, size_pct=100):
        # ... (আপনার ট্রেড লজিক) ...
        self.log(f"EXECUTING {signal} | {reason} | Price: {price}", "TRADE")
        return True

    async def run_loop(self):
        task_key = f"bot_task:{self.bot.id}"
        
        self.log(f"🚀 Bot {self.bot.name} Started on {self.symbol}", "SYSTEM")

        if self.deployment_target == 'future':
            try: self.exchange.load_markets() 
            except: pass

        while True:
            # স্টপ সিগনাল চেক
            if not self.redis.exists(task_key):
                self.log(f"🛑 Stopping Bot {self.bot.name}...", "SYSTEM")
                break

            try:
                # হার্টবিট লগ (যাতে ইউজার বুঝে বট চলছে)
                self.log(f"Waiting for next candle analysis...", "WAIT")

                df = self.fetch_market_data()
                if df is not None:
                    current_price = df.iloc[-1]['close']
                    
                    if self.position["amount"] <= 0:
                        signal, reason, _ = self.check_strategy_signal(df)
                        if signal == "BUY":
                            self.log(f"🔔 Buy Signal: {reason}", "TRADE")
                            await self.execute_trade("BUY", current_price, reason)
                    
                    if self.position["amount"] > 0:
                        await self.monitor_risk_management(current_price)

                await asyncio.sleep(5) 

            except Exception as e:
                self.log(f"Loop Error: {e}", "ERROR")
                await asyncio.sleep(5)
        
        self.log("Bot Stopped Successfully.", "SYSTEM")
