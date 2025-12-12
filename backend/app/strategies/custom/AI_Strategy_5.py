# @params
# {
#   "period": { "type": "number", "label": "RSI Period", "default": 14, "min": 2, "max": 100, "step": 1 },
#   "overbought": { "type": "number", "label": "RSI Overbought Level", "default": 70, "min": 50, "max": 90, "step": 1 },
#   "oversold": { "type": "number", "label": "RSI Oversold Level", "default": 30, "min": 10, "max": 50, "step": 1 }
# }
# @params_end

import backtrader as bt
from app.strategies.base_strategy import BaseStrategy  # ✅ ১. BaseStrategy ইম্পোর্ট করা হলো

# ✅ ২. bt.Strategy এর বদলে BaseStrategy ব্যবহার করা হলো
class RSI_Reversal_Strategy(BaseStrategy):
    params = (
        ('period', 14),
        ('overbought', 70),
        ('oversold', 30),
    )

    def __init__(self):
        # ✅ ৩. প্যারেন্ট ক্লাসের (BaseStrategy) init কল করতে হবে
        super().__init__()
        
        self.dataclose = self.datas[0].close
        # self.order = None # এটি BaseStrategy তে অলরেডি আছে, তাই এখানে দরকার নেই

        # Add RSI indicator
        self.rsi = bt.indicators.RSI(self.datas[0], period=self.p.period)

        # Crossover indicators
        self.crossover_up_oversold = bt.indicators.CrossUp(self.rsi, self.p.oversold)
        self.crossover_down_overbought = bt.indicators.CrossDown(self.rsi, self.p.overbought)

    def log(self, txt, dt=None):
        """Logger function for this strategy"""
        dt = dt or self.datas[0].datetime.date(0)
        print(f'{dt.isoformat()}, {txt}')

    def notify_order(self, order):
        # ✅ ৪. BaseStrategy এর notify_order কল করতে হবে যাতে SL/TP কাজ করে
        super().notify_order(order) 

        # এরপর স্ট্র্যাটেজির নিজস্ব লগিং লজিক (অপশনাল)
        if order.status in [order.Completed]:
            self.log(
                f'ORDER {order.getordername()} COMPLETED. Price: {order.executed.price:.2f}, '
                f'Cost: {order.executed.value:.2f}, Comm: {order.executed.comm:.2f}'
            )
        elif order.status in [order.Canceled, order.Margin, order.Rejected, order.Expired]:
            self.log(f'ORDER STATUS: {order.getstatusname()}')

    def next(self):
        # BaseStrategy তে self.order হ্যান্ডেল করা হয়, তাই আমরা সেটা চেক করব
        if self.order:
            return

        # Check for existing position
        if self.position:  # We have a position
            if self.position.size > 0:  # Currently Long
                if self.crossover_down_overbought[0]: 
                    self.log(f'CLOSE LONG (RSI Signal)')
                    self.close() 
                    self.log(f'ENTER SHORT (RSI Signal)')
                    self.sell() # এখানে self.order এ অ্যাসাইন করার দরকার নেই যদি সিম্পল রাখতে চান
            elif self.position.size < 0:  # Currently Short
                if self.crossover_up_oversold[0]: 
                    self.log(f'CLOSE SHORT (RSI Signal)')
                    self.close()
                    self.log(f'ENTER LONG (RSI Signal)')
                    self.buy()
        else:  # No open position
            if self.crossover_down_overbought[0]:
                self.log(f'ENTER SHORT (RSI Signal)')
                self.sell()
            elif self.crossover_up_oversold[0]:
                self.log(f'ENTER LONG (RSI Signal)')
                self.buy()