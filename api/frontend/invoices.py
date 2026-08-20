from typing import Any
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID
import re
import traceback
from fastapi import APIRouter, HTTPException, Body, Depends
from db.postgresql.pool import get_db_connection
from fastapi.responses import StreamingResponse
from services.telemetry.progress import upload_progress_tracker
from services.security.clerk_auth import verify_clerk_token
from services.dedup.deduplication import find_duplicate_invoices_for_user

router = APIRouter(prefix="/api/invoices", tags=["invoice"])


def parse_date_safely(val: Any) -> date | None:
    if not val or val == "N/A" or val == "":
        return None
    if isinstance(val, date):
        return val
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, str):
        val = val.strip()
        try:
            return datetime.fromisoformat(val.replace("Z", "")).date()
        except ValueError:
            pass
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%b %d, %Y", "%d %b %Y"):
            try:
                return datetime.strptime(val, fmt).date()
            except ValueError:
                pass
    return None


def parse_numeric_safely(val: Any) -> Decimal | None:
    if val is None or val == "" or val == "N/A":
        return None
    if isinstance(val, (int, float, Decimal)):
        return Decimal(str(val))
    if isinstance(val, str):
        cleaned = re.sub(r"[^\d.-]", "", val).strip()
        try:
            return Decimal(cleaned) if cleaned else None
        except Exception:
            return None
    return None


@router.get("/review-invoices")
async def get_review_invoices(user: dict = Depends(verify_clerk_token)):
    try:
        # authentication and user scoping
        user_id = user.get("sub")
        
        async with get_db_connection() as conn:
            
            # sql query and fetching 
            if user_id:
                query = """
                SELECT id, file_name, vendor_name, invoice_id, DATE(created_at) as date, created_at, invoice_total, status, reason, raw_fields, content_hash, COALESCE(is_duplicate_resolved, FALSE) as is_duplicate_resolved
                FROM invoices
                WHERE user_id = $1
                ORDER BY created_at DESC
                """
                rows = await conn.fetch(query, user_id)
            else:
                query = """
                SELECT id, file_name, vendor_name, invoice_id, DATE(created_at) as date, created_at, invoice_total, status, reason, raw_fields, content_hash, COALESCE(is_duplicate_resolved, FALSE) as is_duplicate_resolved
                FROM invoices
                WHERE user_id IS NULL
                ORDER BY created_at DESC
                """
                rows = await conn.fetch(query)
            
            # Group rows to identify duplicate clusters in this user's dataset (skipping resolved ones)
            hash_counts: dict[str, list[str]] = {}
            doc_counts: dict[tuple[str, str], list[str]] = {}

            for row in rows:
                if row.get("is_duplicate_resolved"):
                    continue
                # checking for duplicated rows.
                row_id = str(row["id"])
                c_hash = row["content_hash"]
                if c_hash:
                    hash_counts.setdefault(c_hash, []).append(row_id)
                
                # checking for existing vendor and invoice id. 
                vendor = (row["vendor_name"] or "").strip().lower()
                inv_num = (row["invoice_id"] or "").strip().lower()
                if vendor and inv_num:
                    # checking if both the vendor + inv_num existed in the list. 
                    doc_counts.setdefault((vendor, inv_num), []).append(row_id)

            invoices = []
            for row in rows:
                row_id = str(row["id"])
                c_hash = row["content_hash"]
                vendor = (row["vendor_name"] or "").strip().lower()
                inv_num = (row["invoice_id"] or "").strip().lower()
                is_resolved = bool(row.get("is_duplicate_resolved", False))

                # Determine duplication status
                is_dup = False
                dup_type = None
                dup_group_id = None
                dup_count = 0
                matching_ids = []

                if not is_resolved:
                    if c_hash and len(hash_counts.get(c_hash, [])) > 1:
                        is_dup = True
                        dup_type = "exact_file"
                        dup_group_id = f"hash_{c_hash[:12]}"
                        matching_ids = [i for i in hash_counts[c_hash] if i != row_id]
                        dup_count = len(hash_counts[c_hash])
                    elif vendor and inv_num and len(doc_counts.get((vendor, inv_num), [])) > 1:
                        is_dup = True
                        dup_type = "document_match"
                        dup_group_id = f"doc_{vendor[:6]}_{inv_num[:8]}"
                        matching_ids = [i for i in doc_counts[(vendor, inv_num)] if i != row_id]
                        dup_count = len(doc_counts[(vendor, inv_num)])

                invoices.append({
                    "id": row_id, # Full UUID
                    "display_id": inv_num, # Truncated
                    "file_name": row["file_name"] or "Unknown file",
                    "invoice_number": row["invoice_id"] or "N/A",
                    "vendor": row["vendor_name"] or "Unknown",
                    "date": row["date"].strftime("%Y-%m-%d") if row["date"] else "N/A",
                    "created_at": row["created_at"].isoformat() if row.get("created_at") else (row["date"].strftime("%Y-%m-%d") if row["date"] else None),
                    "total": f"${float(row['invoice_total']):,.2f}" if row['invoice_total'] is not None else "----",
                    "raw_total": float(row['invoice_total']) if row['invoice_total'] is not None else 0.0,
                    "status": row["status"],
                    "reason": row["reason"] or "",
                    "content_hash": c_hash,
                    "is_duplicate": is_dup,
                    "is_duplicate_resolved": is_resolved,
                    "duplicate_type": dup_type,
                    "duplicate_group_id": dup_group_id,
                    "duplicate_count": dup_count,
                    "matching_duplicate_ids": matching_ids,
                    "confidence": "Review"
                })
            
            return invoices
    except Exception as e:
        print(f"Error fetching review invoices: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/invoice/{invoice_id}/resolve-duplicate")
