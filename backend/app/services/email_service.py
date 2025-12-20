from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings
from pathlib import Path

# Basic configuration
conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True, 
    VALIDATE_CERTS=True
)

async def send_meeting_invite(email_to: str, meeting_title: str, meeting_time: str, join_link: str, agenda_items: list[str]):
    
    agenda_html = "<ul>" + "".join([f"<li>{item}</li>" for item in agenda_items]) + "</ul>" if agenda_items else "<p>No specific agenda.</p>"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
            .header {{ background-color: #2563eb; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ padding: 20px; }}
            .button {{ display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; }}
            .footer {{ margin-top: 20px; text-align: center; font-size: 12px; color: #888; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Meeting Invitation</h2>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>You have been invited to a meeting: <strong>{meeting_title}</strong></p>
                
                <p><strong>When:</strong> {meeting_time}</p>
                
                <h3>Agenda:</h3>
                {agenda_html}
                
                <p style="text-align: center; margin-top: 30px;">
                    <a href="{join_link}" class="button">Join Meeting</a>
                </p>
                <p style="text-align: center; font-size: 0.9em;">
                    Or click here: <a href="{join_link}">{join_link}</a>
                </p>
            </div>
            <div class="footer">
                <p>Powered by AI MOM System</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    message = MessageSchema(
        subject=f"Invitation: {meeting_title}",
        recipients=[email_to],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    
    try:
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
             await fm.send_message(message)
             return True
        else:
             print(f"SMTP not configured. Mocking email to {email_to}")
             print(f"Subject: Invitation: {meeting_title}")
             print(f"Link: {join_link}")
             return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
