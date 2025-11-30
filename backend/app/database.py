from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Docker compose এ দেওয়া environment variable থেকে URL নিচ্ছি
# ডিফল্ট: postgresql://user:password@db:5432/cosmoquant_db
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://user:password@db:5432/cosmoquant_db"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# ডিপেন্ডেন্সি ফাংশন (DB Session পাওয়ার জন্য)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()