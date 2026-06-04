"""
ClickHouse analytics insertion module.

This is the "Dual Write" counterpart to db/postgresql/invoices.py.
After every invoice is inserted into PostgreSQL, this module inserts
the same data into ClickHouse's analytics tables.

Tables written to:
  1. invoice_facts       — one row per invoice (denormalized summary)
  2. line_item_facts     — one row per line item (drill-down)
  3. field_confidence    — one row per extracted field (quality tracking)
"""

import uuid
from models.invoice import Invoice
from db.clickhouse.client import get_clickhouse_client


# =============================================
# Helper: compute quality metrics from raw_fields
# =============================================
def _compute_confidence_metrics(raw_fields: dict) -> dict:
    """
    Extracts confidence scores from the raw_fields dictionary
    and computes aggregate quality metrics.
    
    raw_fields format (from Azure):
        {
            "VendorName":    {"value": "Acme Corp", "confidence": 0.95},
            "InvoiceTotal":  {"value": "1500.00",   "confidence": 0.88},
            ...
        }
    """
    if not raw_fields:
        return {
            "avg_confidence": 0.0,
            "min_confidence": 0.0,
            "fields_extracted_count": 0,
            "low_confidence_field_count": 0,
        }
    
    confidences = []
    low_count = 0
    
    for field_name, field_data in raw_fields.items():
        if isinstance(field_data, dict) and "confidence" in field_data:
            conf = field_data["confidence"]
            if conf is not None:
                confidences.append(conf)
                if conf < 0.8:
                    low_count += 1
    
    if not confidences:
        return {
            "avg_confidence": 0.0,
            "min_confidence": 0.0,
            "fields_extracted_count": len(raw_fields),
            "low_confidence_field_count": 0,
        }
    
    return {
        "avg_confidence": sum(confidences) / len(confidences),
        "min_confidence": min(confidences),
        "fields_extracted_count": len(confidences),
        "low_confidence_field_count": low_count,
    }


# =============================================
# 1. Insert into invoice_facts
# =============================================
def insert_invoice_facts(invoice: Invoice, invoice_uuid: str, batch_id: str) -> None:
    """
    Inserts a single row into the invoice_facts table.
    
    Args:
        invoice:      The Pydantic Invoice model with all extracted data.
        invoice_uuid: The UUID returned by PostgreSQL after insert (links the two databases).
        batch_id:     The batch this invoice belongs to.
    """
    client = get_clickhouse_client()
    metrics = _compute_confidence_metrics(invoice.raw_fields)
    
    # Column names must match the CREATE TABLE in 001_analytics_schema.sql
    columns = [
        "id", "job_id", "batch_id", "file_name",
        "status", "template_name",
        "vendor_name", "vendor_tax_id",
        "customer_name", "customer_id", "customer_tax_id",
        "currency", "country_code",
        "invoice_id", "invoice_date", "due_date",
        "subtotal", "total_discount", "total_tax",
        "invoice_total", "amount_due",
        "avg_confidence", "min_confidence",
        "fields_extracted_count", "low_confidence_field_count",
        "line_item_count",
    ]
    
    row = [
        uuid.UUID(invoice_uuid),
        invoice.job_id,
        batch_id,
        invoice.file_name,
        invoice.status,
        invoice.template_name or "",
        invoice.vendor_name or "",
        invoice.vendor_tax_id or "",
        invoice.customer_name or "",
        invoice.customer_id or "",
        invoice.customer_tax_id or "",
        invoice.currency or "",
        invoice.country_code or "",
        invoice.invoice_id or "",
        invoice.invoice_date,          # Date or None → Nullable(Date)
        invoice.due_date,              # Date or None → Nullable(Date)
        float(invoice.subtotal or 0),
        float(invoice.total_discount or 0),
        float(invoice.total_tax or 0),
        float(invoice.invoice_total or 0),
        float(invoice.amount_due or 0),
        metrics["avg_confidence"],
        metrics["min_confidence"],
        metrics["fields_extracted_count"],
        metrics["low_confidence_field_count"],
        len(invoice.line_items),
    ]
    
    client.insert("invoice_facts", [row], column_names=columns)


