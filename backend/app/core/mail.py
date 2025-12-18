from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr, BaseModel
from app.core.config import settings


class EmailSchema(BaseModel):
    email: EmailStr
    subject: str
    body: str


# FastAPI-Mail configuration
conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

fast_mail = FastMail(conf)


async def send_email(email: EmailSchema) -> None:
    """
    Simple helper to send a single email.
    """
    message = MessageSchema(
        subject=email.subject,
        recipients=[email.email],
        body=email.body,
        subtype="html",
    )
    await fast_mail.send_message(message)
