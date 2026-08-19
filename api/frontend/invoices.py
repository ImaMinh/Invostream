from typing import Any
from fastapi import APIRouter, HTTPException, Body, Depends
from db.postgresql.pool import get_db_connection
from fastapi.responses import StreamingResponse
from services.telemetry.progress import upload_progress_tracker
from services.security.clerk_auth import verify_clerk_token

router = APIRouter(prefix="/api/invoices", tags=["invoice"])

@router.get("/review-invoices")
async def get_review_invoices(user: dict = Depends(verify_clerk_token)):
    try:
        user_id = user.get("sub")
        async with get_db_connection() as conn:
            if user_id:
                query = """
                SELECT id, vendor_name, DATE(created_at) as date, created_at, invoice_total, status, reason, raw_fields
                FROM invoices
                WHERE (user_id = $1 OR user_id IS NULL)
                ORDER BY created_at DESC
                """
                rows = await conn.fetch(query, user_id)
            else:
                query = """
                SELECT id, vendor_name, DATE(created_at) as date, created_at, invoice_total, status, reason, raw_fields
                FROM invoices
                WHERE user_id IS NULL
                ORDER BY created_at DESC
                """
                rows = await conn.fetch(query)
            
            invoices = []
            for row in rows:
                invoices.append({
                    "id": str(row["id"]), # Full UUID
                    "display_id": str(row["id"]).split('-')[0].upper(), # Truncated
                    "vendor": row["vendor_name"] or "Unknown",
                    "date": row["date"].strftime("%Y-%m-%d") if row["date"] else "N/A",
                    "created_at": row["created_at"].isoformat() if row.get("created_at") else (row["date"].strftime("%Y-%m-%d") if row["date"] else None),
                    "total": f"${float(row['invoice_total']):,.2f}" if row['invoice_total'] is not None else "----",
                    "raw_total": float(row['invoice_total']) if row['invoice_total'] is not None else 0.0,
                    "status": row["status"],
                    "reason": row["reason"] or "",
                    # TODO: Calculate confidence score dynamically from raw_fields instead of hardcoded "Review"
                    "confidence": "Review"
                })
            
            return invoices
    except Exception as e:
        print(f"Error fetching review invoices: {e}")
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
            
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.put("/invoice/{invoice_id}")
async def update_invoice_detail(invoice_id: str, payload: dict[str, Any] = Body(...), user: dict = Depends(verify_clerk_token)):
    try:
        user_id = user.get("sub")
        async with get_db_connection() as conn:
            # We only allow updating specific fields
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
            
            for idx, field in enumerate(allowed_fields, start=2):
                if field in payload:
                    updates.append(f"{field} = ${idx}")
                    # Convert empty strings to None
                    val = payload[field]
                    if val == "": val = None
                    values.append(val)
            
            if not updates:
                return {"status": "no_changes"}
                
            updates.append(f"status = 'success'") # Automatically approve when saved manually
            
            if user_id:
                user_id_param_idx = len(values) + 2
                query = f"UPDATE invoices SET {', '.join(updates)} WHERE id = $1 AND (user_id = ${user_id_param_idx} OR user_id IS NULL) RETURNING *"
                row = await conn.fetchrow(query, invoice_id, *values, user_id)
            else:
                query = f"UPDATE invoices SET {', '.join(updates)} WHERE id = $1 AND user_id IS NULL RETURNING *"
                row = await conn.fetchrow(query, invoice_id, *values)
            
            if not row:
                raise HTTPException(status_code=404, detail="Invoice not found or access denied")
                
            return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/upload/{upload_id}/progress")
async def stream_upload_progress(upload_id: str):
    """
    Streaming SSE data for upload job progress
    """
    return StreamingResponse(
        upload_progress_tracker.subscribe(upload_id), media_type="text/event-stream"
    )


