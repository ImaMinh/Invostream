from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from db.postgresql.pool import get_db_connection
from db.sqlite.job_queue import get_queue_size
from db.clickhouse.client import get_clickhouse_client
from datetime import datetime, timedelta
import math

router = APIRouter(prefix="/api/invoices", tags=["invoice"])

@router.get("/review-invoices")
async def get_review_invoices():
    try:
        async with get_db_connection() as conn:
            query = """
            SELECT id, vendor_name, DATE(created_at) as date, invoice_total, status, raw_fields
            FROM invoices
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
                    "total": f"${float(row['invoice_total']):,.2f}" if row['invoice_total'] is not None else "----",
                    "status": row["status"],
                    "confidence": "Review" # Will improve this later if raw_fields holds exact confidence
                })
            
            return invoices
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/invoice/{invoice_id}")
async def get_invoice_detail(invoice_id: str):
    try:
        # Full uuid lookup since the ID param is either truncated or full. 
        # Wait, the list UI has truncated UUIDs. We must fix the list UI to send the full UUID to the detail page, while displaying truncated.
        # I'll update ReviewInvoices to use full ID.
        async with get_db_connection() as conn:
            query = "SELECT * FROM invoices WHERE id = $1"
            row = await conn.fetchrow(query, invoice_id)
            if not row:
                raise HTTPException(status_code=404, detail="Invoice not found")
            
            return dict(row)
    except Exception as e:
        print(f"Error fetching invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.put("/invoice/{invoice_id}")
async def update_invoice_detail(invoice_id: str, payload: Dict[str, Any] = Body(...)):
    try:
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
            
            query = f"UPDATE invoices SET {', '.join(updates)} WHERE id = $1 RETURNING *"
            row = await conn.fetchrow(query, invoice_id, *values)
            
            return dict(row)
    except Exception as e:
        print(f"Error updating invoice {invoice_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


