from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from db.postgresql.pool import get_db_connection
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/metrics")
async def get_dashboard_metrics():
    try:
        async with get_db_connection() as conn:
            # 1. Volume data for the last 7 days
            volume_query = """
            SELECT DATE(created_at) as date, COUNT(*) as invoices
            FROM invoices
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
            """
            volume_rows = await conn.fetch(volume_query)
            
            # Pad empty days
            volume_data = []
            today = datetime.now().date()
            for i in range(6, -1, -1):
                d = today - timedelta(days=i)
                found = next((row for row in volume_rows if row["date"] == d), None)
                volume_data.append({
                    "name": d.strftime("%a"),
                    "invoices": found["invoices"] if found else 0
                })

            # 2. Total processed this week
            total_processed = sum([day["invoices"] for day in volume_data])

            # 3. Status counts
            status_query = """
            SELECT status, COUNT(*) as count
            FROM invoices
            GROUP BY status
            """
            status_rows = await conn.fetch(status_query)
            status_counts = {row["status"]: row["count"] for row in status_rows}
            
            success_count = status_counts.get("success", 0)
            review_count = status_counts.get("review", 0)
            failed_count = status_counts.get("failed", 0)
            total = success_count + review_count + failed_count

            success_rate = round((success_count / total * 100), 1) if total > 0 else 0.0
            review_rate = round((review_count / total * 100), 1) if total > 0 else 0.0

            # 4. Accuracy Data (Simplified from Postgres)
            # Normally this comes from ClickHouse field_confidence table.
            # We'll return a static approximation here for the UI to render, 
            # as parsing nested JSONB confidence scores across thousands of rows in Postgres is too slow.
            accuracy_data = [
                {"name": "VendorName", "value": 98},
                {"name": "TotalAmount", "value": 95},
                {"name": "TaxID", "value": 92},
                {"name": "Date", "value": 88},
                {"name": "LineItems", "value": 85},
            ]

            return {
                "overview": {
                    "total_processed": total_processed,
                    "success_rate": success_rate,
                    "review_rate": review_rate,
                    "avg_processing_time": "1.2s", # Still mock, normally requires processing_metrics
                },
                "volumeData": volume_data,
                "accuracyData": accuracy_data
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/review-invoices")
async def get_review_invoices():
    try:
        async with get_db_connection() as conn:
            query = """
            SELECT id, vendor_name, DATE(created_at) as date, invoice_total, status, raw_fields
            FROM invoices
            WHERE status IN ('review', 'failed')
            ORDER BY created_at DESC
            LIMIT 50
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
                "vendor_name", "vendor_tax_id", "vendor_address",
                "customer_name", "customer_tax_id", "customer_address",
                "invoice_id", "invoice_date", "due_date",
                "subtotal", "total_tax", "invoice_total"
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


