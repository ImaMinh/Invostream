from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

class InvoiceLineItem(BaseModel):
    # referenced to the invoice by invoice_id
    invoice_id: str

    # order in the invoice
    line_number: Optional[int] = None

    # information about the line item
    amount: Optional[Decimal] = None
    item_date: Optional[date] = None
    description: Optional[str] = None
    quantity: Optional[Decimal] = None
    product_code: Optional[str] = None
    tax: Optional[Decimal] = None
    tax_rate: Optional[str] = None
    unit: Optional[str] = None
    unit_price: Optional[Decimal] = None

    # timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class Invoice(BaseModel):
    # identifiers / tracking
    job_id: str
    file_name: str
    # status can be: success, review, failed.
    status: str
    # SHA-256 hash of the original file bytes, used for deduplication
    content_hash: Optional[str] = None

    # invoice model and confidence scores
    template_name: Optional[str] = None

    # geographical and financial info
    country_code: Optional[str] = None
    currency: Optional[str] = None

    # customer (buyer)
    customer_name: Optional[str] = None
    customer_id: Optional[str] = None
    customer_tax_id: Optional[str] = None
    customer_address: Optional[str] = None
    customer_address_recipient: Optional[str] = None

    # vendor
    vendor_name: Optional[str] = None
    vendor_tax_id: Optional[str] = None
    vendor_address: Optional[str] = None
    vendor_address_recipient: Optional[str] = None

    # purchase / invoice identifiers
    purchase_order: Optional[str] = None
    invoice_id: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None

    # billing address
    billing_address: Optional[str] = None
    billing_address_recipient: Optional[str] = None

    # shipping address
    shipping_address: Optional[str] = None
    shipping_address_recipient: Optional[str] = None

    # remittance address
    remittance_address: Optional[str] = None
    remittance_address_recipient: Optional[str] = None

    # service address & period
    service_address: Optional[str] = None
    service_address_recipient: Optional[str] = None
    service_start_date: Optional[date] = None
    service_end_date: Optional[date] = None

    # amounts
    subtotal: Optional[Decimal] = None
    total_discount: Optional[Decimal] = None
    total_tax: Optional[Decimal] = None
    invoice_total: Optional[Decimal] = None
    amount_due: Optional[Decimal] = None
    previous_unpaid_balance: Optional[Decimal] = None

    # payment terms & registration
    payment_term: Optional[str] = None
    kvk_number: Optional[str] = None

    # nested arrays kept as raw structures (mirror the JSONB columns)
    payment_details: Optional[list[dict]] = None
    tax_details: Optional[list[dict]] = None
    paid_in_four_installments: Optional[list[dict]] = None

    # raw fields from Azure Document Intelligence, original field names as keys,
    # value + confidence as values; for debugging and traceability.
    raw_fields: Optional[dict] = None

    # timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    line_items: list[InvoiceLineItem] = []