async def resolve_duplicate_invoice(
    invoice_id: str,
    user: dict = Depends(verify_clerk_token)
):
    try:
        user_id = user.get("sub")
        async with get_db_connection() as conn:
            if user_id:
                query = """
                    UPDATE invoices 
                    SET is_duplicate_resolved = TRUE, updated_at = NOW() 
                    WHERE id = $1::uuid AND (user_id = $2 OR user_id IS NULL) 
                    RETURNING id, is_duplicate_resolved
                """
                row = await conn.fetchrow(query, invoice_id, user_id)
            else:
                query = """
                    UPDATE invoices 
                    SET is_duplicate_resolved = TRUE, updated_at = NOW() 
                    WHERE id = $1::uuid AND user_id IS NULL 
                    RETURNING id, is_duplicate_resolved
                """
                row = await conn.fetchrow(query, invoice_id)
                
            if not row:
                raise HTTPException(status_code=404, detail="Invoice not found or access denied")
                
            return {"status": "success", "id": str(row["id"]), "is_duplicate_resolved": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error resolving duplicate for invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to resolve duplicate: {str(e)}")

@router.get("/duplicates")
async def get_duplicate_invoices(user: dict = Depends(verify_clerk_token)):
    try:
        user_id = user.get("sub")
        duplicate_groups = await find_duplicate_invoices_for_user(user_id)
        return duplicate_groups
    except Exception as e:
        print(f"Error fetching duplicate invoices: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/invoice/{invoice_id}")
async def get_invoice_detail(invoice_id: str, user: dict = Depends(verify_clerk_token)):
    try:
        user_id = user.get("sub")
        async with get_db_connection() as conn:
            if user_id:
                query = "SELECT * FROM invoices WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)"
                row = await conn.fetchrow(query, invoice_id, user_id)
            else:
                query = "SELECT * FROM invoices WHERE id = $1 AND user_id IS NULL"
                row = await conn.fetchrow(query, invoice_id)

            if not row:
                raise HTTPException(status_code=404, detail="Invoice not found")
            
            invoice_dict = dict(row)

            # Fetch associated line items
            line_items_query = """
                SELECT id, invoice_id, line_number, description, quantity, unit_price, amount 
                FROM invoice_line_items 
                WHERE invoice_id = $1 
                ORDER BY line_number ASC, id ASC
            """
            line_item_rows = await conn.fetch(line_items_query, invoice_id)
            invoice_dict["line_items"] = [
                {
                    "id": str(li["id"]),
                    "invoice_id": str(li["invoice_id"]),
                    "line_number": li["line_number"],
                    "description": li["description"],
                    "quantity": float(li["quantity"]) if li["quantity"] is not None else None,
                    "unit_price": float(li["unit_price"]) if li["unit_price"] is not None else None,
                    "amount": float(li["amount"]) if li["amount"] is not None else None,
                }
                for li in line_item_rows
            ]
            
            return invoice_dict
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.put("/invoice/{invoice_id}")
async def update_invoice_detail(
    invoice_id: str,
    payload: dict[str, Any] = Body(...),
    user: dict = Depends(verify_clerk_token)
):
    try:
        user_id = user.get("sub")
        async with get_db_connection() as conn:
            date_fields = {"invoice_date", "due_date", "service_start_date", "service_end_date"}
            numeric_fields = {
                "subtotal", "total_discount", "total_tax", "invoice_total",
                "amount_due", "previous_unpaid_balance"
            }
            allowed_fields = [
                "vendor_name", "vendor_tax_id", "vendor_address", "vendor_address_recipient",
                "customer_name", "customer_tax_id", "customer_address", "customer_address_recipient",
                "invoice_id", "purchase_order", "invoice_date", "due_date",
                "subtotal", "total_discount", "total_tax", "invoice_total", "amount_due", "previous_unpaid_balance",
                "country_code", "currency", "payment_term", "kvk_number",
                "billing_address", "shipping_address", "remittance_address", "service_address"
            ]
            
            updates = []
            values = []
            
            for field in allowed_fields:
                if field in payload:
                    raw_val = payload[field]
                    if field in date_fields:
                        val = parse_date_safely(raw_val)
                        values.append(val)
                        updates.append(f"{field} = ${len(values) + 1}::date")
                    elif field in numeric_fields:
                        val = parse_numeric_safely(raw_val)
                        values.append(val)
                        updates.append(f"{field} = ${len(values) + 1}::numeric")
                    elif field == "country_code":
                        val = str(raw_val).strip()[:2].upper() if raw_val and raw_val != "N/A" else None
                        values.append(val)
                        updates.append(f"{field} = ${len(values) + 1}")
                    elif field == "currency":
                        val = str(raw_val).strip()[:3].upper() if raw_val and raw_val != "N/A" else None
                        values.append(val)
                        updates.append(f"{field} = ${len(values) + 1}")
                    else:
                        val = None if (raw_val == "" or raw_val == "N/A" or raw_val is None) else str(raw_val).strip()
                        values.append(val)
                        updates.append(f"{field} = ${len(values) + 1}")
            
            if not updates:
                return {"status": "no_changes"}
                
            updates.append("status = 'success'") # Automatically approve when saved manually
            updates.append("reason = ''") # Clear review reasons on manual approval
            updates.append("updated_at = NOW()")
            
            if user_id:
                user_id_param_idx = len(values) + 2
                query = f"""
                    UPDATE invoices 
                    SET {', '.join(updates)} 
                    WHERE id = $1::uuid AND (user_id = ${user_id_param_idx} OR user_id IS NULL) 
                    RETURNING *
                """
                row = await conn.fetchrow(query, invoice_id, *values, user_id)
            else:
                query = f"""
                    UPDATE invoices 
                    SET {', '.join(updates)} 
                    WHERE id = $1::uuid AND user_id IS NULL 
                    RETURNING *
                """
                row = await conn.fetchrow(query, invoice_id, *values)
            
            if not row:
                raise HTTPException(status_code=404, detail="Invoice not found or access denied")
                
            row_dict = dict(row)
            serialized = {}
            for k, v in row_dict.items():
                if isinstance(v, (UUID, Decimal)):
                    serialized[k] = str(v)
                elif isinstance(v, (datetime, date)):
                    serialized[k] = v.isoformat()
                else:
                    serialized[k] = v
                    
            return serialized
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        print(f"Error updating invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update invoice: {str(e)}")

@router.delete("/invoice/{invoice_id}")
async def delete_invoice(
    invoice_id: str,
    user: dict = Depends(verify_clerk_token)
):
    try:
        user_id = user.get("sub")
        async with get_db_connection() as conn:
            if user_id:
                query = """
                    DELETE FROM invoices 
                    WHERE id = $1 AND (user_id = $2 OR user_id IS NULL) 
                    RETURNING id, file_name, job_id
                """
                row = await conn.fetchrow(query, invoice_id, user_id)
            else:
                query = """
                    DELETE FROM invoices 
                    WHERE id = $1 AND user_id IS NULL 
                    RETURNING id, file_name, job_id
                """
                row = await conn.fetchrow(query, invoice_id)
                
            if not row:
                raise HTTPException(status_code=404, detail="Invoice not found or access denied")
                
            return {
                "status": "success",
                "message": f"Invoice {invoice_id} deleted successfully",
                "deleted_id": str(row["id"]),
                "file_name": row["file_name"]
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/upload/{upload_id}/progress")
async def stream_upload_progress(upload_id: str):
    """
    Streaming SSE data for upload job progress
    """
    return StreamingResponse(
        upload_progress_tracker.subscribe(upload_id), media_type="text/event-stream"
    )


