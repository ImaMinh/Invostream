import os
import asyncpg  
from dotenv import load_dotenv
    
_pool = None

async def init_pool():
    """
    Initializes the connection pool.
    """
    try:
        global _pool
        
        load_dotenv()
        
        print("USER:", os.getenv("POSTGRES_USER"))
        print("PASS:", os.getenv("POSTGRES_PASSWORD"))
        print("DB:", os.getenv("POSTGRES_DB"))
        print("HOST:", os.getenv("POSTGRES_HOST"))
        print("PORT:", os.getenv("POSTGRES_PORT"))

        _pool = await asyncpg.create_pool(
            user = os.getenv("POSTGRES_USER"),
            password = os.getenv("POSTGRES_PASSWORD"),
            database = os.getenv("POSTGRES_DB"),
            host = os.getenv("POSTGRES_HOST"),
            port = os.getenv("POSTGRES_PORT", "5432"),
            min_size = 1,
            max_size = 10
        )
        
        await _create_table()
    except Exception as e:
        print(f"Error initializing pool: {e}")
        raise
    
async def close_pool():
    """
    Closes the connection pool.
    """
    try:
        if _pool is not None:
            await _pool.close()
    except Exception as e:
        print(f"Error closing pool: {e}")
        raise
        
def get_pool():
    """
    Returns the connection pool. Raise if init_pool() has not been called.
    """
    try: 
        if _pool is None:
            raise RuntimeError("Database pool not initialized - call init_pool() first.")
        return _pool
    except Exception as e:
        print(e)
        raise

async def _create_table():
    """
    Creates the main 'invoices' table with a comprehensive schema designed for global invoice data.
    """
    try:
        if _pool is None:
            raise RuntimeError("Pool not initialized - call init_pool() first.")

        async with _pool.acquire() as connection:   
                await connection.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

                await connection.execute(   
                    """
                    CREATE TABLE IF NOT EXISTS invoices (
                    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                    -- Source tracking
                    job_id          TEXT NOT NULL UNIQUE,
                    filename        TEXT NOT NULL,
                    file_hash       TEXT,                              -- SHA256 of source file, for dedup

                    -- Pipeline state
                    status          TEXT NOT NULL
                                    CHECK (status IN ('success', 'review', 'failed')),

                    -- Extractor metadata
                    model_used      TEXT NOT NULL,                     -- 'azure_prebuilt', 'paddleocr_v1', 'gemini'
                    template_name   TEXT,                              -- optional template label
                    ocr_confidence  FLOAT CHECK (ocr_confidence BETWEEN 0 AND 1),

                    -- Jurisdiction (globally aware)
                    country_code    CHAR(2),                           -- ISO 3166-1 alpha-2: VN, US, JP, ...
                    currency        CHAR(3),                           -- ISO 4217: VND, USD, JPY, ...

                    -- Parties
                    vendor_name     TEXT,
                    vendor_tax_code TEXT,
                    buyer_name      TEXT,
                    buyer_tax_code  TEXT,

                    -- Identifiers + dates
                    invoice_number  TEXT,
                    invoice_date    DATE,
                    due_date        DATE,

                    -- Amounts (NUMERIC(20,4) covers every fiat currency, including 3-decimal ones)
                    subtotal        NUMERIC(20, 4),
                    tax_amount      NUMERIC(20, 4),
                    total_amount    NUMERIC(20, 4),
                    amount_due      NUMERIC(20, 4),

                    -- Terms
                    payment_term    TEXT,

                    -- Catch-all for model-specific or country-specific fields
                    raw_fields      JSONB,                             -- nullable: failed invoices may have nothing

                    -- Why something failed or needs review (free-text or structured later)
                    failure_reason  TEXT,

                    -- Audit
                    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
                    processed_at    TIMESTAMPTZ
                );
                """
            )
    except Exception as e:
        print(f"Error creating table: {e}")
        raise