# @params
# {
#   "period": { "type": "number", "label": "RSI Period", "default": 14, "min": 2, "max": 100, "step": 1 },
#   "oversold": { "type": "number", "label": "RSI Oversold Level", "default": 30, "min": 10, "max": 50, "step": 1 },
#   "overbought": { "type": "number", "label": "RSI Overbought Level", "default": 70, "min": 50, "max": 90, "step": 1 }
# }
# @params_end
import backtrader as bt
from app.strategies.base_strategy import BaseStrategy

class RSIStrategy(BaseStrategy):
    params = (
        ('period', 14),
        ('oversold', 30),
        ('overbought', 70),
    )

    def __init__(self):
        self.trade_history = []
        self.rsi = bt.indicators.RSI(self.data.close, period=self.p.period)

        # Crossover / Crossunder conditions
        # Long Entry: RSI crosses OVER the Oversold level (30)
        self.crossover_oversold = bt.indicators.CrossOver(self.rsi, self.p.oversold)
        # Short Entry: RSI crosses UNDER the Overbought level (70)
        self.crossunder_overbought = bt.indicators.CrossDown(self.rsi, self.p.overbought)

        self.order = None  # To keep track of pending orders

    def notify_order(self, order):
        if order.status in [order.Submitted, order.Accepted]:
            # Order submitted/accepted - no action required
            return

        if order.status in [order.Completed]:
            if order.isbuy():
                pass # self.log(f'BUY EXECUTED, Price: {order.executed.price:.2f}, Size: {order.executed.size}, Cost: {order.executed.value:.2f}, Comm: {order.executed.comm:.2f}')
            else:  # Sell
                pass # self.log(f'SELL EXECUTED, Price: {order.executed.price:.2f}, Size: {order.executed.size}, Cost: {order.executed.value:.2f}, Comm: {order.executed.comm:.2f}')

            is_buy = order.isbuy()
            self.trade_history.append({
                "type": "buy" if is_buy else "sell",
                "price": order.executed.price,
                "size": order.executed.size,
                "time": int(bt.num2date(order.executed.dt).timestamp())
            })

        elif order.status in [order.Canceled, order.Margin, order.Rejected]:
            pass # self.log('Order Canceled/Margin/Rejected')

        self.order = None # No pending order anymore

    def next(self):
        if self.order:
            return  # A previous order is pending, do not create new ones

        # Long Entry: RSI crosses OVER the Oversold level (30)
        if self.crossover_oversold[0]: # [0] means current bar
            if self.position.size < 0:  # If currently short, close short and go long
                self.close()  # Close existing short position
                self.order = self.buy()  # Then open a long position
            elif self.position.size == 0:  # If flat, open a long position
                self.order = self.buy()

        # Short Entry: RSI crosses UNDER the Overbought level (70)
        # Use elif to ensure only one trade per bar from these conditions,
        # mimicking Pine Script's sequential if statements for entry.
        elif self.crossunder_overbought[0]:
            if self.position.size > 0:  # If currently long, close long and go short
                self.close()  # Close existing long position
                self.order = self.sell()  # Then open a short position
            elif self.position.size == 0:  # If flat, open a short position
                self.order = self.sell()