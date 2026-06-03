# import necessary modules for environment variable management
import os
from dotenv import load_dotenv

# import necessary modules for Azure Document Intelligence
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import DocumentField

# import necessary modules and functions from other files
from models.invoice import Invoice, InvoiceLineItem

# import Decimal for handling currency values
from decimal import Decimal


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

# --- Azure Document Intelligence Client Initialization ---
def init_azure_client()->DocumentIntelligenceClient:
    """
    Initializes the Azure Document Intelligence client using credentials from environment variables.
    Returns an instance of DocumentIntelligenceClient.
    """
    try:
        load_dotenv()
        endpoint = os.getenv("DOCUMENTINTELLIGENCE_ENDPOINT")
        key = os.getenv("DOCUMENTINTELLIGENCE_API_KEY")

        if(endpoint and key):
            document_intelligence_client = DocumentIntelligenceClient(
                endpoint=endpoint, credential=AzureKeyCredential(key)
            )
            print("<--Extraction.py--> Azure Document Intelligence client initialized successfully")
            return document_intelligence_client
        else:
            raise ValueError(f"<--Extraction.py--> Cannot get environment variables: <key>: {key} and <endpoint>: {endpoint}")
    except Exception as e:
        print(f"<--Extraction.py--> Error initializing Azure Document Intelligence client: {e}")
        raise

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
        return field.value_array         # list[DocumentField]
    elif t == "object":
        return field.value_object        # dict[str, DocumentField]
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

# -- Main extraction function that takes in a file path and the Azure client, and returns an Invoice object with the extracted data --
def extract(batch_id: str, file_path: str, document_intelligence_client: DocumentIntelligenceClient)->Invoice:
    """
    Extract structured data from a single invoice file.
    Returns an Invoice object with all fields, confidence scores, and status.
    """
        
    # required non-null fields:
    job_id = f"{batch_id}_{os.path.basename(file_path)}"  # unique identifier for the invoice, can be used as primary key in the database
    file_name = os.path.basename(file_path)
    status = "success"  # default status is success, will be updated to "review" if any field has low confidence
    
    try:
        # 1. Extract the structured data from the invoice using Azure Document Intelligence
        with open(file_path, "rb") as file:
            poller = document_intelligence_client.begin_analyze_document(
                'prebuilt-invoice', body=file
            )
            
        # wait for the extraction to complete and get the results
        analyzed_result = poller.result()
        documents = analyzed_result.documents
        
        if not documents: 
            raise ValueError(f"<--Extraction.py--> No documents extracted from the invoice {file_path}")
        
        extracted_invoice = documents[0]
        raw_fields = {}
        mapped = {}
        line_items = []
        
        # 2. Loop through all the fields returned by Azure, and extract the value and confidence score for each field.
        # Flag the invoice for review if any field has a confidence score below the threshold (e.g. 0.8). The threshold can be adjusted based on requirements.
        if extracted_invoice.fields:
            for field_name, field_value in extracted_invoice.fields.items():
                raw_fields[field_name] = {
                    "value": field_value.content,
                    "confidence": field_value.confidence
                }
                
                # Line items are handled separately since they are nested under "Items" and have their own sub-fields. We will extract them as a list of dictionaries and assign to the invoice_line_items field in the Invoice model.
                if field_name == "Items":
                    line_items = _extract_line_items(field_value, job_id, LINE_ITEM_FIELD_MAP)
                    continue
                
                target = FIELD_MAP.get(field_name)
                if target is None:
                    continue # skip fields that are not in the FIELD_MAP, we only care about the mapped fields for now
                
                value = get_field_value(field_value)   # ← typed value, not .content
                if value is not None:
                    mapped[target] = value
                else:
                    status = "review"
                    
                confidence = field_value.confidence
                if confidence is None or confidence < 0.8:
                    status = "review"
        else:
            # Azure returned a document but with no fields — flag for review
            status = "review"
        
        # ← return is now OUTSIDE the if-block, so it always executes
        return Invoice(
            job_id=job_id,
            file_name=file_name,
            status=status,
            template_name=analyzed_result.model_id,
            **mapped,
            raw_fields=raw_fields,
            line_items=line_items
        )
    except Exception as e: 
        # catch the error and return a failed Invoice object signaling a failed extraction, so that the pipeline can continue processing other files in the batch
        print(f"<--Extraction.py--> Error extracting invoice from file {file_path}: {e}")
        return Invoice(
            job_id=job_id,
            file_name=file_name,
            status="failed",
            raw_fields=raw_fields if 'raw_fields' in locals() else {},
            line_items=line_items if 'line_items' in locals() else []
        )
        
    
def extract_invoices(file_paths: list[str], batch_id: str)->list[Invoice]:
    """
    extract invoices for a process batch. Returns a list of extracted invoices as Invoice objects.
    """
    pid = os.getpid()
    try:
        # 1. initialize Azure Document Intelligence client once for the batch, then reuse for all files in the batch
        print(f"[PID: {pid}] 🔄 Initializing Azure Document Intelligence Client...")
        document_intelligence_client = init_azure_client() 
        
        # 2. loop through the file paths, extract each invoice, and collect the results in a list.
        extracted_invoices: list[Invoice] = []
        for file_path in file_paths:
            extracted_result = extract(batch_id, file_path, document_intelligence_client=document_intelligence_client)
            if(extracted_result):
                print(f"[PID: {pid}] ✔️ <--Extraction.py--> Successfully extracted invoice from file {file_path} with job id {extracted_result.job_id}")
            else: 
                print(f"[PID: {pid}] ⚠️ <--Extraction.py--> Extraction returned None for file {file_path}")
            extracted_invoices.append(extracted_result)
        return extracted_invoices
    except Exception as e:
        # TODO: we might want to handle this differently depending on the use case  
        # if the Azure client initialization fails, 
        # it might make sense to fail the entire batch instead of returning empty/failed invoices,
        # since it's likely that all extractions will fail without a client. For now, we will just log the error and re-raise it to be handled by the caller.
        
        
        print(f"<--Extraction.py--> Error extracting invoices for batch {batch_id}: {e}")
        raise
    finally:    
        document_intelligence_client.close()
