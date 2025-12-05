import backtrader as bt
import os
import importlib
import inspect
import pkgutil
from .base_strategy import BaseStrategy

# -----------------------------------------------------------
# ১. ফিক্সড স্ট্র্যাটেজি (Built-in Strategies with Alias Support)
# -----------------------------------------------------------

class SmaCross(BaseStrategy):
    # 'fast_period' এবং 'slow_period' কে Alias হিসেবে যোগ করা হলো
    params = (
        ('short_period', 10), ('long_period', 30),
        ('fast_period', None), ('slow_period', None), # Aliases
    )
    def __init__(self):
        super().__init__()
        # Alias ম্যাপিং লজিক
        short_p = self.params.fast_period if self.params.fast_period else self.params.short_period
        long_p = self.params.slow_period if self.params.slow_period else self.params.long_period
        
        self.sma_short = bt.indicators.SimpleMovingAverage(self.data.close, period=int(short_p))
        self.sma_long = bt.indicators.SimpleMovingAverage(self.data.close, period=int(long_p))
        self.crossover = bt.indicators.CrossOver(self.sma_short, self.sma_long)
        
    def next(self):
        if not self.position:
            if self.crossover > 0: self.buy()
        elif self.crossover < 0: self.close()

class RsiStrategy(BaseStrategy):
    # 'rsi_period', 'rsi_upper', 'rsi_lower' কে Alias হিসেবে যোগ করা হলো (লগ অনুযায়ী ফিক্স)
    params = (
        ('period', 14), ('overbought', 70), ('oversold', 30),
        ('rsi_period', None), ('rsi_upper', None), ('rsi_lower', None), # Aliases
    )
    def __init__(self):
        super().__init__()
        # Alias ম্যাপিং লজিক
        p_period = self.params.rsi_period if self.params.rsi_period else self.params.period
        p_upper = self.params.rsi_upper if self.params.rsi_upper else self.params.overbought
        p_lower = self.params.rsi_lower if self.params.rsi_lower else self.params.oversold
        
        self.rsi = bt.indicators.RSI(self.data.close, period=int(p_period))
        self.upper_band = p_upper
        self.lower_band = p_lower

    def next(self):
        if not self.position:
            if self.rsi[0] < self.lower_band: self.buy()
        else:
            if self.rsi[0] > self.upper_band: self.close()

class MacdCross(BaseStrategy):
    params = (
        ('fastPeriod', 12), ('slowPeriod', 26), ('signalPeriod', 9),
        ('fast_period', None), ('slow_period', None), ('signal_period', None), # Aliases
    )
    def __init__(self):
        super().__init__()
        # Alias ম্যাপিং
        fp = self.params.fast_period if self.params.fast_period else self.params.fastPeriod
        sp = self.params.slow_period if self.params.slow_period else self.params.slowPeriod
        sig = self.params.signal_period if self.params.signal_period else self.params.signalPeriod

        self.macd = bt.indicators.MACD(self.data.close, period_me1=int(fp), period_me2=int(sp), period_signal=int(sig))
        self.crossover = bt.indicators.CrossOver(self.macd.macd, self.macd.signal)
        
    def next(self):
        if not self.position:
            if self.crossover > 0: self.buy()
        elif self.crossover < 0: self.close()

class BollingerBandsStrat(BaseStrategy):
    params = (
        ('period', 20), ('stdDev', 2),
        ('dev', None), ('std_dev', None), # Aliases
    )
    def __init__(self):
        super().__init__()
        # Alias ম্যাপিং
        dev = self.params.std_dev if self.params.std_dev else (self.params.dev if self.params.dev else self.params.stdDev)
        
        self.boll = bt.indicators.BollingerBands(self.data.close, period=self.params.period, devfactor=float(dev))
        
    def next(self):
        if not self.position:
            if self.data.close < self.boll.lines.bot: self.buy()
        else:
            if self.data.close > self.boll.lines.mid: self.close()

class EmaCross(BaseStrategy):
    params = (
        ('shortPeriod', 9), ('longPeriod', 21),
        ('short_period', None), ('long_period', None), # Aliases
    )
    def __init__(self):
        super().__init__()
        sp = self.params.short_period if self.params.short_period else self.params.shortPeriod
        lp = self.params.long_period if self.params.long_period else self.params.longPeriod

        self.ema_short = bt.indicators.ExponentialMovingAverage(self.data.close, period=int(sp))
        self.ema_long = bt.indicators.ExponentialMovingAverage(self.data.close, period=int(lp))
        self.crossover = bt.indicators.CrossOver(self.ema_short, self.ema_long)
        
    def next(self):
        if not self.position:
            if self.crossover > 0: self.buy()
        elif self.crossover < 0: self.close()

# -----------------------------------------------------------
# ২. ডায়নামিক লোডিং ফাংশন (Dynamic Loader)
# -----------------------------------------------------------

def load_custom_strategies():
    custom_strategies = {}
    current_dir = os.path.dirname(__file__)
    custom_dir = os.path.join(current_dir, 'custom')

    if not os.path.exists(custom_dir):
        return custom_strategies

    for _, module_name, _ in pkgutil.iter_modules([custom_dir]):
        try:
            full_module_name = f"app.strategies.custom.{module_name}"
            module = importlib.import_module(full_module_name)
            for name, cls in inspect.getmembers(module, inspect.isclass):
                if issubclass(cls, bt.Strategy) and cls is not BaseStrategy and cls.__module__ == full_module_name:
                    display_name = f"{module_name} ({name})"
                    custom_strategies[display_name] = cls
                    print(f"✅ Loaded Custom Strategy: {display_name}")
        except Exception as e:
            print(f"⚠️ Failed to load custom strategy module '{module_name}': {e}")
            continue

    return custom_strategies

# -----------------------------------------------------------
# ৩. স্ট্র্যাটেজি ম্যাপ
# -----------------------------------------------------------

STRATEGY_MAP = {
    "SMA Crossover": SmaCross,
    "RSI Crossover": RsiStrategy,
    "MACD Crossover": MacdCross,
    "EMA Crossover": EmaCross,
    "Bollinger Bands": BollingerBandsStrat,
}

try:
    custom_map = load_custom_strategies()
    STRATEGY_MAP.update(custom_map)
except Exception as e:
    print(f"Error initializing custom strategies: {e}")