import ccxt
import time
import pandas as pd
import pandas_ta as ta  # টেকনিক্যাল অ্যানালাইসিসের জন্য (pip install pandas_ta)
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
        self.trade_value = bot.trade_value or 100.0
        self.trade_unit = bot.trade_unit or "QUOTE" # 'QUOTE' (USDT) or 'ASSET' (BTC)
        self.order_type = self.config.get('orderType', 'Market').lower()
        self.deployment_target = self.config.get('deploymentTarget', 'Spot').lower()
        
        # ২. এক্সচেঞ্জ সেটআপ (API Key ছাড়া পাবলিক ডাটার জন্য, ট্রেডের জন্য কী লাগবে)
        # TODO: রিয়েল ট্রেডিং এর জন্য এখানে User এর API Key ডিক্রিপ্ট করে লোড করতে হবে
        # আপাতত পাবলিক ডাটা দিয়ে লজিক চেক করা হচ্ছে
        self.exchange = ccxt.binance({
            'enableRateLimit': True,
            'options': {'defaultType': self.deployment_target} # Spot or Future
        })

    def fetch_market_data(self, limit=100):
        """
        লাইভ ক্যান্ডেল ডাটা নিয়ে এসে DataFrame এ কনভার্ট করে
        """
        try:
            candles = self.exchange.fetch_ohlcv(self.symbol, self.timeframe, limit=limit)
            df = pd.DataFrame(candles, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            return df
        except Exception as e:
            print(f"❌ Data Fetch Error: {e}")
            return None

    def check_strategy_signal(self, df):
        """
        ডাটাফ্রেমের ওপর স্ট্র্যাটেজি চালিয়ে সিগন্যাল বের করে
        """
        strategy_name = self.bot.strategy
        last_row = df.iloc[-1]
        prev_row = df.iloc[-2]
        
        signal = "HOLD"
        reason = ""

        # --- A. RSI Strategy ---
        if "RSI" in strategy_name:
            # RSI ক্যালকুলেশন ( ডিফল্ট ১৪ পিরিয়ড)
            df['rsi'] = ta.rsi(df['close'], length=14)
            current_rsi = df['rsi'].iloc[-1]
            
            # শর্ত: RSI < 30 হলে BUY, RSI > 70 হলে SELL
            if current_rsi < 30:
                signal = "BUY"
                reason = f"RSI Oversold ({current_rsi:.2f})"
            elif current_rsi > 70:
                signal = "SELL"
                reason = f"RSI Overbought ({current_rsi:.2f})"

        # --- B. SMA Crossover ---
        elif "SMA" in strategy_name:
            df['sma_fast'] = ta.sma(df['close'], length=9)
            df['sma_slow'] = ta.sma(df['close'], length=21)
            
            # গোল্ডেন ক্রস চেক
            if df['sma_fast'].iloc[-2] < df['sma_slow'].iloc[-2] and df['sma_fast'].iloc[-1] > df['sma_slow'].iloc[-1]:
                signal = "BUY"
                reason = "SMA Golden Cross"
            # ডেথ ক্রস চেক
            elif df['sma_fast'].iloc[-2] > df['sma_slow'].iloc[-2] and df['sma_fast'].iloc[-1] < df['sma_slow'].iloc[-1]:
                signal = "SELL"
                reason = "SMA Death Cross"

        # --- C. Bollinger Bands ---
        elif "Bollinger" in strategy_name:
            bb = ta.bbands(df['close'], length=20, std=2)
            # কলাম নাম সাধারণত: BBL_20_2.0, BBM_20_2.0, BBU_20_2.0
            lower_band = bb[f'BBL_20_2.0']
            upper_band = bb[f'BBU_20_2.0']
            
            if df['close'].iloc[-1] < lower_band.iloc[-1]:
                signal = "BUY"
                reason = "Price below Lower BB"
            elif df['close'].iloc[-1] > upper_band.iloc[-1]:
                signal = "SELL"
                reason = "Price above Upper BB"

        return signal, reason, last_row['close']

    async def execute_trade(self, signal, price, reason):
        """
        সিগন্যাল অনুযায়ী অর্ডার প্লেস করা (সিমুলেশন + রিয়েল লজিক)
        """
        # ১. এমাউন্ট ক্যালকুলেশন
        amount = 0
        if self.trade_unit == "QUOTE": # যেমন 100 USDT
            amount = self.trade_value / price
        else: # যেমন 0.01 BTC
            amount = self.trade_value

        # ২. অর্ডার তৈরি (Mock/Simulation)
        # রিয়েল এপিআই কল: order = self.exchange.create_order(self.symbol, self.order_type, side, amount, price)
        
        print(f"⚡ EXECUTING {self.order_type.upper()} {signal}: {amount:.6f} {self.symbol} @ {price}")
        
        # ৩. ডাটাবেস আপডেট (PnL ট্র্যাকিং এর জন্য এন্ট্রি পয়েন্ট সেভ করা দরকার)
        # আপাতত আমরা শুধু PnL সিমুলেট করছি
        return True

    async def run_loop(self):
        task_key = f"bot_task:{self.bot.id}"
        print(f"🚀 Bot {self.bot.name} started on {self.symbol} [{self.deployment_target}]")
        
        await manager.broadcast_to_symbol(f"bot_{self.bot.id}", {"status": "active", "message": "Engine Started"})

        while True:
            # স্টপ সিগন্যাল চেক
            if not self.redis.exists(task_key):
                print(f"🛑 Stopping Bot {self.bot.name}...")
                break

            try:
                # ১. ডাটা আনা
                df = self.fetch_market_data()
                if df is not None:
                    # ২. স্ট্র্যাটেজি চেক
                    signal, reason, current_price = self.check_strategy_signal(df)
                    
                    # ৩. ট্রেড এক্সিকিউশন
                    if signal in ["BUY", "SELL"]:
                        print(f"🔔 Signal Found: {signal} | Reason: {reason}")
                        await self.execute_trade(signal, current_price, reason)
                        
                        # PnL আপডেট (ডেমো হিসেবে সামান্য পরিবর্তন)
                        if signal == "BUY":
                            # ফি এবং স্লিপেজ বাদ দিয়ে ক্যালকুলেশন হবে
                            pass 

                    # ৪. লাইভ স্ট্যাটাস আপডেট (WebSocket)
                    # ডেমো PnL (রিয়েল ভ্যালু পরে পজিশন থেকে আসবে)
                    simulated_pnl = self.bot.pnl + (current_price * 0.00001) if signal == "HOLD" else self.bot.pnl
                    
                    update_payload = {
                        "bot_id": self.bot.id,
                        "price": current_price,
                        "pnl": simulated_pnl,
                        "signal": signal,
                        "timestamp": datetime.now().isoformat()
                    }
                    await manager.broadcast_to_symbol(f"bot_updates", update_payload)
                    
                    print(f"✅ {self.bot.name}: {current_price} | {signal}")

                # Timeframe অনুযায়ী অপেক্ষা (অথবা ফিক্সড ৫ সেকেন্ড)
                await asyncio.sleep(10) 

            except Exception as e:
                print(f"❌ Bot Loop Error: {e}")
                await asyncio.sleep(10)
        
        await manager.broadcast_to_symbol(f"bot_{self.bot.id}", {"status": "stopped"})
