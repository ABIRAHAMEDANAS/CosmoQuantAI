import sys
import os

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.constants import VALID_TIMEFRAMES
from app.services.market_service import MarketService

def verify_timeframes():
    service = MarketService()
    print("Verifying timeframes...")
    
    errors = []
    
    for tf in VALID_TIMEFRAMES:
        ms = service.timeframe_to_ms(tf)
        print(f"Timeframe: {tf} -> {ms} ms")
        
        expected = 0
        if tf.endswith('s'): expected = int(tf[:-1]) * 1000
        elif tf.endswith('m'): expected = int(tf[:-1]) * 60 * 1000
        elif tf.endswith('h'): expected = int(tf[:-1]) * 3600 * 1000
        elif tf.endswith('d'): expected = int(tf[:-1]) * 86400 * 1000
        elif tf.endswith('w'): expected = int(tf[:-1]) * 604800 * 1000
        elif tf.endswith('M'): expected = int(tf[:-1]) * 2592000 * 1000
        
        if ms != expected:
            errors.append(f"Error for {tf}: expected {expected}, got {ms}")
            
    if errors:
        print("\nERRORS FOUND:")
        for e in errors:
            print(e)
        sys.exit(1)
    else:
        print("\nAll timeframes verified successfully!")

if __name__ == "__main__":
    verify_timeframes()
