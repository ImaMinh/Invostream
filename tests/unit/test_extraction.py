"""
P0 Unit Tests — OCR Extraction Helpers
Tests get_field_value() and _extract_line_items() from ocr/extraction.py.
"""
import pytest
from decimal import Decimal
from datetime import date, time
from unittest.mock import MagicMock

from ocr.extraction import get_field_value, _extract_line_items, LINE_ITEM_FIELD_MAP
from models.invoice import InvoiceLineItem
from tests.conftest import make_mock_field


# ===================== get_field_value() =====================

class TestGetFieldValue:
    """Tests for the multi-type field value extractor."""

    def test_none_input(self):
        """None field should return None."""
        assert get_field_value(None) is None

    def test_string_type(self):
        field = make_mock_field("string", value_string="Acme Corp")
        assert get_field_value(field) == "Acme Corp"

    def test_date_type(self):
        d = date(2026, 7, 15)
        field = make_mock_field("date", value_date=d)
        assert get_field_value(field) == d

    def test_time_type(self):
        t = time(14, 30, 0)
        field = make_mock_field("time", value_time=t)
        assert get_field_value(field) == t

    def test_integer_type(self):
        field = make_mock_field("integer", value_integer=42)
        assert get_field_value(field) == 42

    def test_number_type(self):
        field = make_mock_field("number", value_number=3.14)
        assert get_field_value(field) == 3.14

    def test_currency_type(self):
        cur = MagicMock()
        cur.amount = 99.99
        field = make_mock_field("currency", value_currency=cur)
        result = get_field_value(field)
        assert result == Decimal("99.99")
        assert isinstance(result, Decimal)

    def test_currency_type_none_value(self):
        """Currency field with None value_currency should return None."""
        field = make_mock_field("currency", value_currency=None)
        assert get_field_value(field) is None

    def test_phone_number_type(self):
        field = make_mock_field("phoneNumber", value_phone_number="+1-555-0100")
        assert get_field_value(field) == "+1-555-0100"

    def test_country_region_type(self):
        field = make_mock_field("countryRegion", value_country_region="US")
        assert get_field_value(field) == "US"

    def test_selection_mark_type(self):
        field = make_mock_field("selectionMark", value_selection_mark="selected")
        assert get_field_value(field) == "selected"

    def test_address_type_uses_content(self):
        """Address type should fall back to .content, not a typed value."""
        field = make_mock_field("address", content="123 Main St, Suite 100")
        assert get_field_value(field) == "123 Main St, Suite 100"

    def test_boolean_type(self):
        field = make_mock_field("boolean", value_boolean=True)
        assert get_field_value(field) is True

    def test_array_type(self):
        child1 = make_mock_field("string", value_string="item1")
        child2 = make_mock_field("string", value_string="item2")
        field = make_mock_field("array", value_array=[child1, child2])
        assert get_field_value(field) == ["item1", "item2"]

    def test_array_type_empty(self):
        field = make_mock_field("array", value_array=None)
        assert get_field_value(field) == []

    def test_object_type(self):
        child_a = make_mock_field("string", value_string="val_a")
        child_b = make_mock_field("integer", value_integer=10)
        field = make_mock_field("object", value_object={"a": child_a, "b": child_b})
        result = get_field_value(field)
        assert result == {"a": "val_a", "b": 10}

    def test_object_type_empty(self):
        field = make_mock_field("object", value_object=None)
        assert get_field_value(field) == {}

    def test_unknown_type_falls_back_to_content(self):
        """Unknown/new field types should return .content as fallback."""
        field = make_mock_field("newFutureType", content="raw fallback text")
        assert get_field_value(field) == "raw fallback text"


# ===================== _extract_line_items() =====================

class TestExtractLineItems:
    """Tests for the line item array extractor."""

    def _make_sdk_row(self, description="Widget A", quantity=5.0, unit_price=10.0, amount=50.0):
        """Helper: create a mock SDK-style row with value_object dict of mock fields."""
        cells = {}
        if description is not None:
            cells["Description"] = make_mock_field("string", value_string=description)
        if quantity is not None:
            cur_q = MagicMock(); cur_q.amount = quantity
            cells["Quantity"] = make_mock_field("number", value_number=quantity)
        if unit_price is not None:
            cur_up = MagicMock(); cur_up.amount = unit_price
            cells["UnitPrice"] = make_mock_field("currency", value_currency=cur_up)
        if amount is not None:
            cur_a = MagicMock(); cur_a.amount = amount
            cells["Amount"] = make_mock_field("currency", value_currency=cur_a)
        
        row = MagicMock()
        row.value_object = cells
        return row

    def _make_sdk_items_field(self, rows):
        """Wrap rows into a mock SDK-style items field with value_array."""
        field = MagicMock()
        field.value_array = rows
        return field

    def test_single_row(self):
        """Single valid row should produce one InvoiceLineItem."""
        row = self._make_sdk_row(description="Widget A", quantity=5.0, unit_price=10.0, amount=50.0)
        items_field = self._make_sdk_items_field([row])

        result = _extract_line_items(items_field, "job1", LINE_ITEM_FIELD_MAP)
        
        assert len(result) == 1
        assert isinstance(result[0], InvoiceLineItem)
        assert result[0].description == "Widget A"
        assert result[0].invoice_id == "job1"
        assert result[0].line_number == 1

    def test_multiple_rows(self):
        """Multiple rows should produce correctly numbered line items."""
        row1 = self._make_sdk_row(description="Item A")
        row2 = self._make_sdk_row(description="Item B")
        items_field = self._make_sdk_items_field([row1, row2])

        result = _extract_line_items(items_field, "job2", LINE_ITEM_FIELD_MAP)

        assert len(result) == 2
        assert result[0].line_number == 1
        assert result[0].description == "Item A"
        assert result[1].line_number == 2
        assert result[1].description == "Item B"

    def test_empty_row_skipped(self):
        """Rows with no extractable data should be skipped."""
        empty_row = MagicMock()
        empty_row.value_object = {}
        items_field = self._make_sdk_items_field([empty_row])

        result = _extract_line_items(items_field, "job3", LINE_ITEM_FIELD_MAP)
        assert len(result) == 0

    def test_dict_format_input(self):
        """Should also handle raw dict format (not just SDK objects)."""
        desc_field = make_mock_field("string", value_string="Dict Item")
        items_field = {
            "valueArray": [
                {"valueObject": {"Description": desc_field}}
            ]
        }

        result = _extract_line_items(items_field, "job4", LINE_ITEM_FIELD_MAP)
        assert len(result) == 1
        assert result[0].description == "Dict Item"

    def test_no_rows(self):
        """Field with no rows should return empty list."""
        items_field = MagicMock()
        items_field.value_array = None

        result = _extract_line_items(items_field, "job5", LINE_ITEM_FIELD_MAP)
        assert result == []

    def test_partial_fields(self):
        """Row with only some fields should still produce a line item."""
        row = self._make_sdk_row(description="Partial", quantity=None, unit_price=None, amount=None)
        items_field = self._make_sdk_items_field([row])

        result = _extract_line_items(items_field, "job6", LINE_ITEM_FIELD_MAP)
        assert len(result) == 1
        assert result[0].description == "Partial"
        assert result[0].quantity is None
