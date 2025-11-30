import backtrader as bt
from .base_strategy import BaseStrategy
from .custom.rsi_strategy import RsiStrategy as CustomRsiStrategy
from .custom.advanced_scalping_strategy import AdvancedScalpingStrategy
from .custom.AI_Strategy_5 import EMACrossoverStrategy
from .custom.AI_Strategy_6 import RSIStrategy as AI_RSIStrategy

# ১. SMA Cross আপডেট
class SmaCross(BaseStrategy): # BaseStrategy ইনহেরিট করা হলো
    params = (('short_period', 10), ('long_period', 30),)

    def __init__(self):
        super().__init__() # ট্রেড হিস্ট্রি ইনিশিয়ালাইজ করা
        self.sma_short = bt.indicators.SimpleMovingAverage(self.data.close, period=self.params.short_period)
        self.sma_long = bt.indicators.SimpleMovingAverage(self.data.close, period=self.params.long_period)
        self.crossover = bt.indicators.CrossOver(self.sma_short, self.sma_long)

    def next(self):
        if not self.position:
            if self.crossover > 0:
                self.buy()
        elif self.crossover < 0:
            self.close()

# ২. RSI Strategy আপডেট
class RsiStrategy(BaseStrategy):
    params = (('period', 14), ('overbought', 70), ('oversold', 30),)

    def __init__(self):
        super().__init__()
        self.rsi = bt.indicators.RSI(self.data.close, period=self.params.period)

    def next(self):
        # ডিবাগিং এর জন্য কনসোলে প্রিন্ট (Docker লগে দেখা যাবে)
        # print(f"RSI: {self.rsi[0]}") 

        if not self.position:
            if self.rsi[0] < self.params.oversold:
                self.buy()
        else:
            if self.rsi[0] > self.params.overbought:
                self.close()

# ১. MACD Crossover
class MacdCross(BaseStrategy):
    params = (('fastPeriod', 12), ('slowPeriod', 26), ('signalPeriod', 9),)

    def __init__(self):
        super().__init__()
        self.macd = bt.indicators.MACD(
            self.data.close,
            period_me1=self.params.fastPeriod,
            period_me2=self.params.slowPeriod,
            period_signal=self.params.signalPeriod
        )
        # MACD লাইন এবং সিগনাল লাইনের ক্রসওভার
        self.crossover = bt.indicators.CrossOver(self.macd.macd, self.macd.signal)

    def next(self):
        if not self.position:
            if self.crossover > 0: # Bullish
                self.buy()
        elif self.crossover < 0: # Bearish
            self.close()

# ২. Bollinger Bands (Mean Reversion)
class BollingerBandsStrat(BaseStrategy):
    params = (('period', 20), ('stdDev', 2),)

    def __init__(self):
        super().__init__()
        self.boll = bt.indicators.BollingerBands(
            self.data.close, period=self.params.period, devfactor=self.params.stdDev)

    def next(self):
        if not self.position:
            # প্রাইস লোয়ার ব্যান্ডের নিচে গেলে বাই
            if self.data.close < self.boll.lines.bot:
                self.buy()
        else:
            # প্রাইস মিডেল ব্যান্ড বা আপার ব্যান্ডের উপরে গেলে সেল (এখানে মিডেল দিচ্ছি সেইফটির জন্য)
            if self.data.close > self.boll.lines.mid:
                self.close()

# ৩. EMA Crossover
class EmaCross(BaseStrategy):
    params = (('shortPeriod', 9), ('longPeriod', 21),)

    def __init__(self):
        super().__init__()
        self.ema_short = bt.indicators.ExponentialMovingAverage(self.data.close, period=self.params.shortPeriod)
        self.ema_long = bt.indicators.ExponentialMovingAverage(self.data.close, period=self.params.longPeriod)
        self.crossover = bt.indicators.CrossOver(self.ema_short, self.ema_long)

    def next(self):
        if not self.position:
            if self.crossover > 0:
                self.buy()
        elif self.crossover < 0:
            self.close()

# স্ট্র্যাটেজি ম্যাপ আপডেট
STRATEGY_MAP = {
    "SMA Crossover": SmaCross,
    "RSI Crossover": RsiStrategy,
    "MACD Crossover": MacdCross,
    "EMA Crossover": EmaCross,
    "Bollinger Bands": BollingerBandsStrat,
    "Custom RSI Strategy": CustomRsiStrategy,
    "Advanced Scalping Strategy": AdvancedScalpingStrategy,
    "EMA Crossover Strategy (AI)": EMACrossoverStrategy,
    "RSI Strategy (AI)": AI_RSIStrategy
}