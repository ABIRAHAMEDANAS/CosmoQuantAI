# CCXT এবং Backtrader এর জন্য ভ্যালিড টাইমফ্রেম লিস্ট
VALID_TIMEFRAMES = [
    # Seconds
    "1s", "5s", "10s", "15s", "30s", "45s",
    
    # Minutes
    "1m", "3m", "5m", "15m", "30m", "45m",
    
    # Hours
    "1h", "2h", "3h", "4h", "6h", "8h", "12h",
    
    # Days & Weeks & Months
    "1d", "3d", "1w", "1M"
]

# --- Standard Strategy Parameters Metadata ---
STANDARD_STRATEGY_PARAMS = {
    "RSI Crossover": {
        "rsi_period": {
            "type": "int", "default": 14, "min": 5, "max": 50, "step": 1, "label": "RSI Period"
        },
        "rsi_upper": {
            "type": "int", "default": 70, "min": 50, "max": 95, "step": 1, "label": "Overbought Level"
        },
        "rsi_lower": {
            "type": "int", "default": 30, "min": 5, "max": 50, "step": 1, "label": "Oversold Level"
        }
    },
    "MACD": {
        "fast_period": {
            "type": "int", "default": 12, "min": 2, "max": 50, "step": 1, "label": "Fast Period"
        },
        "slow_period": {
            "type": "int", "default": 26, "min": 10, "max": 100, "step": 1, "label": "Slow Period"
        },
        "signal_period": {
            "type": "int", "default": 9, "min": 2, "max": 20, "step": 1, "label": "Signal Period"
        }
    },
    "Bollinger Bands": {
        "period": {
            "type": "int", "default": 20, "min": 5, "max": 100, "step": 1, "label": "Period"
        },
        "std_dev": {
            "type": "float", "default": 2.0, "min": 1.0, "max": 4.0, "step": 0.1, "label": "Std Deviation"
        }
    },
    "SMA Crossover": {
        "fast_period": {
            "type": "int", "default": 50, "min": 5, "max": 100, "step": 1, "label": "Fast SMA Period"
        },
        "slow_period": {
            "type": "int", "default": 200, "min": 50, "max": 500, "step": 1, "label": "Slow SMA Period"
        }
    }
}