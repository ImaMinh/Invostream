# import necessary modules for environment variable management
import os
from dotenv import load_dotenv
from services.telemetry.tracer import track_time, track_block

# import necessary modules for Azure Document Intelligence
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence.aio import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import DocumentField

# import necessary modules and functions from other files
from models.invoice import Invoice, InvoiceLineItem

# import Decimal for handling currency values
from decimal import Decimal

import asyncio

from services.dedup.deduplication import compute_hash_from_path
from services.telemetry.tracer import track_time


# Globals
# field map to map Azure's field names to Invoice model's field names. 
FIELD_MAP = {
    "CustomerName":               "customer_name",
    "CustomerId":                 "customer_id",
    "PurchaseOrder":              "purchase_order",
    "InvoiceId":                  "invoice_id",
    "InvoiceDate":                "invoice_date",
    "DueDate":                    "due_date",
    "VendorName":                 "vendor_name",
    "VendorAddress":              "vendor_address", 
    "VendorAddressRecipient":     "vendor_address_recipient",
    "CustomerAddress":            "customer_address",
    "CustomerAddressRecipient":   "customer_address_recipient",
    "BillingAddress":             "billing_address",
    "BillingAddressRecipient":    "billing_address_recipient",
    "ShippingAddress":            "shipping_address",
    "ShippingAddressRecipient":   "shipping_address_recipient",
    "SubTotal":                   "subtotal",
    "TotalDiscount":              "total_discount",
    "TotalTax":                   "total_tax",
    "InvoiceTotal":               "invoice_total",
    "AmountDue":                  "amount_due",
    "PreviousUnpaidBalance":      "previous_unpaid_balance",
    "RemittanceAddress":          "remittance_address",
    "RemittanceAddressRecipient": "remittance_address_recipient",
    "ServiceAddress":             "service_address",
    "ServiceAddressRecipient":    "service_address_recipient",
    "ServiceStartDate":           "service_start_date",
    "ServiceEndDate":             "service_end_date",
    "VendorTaxId":                "vendor_tax_id",
    "CustomerTaxId":              "customer_tax_id",
    "PaymentTerm":                "payment_term",
    "KVKNumber":                  "kvk_number",
    "PaymentDetails":             "payment_details",
    "TaxDetails":                 "tax_details",
    "PaidInFourInstallements":    "paid_in_four_installments",
    "Items":                       None,  # handled separately -> invoice_line_items
}

# Line item sub-field map (Items.*)
LINE_ITEM_FIELD_MAP = {
    "Amount":      "amount",
    "Date":        "item_date",
    "Description": "description",
    "Quantity":    "quantity",
    "ProductCode": "product_code",
    "Tax":         "tax",
    "TaxRate":     "tax_rate",
    "Unit":        "unit",
    "UnitPrice":   "unit_price",
}


# --- Invoice Extraction Function ---

# -- helper function get the typed value from the field, which can be in different formats (string, date, number, etc.) --
def get_field_value(field: DocumentField):
    """
    Helper function to extract the typed value from a DocumentField object based on its type.
    Fallback to .content if the type is unknown or if the value is None. 
    """
    if(field is None):
        return None
    
    t = field.type
    if t == "string":
        return field.value_string
    elif t == "date":
        return field.value_date          # datetime.date
    elif t == "time":
        return field.value_time          # datetime.time
    elif t == "integer":
        return field.value_integer
    elif t == "number":
        return field.value_number        # float
    elif t == "currency":
        cur = field.value_currency       # CurrencyValue | None
        return Decimal(str(cur.amount)) if cur is not None else None
    elif t == "phoneNumber":
        return field.value_phone_number
    elif t == "countryRegion":
        return field.value_country_region
    elif t == "selectionMark":
        return field.value_selection_mark
    elif t == "address":
        return field.content             # return address as string
    elif t == "boolean":
        return field.value_boolean
    elif t == "array":
        return [get_field_value(item) for item in field.value_array] if field.value_array else []
    elif t == "object":
        return {k: get_field_value(v) for k, v in field.value_object.items()} if field.value_object else {}
    else:
        return field.content             # fallback for unknown types

# -- helper function to extract line items from the "Items" field, which is an array of objects with their own sub-fields --
def _extract_line_items(items_field: DocumentField, invoice_job_id: str, sub_map: dict) -> list[InvoiceLineItem]:
    """Build InvoiceLineItem objects from Azure's Items array field."""
    line_items: list[InvoiceLineItem] = []

    # 1. Get the rows, tolerating both the SDK object and the raw dict form
    if isinstance(items_field, dict):
        rows = items_field.get("valueArray") or []
    else:
        rows = getattr(items_field, "value_array", None) or []

    # 2. Enumerate through the rows and extract the sub-fields based on the sub_map, which maps Azure's field names to our InvoiceLineItem model's field names.
    for i, row in enumerate(rows):
        # unwrap the cell dict
        if isinstance(row, dict):
            cells = row.get("valueObject") or {}
        else:
            cells = getattr(row, "value_object", None) or {}

        item_data = {}
        for az_name, target in sub_map.items():
            cell = cells.get(az_name)
            if cell is not None:
                item_data[target] = get_field_value(cell)

        if not item_data:        # skip empty/garbage rows like row[0]
            continue

        line_items.append(
            InvoiceLineItem(invoice_id=invoice_job_id, line_number=i + 1, **item_data)
        )
    
    return line_items

