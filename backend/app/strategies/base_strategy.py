import backtrader as bt

class BaseStrategy(bt.Strategy):
    """
    Base Strategy with built-in Risk Management (SL/TP/Trailing) & Trade Recording
    """
    params = (
        ('stop_loss', 0.0),      # শতাংশ হিসেবে (যেমন 1.0 = 1%)
        ('take_profit', 0.0),    # শতাংশ হিসেবে (যেমন 2.0 = 2%)
        ('trailing_stop', 0.0),  # শতাংশ হিসেবে
    )

    def __init__(self):
        self.trade_history = [] # এখানে ট্রেড জমা হবে (Frontend এর জন্য)
        self.order = None       # মেইন অর্ডার ট্র্যাক করার জন্য
        self.sl_order = None    # স্টপ লস অর্ডার ট্র্যাক করার জন্য
        self.tp_order = None    # টেক প্রফিট অর্ডার ট্র্যাক করার জন্য
        
        # ✅ এই লাইনটি যোগ করুন ডিবাগ করার জন্য
        print(f"🔍 DEBUG: Loaded Strategy with SL={self.params.stop_loss}%, TP={self.params.take_profit}%")

    def notify_order(self, order):
        if order.status in [order.Submitted, order.Accepted]:
            return

        # অর্ডার যদি কমপ্লিট হয়
        if order.status in [order.Completed]:
            is_buy = order.isbuy()
            price = order.executed.price
            size = order.executed.size
            
            # --- ১. লগ প্রিন্ট করা (Advanced Verification) ---
            # লগ দেখতে চাইলে নিচের ৩টি লাইনের শুরুর '#' তুলে দিন
            # print(f"✅ ORDER EXECUTED: {order.ordtypename()} | Price: {price:.2f} | Size: {size}")

            # --- ২. Frontend এর জন্য ট্রেড রেকর্ড করা ---
            trade_record = {
                "type": "buy" if is_buy else "sell",
                "price": price,
                "size": size,
                "time": int(bt.num2date(order.executed.dt).timestamp())
            }
            self.trade_history.append(trade_record)

            # --- ৩. Risk Management Logic (SL/TP বসানো) ---
            if is_buy:
                # বাই অর্ডার এক্সিকিউট হলে আমরা সেল অর্ডার বসাবো (SL/TP)
                
                # Stop Loss সেট করা
                if self.params.stop_loss > 0:
                    sl_price = price * (1.0 - self.params.stop_loss / 100)
                    self.sl_order = self.sell(exectype=bt.Order.Stop, price=sl_price, size=size)
                    
                    # লগ দেখতে চাইলে '#' তুলে দিন
                    print(f"🛡️ SL Placed at {sl_price:.2f} (-{self.params.stop_loss}%)")

                # Take Profit সেট করা
                if self.params.take_profit > 0:
                    tp_price = price * (1.0 + self.params.take_profit / 100)
                    self.tp_order = self.sell(exectype=bt.Order.Limit, price=tp_price, size=size)
                    
                    # লগ দেখতে চাইলে '#' তুলে দিন
                    print(f"🎯 TP Placed at {tp_price:.2f} (+{self.params.take_profit}%)")

                # Trailing Stop (যদি থাকে)
                if self.params.trailing_stop > 0:
                    self.sell(exectype=bt.Order.StopTrail, trailpercent=self.params.trailing_stop / 100, size=size)
                    print(f"📈 Trailing Stop Activated: {self.params.trailing_stop}%")

            elif order.issell():
                # সেল হয়ে গেলে (TP বা SL হিট করলে), বাকি পেন্ডিং অর্ডার ক্যানসেল করা (OCO Logic)
                if self.sl_order:
                    self.cancel(self.sl_order)
                    self.sl_order = None
                if self.tp_order:
                    self.cancel(self.tp_order)
                    self.tp_order = None
            
            self.order = None

        elif order.status in [order.Canceled, order.Margin, order.Rejected]:
            # print(f"❌ Order Failed: {order.getstatusname()}")
            self.order = None
