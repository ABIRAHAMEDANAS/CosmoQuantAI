# @params
# {
#   "fast_period": { "type": "number", "label": "Fast MA Period", "default": 10, "min": 2, "max": 100, "step": 1 },
#   "slow_period": { "type": "number", "label": "Slow MA Period", "default": 30, "min": 2, "max": 200, "step": 1 }
# }
# @params_end
import backtrader as bt

class MACrossStrategy(bt.Strategy):
    params = (
        ('fast_period', 10),
        ('slow_period', 30),
    )

    def __init__(self):
        self.dataclose = self.datas[0].close
        self.order = None  # To keep track of pending orders
        self.trade_history = []

        # Ensure slow_period is greater than fast_period for a valid cross
        if self.p.fast_period >= self.p.slow_period:
            raise ValueError("Fast MA period must be less than Slow MA period for a meaningful cross.")

        # Create our Moving Average indicators
        self.fast_ma = bt.indicators.SMA(self.datas[0], period=self.p.fast_period)
        self.slow_ma = bt.indicators.SMA(self.datas[0], period=self.p.slow_period)

        # CrossOver indicator:
        # 1 if fast crosses above slow
        # -1 if fast crosses below slow
        # 0 otherwise
        self.crossover = bt.indicators.CrossOver(self.fast_ma, self.slow_ma)

    def notify_order(self, order):
        if order.status in [order.Submitted, order.Accepted]:
            # Order has been submitted/accepted by the broker - nothing to do yet
            return

        # Check if an order has been completed or failed
        if order.status in [order.Completed]:
            is_buy = order.isbuy()
            self.trade_history.append({
                "type": "buy" if is_buy else "sell",
                "price": order.executed.price,
                "size": order.executed.size,
                "time": int(bt.num2date(order.executed.dt).timestamp())
            })
            # Once completed, clear the order variable to allow new orders
            self.order = None

        elif order.status in [order.Canceled, order.Rejected, order.Margin]:
            # Order failed for some reason, clear the order variable
            self.order = None

    def next(self):
        # If an order is pending, do nothing and wait for it to complete/fail
        if self.order:
            return

        # Check if we are not in the market (no open position)
        if not self.position:
            # Buy signal: fast MA crosses above slow MA
            if self.crossover[0] > 0:
                self.order = self.buy() # Place buy order

            # Sell signal: fast MA crosses below slow MA
            elif self.crossover[0] < 0:
                self.order = self.sell() # Place sell order

        # If we are already in the market
        else:
            if self.position.size > 0:  # We are currently long
                # Exit long position if fast MA crosses below slow MA
                if self.crossover[0] < 0:
                    self.order = self.close() # Close long position

            elif self.position.size < 0:  # We are currently short
                # Exit short position if fast MA crosses above slow MA
                if self.crossover[0] > 0:
                    self.order = self.close() # Close short position