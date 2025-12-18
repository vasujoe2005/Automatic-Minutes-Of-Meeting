import psycopg2
from app.core.config import settings
import sys

try:
    print(f"Attempting to connect to '{settings.POSTGRES_DB}' db on {settings.POSTGRES_SERVER}...")
    conn = psycopg2.connect(
        dbname=settings.POSTGRES_DB,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        host=settings.POSTGRES_SERVER,
        port=settings.POSTGRES_PORT
    )
    print(f"Connection to '{settings.POSTGRES_DB}' DB successful!")
    conn.close()
except Exception as e:
    print(f"Connection to '{settings.POSTGRES_DB}' DB failed: {e}")
    sys.exit(1)
