# @params
# {
#   "short_window": { "type": "number", "label": "Short EMA Period", "default": 20, "min": 2, "max": 200, "step": 1 },
#   "long_window": { "type": "number", "label": "Long EMA Period", "default": 50, "min": 2, "max": 200, "step": 1 }
# }
# @params_end
import backtrader as bt
from app.strategies.base_strategy import BaseStrategy

class EMACrossoverStrategy(BaseStrategy):
    """
    An EMA Crossover Trading Strategy that generates buy signals when the short
    EMA crosses above the long EMA, and sell signals when the short EMA crosses
    below the long EMA.
    """
    params = (
        ('short_window', 20),
        ('long_window', 50),
    )

    def __init__(self):
        self.trade_history = []
        
        # Keep a reference to the close price line of the first data feed
        self.dataclose = self.datas[0].close

        # To keep track of pending orders
        self.order = None

        # Calculate the Short and Long Exponential Moving Averages (EMAs)
        self.ema_short = bt.indicators.EMA(self.datas[0], period=self.p.short_window)
        self.ema_long = bt.indicators.EMA(self.datas[0], period=self.p.long_window)

        # Crossover indicator:
        # Crossover > 0 when ema_short crosses above ema_long (bullish)
        # Crossover < 0 when ema_short crosses below ema_long (bearish)
        self.crossover = bt.indicators.CrossOver(self.ema_short, self.ema_long)

    def log(self, txt, dt=None):
        """
        Logging function for the strategy.
        """
        dt = dt or self.datas[0].datetime.date(0)
        print(f'{dt.isoformat()}, {txt}')

    def notify_order(self, order):
        """
        Method to log and record order status and completed trades.
        """
        if order.status in [order.Completed]:
            is_buy = order.isbuy()
            self.trade_history.append({
                "type": "buy" if is_buy else "sell",
                "price": order.executed.price,
                "size": order.executed.size,
                "time": int(bt.num2date(order.executed.dt).timestamp())
            })
            self.order = None # Reset order to None after completion
            
            self.log(
                f'ORDER COMPLETED. Type: {"BUY" if is_buy else "SELL"}, '
                f'Price: {order.executed.price:.2f}, Size: {order.executed.size}, '
                f'Comm: {order.executed.comm:.2f}'
            )

        elif order.status in [order.Canceled, order.Rejected, order.Margin]:
            self.log(f'Order Canceled/Rejected/Margin: {order.getstatusname()}')
            self.order = None # Reset order to None if it's not completed

    def next(self):
        """
        Main trading logic for each new data point (bar).
        """
        # If an order is pending (e.g., waiting to be executed), do nothing.
        if self.order:
            return

        # Check if we are currently not in a position (flat market)
        if not self.position:
            # Buy signal: Short EMA crosses above Long EMA
            if self.crossover > 0:
                self.log(f'BUY CREATE, {self.dataclose[0]:.2f}')
                # Place a buy order. Keep a reference to it.
                self.order = self.buy()
        else:
            # Sell signal: Short EMA crosses below Long EMA
            if self.crossover < 0:
                self.log(f'SELL CREATE, {self.dataclose[0]:.2f}')
                # Place a sell order. Keep a reference to it.
                self.order = self.sell()