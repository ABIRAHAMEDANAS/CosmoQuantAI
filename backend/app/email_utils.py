from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from typing import List

# আপনার জিমেইল তথ্য এখানে দিন (সতর্কতা: গিটহাবে পুশ করার সময় .env ব্যবহার করবেন)
conf = ConnectionConfig(
    MAIL_USERNAME = "abir.ahamed.01931645993@gmail.com",    # <--- আপনার ইমেইল দিন
    MAIL_PASSWORD = "gyqd uzkz hapn entz",     # <--- সেই ১৬ ডিজিটের অ্যাপ পাসওয়ার্ড
    MAIL_FROM = "abir.ahamed.01931645993@gmail.com",
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

async def send_reset_email(email: EmailStr, token: str):
    # এই লিংকটি ফ্রন্টএন্ডের পাসওয়ার্ড রিসেট পেজের হতে হবে
    # Docker-এ হোস্ট নেম 'localhost' হতে পারে, প্রোডাকশনে ডোমেইন নেম হবে
    reset_link = f"http://localhost:3000/reset-password?token={token}"

    html = f"""
    <h3>Password Reset Request</h3>
    <p>Hello,</p>
    <p>We received a request to reset your password for CosmoQuantAI.</p>
    <p>Click the link below to reset it (valid for 15 minutes):</p>
    <br>
    <a href="{reset_link}" style="padding: 10px 20px; background-color: #6366F1; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <br><br>
    <p>If you did not request this, please ignore this email.</p>
    """

    message = MessageSchema(
        subject="Reset Your CosmoQuantAI Password",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)
    return True
