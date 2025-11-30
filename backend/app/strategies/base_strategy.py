import backtrader as bt

# একটি বেইস ক্লাস বানাচ্ছি যাতে সব স্ট্র্যাটেজি ট্রেড রেকর্ড করতে পারে
class BaseStrategy(bt.Strategy):
    def __init__(self):
        self.trade_history = [] # এখানে ট্রেড জমা হবে

    def notify_order(self, order):
        # অর্ডার যদি কমপ্লিট হয়
        if order.status in [order.Completed]:
            is_buy = order.isbuy()
            trade_record = {
                "type": "buy" if is_buy else "sell",
                "price": order.executed.price,
                "size": order.executed.size,
                # পরিবর্তন: isoformat() এর বদলে timestamp() ব্যবহার করুন
                "time": int(bt.num2date(order.executed.dt).timestamp())
            }
            self.trade_history.append(trade_record)
            
        # প্যারেন্ট ক্লাসের next মেথড কল হবে চাইল্ড থেকে