# =============================================
# 2. Insert into line_item_facts
# =============================================
def insert_line_item_facts(invoice: Invoice, invoice_uuid: str, batch_id: str) -> None:
    """
    Inserts one row per line item into the line_item_facts table.
    Each row is denormalized with parent invoice context so
    dashboards can drill down without JOINs.
    """
    if not invoice.line_items:
        return
    
    client = get_clickhouse_client()
    
    columns = [
        "line_item_id", "invoice_id", "job_id", "batch_id",
        "line_number", "description", "quantity", "unit_price", "amount",
        "vendor_name", "customer_name", "template_name",
        "invoice_status", "currency", "invoice_date", "invoice_total",
    ]
    
    rows = []
    for item in invoice.line_items:
        rows.append([
            uuid.uuid4(),                           # generate a UUID for each line item
            uuid.UUID(invoice_uuid),                # parent invoice UUID
            invoice.job_id,
            batch_id,
            item.line_number or 0,
            item.description or "",
            float(item.quantity or 0),
            float(item.unit_price or 0),
            float(item.amount or 0),
            # --- denormalized invoice context ---
            invoice.vendor_name or "",
            invoice.customer_name or "",
            invoice.template_name or "",
            invoice.status,
            invoice.currency or "",
            invoice.invoice_date,                   # Nullable(Date)
            float(invoice.invoice_total or 0),
        ])
    
    # Batch insert: all line items in one HTTP call (much faster than one-by-one)
    client.insert("line_item_facts", rows, column_names=columns)


# =============================================
# 3. Insert into field_confidence
# =============================================
def insert_field_confidence(invoice: Invoice, invoice_uuid: str) -> None:
    """
    Inserts one row per extracted field into the field_confidence table.
    This powers the per-field accuracy dashboard.
    
    Data source: the raw_fields JSONB dict on the Invoice model.
    """
    if not invoice.raw_fields:
        return
    
    client = get_clickhouse_client()
    
    columns = [
        "invoice_id", "job_id",
        "field_name", "field_value", "confidence",
        "template_name",
    ]
    
    rows = []
    for field_name, field_data in invoice.raw_fields.items():
        if not isinstance(field_data, dict):
            continue
        
        rows.append([
            uuid.UUID(invoice_uuid),
            invoice.job_id,
            field_name,
            str(field_data.get("value", "")),
            float(field_data.get("confidence", 0) or 0),
            invoice.template_name or "",
        ])
    
    if rows:
        client.insert("field_confidence", rows, column_names=columns)


# =============================================
# Main entry point: insert all analytics data
# =============================================
def insert_analytics(invoice: Invoice, invoice_uuid: str, batch_id: str) -> None:
    """
    Dual-write entry point. Call this right after the PostgreSQL insert succeeds.
    Populates all three ClickHouse analytics tables in one shot.
    
    Args:
        invoice:      The Pydantic Invoice model.
        invoice_uuid: The UUID string returned from PostgreSQL's RETURNING id.
        batch_id:     The batch identifier.
    """
    try:
        insert_invoice_facts(invoice, invoice_uuid, batch_id)
        insert_line_item_facts(invoice, invoice_uuid, batch_id)
        insert_field_confidence(invoice, invoice_uuid)
        print(f"<--ClickHouse--> Analytics data inserted for invoice {invoice.job_id}")
    except Exception as e:
        # Log the error but do NOT crash the pipeline.
        # ClickHouse is the analytics copy, not the source of truth.
        # If it fails, PostgreSQL still has the data.
        print(f"<--ClickHouse--> ERROR inserting analytics for {invoice.job_id}: {e}")
