import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


# test_db.py
import asyncio
from db.postgresql import init_pool, close_pool, get_pool

async def main():
    print("1. Initializing pool...")
    await init_pool()
    print("   ✓ Pool initialized")

    print("2. Acquiring connection...")
    async with get_pool().acquire() as conn:
        version = await conn.fetchval("SELECT version()")
        print(f"   ✓ Connected to: {version}")

        tables = await conn.fetch("""
            SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        """)
        print(f"   ✓ Tables in database: {[t['tablename'] for t in tables]}")

    print("3. Closing pool...")
    await close_pool()
    print("   ✓ Pool closed")

    print("\nAll good ✨")

if __name__ == "__main__":
    asyncio.run(main())