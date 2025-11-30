# FILE: bot_worker/strategies/rsi_strategy.py (সঠিক সংস্করণ)
import pandas as pd
import talib
from app.strategies.base_strategy import BaseStrategy

class RsiStrategy(BaseStrategy):
    def __init__(self, params: dict):
        super().__init__(params)
        self.length = int(params.get('length', 14))
        self.oversold = int(params.get('oversold', 30))
        self.overbought = int(params.get('overbought', 70))

    @staticmethod
    def get_params_definition():
        return [
            {"name": "length", "type": "integer", "default": 14, "label": "RSI Length"},
            {"name": "oversold", "type": "integer", "default": 30, "label": "Oversold Threshold"},
            {"name": "overbought", "type": "integer", "default": 70, "label": "Overbought Threshold"}
        ]

    def generate_signal(self, df: pd.DataFrame) -> str:
        if len(df) < self.length:
            return 'HOLD'
        rsi_values = talib.RSI(df['close'], timeperiod=self.length)
        latest_rsi = rsi_values.iloc[-1]

        if pd.isna(latest_rsi):
            return 'HOLD'
        
        if latest_rsi < self.oversold:
            return 'BUY'
        elif latest_rsi > self.overbought:
            return 'SELL'
        else:
            return 'HOLD'