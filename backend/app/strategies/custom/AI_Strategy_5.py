# @params
# {
#   "period": { "type": "number", "label": "RSI Period", "default": 14, "min": 2, "max": 100, "step": 1 },
#   "overbought": { "type": "number", "label": "RSI Overbought Level", "default": 70, "min": 50, "max": 90, "step": 1 },
#   "oversold": { "type": "number", "label": "RSI Oversold Level", "default": 30, "min": 10, "max": 50, "step": 1 }
# }
# @params_end
import backtrader as bt

class RSI_Reversal_Strategy(bt.Strategy):
    params = (
        ('period', 14),
        ('overbought', 70),
        ('oversold', 30),
    )

    def __init__(self):
        self.trade_history = []
        self.dataclose = self.datas[0].close

        # Keep track of pending orders
        self.order = None

        # Add RSI indicator
        self.rsi = bt.indicators.RSI(self.datas[0], period=self.p.period)

        # Crossover indicators for clarity
        self.crossover_up_oversold = bt.indicators.CrossUp(self.rsi, self.p.oversold)
        self.crossover_down_overbought = bt.indicators.CrossDown(self.rsi, self.p.overbought)

    def log(self, txt, dt=None):
        """Logger function for this strategy"""
        dt = dt or self.datas[0].datetime.date(0)
        print(f'{dt.isoformat()}, {txt}')

    def notify_order(self, order):
        if order.status in [order.Submitted, order.Accepted]:
            # Order is submitted/accepted - no action required yet
            return

        # Check if an order has been completed, canceled, or rejected
        if order.status in [order.Completed]:
            is_buy = order.isbuy()
            self.trade_history.append({
                "type": "buy" if is_buy else "sell",
                "price": order.executed.price,
                "size": order.executed.size,
                "time": int(bt.num2date(order.executed.dt).timestamp())
            })
            self.log(
                f'ORDER {order.getordername()} COMPLETED. Price: {order.executed.price:.2f}, '
                f'Size: {order.executed.size}, Cost: {order.executed.value:.2f}, Comm: {order.executed.comm:.2f}'
            )
            self.order = None # Clear the pending order reference
        elif order.status in [order.Canceled, order.Margin, order.Rejected, order.Expired]:
            self.log(f'ORDER CANCELED/MARGIN/REJECTED/EXPIRED. Status: {order.getstatusname()}')
            self.order = None # Clear the pending order reference

    def next(self):
        # If an order is pending, don't do anything
        if self.order:
            return

        # Check for existing position
        if self.position:  # We have a position
            if self.position.size > 0:  # Currently Long
                if self.crossover_down_overbought[0]:  # RSI crosses below overbought
                    self.log(f'CLOSE LONG POSITION, RSI ({self.rsi[0]:.2f}) below overbought ({self.p.overbought})')
                    self.close() # Close current long position
                    self.log(f'ENTER SHORT POSITION, RSI ({self.rsi[0]:.2f}) below overbought ({self.p.overbought}) at {self.dataclose[0]:.2f}')
                    self.order = self.sell() # Enter short
            elif self.position.size < 0:  # Currently Short
                if self.crossover_up_oversold[0]:  # RSI crosses above oversold
                    self.log(f'CLOSE SHORT POSITION, RSI ({self.rsi[0]:.2f}) above oversold ({self.p.oversold})')
                    self.close() # Close current short position
                    self.log(f'ENTER LONG POSITION, RSI ({self.rsi[0]:.2f}) above oversold ({self.p.oversold}) at {self.dataclose[0]:.2f}')
                    self.order = self.buy() # Enter long
        else:  # No open position
            if self.crossover_down_overbought[0]:  # RSI crosses below overbought
                self.log(f'ENTER SHORT POSITION, RSI ({self.rsi[0]:.2f}) below overbought ({self.p.overbought}) at {self.dataclose[0]:.2f}')
                self.order = self.sell()
            elif self.crossover_up_oversold[0]:  # RSI crosses above oversold
                self.log(f'ENTER LONG POSITION, RSI ({self.rsi[0]:.2f}) above oversold ({self.p.oversold}) at {self.dataclose[0]:.2f}')
                self.order = self.buy()