from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

# Shared properties
class BotBase(BaseModel):
    name: Optional[str] = None
    exchange: Optional[str] = None
    market: Optional[str] = None
    strategy: Optional[str] = None
    timeframe: Optional[str] = None
    trade_value: Optional[float] = 100.0
    trade_unit: Optional[str] = "QUOTE"
    api_key_id: Optional[str] = None
    config: Optional[Dict[str, Any]] = {}
    is_regime_aware: Optional[bool] = False

# Properties to receive on Bot creation
class BotCreate(BotBase):
    name: str
    exchange: str
    market: str
    strategy: str
    timeframe: str

# ✅ মিসিং অংশ: BotUpdate ক্লাসটি আবার যোগ করা হলো
class BotUpdate(BotBase):
    status: Optional[str] = None
    pnl: Optional[float] = None
    pnl_percent: Optional[float] = None

# Properties to return to client
class Bot(BotBase):
    id: int
    owner_id: int
    status: str
    pnl: float
    pnl_percent: float
    created_at: datetime

    class Config:
        from_attributes = True
