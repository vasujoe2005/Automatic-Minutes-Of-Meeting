from app.db.session import SessionLocal
from sqlalchemy import text
import asyncio

async def check_column():
    print("Checking summaries table schema...")
    try:
        async with SessionLocal() as db:
            # Postgres specific query to check columns
            result = await db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'summaries';"))
            columns = result.scalars().all()
            print(f"Columns in summaries: {columns}")
            
            if 'formatted_report' in columns:
                print("SUCCESS: formatted_report column exists.")
            else:
                print("FAILURE: formatted_report column MISSING.")
                
                # Try adding it
                print("Attempting to add column via SQLAlchemy text...")
                await db.execute(text("ALTER TABLE summaries ADD COLUMN formatted_report TEXT;"))
                await db.commit()
                print("Column added.")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_column())
