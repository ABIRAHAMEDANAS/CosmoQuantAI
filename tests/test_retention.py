import sys
import os
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, MarketData
from app.services.market_service import MarketService

# Override DB URL for localhost testing if needed
# Assuming default docker-compose ports: 5432 mapped to 5432
DATABASE_URL = "postgresql://user:password@localhost:5432/cosmoquant_db"

def test_retention():
    print("Connecting to database...")
    try:
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
    except Exception as e:
        print(f"Connection failed: {e}")
        print("Make sure the database is running and accessible at localhost:5432")
        return

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    service = MarketService()
    
    # 1. Insert Old Data
    old_date = datetime.utcnow() - timedelta(days=400)
    print(f"Inserting dummy data from {old_date}...")
    
    dummy_candle = MarketData(
        exchange='binance',
        symbol='BTC/USDT',
        timeframe='1h',
        timestamp=old_date,
        open=100, high=110, low=90, close=105, volume=1000
    )
    
    db.add(dummy_candle)
    db.commit()
    
    # Verify insertion
    exists = db.query(MarketData).filter(
        MarketData.symbol == 'BTC/USDT',
        MarketData.timeframe == '1h',
        MarketData.timestamp == old_date
    ).first()
    
    if exists:
        print("Dummy data inserted successfully.")
    else:
        print("Failed to insert dummy data.")
        return

    # 2. Run Cleanup
    print("Running cleanup...")
    deleted_count = service.cleanup_old_data(db)
    print(f"Cleanup finished. Deleted rows: {deleted_count}")

    # 3. Verify Deletion
    exists_after = db.query(MarketData).filter(
        MarketData.symbol == 'BTC/USDT',
        MarketData.timeframe == '1h',
        MarketData.timestamp == old_date
    ).first()

    if not exists_after:
        print("SUCCESS: Old data was deleted.")
    else:
        print("FAILURE: Old data still exists.")

    db.close()

if __name__ == "__main__":
    test_retention()
