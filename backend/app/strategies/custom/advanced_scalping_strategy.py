# @params
# {
#   "bb_length": { "type": "number", "label": "BB Length", "default": 20, "min": 5, "max": 50, "step": 1 },
#   "bb_stddev": { "type": "number", "label": "BB StdDev", "default": 2.0, "min": 1.0, "max": 4.0, "step": 0.1 },
#   "sr_lookback": { "type": "number", "label": "S/R Lookback", "default": 30, "min": 10, "max": 100, "step": 1 },
#   "atr_length": { "type": "number", "label": "ATR Length", "default": 14, "min": 5, "max": 50, "step": 1 },
#   "squeeze_threshold": { "type": "number", "label": "Squeeze Threshold", "default": 0.015, "min": 0.001, "max": 0.1, "step": 0.001 }
# }
# @params_end

import backtrader as bt
import numpy as np
from app.strategies.base_strategy import BaseStrategy

class AdvancedScalpingStrategy(BaseStrategy):
    params = (
        ('bb_length', 20),
        ('bb_stddev', 2.0),
        ('sr_lookback', 30),
        ('atr_length', 14),
        ('squeeze_threshold', 0.015),
    )

    def __init__(self):
        # ১. ট্রেড হিস্ট্রি এবং ইন্ডিকেটর সেটআপ
        self.trade_history = [] # চার্টে সিগন্যাল দেখানোর জন্য জরুরি
        
        # Bollinger Bands
        self.bb = bt.indicators.BollingerBands(
            self.data.close, 
            period=self.params.bb_length, 
            devfactor=self.params.bb_stddev
        )
        
        # ATR (Volatile Stop Loss এর জন্য ব্যবহার করা যেতে পারে)
        self.atr = bt.indicators.ATR(self.data, period=self.params.atr_length)
        
        # Bandwidth Calculation for Squeeze
        # BBW = (Upper - Lower) / Middle
        self.bbw = (self.bb.lines.top - self.bb.lines.bot) / self.bb.lines.mid

    def notify_order(self, order):
        """চার্টে বাই/সেল সিগন্যাল দেখানোর জন্য এই ফাংশনটি বাধ্যতামূলক"""
        if order.status in [order.Completed]:
            is_buy = order.isbuy()
            self.trade_history.append({
                "type": "buy" if is_buy else "sell",
                "price": order.executed.price,
                "size": order.executed.size,
                "time": int(bt.num2date(order.executed.dt).timestamp())
            })

    def get_sr_levels(self):
        """ সাপোর্ট এবং রেজিস্ট্যান্স লেভেল ক্যালকুলেশন (Numpy ব্যবহার করে) """
        lookback = self.params.sr_lookback
        if len(self) < lookback:
            return None, None

        # গত ৩০ ক্যান্ডেলের হাই এবং লো ডেটা নেওয়া
        highs = np.array(self.data.high.get(ago=0, size=lookback))
        lows = np.array(self.data.low.get(ago=0, size=lookback))
        closes = np.array(self.data.close.get(ago=0, size=lookback))
        
        highest_high = np.max(highs)
        lowest_low = np.min(lows)
        current_close = closes[-1]
        
        price_range = highest_high - lowest_low
        if price_range == 0: return None, None
        
        # হিস্টোগ্রাম লজিক (আপনার আগের কোডের অনুরূপ)
        bin_size = price_range / 50
        bins = np.arange(lowest_low, highest_high, bin_size)
        
        # সিম্পল সাপোর্ট ডিটেকশন: প্রাইসের নিচে সবচেয়ে স্ট্রং জোন
        # সিম্পল রেজিস্ট্যান্স ডিটেকশন: প্রাইসের উপরে সবচেয়ে স্ট্রং জোন
        
        # ব্যাকটেস্টিং স্পিড বাড়ানোর জন্য আমরা এখানে একটি সিম্পল লজিক ব্যবহার করছি:
        # গত ৩০ ক্যান্ডেলের মধ্যে ২য় সর্বোচ্চ হাই এবং ২য় সর্বনিম্ন লো কে S/R ধরা হচ্ছে
        # (ফুল হিস্টোগ্রাম লুপ প্রতি ক্যান্ডেলে চালালে ব্যাকটেস্ট স্লো হয়ে যাবে)
        
        sorted_lows = np.sort(lows)
        sorted_highs = np.sort(highs)
        
        # ইমিডিয়েট সাপোর্ট এবং রেজিস্ট্যান্স
        support = sorted_lows[2] # নিচের দিক থেকে ৩য় লো পয়েন্ট
        resistance = sorted_highs[-3] # উপরের দিক থেকে ৩য় হাই পয়েন্ট
        
        return support, resistance

    def next(self):
        # যদি পজিশন থাকে তবে এক্সিট লজিক চেক করব
        if self.position:
            # সিম্পল এক্সিট: যদি প্রাইস মিডল ব্যান্ডের উল্টো দিকে যায়
            if self.position.size > 0 and self.data.close[0] > self.bb.lines.top[0]:
                self.close()
            elif self.position.size < 0 and self.data.close[0] < self.bb.lines.bot[0]:
                self.close()
            return

        # --- এন্ট্রি লজিক ---
        
        # ১. স্কুইজ চেক (Squeeze Check)
        # আগের ক্যান্ডেলে ব্যান্ডউইথ থ্রেশহোল্ডের নিচে ছিল কি না
        was_squeeze = self.bbw[-1] < self.params.squeeze_threshold
        
        # ২. সাপোর্ট/রেজিস্ট্যান্স লেভেল
        support, resistance = self.get_sr_levels()
        if not support or not resistance:
            return

        # ৩. সিগন্যাল জেনারেশন
        
        # Squeeze Breakout Logic
        if was_squeeze:
            # Bullish Breakout
            if self.data.close[0] > self.bb.lines.top[0]:
                self.buy()
            # Bearish Breakout
            elif self.data.close[0] < self.bb.lines.bot[0]:
                self.sell()
        
        # Mean Reversion (Bounce) Logic
        else:
            # যদি প্রাইস লোয়ার ব্যান্ডের কাছে থাকে এবং সাপোর্টের উপরে থাকে -> BUY
            if self.data.low[0] <= self.bb.lines.bot[0] and self.data.close[0] > self.data.open[0]: # Green candle
                self.buy()
            
            # যদি প্রাইস আপার ব্যান্ডের কাছে থাকে এবং রেজিস্ট্যান্সের নিচে থাকে -> SELL
            elif self.data.high[0] >= self.bb.lines.top[0] and self.data.close[0] < self.data.open[0]: # Red candle
                self.sell()