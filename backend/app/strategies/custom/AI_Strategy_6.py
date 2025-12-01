# @params
# {
#   "period": { "type": "number", "label": "SMA Period", "default": 20, "min": 2, "max": 200, "step": 1 },
#   "multiplier": { "type": "number", "label": "Std Dev Multiplier", "default": 2.0, "min": 0.5, "max": 5.0, "step": 0.1 }
# }
# @params_end
import backtrader as bt
import datetime
import pandas as pd
import random # For dummy data generation

class BollingerStrategy(bt.Strategy):
    params = (
        ('period', 20),
        ('multiplier', 2.0),
    )

    def __init__(self):
        self.trade_history = []
        self.dataclose = self.datas[0].close
        self.order = None # Keep track of pending order

        # Bollinger Bands indicator
        self.bband = bt.indicators.BollingerBands(
            self.datas[0],
            period=self.p.period,
            devfactor=self.p.multiplier
        )

        self.upperband = self.bband.top
        self.middleband = self.bband.mid
        self.lowerband = self.bband.bot

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
            self.log(f'Order Canceled/Margin/Rejected: {order.getstatusname(order.status)}')

        self.order = None # No pending order anymore

    def log(self, txt, dt=None):
        ''' Logging function for the strategy '''
        dt = dt or self.datas[0].datetime.date(0)
        # print(f'{dt.isoformat()}, {txt}')

    def next(self):
        # Simply log the closing price of the current bar
        # self.log(f'Close: {self.dataclose[0]:.2f}')

        # Check if an order is pending. If yes, we can't send a new one.
        if self.order:
            return

        # Check if we are in the market
        if not self.position:  # Not in the market
            # Buy signal: price crosses below the lower band
            if self.dataclose[0] < self.lowerband[0]:
                self.log(f'BUY CREATE, {self.dataclose[0]:.2f}')
                self.order = self.buy()

            # Sell signal: price crosses above the upper band (initiate short)
            elif self.dataclose[0] > self.upperband[0]:
                self.log(f'SELL CREATE, {self.dataclose[0]:.2f}')
                self.order = self.sell()

        else:  # In the market, check for exit conditions
            if self.position.size > 0:  # Currently long
                # Exit long: price crosses above the middle band
                if self.dataclose[0] > self.middleband[0]:
                    self.log(f'CLOSE LONG, {self.dataclose[0]:.2f}')
                    self.order = self.close()

            elif self.position.size < 0:  # Currently short
                # Exit short: price crosses below the middle band
                if self.dataclose[0] < self.middleband[0]:
                    self.log(f'CLOSE SHORT, {self.dataclose[0]:.2f}')
                    self.order = self.close()

if __name__ == '__main__':
    # 1. Create a Cerebro entity
    cerebro = bt.Cerebro()

    # 2. Add our strategy
    cerebro.addstrategy(BollingerStrategy)

    # Generate some dummy data for demonstration
    start_date = datetime.datetime(2020, 1, 1)
    end_date = datetime.datetime(2021, 1, 1)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Simulate a trending and volatile price series
    price = 100.0
    prices = []
    for _ in dates:
        prices.append(price)
        # Random walk with some trend and volatility
        price += random.uniform(-1, 1) + 0.1 # slight upward drift
        if random.random() < 0.1: # occasional larger jump/drop
            price += random.uniform(-5, 5)
        price = max(price, 50.0) # Ensure price doesn't go too low

    df = pd.DataFrame({
        'Open': prices,
        'High': [p + abs(random.gauss(0, 1)) for p in prices],
        'Low': [p - abs(random.gauss(0, 1)) for p in prices],
        'Close': prices,
        'Volume': [random.randint(1000, 5000) for _ in prices]
    }, index=dates)

    # Convert to Backtrader data feed
    data = bt.feeds.PandasData(
        dataname=df,
        fromdate=start_date,
        todate=end_date,
        datetime='index',
        open='Open',
        high='High',
        low='Low',
        close='Close',
        volume='Volume',
        openinterest=-1
    )

    # 3. Add the Data Feed to Cerebro
    cerebro.adddata(data)

    # 4. Set starting cash
    cerebro.broker.setcash(100000.0)

    # 5. Set the commission
    cerebro.broker.setcommission(commission=0.001) # 0.1% commission

    # Print out the starting cash
    print(f'Starting Portfolio Value: {cerebro.broker.getvalue():.2f}')

    # 6. Run the backtest
    strategies = cerebro.run()
    strategy = strategies[0] # Get the first (and only) strategy instance

    # Print out the final results
    print(f'Final Portfolio Value: {cerebro.broker.getvalue():.2f}')
    print(f'Trade History: {strategy.trade_history}')

    # 7. Plot the results
    # cerebro.plot() # Uncomment to see the plot
    # The `cerebro.plot()` function will automatically plot indicators and trades.
    # To get a DataFrame as requested by the original prompt, you'd typically use
    # a Backtrader Analyzer or iterate through the strategy's lines/indicators
    # after the run, but that's beyond the scope of a standard Backtrader `next`
    # method output. The `trade_history` provides the requested trade data.