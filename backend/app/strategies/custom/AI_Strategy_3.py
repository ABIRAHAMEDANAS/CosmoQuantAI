# @params
# {
#   "short_period": { "type": "number", "label": "Short EMA Period", "default": 20, "min": 2, "max": 200, "step": 1 },
#   "long_period": { "type": "number", "label": "Long EMA Period", "default": 50, "min": 2, "max": 200, "step": 1 }
# }
# @params_end
import backtrader as bt

class EMA_Crossover(bt.Strategy):
    params = (
        ('short_period', 20),
        ('long_period', 50),
    )

    def __init__(self):
        self.trade_history = []
        self.dataclose = self.datas[0].close

        # Indicators
        self.ema_short = bt.indicators.EMA(self.dataclose, period=self.p.short_period)
        self.ema_long = bt.indicators.EMA(self.dataclose, period=self.p.long_period)

        # Crossover indicator: +1 when short crosses above long, -1 when short crosses below long
        self.crossover = bt.indicators.CrossOver(self.ema_short, self.ema_long)

        # To keep track of pending orders
        self.order = None

    def notify_order(self, order):
        if order.status in [order.Completed]:
            is_buy = order.isbuy()
            self.trade_history.append({
                "type": "buy" if is_buy else "sell",
                "price": order.executed.price,
                "size": order.executed.size,
                "time": int(bt.num2date(order.executed.dt).timestamp())
            })
        elif order.status in [order.Canceled, order.Margin, order.Rejected]:
            # self.log('Order Canceled/Margin/Rejected') # Optional: for debugging
            pass

        # Clear pending order
        self.order = None

    def next(self):
        # Simply return if an order is currently pending
        if self.order:
            return

        # Check for buy signal (Golden Cross)
        if not self.position:  # Not in the market
            if self.crossover > 0:  # Short EMA crosses above Long EMA
                # Buy
                self.order = self.buy()

        # Check for sell signal (Death Cross)
        else:  # In the market, we have a long position
            if self.crossover < 0:  # Short EMA crosses below Long EMA
                # Close existing long position
                self.order = self.close()