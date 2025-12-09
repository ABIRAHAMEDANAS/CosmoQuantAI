from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Bot(Base):
    __tablename__ = "bots"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    name = Column(String, index=True)
    exchange = Column(String) # ✅ নতুন: যেমন 'binance'
    market = Column(String)   # যেমন 'BTC/USDT'
    strategy = Column(String) # যেমন 'RSI Crossover'
    timeframe = Column(String) # যেমন '1h'
    
    # ✅ নতুন ট্রেডিং কনফিগারেশন
    trade_value = Column(Float, default=100.0) # কত টাকার ট্রেড হবে
    trade_unit = Column(String, default="QUOTE") # 'QUOTE' (USDT) বা 'ASSET' (BTC)
    api_key_id = Column(String, nullable=True) # কোন API Key ব্যবহার হবে (Exchange Name বা ID)

    # Configuration & State
    status = Column(String, default="inactive") # active, inactive
    pnl = Column(Float, default=0.0)
    pnl_percent = Column(Float, default=0.0)
    
    # Strategy Parameters & Risk Management (JSON এ সেভ থাকবে)
    config = Column(JSON, default={})
    
    is_regime_aware = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="bots")
