"""
Shared fixtures for Invostream tests.
"""
import os
import pytest
from decimal import Decimal
from datetime import date
from unittest.mock import MagicMock

from models.invoice import Invoice, InvoiceLineItem


# --------------- Sample Data Fixtures ---------------

@pytest.fixture
def sample_file_bytes():
    """Raw bytes representing a minimal test file."""
    return b"fake invoice file content for testing"


@pytest.fixture
def sample_file_bytes_alt():
    """Different file bytes to verify hash divergence."""
    return b"different invoice content entirely"


@pytest.fixture
def minimal_invoice():
    """Invoice with only required fields (job_id, file_name, status)."""
    return Invoice(
        job_id="batch1_invoice.png",
        file_name="invoice.png",
        status="success",
    )


@pytest.fixture
def full_invoice():
    """Invoice with all fields populated for round-trip testing."""
    return Invoice(
        job_id="batch1_full.pdf",
        file_name="full.pdf",
        status="review",
        content_hash="abc123def456",
        template_name="prebuilt-invoice",
        country_code="US",
        currency="USD",
        customer_name="Acme Corp",
        customer_id="CUST-001",
        customer_tax_id="TAX-CUST-001",
        customer_address="123 Main St",
        customer_address_recipient="John Doe",
        vendor_name="WidgetCo",
        vendor_tax_id="TAX-VEND-001",
        vendor_address="456 Oak Ave",
        vendor_address_recipient="Jane Smith",
        purchase_order="PO-2026-001",
        invoice_id="INV-2026-100",
        invoice_date=date(2026, 7, 1),
        due_date=date(2026, 8, 1),
        billing_address="789 Billing Rd",
        billing_address_recipient="Billing Dept",
        shipping_address="101 Ship Lane",
        shipping_address_recipient="Warehouse",
        subtotal=Decimal("1000.00"),
        total_discount=Decimal("50.00"),
        total_tax=Decimal("95.00"),
        invoice_total=Decimal("1045.00"),
        amount_due=Decimal("1045.00"),
        payment_term="Net 30",
        raw_fields={"VendorName": {"value": "WidgetCo", "confidence": 0.95}},
        total_processing_time_ms=1234,
        line_items=[
            InvoiceLineItem(
                invoice_id="batch1_full.pdf",
                line_number=1,
                description="Widget A",
                quantity=Decimal("10"),
                unit_price=Decimal("100.00"),
                amount=Decimal("1000.00"),
            )
        ],
    )


@pytest.fixture
def sample_line_item():
    """A single InvoiceLineItem for isolated testing."""
    return InvoiceLineItem(
        invoice_id="batch1_test.pdf",
        line_number=1,
        description="Test Item",
        quantity=Decimal("5"),
        unit_price=Decimal("20.00"),
        amount=Decimal("100.00"),
    )


# --------------- Mock Azure DocumentField ---------------

def make_mock_field(field_type: str, **kwargs):
    """
    Create a mock Azure DocumentField with the given type and attribute values.
    
    Usage:
        make_mock_field("string", value_string="hello")
        make_mock_field("currency", value_currency=MagicMock(amount=99.99))
        make_mock_field("date", value_date=date(2026, 1, 1))
    """
    field = MagicMock()
    field.type = field_type
    field.content = kwargs.pop("content", f"raw-content-{field_type}")
    
    # Set all possible value attributes to None first
    for attr in [
        "value_string", "value_date", "value_time", "value_integer",
        "value_number", "value_currency", "value_phone_number",
        "value_country_region", "value_selection_mark", "value_boolean",
        "value_array", "value_object",
    ]:
        setattr(field, attr, kwargs.get(attr, None))
    
    return field


@pytest.fixture
def tmp_workspace(tmp_path):
    """Provide a temporary workspace directory for file I/O tests."""
    return tmp_path
