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
        
        # Deployment Target এবং Risk Params পার্স করা
        raw_target = self.config.get('deploymentTarget', 'Spot').lower()
        # ccxt তে সাধারণত 'future' বা 'swap' ব্যবহার হয়, কিন্তু ফ্রন্টএন্ড 'futures' পাঠাতে পারে
        self.deployment_target = 'future' if 'future' in raw_target else raw_target
        
        self.trade_value = bot.trade_value or 100.0
        self.trade_unit = bot.trade_unit or "QUOTE"
        self.order_type = self.config.get('orderType', 'Market').lower()
        
        # Futures Specific Configs (Defaults)
        self.leverage = int(self.config.get('riskParams', {}).get('leverage', 1)) # Default 1x
        self.margin_mode = self.config.get('riskParams', {}).get('marginMode', 'ISOLATED').upper() # ISOLATED / CROSSED

        # ২. এক্সচেঞ্জ ইনিশিয়ালাইজেশন
        exchange_options = {
            'enableRateLimit': True,
            'options': {'defaultType': self.deployment_target} 
        }
        
        # TODO: প্রোডাকশনে রিয়েল API Key এবং Secret ডিক্রিপ্ট করে এখানে বসাতে হবে
        # if bot.api_key_id:
        #     api_key_data = get_api_key(bot.api_key_id)
        #     exchange_options['apiKey'] = api_key_data.key
        #     exchange_options['secret'] = api_key_data.secret

        self.exchange = ccxt.binance(exchange_options)

    def setup_futures_settings(self):
        """
        ফিউচার্স ট্রেডিংয়ের জন্য লিভারেজ এবং মার্জিন মোড সেট করে।
        এটি লুপ শুরু হওয়ার আগে একবার কল করা উচিত।
        """
        if self.deployment_target == 'future':
            try:
                # মার্কেট লোড করা জরুরি
                self.exchange.load_markets()
                
                print(f"⚙️ Configuring Futures for {self.symbol}...")
                
                # ১. মার্জিন মোড সেট করা (ISOLATED / CROSSED)
                try:
                    self.exchange.set_margin_mode(self.margin_mode, self.symbol)
                    print(f"✅ Margin Mode set to {self.margin_mode}")
                except Exception as e:
                    print(f"⚠️ Failed to set Margin Mode: {e}")

                # ২. লিভারেজ সেট করা
                try:
                    self.exchange.set_leverage(self.leverage, self.symbol)
                    print(f"✅ Leverage set to {self.leverage}x")
                except Exception as e:
                    print(f"⚠️ Failed to set Leverage: {e}")

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

    async def execute_trade(self, signal, price, reason):
        """
        সিগন্যাল অনুযায়ী অর্ডার প্লেস করা (Market vs Limit Logic)
        """
        try:
            side = 'buy' if signal == "BUY" else 'sell'
            
            # ✅ ১. লিমিট প্রাইস নির্ধারণ
            # ডিফল্ট হিসেবে কারেন্ট প্রাইস (price) নেওয়া হবে
            execution_price = price
            
            # যদি ইউজার ম্যানুয়ালি ফিক্সড প্রাইস দিয়ে থাকে এবং অর্ডার টাইপ Limit হয়
            if self.order_type == 'limit' and self.config.get('limitPrice'):
                execution_price = float(self.config['limitPrice'])
                print(f"🎯 Using Manual Limit Price: {execution_price}")

            amount = 0
            # এমাউন্ট ক্যালকুলেশন (execution_price ব্যবহার করে)
            if self.trade_unit == "QUOTE": 
                amount = self.trade_value / execution_price
            else: 
                amount = self.trade_value

            # Futures leverage handling...
            if self.deployment_target == 'future':
                # effective_amount calculation (log only)
                pass

            print(f"⚡ PREPARING {self.order_type.upper()} {side.upper()} ORDER")
            print(f"   Symbol: {self.symbol} | Amount: {amount:.6f} | Price: {execution_price}")

            params = {}
            if self.deployment_target == 'future':
                pass

            # অর্ডার এক্সিকিউশন সিমুলেশন/রিয়েল
            """
            if self.exchange.apiKey:
                if self.order_type == 'market':
                    order = self.exchange.create_order(self.symbol, 'market', side, amount, params=params)
                elif self.order_type == 'limit':
                    # ✅ এখানে execution_price ব্যবহার করা হচ্ছে
                    order = self.exchange.create_order(self.symbol, 'limit', side, amount, execution_price, params=params)
                print(f"✅ Order Placed: {order['id']}")
            else:
                print("🔸 Simulation Mode: Order skipped (No API Key)")
            """

            # লগ আপডেট
            action_msg = f"Executed {self.order_type.upper()} {side.upper()}"
            if self.order_type == 'limit':
                action_msg += f" @ {execution_price}"
            else:
                action_msg += " (Market Price)"
            
            print(f"✅ {action_msg} | Size: {amount:.6f} | Reason: {reason}")
            
            return True

        except Exception as e:
            print(f"❌ Trade Execution Failed: {e}")
            return False

    async def run_loop(self):
        task_key = f"bot_task:{self.bot.id}"
        print(f"🚀 Bot {self.bot.name} started on {self.symbol} [{self.deployment_target}]")
        
        # ১. ফিউচার্স হলে সেটিংস কনফিগার করা
        if self.deployment_target == 'future':
            self.setup_futures_settings()

        await manager.broadcast_to_symbol(f"bot_{self.bot.id}", {"status": "active", "message": "Engine Started"})

        while True:
            if not self.redis.exists(task_key):
                print(f"🛑 Stopping Bot {self.bot.name}...")
                break

            try:
                df = self.fetch_market_data()
                if df is not None:
                    signal, reason, current_price = self.check_strategy_signal(df)
                    
                    if signal in ["BUY", "SELL"]:
                        print(f"🔔 Signal Found: {signal} | Reason: {reason}")
                        await self.execute_trade(signal, current_price, reason)
                        
                        # Demo PnL Update logic here...

                    # Live Status Update
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

                await asyncio.sleep(10) 

            except Exception as e:
                print(f"❌ Bot Loop Error: {e}")
                await asyncio.sleep(10)
        
        await manager.broadcast_to_symbol(f"bot_{self.bot.id}", {"status": "stopped"})
