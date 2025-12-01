import backtrader as bt
import os
import importlib
import inspect
import pkgutil
from .base_strategy import BaseStrategy

# -----------------------------------------------------------
# ১. ফিক্সড স্ট্র্যাটেজি (Built-in Strategies)
# -----------------------------------------------------------

class SmaCross(BaseStrategy):
    params = (('short_period', 10), ('long_period', 30),)
    def __init__(self):
        super().__init__()
        self.sma_short = bt.indicators.SimpleMovingAverage(self.data.close, period=self.params.short_period)
        self.sma_long = bt.indicators.SimpleMovingAverage(self.data.close, period=self.params.long_period)
        self.crossover = bt.indicators.CrossOver(self.sma_short, self.sma_long)
    def next(self):
        if not self.position:
            if self.crossover > 0: self.buy()
        elif self.crossover < 0: self.close()

class RsiStrategy(BaseStrategy):
    params = (('period', 14), ('overbought', 70), ('oversold', 30),)
    def __init__(self):
        super().__init__()
        self.rsi = bt.indicators.RSI(self.data.close, period=self.params.period)
    def next(self):
        if not self.position:
            if self.rsi[0] < self.params.oversold: self.buy()
        else:
            if self.rsi[0] > self.params.overbought: self.close()

class MacdCross(BaseStrategy):
    params = (('fastPeriod', 12), ('slowPeriod', 26), ('signalPeriod', 9),)
    def __init__(self):
        super().__init__()
        self.macd = bt.indicators.MACD(self.data.close, period_me1=self.params.fastPeriod, period_me2=self.params.slowPeriod, period_signal=self.params.signalPeriod)
        self.crossover = bt.indicators.CrossOver(self.macd.macd, self.macd.signal)
    def next(self):
        if not self.position:
            if self.crossover > 0: self.buy()
        elif self.crossover < 0: self.close()

class BollingerBandsStrat(BaseStrategy):
    params = (('period', 20), ('stdDev', 2),)
    def __init__(self):
        super().__init__()
        self.boll = bt.indicators.BollingerBands(self.data.close, period=self.params.period, devfactor=self.params.stdDev)
    def next(self):
        if not self.position:
            if self.data.close < self.boll.lines.bot: self.buy()
        else:
            if self.data.close > self.boll.lines.mid: self.close()

class EmaCross(BaseStrategy):
    params = (('shortPeriod', 9), ('longPeriod', 21),)
    def __init__(self):
        super().__init__()
        self.ema_short = bt.indicators.ExponentialMovingAverage(self.data.close, period=self.params.shortPeriod)
        self.ema_long = bt.indicators.ExponentialMovingAverage(self.data.close, period=self.params.longPeriod)
        self.crossover = bt.indicators.CrossOver(self.ema_short, self.ema_long)
    def next(self):
        if not self.position:
            if self.crossover > 0: self.buy()
        elif self.crossover < 0: self.close()

# -----------------------------------------------------------
# ২. ডায়নামিক লোডিং ফাংশন (Dynamic Loader)
# এটি custom ফোল্ডার স্ক্যান করে অটোমেটিক ফাইল ইমপোর্ট করবে
# -----------------------------------------------------------

def load_custom_strategies():
    custom_strategies = {}
    
    # বর্তমান ডিরেক্টরি এবং custom ফোল্ডারের পাথ বের করা
    current_dir = os.path.dirname(__file__)
    custom_dir = os.path.join(current_dir, 'custom')

    # যদি custom ফোল্ডার না থাকে, খালি ডিকশনারি রিটার্ন করো
    if not os.path.exists(custom_dir):
        return custom_strategies

    # custom ফোল্ডারের সব .py ফাইল ইটারেট করা
    # pkgutil ব্যবহার করে মডিউলগুলো খোঁজা হচ্ছে
    for _, module_name, _ in pkgutil.iter_modules([custom_dir]):
        try:
            # মডিউলটি ইমপোর্ট করা (যেমন: app.strategies.custom.AI_Strategy_6)
            full_module_name = f"app.strategies.custom.{module_name}"
            
            # importlib দিয়ে মডিউল লোড করা
            module = importlib.import_module(full_module_name)
            
            # মডিউলের ভেতর সব ক্লাস চেক করা
            for name, cls in inspect.getmembers(module, inspect.isclass):
                # চেক করা: এটি কি Backtrader Strategy? এবং BaseStrategy নয় তো?
                # এবং ক্লাসটি কি এই মডিউলেই ডিফাইন করা হয়েছে? (অন্য কোথাও থেকে ইমপোর্ট করা নয়)
                if issubclass(cls, bt.Strategy) and cls is not BaseStrategy and cls.__module__ == full_module_name:
                    
                    # স্ট্র্যাটেজির নাম হিসেবে ফাইলের নাম বা ক্লাসের নাম ব্যবহার করা
                    # ইউজার ইন্টারফেসে সুন্দর দেখানোর জন্য ফাইলের নাম ব্যবহার করা ভালো
                    display_name = f"{module_name} ({name})"
                    
                    custom_strategies[display_name] = cls
                    print(f"✅ Loaded Custom Strategy: {display_name}")
                    
        except Exception as e:
            # যদি কোনো ফাইলে এরর থাকে (যেমন Syntax Error বা ফাইল মিসিং), 
            # তাহলে সার্ভার ক্র্যাশ না করে শুধু লগ প্রিন্ট করবে।
            print(f"⚠️ Failed to load custom strategy module '{module_name}': {e}")
            continue

    return custom_strategies

# -----------------------------------------------------------
# ৩. স্ট্র্যাটেজি ম্যাপ তৈরি
# -----------------------------------------------------------

STRATEGY_MAP = {
    "SMA Crossover": SmaCross,
    "RSI Crossover": RsiStrategy,
    "MACD Crossover": MacdCross,
    "EMA Crossover": EmaCross,
    "Bollinger Bands": BollingerBandsStrat,
}

# কাস্টম স্ট্র্যাটেজিগুলো লোড করে ম্যাপে যোগ করা
try:
    custom_map = load_custom_strategies()
    STRATEGY_MAP.update(custom_map)
except Exception as e:
    print(f"Error initializing custom strategies: {e}")