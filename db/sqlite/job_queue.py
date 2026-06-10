import aiosqlite
from db.sqlite.sqlite import init_db, DB_PATH

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
    
async def add_jobs(batch_id: str, file_path: str, table_name: str = 'job_queue'):
    """
    function to add a sigle job to the queue.
    """
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            if db is None:
                raise RuntimeError("Database connection failed.")
            
            job_id = f"{batch_id}_{file_path}"
            await db.execute(
                f"INSERT OR IGNORE INTO {table_name} (id, batch_id, file_path, status) VALUES (?, ?, ?, ?)",
                (job_id, batch_id, file_path, "pending")
            )
            await db.commit()
            print(f"<ADD JOB> enqueued {file_path} into table {table_name}")
    except Exception as e:
        print(f"failed to add job for batch {batch_id}: {e}")
        raise
    
async def remove_job(job_id: str, table_name: str = 'job_queue'):
    """
    function to remove a job from the queue.
    """
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            if db is None:
                raise RuntimeError("Database connection failed.")
            
            await db.execute(
                f"DELETE FROM {table_name} WHERE id = ?",
                (job_id,)
            )
            await db.commit()
            print(f"<REMOVE JOB> removed job {job_id} from table {table_name}")
    except Exception as e:
        print(f"failed to remove job {job_id}: {e}")
        raise   
    
async def get_queue_size(table_name: str = 'job_queue') -> int:
    """
    Returns the number of jobs currently in the queue with status 'pending'.
    """
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            if db is None:
                return 0
            
            # Ensure table exists first to avoid error if called before queue is initialized
            async with db.execute(f"SELECT name from sqlite_master WHERE type='table' AND name='{table_name}'") as cursor:
                if not await cursor.fetchone():
                    return 0
                    
            async with db.execute(f"SELECT COUNT(*) FROM {table_name} WHERE status = 'pending'") as cursor:
                result = await cursor.fetchone()
                return result[0] if result else 0
    except Exception as e:
        print(f"failed to get queue size: {e}")
        return 0    