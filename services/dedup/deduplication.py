"""
Content-addressable file deduplication service.
Single source of truth for hashing, checking, and recording file fingerprints.
"""
import hashlib
from db.postgresql.pool import get_db_connection

def compute_hash(file_bytes: bytes) -> str:
    """SHA-256 fingerprint of raw file content."""
    return hashlib.sha256(file_bytes).hexdigest()

def compute_hash_from_path(file_path: str) -> str:
    """SHA-256 fingerprint from a file on disk."""
    with open(file_path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

async def find_existing(hashes: list[str]) -> set[str]:
    """Return the subset of hashes that already exist in the DB."""
    if not hashes:
        return set()
    async with get_db_connection() as conn:
        # O(1) query for finding the hashes. $1::text[] broadcasts the hashes into a
        # Postgres text array for efficient lookup.
        rows = await conn.fetch(
            "SELECT content_hash FROM invoices WHERE content_hash = ANY($1::text[])",
            hashes
        )
        return {r["content_hash"] for r in rows}

async def is_duplicate(content_hash: str) -> bool:
    """Check if a single hash exists."""
    existing = await find_existing([content_hash])
    return content_hash in existing