from app.core.config import settings
import psycopg2

def list_tables():
    try:
        conn = psycopg2.connect(
            dbname=settings.POSTGRES_DB,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            host=settings.POSTGRES_SERVER,
            port=settings.POSTGRES_PORT
        )
        cur = conn.cursor()
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        tables = cur.fetchall()
        print("Tables found in database:", [t[0] for t in tables])
        conn.close()
    except Exception as e:
        print(f"Error listing tables: {e}")

if __name__ == "__main__":
    list_tables()
