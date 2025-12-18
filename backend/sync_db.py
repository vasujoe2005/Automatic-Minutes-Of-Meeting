
import asyncio
from app.db.session import engine, Base
from app.models import AgendaTemplate # Ensure model is imported to be registered in Base

async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_models())