OCR_MAX_CONCURRENCY = int(os.getenv("OCR_MAX_CONCURRENCY", "8"))
OCR_SEMAPHORE = asyncio.Semaphore(OCR_MAX_CONCURRENCY)


def _read_bytes(file_path: str) -> bytes:
    """Reads file bytes synchronously for offloading to a thread."""
    with open(file_path, "rb") as f:
        return f.read()


def _failed_invoice(job_id: str, file_name: str, raw_fields: dict = None, line_items: list = None) -> Invoice:
    return Invoice(
        job_id=job_id,
        file_name=file_name,
        status="failed",
        content_hash="",
        raw_fields=raw_fields or {},
        line_items=line_items or [],
    )


# -- Main extraction function that takes in a file path and the Azure client, and returns an Invoice object --
async def extract(batch_id: str, file_path: str, document_intelligence_client: DocumentIntelligenceClient) -> Invoice:
    """
    Extract structured data from a single invoice file.
    Returns an Invoice object with all fields, confidence scores, and status.
    """
    job_id = f"{batch_id}_{os.path.basename(file_path)}"
    file_name = os.path.basename(file_path)
    status = "success"
    
    raw_fields = {}
    mapped = {}
    line_items = []

    try:
        file_bytes = await asyncio.to_thread(_read_bytes, file_path)

        async with OCR_SEMAPHORE:
            poller = await document_intelligence_client.begin_analyze_document(
                'prebuilt-invoice', body=file_bytes
            )
            analyzed_result = await poller.result()
            
        documents = analyzed_result.documents
        if not documents: 
            raise ValueError(f"<--Extraction.py--> No documents extracted from the invoice {file_path}")
        
        extracted_invoice = documents[0]
        
        if extracted_invoice.fields:
            for field_name, field_value in extracted_invoice.fields.items():
                raw_fields[field_name] = {
                    "value": field_value.content,
                    "confidence": field_value.confidence
                }
                
                if field_name == "Items":
                    line_items = _extract_line_items(field_value, job_id, LINE_ITEM_FIELD_MAP)
                    continue
                
                target = FIELD_MAP.get(field_name)
                if target is None:
                    continue
                
                value = get_field_value(field_value)
                if value is not None:
                    mapped[target] = value
                else:
                    status = "review"
                    
                confidence = field_value.confidence
                if confidence is None or confidence < 0.8:
                    status = "review"
        else:
            status = "review"
                
        return Invoice(
            job_id=job_id,
            file_name=file_name,
            status=status,
            content_hash=compute_hash_from_path(file_path),
            template_name=analyzed_result.model_id,
            **mapped,
            raw_fields=raw_fields,
            line_items=line_items
        )
    except Exception as e: 
        print(f"<--Extraction.py--> Error extracting invoice from file {file_path}: {e}")
        return _failed_invoice(job_id, file_name, raw_fields, line_items)


async def extract_with_timeout(
    batch_id: str,
    file_path: str,
    document_intelligence_client: DocumentIntelligenceClient,
    timeout_seconds: float = 60.0,
) -> Invoice:
    """Wraps extract() with a 60-second timeout. Marks status='failed' if timed out."""
    job_id = f"{batch_id}_{os.path.basename(file_path)}"
    file_name = os.path.basename(file_path)

    try:
        return await asyncio.wait_for(
            extract(batch_id, file_path, document_intelligence_client),
            timeout=timeout_seconds,
        )
    except asyncio.TimeoutError:
        print(f"[TIMEOUT FAILED] {file_name} exceeded processing timeout ({timeout_seconds}s).")
        return _failed_invoice(
            job_id=job_id,
            file_name=file_name,
            raw_fields={"error": "too long to process"},
            line_items=[],
        )


async def extract_invoices(file_paths: list[str], batch_id: str) -> list[Invoice]:
    """         
    Extract invoices for a process batch. Returns a list of extracted invoices as Invoice objects.
    """
    load_dotenv()
    endpoint = os.getenv("DOCUMENTINTELLIGENCE_ENDPOINT")
    key = os.getenv("DOCUMENTINTELLIGENCE_API_KEY")
    credential = AzureKeyCredential(key)

    async with DocumentIntelligenceClient(
        credential=credential,
        endpoint=endpoint
    ) as client:
        tasks = [extract_with_timeout(batch_id, file_path, client, timeout_seconds=60.0) for file_path in file_paths]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    invoices: list[Invoice] = []
    for file_path, result in zip(file_paths, results):
        if isinstance(result, BaseException):
            print(f"<--Extraction.py--> {file_path} threw unexpected error: {result!r}")
            continue
        invoices.append(result)

    return invoices
