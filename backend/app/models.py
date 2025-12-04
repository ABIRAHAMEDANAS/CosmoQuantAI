from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.sql import func # created_at এর জন্য এটি লাগবে
from .database import Base

# 1. User Model
class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True} # This fixes the redefinition error

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    
    # মিসিং ফিল্ডস যোগ করা হলো:
    is_pro = Column(Boolean, default=False) # ডিফল্ট false (ফ্রি ইউজার)
    created_at = Column(DateTime(timezone=True), server_default=func.now()) # একাউন্ট তৈরির সময়

    # Relationships
    api_keys = relationship("ApiKey", back_populates="owner")

# 2. API Keys Model
class ApiKey(Base):
    __tablename__ = "api_keys"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    exchange = Column(String)  # e.g., Binance, KuCoin
    api_key = Column(String)   # Public Key
    secret_key = Column(String) # Encrypted Secret Key
    is_enabled = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="api_keys")

# 3. Strategy Templates Model
class StrategyTemplate(Base):
    __tablename__ = "strategy_templates"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    strategy_type = Column(String) 
    tags = Column(JSON)
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.sql import func # created_at এর জন্য এটি লাগবে
from .database import Base

# 1. User Model
class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True} # This fixes the redefinition error

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    
    # মিসিং ফিল্ডস যোগ করা হলো:
    is_pro = Column(Boolean, default=False) # ডিফল্ট false (ফ্রি ইউজার)
    created_at = Column(DateTime(timezone=True), server_default=func.now()) # একাউন্ট তৈরির সময়

    # Relationships
    api_keys = relationship("ApiKey", back_populates="owner")

# 2. API Keys Model
class ApiKey(Base):
    __tablename__ = "api_keys"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    exchange = Column(String)  # e.g., Binance, KuCoin
    api_key = Column(String)   # Public Key
    secret_key = Column(String) # Encrypted Secret Key
    is_enabled = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="api_keys")

# 3. Strategy Templates Model
class StrategyTemplate(Base):
    __tablename__ = "strategy_templates"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    strategy_type = Column(String) 
    tags = Column(JSON)
    params = Column(JSON)

# 4. Market Data Model
class MarketData(Base):
    __tablename__ = "market_data"

    # id = Column(Integer, primary_key=True, index=True)  <-- এই লাইনটি মুছে দিন বা কমেন্ট করুন
    
    # Composite Primary Key তৈরি করছি (primary_key=True যোগ করুন)
    exchange = Column(String, primary_key=True)
    symbol = Column(String, primary_key=True)
    timeframe = Column(String, primary_key=True)
    timestamp = Column(DateTime, primary_key=True) # টাইমস্কেলDB-এর জন্য এটি প্রাইমারি কি-তে থাকা বাধ্যতামূলক
    
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)

    # Constraints (Existing)
    __table_args__ = (
        # UniqueConstraint আর লাগবে না কারণ Primary Key নিজেই ইউনিক
        Index('idx_market_data_lookup', 'symbol', 'timeframe', 'timestamp'),
        {'extend_existing': True}
    )