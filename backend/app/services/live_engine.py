import ccxt
import time
import pandas as pd
import pandas_ta as ta
from datetime import datetime
import asyncio
import json

from app.services.websocket_manager import manager
from app import models
from app.utils import get_redis_client

class LiveBotEngine:
    def __init__(self, bot: models.Bot, db_session):
        self.bot = bot
        self.db = db_session
        self.symbol = bot.market
        self.timeframe = bot.timeframe
        self.redis = get_redis_client()
        
        # ১. কনফিগারেশন লোড করা
        self.config = bot.config or {}
        
        self.deployment_target = self.config.get('deploymentTarget', 'Spot').lower()
        if 'future' in self.deployment_target: self.deployment_target = 'future'

        self.trade_value = bot.trade_value or 100.0
        self.trade_unit = bot.trade_unit or "QUOTE"
        self.order_type = self.config.get('orderType', 'Market').lower()
        
        # Futures Configs
        self.leverage = int(self.config.get('riskParams', {}).get('leverage', 1))
        self.margin_mode = self.config.get('riskParams', {}).get('marginMode', 'ISOLATED').upper()

        # ✅ Risk Management Configs
        risk_params = self.config.get('riskParams', {})
        self.stop_loss_pct = float(risk_params.get('stopLoss', 0)) # যেমন 2%
        
        # Take Profit কনফিগারেশন হ্যান্ডলিং (Single বা Multiple/Partial)
        self.take_profits = []
        raw_tp = risk_params.get('takeProfit') # এটা হতে পারে নাম্বার বা লিস্ট
        
        if isinstance(raw_tp, list):
            # যদি ইউজার অ্যাডভান্সড পার্শিয়াল টিপি সেট করে
            # Format: [{ "target": 5, "amount": 50 }, { "target": 10, "amount": 100 }]
            self.take_profits = sorted(raw_tp, key=lambda x: x['target'])
        elif raw_tp and float(raw_tp) > 0:
            # যদি সিম্পল একটা টিপি দেয় (Standard) -> 100% সেল
            self.take_profits = [{"target": float(raw_tp), "amount": 100}]

        # ✅ Position Tracking State (মেমোরিতে রাখা হচ্ছে, রিয়েল লাইফে ডাটাবেস/রেডিসে রাখা উচিত)
        self.position = {
            "amount": 0.0,      # কতগুলো কয়েন কেনা আছে
            "entry_price": 0.0, # কেনা দাম কত
            "tp_hits": []       # কোন কোন টিপি অলরেডি হিট করেছে
        }

        # এক্সচেঞ্জ সেটআপ (API Key ছাড়া পাবলিক ডাটার জন্য, ট্রেডের জন্য কী লাগবে)
        exchange_options = {
            'enableRateLimit': True,
            'options': {'defaultType': self.deployment_target} 
        }
        # if bot.api_key_id: ... (API Key setup code)
        self.exchange = ccxt.binance(exchange_options)

    # ✅ Helper Methods for Smart Waiting
    def _get_timeframe_seconds(self):
        """Convert timeframe string to seconds."""
        tf = self.timeframe
        if tf.endswith('m'): return int(tf[:-1]) * 60
        if tf.endswith('h'): return int(tf[:-1]) * 3600
        if tf.endswith('d'): return int(tf[:-1]) * 86400
        return 60 # default 1m

    def _calculate_sleep_seconds(self):
        """Calculate seconds until next candle close."""
        now = datetime.now()
        timestamp = now.timestamp()
        tf_seconds = self._get_timeframe_seconds()
        
        # Next candle time = (Current Time // Timeframe) * Timeframe + Timeframe
        next_candle_timestamp = ((timestamp // tf_seconds) + 1) * tf_seconds
        
        sleep_seconds = next_candle_timestamp - timestamp
        return max(0, sleep_seconds)

    async def _wait_for_next_candle(self):
        """
        Wait until the next candle close, but print heartbeat logs every 10-15 seconds.
        Returns False if stopped during wait, True otherwise.
        """
        sleep_seconds = self._calculate_sleep_seconds()
        
        # If successfully waited for most of the time, we return True
        # If sleep_seconds is very small (e.g. < 5s), we just wait and return
        if sleep_seconds < 5:
            await asyncio.sleep(sleep_seconds)
            return True

        print(f"⏳ {self.bot.name} is monitoring... (Next candle in {int(sleep_seconds)}s)")
        
        while sleep_seconds > 0:
            # Check for stop signal via Redis
            task_key = f"bot_task:{self.bot.id}"
            if not self.redis.exists(task_key):
                return False

            # If we have a position, we SHOULD NOT wait long. 
            # We should return immediately to let the main loop check Risk Management.
            if self.position["amount"] > 0:
                # We do a short sleep to prevent CPU spin, then return True to allow loop to proceed
                await asyncio.sleep(5) 
                return True

            wait_chunk = min(sleep_seconds, 15) # Max wait 15s for heartbeat
            await asyncio.sleep(wait_chunk)
            
            sleep_seconds -= wait_chunk
            if sleep_seconds > 1: # Only print if meaningful time left
                print(f"⏳ {self.bot.name} is monitoring... (Next check in {int(sleep_seconds)}s)")
                
        return True

    def setup_futures_settings(self):
        """ফিউচার্স ট্রেডিংয়ের জন্য লিভারেজ এবং মার্জিন মোড সেট করে।"""
        if self.deployment_target == 'future':
            try:
                self.exchange.load_markets()
                print(f"⚙️ Configuring Futures for {self.symbol}...")
                try:
                    self.exchange.set_margin_mode(self.margin_mode, self.symbol)
                except Exception: pass
                try:
                    self.exchange.set_leverage(self.leverage, self.symbol)
                except Exception: pass
            except Exception as e:
                print(f"❌ Error configuring futures settings: {e}")

    def fetch_market_data(self, limit=100):
        try:
            candles = self.exchange.fetch_ohlcv(self.symbol, self.timeframe, limit=limit)
            df = pd.DataFrame(candles, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            return df
        except Exception as e:
            print(f"❌ Data Fetch Error: {e}")
            return None

    def check_strategy_signal(self, df):
        strategy_name = self.bot.strategy
        last_row = df.iloc[-1]
        
        signal = "HOLD"
        reason = ""

        # --- A. RSI Strategy ---
        if "RSI" in strategy_name:
            # Dynamic Params ব্যবহার করা (যদি থাকে)
            params = self.config.get('strategyParams', {})
            rsi_period = int(params.get('period', 14))
            rsi_upper = int(params.get('overbought', 70))
            rsi_lower = int(params.get('oversold', 30))

            df['rsi'] = ta.rsi(df['close'], length=rsi_period)
            current_rsi = df['rsi'].iloc[-1]
            
            if current_rsi < rsi_lower:
                signal = "BUY"
                reason = f"RSI Oversold ({current_rsi:.2f})"
            elif current_rsi > rsi_upper:
                signal = "SELL"
                reason = f"RSI Overbought ({current_rsi:.2f})"

        # --- B. SMA Crossover ---
        elif "SMA" in strategy_name:
            params = self.config.get('strategyParams', {})
            fast_p = int(params.get('fast_period', 9))
            slow_p = int(params.get('slow_period', 21))

            df['sma_fast'] = ta.sma(df['close'], length=fast_p)
            df['sma_slow'] = ta.sma(df['close'], length=slow_p)
            
            if df['sma_fast'].iloc[-2] < df['sma_slow'].iloc[-2] and df['sma_fast'].iloc[-1] > df['sma_slow'].iloc[-1]:
                signal = "BUY"
                reason = "SMA Golden Cross"
            elif df['sma_fast'].iloc[-2] > df['sma_slow'].iloc[-2] and df['sma_fast'].iloc[-1] < df['sma_slow'].iloc[-1]:
                signal = "SELL"
                reason = "SMA Death Cross"
        
        # --- C. Bollinger Bands ---
        elif "Bollinger" in strategy_name:
            params = self.config.get('strategyParams', {})
            period = int(params.get('period', 20))
            std_dev = float(params.get('std_dev', 2.0))

            bb = ta.bbands(df['close'], length=period, std=std_dev)
            lower_col = f'BBL_{period}_{std_dev}'
            upper_col = f'BBU_{period}_{std_dev}'
            
            # নাম ঠিক করার জন্য Fallback (pandas_ta কলামের নাম ভিন্ন হতে পারে)
            if lower_col not in bb.columns:
                lower_col = bb.columns[0]
                upper_col = bb.columns[2]

            lower_band = bb[lower_col]
            upper_band = bb[upper_col]
            
            if df['close'].iloc[-1] < lower_band.iloc[-1]:
                signal = "BUY"
                reason = "Price below Lower BB"
            elif df['close'].iloc[-1] > upper_band.iloc[-1]:
                signal = "SELL"
                reason = "Price above Upper BB"

        return signal, reason, last_row['close']

    # ✅ নতুন: রিস্ক ম্যানেজমেন্ট মনিটর (প্রতিটি প্রাইস আপডেটে কল হবে)
    async def monitor_risk_management(self, current_price):
        if self.position["amount"] <= 0:
            return # কোনো পজিশন নেই, চেক করার দরকার নেই

        entry_price = self.position["entry_price"]
        pnl_pct = ((current_price - entry_price) / entry_price) * 100
        
        # ১. Stop Loss Check
        if self.stop_loss_pct > 0 and pnl_pct <= -self.stop_loss_pct:
            print(f"🛑 STOP LOSS HIT at {current_price} ({pnl_pct:.2f}%)")
            await self.execute_trade("SELL", current_price, "Stop Loss Triggered", size_pct=100)
            return

        # ২. Take Profit Check (Partial / Full)
        for i, tp in enumerate(self.take_profits):
            # যদি এই টিপি আগে হিট না করে থাকে এবং প্রাইস টার্গেটে পৌঁছায়
            if i not in self.position["tp_hits"] and pnl_pct >= tp["target"]:
                print(f"🎯 TAKE PROFIT {i+1} HIT at {current_price} ({pnl_pct:.2f}%)")
                
                # পার্শিয়াল সেল এক্সিকিউট করা
                await self.execute_trade("SELL", current_price, f"TP-{i+1} Hit ({tp['target']}%)", size_pct=tp['amount'])
                
                # এই টিপি মার্ক করে রাখা যাতে বারবার সেল না হয়
                self.position["tp_hits"].append(i)

    # ✅ আপডেটেড: execute_trade মেথড (Position State আপডেট সহ)
    async def execute_trade(self, signal, price, reason, size_pct=100):
        try:
            side = 'buy' if signal == "BUY" else 'sell'
            
            # লিমিট প্রাইস লজিক (শুধুমাত্র এন্ট্রির জন্য)
            execution_price = price
            if signal == "BUY" and self.order_type == 'limit' and self.config.get('limitPrice'):
                execution_price = float(self.config['limitPrice'])

            # এমাউন্ট ক্যালকুলেশন
            trade_amount = 0.0
            
            if signal == "BUY":
                # এন্ট্রি লজিক: কনফিগারেশন অনুযায়ী কেনা
                if self.trade_unit == "QUOTE": 
                    trade_amount = self.trade_value / execution_price
                else: 
                    trade_amount = self.trade_value
            
            elif signal == "SELL":
                # এক্সিট লজিক: বর্তমান পজিশনের ওপর ভিত্তি করে সেল
                # size_pct হলো কত শতাংশ বেচতে হবে (Partial TP এর জন্য)
                trade_amount = self.position["amount"] * (size_pct / 100)

            # ফিউচার্স সিমুলেশন লগ
            if self.deployment_target == 'future':
                pass 

            print(f"⚡ EXECUTING {self.order_type.upper()} {side.upper()} | Size: {trade_amount:.6f} | Price: {execution_price}")

            # --- State Update (Memory) ---
            if signal == "BUY":
                # পজিশন আপডেট (Simple adding, বাস্তবে Average Entry Price হিসাব করা উচিত)
                self.position["amount"] += trade_amount
                self.position["entry_price"] = execution_price # শেষ এন্ট্রি প্রাইস ধরা হচ্ছে
                self.position["tp_hits"] = [] # নতুন ট্রেড, তাই টিপি রিসেট
                print(f"📈 Position Opened/Added: {self.position['amount']:.6f} @ {self.position['entry_price']}")

            elif signal == "SELL":
                self.position["amount"] -= trade_amount
                if self.position["amount"] < 0: self.position["amount"] = 0 # Safety
                
                remaining_pct = (self.position["amount"] * execution_price / self.trade_value) * 100 if self.trade_value else 0
                print(f"📉 Position Reduced. Remaining: {self.position['amount']:.6f}")
                
                if self.position["amount"] <= 0.00001: # পজিশন খালি হয়ে গেলে রিসেট
                     print("✅ Position Fully Closed.")
                     self.position["amount"] = 0
                     self.position["tp_hits"] = []

            # --- Real CCXT Order (Commented) ---
            # if self.exchange.apiKey: ...
            
            return True

        except Exception as e:
            print(f"❌ Trade Execution Failed: {e}")
            return False

    async def run_loop(self):
        task_key = f"bot_task:{self.bot.id}"
        print(f"🚀 Bot {self.bot.name} started on {self.symbol} [{self.deployment_target}]")
        
        if self.deployment_target == 'future':
            self.setup_futures_settings()

        await manager.broadcast_to_symbol(f"bot_{self.bot.id}", {"status": "active", "message": "Engine Started"})

        while True:
            # 1. Check Stop Signal
            if not self.redis.exists(task_key):
                print(f"🛑 Stopping Bot {self.bot.name}...")
                break

            try:
                # 2. Smart Wait (Heartbeat & Candle Sync)
                # If we have a position, _wait_for_next_candle returns quickly (every 5s)
                # If no position, it waits for next candle with 15s heartbeat logs
                should_continue = await self._wait_for_next_candle()
                if not should_continue:
                    break

                # 3. Data Fetch
                df = self.fetch_market_data()
                if df is not None:

                    # ১. স্ট্র্যাটেজি সিগন্যাল চেক (শুধুমাত্র নতুন এন্ট্রির জন্য)
                    # যদি পজিশন খালি থাকে তবেই বাই সিগন্যাল খুঁজবে (সিম্পল লজিক)
                    if self.position["amount"] <= 0:
                        signal, reason, current_price = self.check_strategy_signal(df)
                        if signal == "BUY":
                            log_msg = f"🔔 Buy Signal: {reason}"
                            # Removed duplicate print because 'log' method handles it.
                            await self.log(log_msg, "TRADE")
                            await self.execute_trade("BUY", current_price, reason)
                    else:
                        # পজিশন থাকলে কারেন্ট প্রাইস আপডেট নেওয়া
                        current_price = df.iloc[-1]['close']

                    # ২. রিস্ক ম্যানেজমেন্ট মনিটর (সবসময় চলবে যদি পজিশন থাকে)
                    await self.monitor_risk_management(df.iloc[-1]['close'])

                    # ৩. লাইভ স্ট্যাটাস ব্রডকাস্ট
                    pnl_val = (df.iloc[-1]['close'] - self.position["entry_price"]) * self.position["amount"] if self.position["amount"] > 0 else 0
                    
                    update_payload = {
                        "bot_id": self.bot.id,
                        "price": df.iloc[-1]['close'],
                        "pnl": self.bot.pnl + pnl_val, # Cumulative + Unrealized
                        "signal": "HOLD" if self.position["amount"] > 0 else "WAIT",
                        "timestamp": datetime.now().isoformat()
                    }
                    await manager.broadcast(update_payload, "bot_updates")

                # Loop delay is handled by _wait_for_next_candle, 
                # but if we skipped it or just processed, a small sleep is good safety
                # (Removed explicit asyncio.sleep(5) because _wait_for_next_candle handles timing)
                if self.position["amount"] > 0:
                     pass # Risk management needs speed.

            except Exception as e:
                err_msg = f"❌ Bot Loop Error: {e}"
                print(err_msg)
                await self.log(err_msg, "ERROR")
                await asyncio.sleep(5)
        
        stop_msg = f"🛑 Bot {self.bot.name} Stopped."
        await self.log(stop_msg, "INFO")
        
        # Send final status update to Redis/WS
        status_payload = {"status": "stopped", "bot_id": self.bot.id}
        await manager.broadcast(status_payload, "bot_updates")
        # Also publish status to Redis for cross-process awareness if needed
        self.redis.publish("bot_updates", json.dumps(status_payload))

    async def log(self, message: str, type: str = "INFO"):
        """Publish logs to Redis instead of direct WebSocket manager"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # ১. কনসোল লগ (Worker Terminal এ দেখাবে)
        print(f"[{type}] {self.bot.name}: {message}", flush=True)

        # ২. রেডিস পাবলিস (Backend এর জন্য)
        log_payload = {
            "channel": f"logs_{self.bot.id}",
            "data": {
                "time": timestamp,
                "type": type,
                "message": message
            }
        }
        try:
            # 'bot_logs' নামক গ্লোবাল চ্যানেলে পাঠাচ্ছি
            self.redis.publish("bot_logs", json.dumps(log_payload))
        except Exception as e:
            print(f"⚠️ Redis Publish Error: {e}")
