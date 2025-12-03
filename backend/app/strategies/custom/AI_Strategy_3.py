# @params
# {
#   "short_period": { "type": "number", "label": "Short EMA Period", "default": 20, "min": 5, "max": 100, "step": 1 },
#   "long_period": { "type": "number", "label": "Long EMA Period", "default": 50, "min": 10, "max": 200, "step": 1 }
# }
# @params_end
import backtrader as bt

class EMACrossoverStrategy(bt.Strategy):
    params = (
        ('short_period', 20),
        ('long_period', 50),
    )

    def __init__(self):
        self.trade_history = [] # MANDATORY: Initialize trade_history for UI
        self.dataclose = self.datas[0].close

        # Add EMAs
        self.ema_short = bt.indicators.EMA(self.dataclose, period=self.p.short_period)
        self.ema_long = bt.indicators.EMA(self.dataclose, period=self.p.long_period)

        self.order = None  # Keep track of pending orders

    def notify_order(self, order):
        # MANDATORY: Implement notify_order exactly as specified
        if order.status in [order.Completed]:
            is_buy = order.isbuy()
            self.trade_history.append({
                "type": "buy" if is_buy else "sell",
                "price": order.executed.price,
                "size": order.executed.size,
                "time": int(bt.num2date(order.executed.dt).timestamp())
            })
            self.order = None # Clear pending order once completed
        elif order.status in [order.Canceled, order.Margin, order.Rejected]:
            # self.log(f'Order Canceled/Margin/Rejected: {order.getstatusname(order.status)}')
            self.order = None # Clear pending order on failure
        # For other statuses (e.g., Submitted, Accepted), self.order remains active

    def log(self, txt, dt=None):
        ''' Logging function for the strategy (for debugging purposes) '''
        dt = dt or self.datas[0].datetime.date(0)
        # print(f'{dt.isoformat()}, {txt}') # Commented out for raw code output

    def next(self):
        # Ensure we have enough data points for indicators to be valid
        if len(self) < max(self.p.short_period, self.p.long_period):
            return

        # If an order is pending, do not send another one
        if self.order:
            return

        # Check for Golden Cross (Buy Signal)
        # Short EMA crosses above Long EMA
        if self.ema_short[0] > self.ema_long[0] and self.ema_short[-1] <= self.ema_long[-1]:
            # If not in the market, or if currently short, act
            if self.position.size == 0:  # Not in a position
                # self.log(f'BUY CREATE {self.dataclose[0]:.2f}')
                self.order = self.buy()
            elif self.position.size < 0:  # If currently short, close short position and go long
                # self.log(f'CLOSING SHORT POSITION AND GOING LONG {self.dataclose[0]:.2f}')
                self.close()  # Close any existing short position
                self.order = self.buy()  # Then open a long position

        # Check for Death Cross (Sell Signal)
        # Short EMA crosses below Long EMA
        elif self.ema_short[0] < self.ema_long[0] and self.ema_short[-1] >= self.ema_long[-1]:
            # If not in the market, or if currently long, act
            if self.position.size == 0:  # Not in a position
                # self.log(f'SELL CREATE {self.dataclose[0]:.2f}')
                self.order = self.sell()
            elif self.position.size > 0:  # If currently long, close long position and go short
                # self.log(f'CLOSING LONG POSITION AND GOING SHORT {self.dataclose[0]:.2f}')
                self.close()  # Close any existing long position
                self.order = self.sell()  # Then open a short position