from passlib.context import CryptContext
from cryptography.fernet import Fernet
import redis
import os

# Bcrypt এলগোরিদম ব্যবহার করা হচ্ছে
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# প্রোডাকশনে এটি অবশ্যই .env ফাইলে রাখবেন!
# একটি রেন্ডম কি জেনারেট করার জন্য টার্মিনালে রান করুন: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# আপাতত আমি একটি ডামি কি ব্যবহার করছি শেখানোর জন্য:
ENCRYPTION_KEY = b'Jq-w5yXp3zQ4R1t2E8y9U0i7O6p5L4k3J2h1G0f9D8s=' 

cipher_suite = Fernet(ENCRYPTION_KEY)

def encrypt_key(text: str) -> str:
    return cipher_suite.encrypt(text.encode()).decode()

def decrypt_key(text: str) -> str:
    return cipher_suite.decrypt(text.encode()).decode()

def get_redis_client():
    # Docker environment থেকে URL নিবে
    redis_url = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")
    return redis.from_url(redis_url)