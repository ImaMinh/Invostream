from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

class InvoiceLineItem(BaseModel):
    # referenced to the invoice by invoice_id
    invoice_id: str
    
    # order in the invoice 
    line_number: Optional[int] = None
    
    # information about the line item
    description: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    amount: Optional[Decimal] = None

class Invoice(BaseModel):
    # identifiers
    job_id: str
    file_name: str
    # status can be: pending, processing, completed, failed.
    status: str

    # invoice model and confidence scores
    template_name: Optional[str] = None
    ocr_confidence: Optional[float] = None

    # geographical and financial info
    country_code: Optional[str] = None
    currency: Optional[str] = None

    # invoice parties info
    vendor_name: Optional[str] = None
    vendor_tax_code: Optional[str] = None
    buyer_name: Optional[str] = None
    buyer_tax_code: Optional[str] = None

    # invoice details
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None

    # amount extracted from the invoice.
    subtotal: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None
    amount_due: Optional[Decimal] = None

    # payment terms, e.g. "Net 30", "Due on Receipt", etc.
    payment_terms: Optional[str] = None

    line_items: list[InvoiceLineItem] = []