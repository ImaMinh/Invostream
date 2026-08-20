"""
Content-addressable file deduplication service.
Single source of truth for hashing, checking, and recording file fingerprints.
Supports user-scoped duplicate detection for exact content matches and business identifiers.
"""
import hashlib
from typing import Any, Optional
from db.postgresql.pool import get_db_connection

def compute_hash(file_bytes: bytes) -> str:
    """SHA-256 fingerprint of raw file content."""
    return hashlib.sha256(file_bytes).hexdigest()

def compute_hash_from_path(file_path: str) -> str:
    """SHA-256 fingerprint from a file on disk."""
    with open(file_path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

async def find_existing(hashes: list[str], user_id: Optional[str] = None) -> set[str]:
    """
    Return the subset of hashes that already exist in the DB for the given user.
    If user_id is provided, checks only that user's invoices.
    If user_id is None, checks legacy/unassigned records (user_id IS NULL).
    """
    if not hashes:
        return set()
    
    async with get_db_connection() as conn:
        if user_id:
            query = """
                SELECT content_hash 
                FROM invoices 
                WHERE (user_id = $2 OR user_id IS NULL) 
                  AND content_hash = ANY($1::text[])
            """
            rows = await conn.fetch(query, hashes, user_id)
        else:
            query = """
                SELECT content_hash 
                FROM invoices 
                WHERE user_id IS NULL 
                  AND content_hash = ANY($1::text[])
            """
            rows = await conn.fetch(query, hashes)

        return {r["content_hash"] for r in rows if r["content_hash"]}

async def is_duplicate(content_hash: str, user_id: Optional[str] = None) -> bool:
    """Check if a single content hash exists for the given user."""
    existing = await find_existing([content_hash], user_id=user_id)
    return content_hash in existing

async def find_duplicate_invoices_for_user(user_id: Optional[str] = None) -> list[dict[str, Any]]:
    """
    Finds all duplicate invoice clusters for a user.
    Detects both:
    1. Exact file duplicates (identical content_hash)
    2. Document metadata duplicates (same vendor_name and invoice_id)
    
    Returns a list of duplicate group records containing matching invoice IDs and metadata.
    """
    async with get_db_connection() as conn:
        if user_id:
            query = """
                SELECT id, job_id, file_name, vendor_name, invoice_id, 
                       DATE(created_at) as date, created_at, invoice_total, 
                       status, reason, content_hash
                FROM invoices
                WHERE (user_id = $1 OR user_id IS NULL)
                ORDER BY created_at DESC
            """
            rows = await conn.fetch(query, user_id)
        else:
            query = """
                SELECT id, job_id, file_name, vendor_name, invoice_id, 
                       DATE(created_at) as date, created_at, invoice_total, 
                       status, reason, content_hash
                FROM invoices
                WHERE user_id IS NULL
                ORDER BY created_at DESC
            """
            rows = await conn.fetch(query)

    # Group by content_hash
    hash_groups: dict[str, list[dict]] = {}
    # Group by (vendor_name, invoice_id)
    doc_groups: dict[tuple[str, str], list[dict]] = {}

    for row in rows:
        inv = {
            "id": str(row["id"]),
            "file_name": row["file_name"],
            "vendor_name": row["vendor_name"],
            "invoice_id": row["invoice_id"],
            "date": row["date"].strftime("%Y-%m-%d") if row["date"] else None,
            "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
            "total": float(row["invoice_total"]) if row["invoice_total"] is not None else None,
            "status": row["status"],
            "reason": row["reason"],
            "content_hash": row["content_hash"],
        }

        # Index by content_hash
        c_hash = row["content_hash"]
        if c_hash:
            hash_groups.setdefault(c_hash, []).append(inv)

        # Index by document identifier
        vendor = (row["vendor_name"] or "").strip().lower()
        inv_num = (row["invoice_id"] or "").strip().lower()
        if vendor and inv_num:
            doc_groups.setdefault((vendor, inv_num), []).append(inv)

    duplicate_groups = []
    seen_group_invoice_ids: set[frozenset[str]] = set()

    # 1. Collect exact file duplicates (same hash)
    for c_hash, group_items in hash_groups.items():
        if len(group_items) > 1:
            group_ids = frozenset(item["id"] for item in group_items)
            seen_group_invoice_ids.add(group_ids)
            duplicate_groups.append({
                "group_id": f"hash_{c_hash[:12]}",
                "type": "exact_file",
                "label": f"Identical file uploaded {len(group_items)} times",
                "count": len(group_items),
                "invoices": group_items,
            })

    # 2. Collect document metadata duplicates (same vendor + invoice #)
    for (vendor, inv_num), group_items in doc_groups.items():
        if len(group_items) > 1:
            group_ids = frozenset(item["id"] for item in group_items)
            # Avoid duplicate reporting if already clustered under hash
            if group_ids not in seen_group_invoice_ids:
                seen_group_invoice_ids.add(group_ids)
                display_vendor = group_items[0]["vendor_name"] or vendor.title()
                display_inv = group_items[0]["invoice_id"] or inv_num.upper()
                duplicate_groups.append({
                    "group_id": f"doc_{vendor[:6]}_{inv_num[:8]}",
                    "type": "document_match",
                    "label": f"Matching invoice #{display_inv} from {display_vendor} ({len(group_items)} copies)",
                    "count": len(group_items),
                    "invoices": group_items,
                })

    return duplicate_groups