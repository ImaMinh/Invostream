"""
P1 Unit Tests — Pydantic Model Validation
Tests Invoice, InvoiceLineItem, BatchUploadResponse, and DuplicateFileInfo models.
"""
import json
import pytest
from decimal import Decimal
from datetime import date, datetime
from pydantic import ValidationError

from models.invoice import Invoice, InvoiceLineItem
from models.batch import BatchUploadResponse, DuplicateFileInfo


# ===================== InvoiceLineItem =====================

class TestInvoiceLineItem:
    """Tests for InvoiceLineItem Pydantic model."""

    def test_required_field_invoice_id(self):
        """invoice_id is required — missing it should raise ValidationError."""
        with pytest.raises(ValidationError):
            InvoiceLineItem()

    def test_minimal_creation(self):
        """Should create with only invoice_id (all others optional)."""
        item = InvoiceLineItem(invoice_id="job1")
        assert item.invoice_id == "job1"
        assert item.line_number is None
        assert item.description is None
        assert item.quantity is None
        assert item.unit_price is None
        assert item.amount is None

    def test_full_creation(self, sample_line_item):
        """Should create with all fields populated."""
        assert sample_line_item.invoice_id == "batch1_test.pdf"
        assert sample_line_item.line_number == 1
        assert sample_line_item.description == "Test Item"
        assert sample_line_item.quantity == Decimal("5")
        assert sample_line_item.unit_price == Decimal("20.00")
        assert sample_line_item.amount == Decimal("100.00")

    def test_decimal_precision(self):
        """Decimal fields should preserve precision."""
        item = InvoiceLineItem(
            invoice_id="job1",
            quantity=Decimal("1.500"),
            unit_price=Decimal("99.99"),
            amount=Decimal("149.985"),
        )
        assert item.quantity == Decimal("1.500")
        assert item.unit_price == Decimal("99.99")
        assert item.amount == Decimal("149.985")

    def test_numeric_string_coercion(self):
        """Pydantic should coerce numeric strings to Decimal."""
        item = InvoiceLineItem(
            invoice_id="job1",
            quantity="10",
            unit_price="25.50",
        )
        assert item.quantity == Decimal("10")
        assert item.unit_price == Decimal("25.50")

    def test_date_field(self):
        """item_date should accept date objects."""
        item = InvoiceLineItem(
            invoice_id="job1",
            item_date=date(2026, 7, 15),
        )
        assert item.item_date == date(2026, 7, 15)


# ===================== Invoice =====================

class TestInvoice:
    """Tests for Invoice Pydantic model."""

    def test_required_fields_only(self):
        """Invoice requires job_id, file_name, and status."""
        inv = Invoice(job_id="j1", file_name="f.png", status="success")
        assert inv.job_id == "j1"
        assert inv.file_name == "f.png"
        assert inv.status == "success"

    def test_missing_required_fields_raises(self):
        """Missing any required field should raise ValidationError."""
        with pytest.raises(ValidationError):
            Invoice(job_id="j1", file_name="f.png")  # missing status
        with pytest.raises(ValidationError):
            Invoice(job_id="j1", status="success")  # missing file_name
        with pytest.raises(ValidationError):
            Invoice(file_name="f.png", status="success")  # missing job_id

    def test_all_optional_fields_default_none(self, minimal_invoice):
        """All optional fields should default to None."""
        assert minimal_invoice.content_hash is None
        assert minimal_invoice.vendor_name is None
        assert minimal_invoice.invoice_total is None
        assert minimal_invoice.invoice_date is None
        assert minimal_invoice.raw_fields is None

    def test_line_items_default_empty(self, minimal_invoice):
        """line_items should default to empty list."""
        assert minimal_invoice.line_items == []

    def test_processing_time_default_zero(self, minimal_invoice):
        """total_processing_time_ms should default to 0."""
        assert minimal_invoice.total_processing_time_ms == 0

    def test_full_invoice_all_fields(self, full_invoice):
        """Full invoice with all fields should pass validation."""
        assert full_invoice.vendor_name == "WidgetCo"
        assert full_invoice.invoice_total == Decimal("1045.00")
        assert full_invoice.invoice_date == date(2026, 7, 1)
        assert len(full_invoice.line_items) == 1

    def test_decimal_amounts(self):
        """Amount fields should handle Decimal correctly."""
        inv = Invoice(
            job_id="j1", file_name="f.png", status="success",
            subtotal=Decimal("999.99"),
            total_tax=Decimal("100.001"),
            invoice_total=Decimal("1099.991"),
        )
        assert inv.subtotal == Decimal("999.99")
        assert inv.total_tax == Decimal("100.001")
        assert inv.invoice_total == Decimal("1099.991")

    def test_date_fields(self):
        """Date fields should accept date objects."""
        inv = Invoice(
            job_id="j1", file_name="f.png", status="success",
            invoice_date=date(2026, 1, 15),
            due_date=date(2026, 2, 15),
            service_start_date=date(2026, 1, 1),
            service_end_date=date(2026, 12, 31),
        )
        assert inv.invoice_date == date(2026, 1, 15)
        assert inv.due_date == date(2026, 2, 15)

    def test_jsonb_fields_accept_dicts(self):
        """JSONB fields (raw_fields, payment_details, etc.) should accept dicts/lists."""
        inv = Invoice(
            job_id="j1", file_name="f.png", status="success",
            raw_fields={"VendorName": {"value": "Test", "confidence": 0.9}},
            payment_details=[{"bank": "ABC", "account": "123"}],
            tax_details=[{"rate": "10%", "amount": 100}],
        )
        assert inv.raw_fields["VendorName"]["confidence"] == 0.9
        assert inv.payment_details[0]["bank"] == "ABC"

    def test_status_values(self):
        """Status field should accept the three valid values."""
        for status in ["success", "review", "failed"]:
            inv = Invoice(job_id="j1", file_name="f.png", status=status)
            assert inv.status == status


