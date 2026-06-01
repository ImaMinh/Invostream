import aiosqlite
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "db", "invostream.db")

async def init_db(table_name: str):
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id          TEXT PRIMARY KEY,
                    batch_id    TEXT NOT NULL,
                    file_path   TEXT NOT NULL,
                    status      TEXT NOT NULL DEFAULT 'pending',
                    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            
            # commits all transaction 
            await db.commit()   
            print(f"<INIT_DB> successfully created table '{table_name}'") 
    except Exception as e:
        print(f"failed to initialize table '{table_name}': {e}")
        raise