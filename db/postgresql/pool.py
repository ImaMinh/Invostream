"""
Database connection pool management for PostgreSQL using asyncpg.
"""

import json
import os
import asyncpg
from dotenv import load_dotenv

_pool: asyncpg.Pool | None = None # pool variable to hold the connection pool instance

# ---- Connection Pool Initialization ----
async def init_db_pool()->None:
    """
    Initialized the DB connection pool. Should be called once at the start of the application.
    A connection pool is a cache of database connections maintained so that the connections can be reused when future requests to the database are required. 
    """
    try: 
        global _pool
        if _pool is None:
            load_dotenv()  
            
            dsn = os.getenv("DATABASE_URL")
            
            if not dsn:
                raise ValueError("<-- INIT DB POOL --> DATABASE_URL not found in environment variables.")
            
            if "+psycopg2" in dsn:
                dsn = dsn.replace("postgresql+psycopg2", "postgresql")
            
            _pool = await asyncpg.create_pool(dsn, min_size=1, max_size=10)
            
            print("Database connection pool initialized.")
    except Exception as e:
        print(f"<--INIT_DB_POOL--> Error initializing database connection pool: {e}")
        raise
    
# ---- Close Pool Connection ----
async def close_db_pool()->None:
    """
    Closes the database connection pool. Should be called when the application is shutting down.
    """
    try:
        global _pool
        if _pool is not None:
            await _pool.close()
            _pool = None
            print("Database connection pool closed.")
    except Exception as e:
        print(f"<--CLOSE_DB_POOL--> Error closing database connection pool: {e}")
        raise
    
# ---- Get a Connection from Pool ----
async def get_db_connection()-> asyncpg.Connection:
    """
    Acquires a single connection from the pool. 
    Should be used within an async context manager to ensure proper release of the connection back to the pool.
    """
    try:
        global _pool
        if _pool is None:
            raise ValueError("Database connection pool is not initialized. Call init_db_pool() first.")
        
        proxy: asyncpg.pool.PoolConnectionProxy = await _pool.acquire()
        connection = proxy._con  # Access the underlying connection from the proxy
        
        if connection is None:
            raise ValueError("Failed to acquire a database connection from the pool.")
        
        return connection
            
    except Exception as e:
        print(f"<--GET_DB_CONNECTION--> Error acquiring database connection from pool: {e}")
        raise