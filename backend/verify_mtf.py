
import sys
import os
import pandas as pd
from sqlalchemy.orm import Session
# Adjust path to find app module
sys.path.append(os.getcwd())

from app.services.backtest_engine import BacktestEngine
from app.strategies import STRATEGY_MAP

# Mock Session
class MockSession:
    def close(self):
        pass

def create_dummy_data():
    data = [
        "2023-01-01 00:00:00,100,105,95,102,1000",
        "2023-01-01 00:05:00,102,108,100,105,1500",
        "2023-01-01 00:10:00,105,106,101,103,1200",
        "2023-01-01 00:15:00,103,107,102,106,1300",
        "2023-01-01 00:20:00,106,110,105,109,1600",
        "2023-01-01 00:25:00,109,112,108,111,1400",
        "2023-01-01 00:30:00,111,115,110,113,1700",
        "2023-01-01 00:35:00,113,114,111,112,1100",
        "2023-01-01 00:40:00,112,116,112,115,1800",
        "2023-01-01 00:45:00,115,118,114,117,1900",
        "2023-01-01 00:50:00,117,119,116,118,2000",
        "2023-01-01 00:55:00,118,120,117,119,2100",
        "2023-01-01 01:00:00,119,122,118,121,2200"
    ]
    
    os.makedirs("app/data_feeds", exist_ok=True)
    with open("app/data_feeds/verification_data.csv", "w") as f:
        f.write("datetime,open,high,low,close,volume\n")
        for line in data:
            f.write(line + "\n")
    print("✅ Created dummy data at app/data_feeds/verification_data.csv")

def verify_mtf():
    create_dummy_data()
    
    engine = BacktestEngine()
    db = MockSession()
    
    print("🚀 Running Backtest with Secondary Timeframe...")
    try:
        # We need a strategy. We'll pick one if available or mock one?
        # Assuming 'RsiStrategy' or similar exists, or we use a basic one.
        # Let's list strategies first.
        strategy_name = list(STRATEGY_MAP.keys())[0] if STRATEGY_MAP else "TestStrategy"
        print(f"Using Strategy: {strategy_name}")

        result = engine.run(
            db=db,
            symbol="TEST",
            timeframe="5m",
            secondary_timeframe="15m", # Testing 15m secondary on 5m primary
            strategy_name=strategy_name,
            initial_cash=10000,
            params={},
            custom_data_file="verification_data.csv"
        )
        
        if result.get("status") == "success":
            print("✅ Backtest ran successfully!")
            # Check if resampling happened (hard to check from result dict without logs, but if it didn't crash it's good sign)
            print("Result:", result.get("profit_percent"))
        else:
            print("❌ Backtest failed:", result)
            
    except Exception as e:
        print(f"❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_mtf()
