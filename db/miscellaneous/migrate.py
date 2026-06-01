"""
db/migrate.py — Lightweight migration runner for invostream.

How it works:
    1. On first run, creates a `schema_migrations` table in Postgres.
       This table has one row per migration that has been applied, with
       the filename and a timestamp.

    2. Scans db/migrations/ for .sql files, sorted by filename (hence
       the numeric prefix: 001_, 002_, …).

    3. Skips any migration already recorded in schema_migrations.

    4. Executes new migrations inside a transaction and records them.

Usage:
    python -m db.migrate          # apply all pending migrations
    python -m db.migrate --reset  # drop schema_migrations and re-run all

Why not Alembic?
    Alembic requires SQLAlchemy models.  This project uses raw asyncpg
    for performance and learning purposes.  A numbered-SQL-file system
    (like Flyway or golang-migrate) is simpler, has zero dependencies
    beyond asyncpg, and teaches the same concepts:
    - Versioned, ordered schema changes
    - Idempotent application (safe to run repeatedly)
    - Auditable history in the database itself

Future migrations are just new .sql files:
    db/migrations/002_add_confidence_column.sql
    db/migrations/003_create_analytics_tables.sql
"""

import asyncio
import os
import sys
import glob
import asyncpg
from dotenv import load_dotenv


MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "migrations")


async def get_connection() -> asyncpg.Connection:
    """Create a standalone connection (not from the app pool)."""
    load_dotenv()
    dsn = os.getenv("DATABASE_URL", "")

    # asyncpg doesn't understand SQLAlchemy's +psycopg2 dialect suffix
    if "+psycopg2" in dsn:
        dsn = dsn.replace("postgresql+psycopg2", "postgresql")

    return await asyncpg.connect(dsn)


async def ensure_migration_table(conn: asyncpg.Connection):
    """
    Create the schema_migrations tracking table if it doesn't exist.
    This table is the source of truth for which migrations have run.
    """
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id          SERIAL PRIMARY KEY,
            filename    TEXT NOT NULL UNIQUE,
            applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)


async def get_applied_migrations(conn: asyncpg.Connection) -> set[str]:
    """Return the set of migration filenames already applied."""
    rows = await conn.fetch("SELECT filename FROM schema_migrations")
    return {row["filename"] for row in rows}


def get_migration_files() -> list[str]:
    """
    Return sorted list of .sql filenames in the migrations directory.
    The numeric prefix (001_, 002_) determines execution order.
    """
    pattern = os.path.join(MIGRATIONS_DIR, "*.sql")
    files = glob.glob(pattern)
    # Sort by filename (not full path) so 001_ < 002_ < 003_
    return sorted(files, key=lambda f: os.path.basename(f))


async def run_migrations(reset: bool = False):
    """
    Apply all pending migrations.

    If reset=True, drops the schema_migrations table first,
    causing all migrations to re-run (useful during development).
    """
    conn = await get_connection()

    try:
        if reset:
            print("⚠  --reset flag: dropping migration history")
            await conn.execute("DROP TABLE IF EXISTS schema_migrations CASCADE")

        await ensure_migration_table(conn)
        applied = await get_applied_migrations(conn)
        migration_files = get_migration_files()

        if not migration_files:
            print("No migration files found in", MIGRATIONS_DIR)
            return

        pending = [
            f for f in migration_files
            if os.path.basename(f) not in applied
        ]

        if not pending:
            print("✓ All migrations already applied. Nothing to do.")
            return

        for filepath in pending:
            filename = os.path.basename(filepath)
            print(f"  Applying {filename} ...", end=" ")

            with open(filepath, "r") as f:
                sql = f.read()

            # Run the migration inside a transaction.
            # If any statement fails, the whole migration is rolled back.
            async with conn.transaction():
                await conn.execute(sql)
                await conn.execute(
                    "INSERT INTO schema_migrations (filename) VALUES ($1)",
                    filename,
                )

            print("✓")

        print(f"\n✓ Applied {len(pending)} migration(s) successfully.")

    finally:
        await conn.close()


def main():
    reset = "--reset" in sys.argv
    asyncio.run(run_migrations(reset=reset))


if __name__ == "__main__":
    main()
