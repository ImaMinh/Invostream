import aiosqlite
from db.sqlite import init_db, DB_PATH

async def enqueue_jobs(batch_id: str, file_paths: list[str]):
    """
    function for enqueueing batch jobs.
    Args: 
        batch_id: batch id
        file_paths: list of batch strings
    """
    try: 
        async with aiosqlite.connect(DB_PATH) as db:
            
            table_name = 'job_queue'
            
            # block to check if a table with the given name already exists. 
            async with db.execute(
                f"SELECT name from sqlite_master WHERE type='table' AND name='{table_name}'"
            ) as cursor:
                result = await cursor.fetchone()
                if not result:
                    await init_db(table_name=table_name)
            
            # enqueue each invoice into the job table. 
            for file_path in file_paths:
                job_id = f"{batch_id}_{file_path}"
                await db.execute(
                    # INSERT OR IGNORE adds a new row, skipping silently if job_id already exists
                    # (id, batch_id, file_path, status) are the columns being filled
                    # VALUES (?, ?, ?, ?) are placeholders - prevents SQL injection
                    f"INSERT OR IGNORE INTO {table_name} (id, batch_id, file_path, status) VALUES (?, ?, ?, ?)",
                    
                    # values mapped positionally to each ? placeholder
                    (job_id, batch_id, file_path, "pending")
                )
                print(f"<ENQUEUE JOBS> enqueued {file_path} into table {table_name}")
                
            # save all the inserts permanently to disk.
            await db.commit()   
            
            print(f"<ENQUEUE JOBS> successfully enqueued batch {batch_id} into {table_name}")
    except Exception as e:
        print(f"failed to enqueue jobs for batch {batch_id}: {e}")
        raise

# async def update_job_status(job_id: str, status: str):
#     async with aiosqlite.connect(DB_PATH) as db:
#         await db.execute(
#             "UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
#             (status, job_id)
#         )
#         await db.commit()

# async def get_jobs_by_batch(batch_id: str):
#     async with aiosqlite.connect(DB_PATH) as db:
#         async with db.execute(
#             "SELECT * FROM jobs WHERE batch_id = ?", (batch_id,)
#         ) as cursor:
#             return await cursor.fetchall()