# ===================== Serialization Round-Trip =====================

class TestInvoiceSerialization:
    """Tests for model_dump / serialization round-trips."""

    def test_model_dump_roundtrip(self, full_invoice):
        """model_dump → Invoice(**dict) should produce identical model."""
        dumped = full_invoice.model_dump()
        reconstructed = Invoice(**dumped)

        assert reconstructed.job_id == full_invoice.job_id
        assert reconstructed.vendor_name == full_invoice.vendor_name
        assert reconstructed.invoice_total == full_invoice.invoice_total
        assert reconstructed.invoice_date == full_invoice.invoice_date
        assert len(reconstructed.line_items) == len(full_invoice.line_items)

    def test_json_mode_handles_decimals(self, full_invoice):
        """model_dump(mode='json') should serialize Decimals to floats/strings."""
        dumped = full_invoice.model_dump(mode="json")
        # Should be JSON-serializable (no Decimal objects)
        json_str = json.dumps(dumped)
        assert isinstance(json_str, str)

    def test_json_mode_handles_dates(self, full_invoice):
        """model_dump(mode='json') should serialize dates to ISO strings."""
        dumped = full_invoice.model_dump(mode="json")
        # date fields should be strings in JSON mode
        assert isinstance(dumped["invoice_date"], str)
        assert "2026-07-01" in dumped["invoice_date"]

    def test_minimal_model_dump(self, minimal_invoice):
        """Minimal invoice should dump without errors."""
        dumped = minimal_invoice.model_dump()
        assert dumped["job_id"] == "batch1_invoice.png"
        assert dumped["status"] == "success"
        assert dumped["line_items"] == []

    def test_worker_process_roundtrip(self, full_invoice):
        """
        Simulate the worker process boundary: model → model_dump() → dict → Invoice(**dict).
        This is exactly what happens in runner.py → batch.py.
        """
        # Worker side: serialize
        serialized = full_invoice.model_dump()
        
        # Main process side: deserialize
        reconstructed = Invoice(**serialized)
        
        # Verify critical fields survive the crossing
        assert reconstructed.content_hash == full_invoice.content_hash
        assert reconstructed.invoice_total == full_invoice.invoice_total
        assert reconstructed.line_items[0].description == full_invoice.line_items[0].description
        assert reconstructed.total_processing_time_ms == full_invoice.total_processing_time_ms


# ===================== Batch Models =====================

class TestBatchModels:
    """Tests for DuplicateFileInfo and BatchUploadResponse."""

    def test_duplicate_file_info(self):
        dup = DuplicateFileInfo(file_name="invoice.png", content_hash="abc123")
        assert dup.file_name == "invoice.png"
        assert dup.content_hash == "abc123"

    def test_duplicate_file_info_missing_fields(self):
        with pytest.raises(ValidationError):
            DuplicateFileInfo(file_name="invoice.png")  # missing content_hash

    def test_batch_upload_response_defaults(self):
        resp = BatchUploadResponse(status="pending")
        assert resp.accepted_count == 0
        assert resp.duplicate_count == 0
        assert resp.duplicates == []

    def test_batch_upload_response_with_duplicates(self):
        dups = [
            DuplicateFileInfo(file_name="a.png", content_hash="h1"),
            DuplicateFileInfo(file_name="b.png", content_hash="h2"),
        ]
        resp = BatchUploadResponse(
            status="pending",
            accepted_count=3,
            duplicate_count=2,
            duplicates=dups,
        )
        assert resp.accepted_count == 3
        assert resp.duplicate_count == 2
        assert len(resp.duplicates) == 2

    def test_all_duplicates_status(self):
        resp = BatchUploadResponse(
            status="all_duplicates",
            accepted_count=0,
            duplicate_count=5,
        )
        assert resp.status == "all_duplicates"
        assert resp.accepted_count == 0
