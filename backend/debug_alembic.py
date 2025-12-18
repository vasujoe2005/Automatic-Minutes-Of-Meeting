from app.core.config import settings
from sqlalchemy import create_engine
import sys

def check_connection():
    # Mirror the logic in env.py
    uri = settings.SQLALCHEMY_DATABASE_URI.replace("postgresql+asyncpg", "postgresql")
    # Hide password in print
    safe_uri = uri.replace(settings.POSTGRES_PASSWORD, "******")
    print(f"Testing URI: {safe_uri}")
    
    try:
        engine = create_engine(uri)
        with engine.connect() as conn:
            print("Connection successful!")
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_connection()
