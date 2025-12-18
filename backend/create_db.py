import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from app.core.config import settings
import sys

def create_database():
    try:
        # Connect to default 'postgres' database to create the new one
        print(f"Connecting to 'postgres' database to check/create '{settings.POSTGRES_DB}'...")
        con = psycopg2.connect(
            dbname="postgres",
            user=settings.POSTGRES_USER,
            host=settings.POSTGRES_SERVER,
            password=settings.POSTGRES_PASSWORD,
            port=settings.POSTGRES_PORT
        )
        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = con.cursor()
        
        db_name = settings.POSTGRES_DB
        
        # Check if exists
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{db_name}'")
        exists = cur.fetchone()
        
        if not exists:
            print(f"Creating database {db_name}...")
            cur.execute(f"CREATE DATABASE {db_name}")
            print(f"Database {db_name} created successfully.")
        else:
            print(f"Database {db_name} already exists.")
            
        cur.close()
        con.close()
        
    except Exception as e:
        print(f"Error creating database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_database()
