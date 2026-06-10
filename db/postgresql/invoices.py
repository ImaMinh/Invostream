"""
Script to manage invoice data in PostgreSQL invoices table. 
This module provides functions to insert extracted invoice data into the database, 
as well as query and update invoice records.
"""

import json
from datetime import datetime
from db.postgresql.pool import get_db_connection
from models.invoice import Invoice, InvoiceLineItem
from asyncpg import Connection

# === --- DB QUERY FUNCTIONS --- ===

# === -- Insertion Functions -- ===

# -- insert line items into invoice_line_items table --
async def insert_line_items(invoice_id: str, line_items: list[InvoiceLineItem], connection: Connection) -> None:
    """
    Inserts line items associated with a specific invoice into the invoice_line_items table.
    Each line item is linked to the invoice via the invoice_id foreign key.
    """
    if not line_items:
        print(f"<--INSERT_LINE_ITEMS--> No line items to insert for invoice {invoice_id}")
        return
    
    # build query from first item -- columns are the same for all items
    fields_template = {
        "invoice_id":   None,
        "line_number":  None,
        "description":  None,
        "quantity":     None,
        "unit_price":   None,
        "amount":       None,
    }

    columns = list(fields_template.keys())
    placeholders = ", ".join(f"${i+1}" for i in range(len(columns)))

    # build the sql string
    sql_query = f"""
        INSERT INTO invoice_line_items ({", ".join(columns)})
        VALUES ({placeholders})
    """

    try:     
        for item in line_items:
            values = [
                invoice_id,
                item.line_number,
                item.description,
                item.quantity,
                item.unit_price,
                item.amount,
            ]
            await connection.execute(sql_query, *values)

        print(f"<--INSERT_LINE_ITEMS--> Inserted {len(line_items)} line items for invoice {invoice_id}")

    except Exception as e:
        print(f"<--INSERT_LINE_ITEMS--> Error inserting line items for invoice {invoice_id}: {e}")
        raise

# -- insert new invoice into invoices table --
async def insert_invoice(extracted_data: Invoice) -> str:
    """
    Inserts a new invoice record into the invoices table, along with its associated line items.
    This function uses a transaction to ensure that both the invoice and its line items are inserted atomically.
    """
    
    # field mapping dictionary
    fields = {
        "job_id":                        extracted_data.job_id,
        "file_name":                     extracted_data.file_name,
        "status":                        extracted_data.status,
        "template_name":                 extracted_data.template_name,
        "country_code":                  extracted_data.country_code,
        "currency":                      extracted_data.currency,
        "customer_name":                 extracted_data.customer_name,
        "customer_id":                   extracted_data.customer_id,
        "customer_tax_id":               extracted_data.customer_tax_id,
        "customer_address":              extracted_data.customer_address,
        "customer_address_recipient":    extracted_data.customer_address_recipient,
        "vendor_name":                   extracted_data.vendor_name,
        "vendor_tax_id":                 extracted_data.vendor_tax_id,
        "vendor_address":                extracted_data.vendor_address,
        "vendor_address_recipient":      extracted_data.vendor_address_recipient,
        "purchase_order":                extracted_data.purchase_order,
        "invoice_id":                    extracted_data.invoice_id,
        "invoice_date":                  extracted_data.invoice_date,
        "due_date":                      extracted_data.due_date,
        "billing_address":               extracted_data.billing_address,
        "billing_address_recipient":     extracted_data.billing_address_recipient,
        "shipping_address":              extracted_data.shipping_address,
        "shipping_address_recipient":    extracted_data.shipping_address_recipient,
        "remittance_address":            extracted_data.remittance_address,
        "remittance_address_recipient":  extracted_data.remittance_address_recipient,
        "service_address":               extracted_data.service_address,
        "service_address_recipient":     extracted_data.service_address_recipient,
        "service_start_date":            extracted_data.service_start_date,
        "service_end_date":              extracted_data.service_end_date,
        "subtotal":                      extracted_data.subtotal,
        "total_discount":                extracted_data.total_discount,
        "total_tax":                     extracted_data.total_tax,
        "invoice_total":                 extracted_data.invoice_total,
        "amount_due":                    extracted_data.amount_due,
        "previous_unpaid_balance":       extracted_data.previous_unpaid_balance,
        "payment_term":                  extracted_data.payment_term,
        "kvk_number":                    extracted_data.kvk_number,
        # JSONB fields need json.dumps, use Pydantic's model_dump(mode='json') to safely serialize Decimals/Dates
        "payment_details":               json.dumps(extracted_data.model_dump(mode='json').get('payment_details') or {}),
        "tax_details":                   json.dumps(extracted_data.model_dump(mode='json').get('tax_details') or {}),
        "paid_in_four_installments":     json.dumps(extracted_data.model_dump(mode='json').get('paid_in_four_installments') or []),
        "raw_fields":                    json.dumps(extracted_data.model_dump(mode='json').get('raw_fields') or {}),
        "content_hash":                  extracted_data.content_hash,
        "total_processing_time_ms":      extracted_data.total_processing_time_ms,
    }
    
    columns = list(fields.keys())
    values = list(fields.values())
    
    # placeholder for values in SQL query 
    placeholders = ",".join(f"${i+1}" for i in range(len(values)))
    
    # construct the SQL query (ON CONFLICT for dedup safety net):
    sql_query = f"""
    INSERT INTO invoices ({",".join(columns)})
    VALUES ({placeholders})
    ON CONFLICT (content_hash) WHERE content_hash IS NOT NULL DO NOTHING
    RETURNING id;
    """
    
    try:
        async with get_db_connection() as connection:
            # ensure invoice and line items are inserted atomically. 
            # A transaction is a sequence of database operations that are treated as a single unit of work. 
            # Either all operations in the transaction are executed successfully, or none of them are applied, 
            # ensuring data integrity.
            async with connection.transaction():
                invoice_id = await connection.fetchval(sql_query, *values)
                
                # If invoice_id is None, the insert was skipped due to duplicate content_hash
                if invoice_id is None:
                    print(f"<--INSERT_INVOICE--> Duplicate detected (content_hash), skipping invoice for job {extracted_data.job_id}")
                    return None
                
                
                await insert_line_items(invoice_id, extracted_data.line_items, connection)
                print(f"<--INSERT_INVOICE--> Successfully inserted invoice with ID: {invoice_id} for job {extracted_data.job_id}")
                return str(invoice_id)
    except Exception as e:
        print(f"<--INSERT_INVOICE--> Error inserting invoice for job {extracted_data.job_id}: {e}")
        raise