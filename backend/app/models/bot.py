from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Bot(Base):
    __tablename__ = "bots"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    market = Column(String)  # e.g., "BTC/USDT"
    strategy = Column(String) # e.g., "RSI Strategy"
    timeframe = Column(String) # e.g., "1h"
    
    # Configuration & State
    status = Column(String, default="inactive") # active, inactive, paused
    pnl = Column(Float, default=0.0)
    pnl_percent = Column(Float, default=0.0)
    initial_capital = Column(Float, default=1000.0)
    
    # Strategy Parameters (JSON format)
    config = Column(JSON, default={})
    
    is_regime_aware = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="bots")
