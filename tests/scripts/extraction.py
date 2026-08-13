import os
import asyncio
from decimal import Decimal

from dotenv import load_dotenv

from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError
from azure.ai.documentintelligence.aio import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import DocumentField

from models.invoice import Invoice, InvoiceLineItem
from services.dedup.deduplication import compute_hash


# ---------------------------------------------------------------------------
# Cấu hình giới hạn
# ---------------------------------------------------------------------------
# Đây là tầng giới hạn THỨ HAI (tầng thứ nhất là số consumer trong batch.py).
# Semaphore này là biến module-level, nên MỌI task extract() từ MỌI consumer
# đều xếp hàng ở cùng một chỗ — điều này chỉ đúng khi tất cả chạy trong
# một process, một event loop.
#
# LƯU Ý: con số này giới hạn "số FILE đang xử lý", không phải "số REQUEST".
# Mỗi file giữ vé từ lúc POST cho tới khi poll xong (~12s), trong đó gửi
# 1 POST + ~3 GET.
OCR_MAX_CONCURRENCY = int(os.getenv("OCR_MAX_CONCURRENCY", "8"))
OCR_SEMAPHORE = asyncio.Semaphore(OCR_MAX_CONCURRENCY)

CONFIDENCE_THRESHOLD = float(os.getenv("OCR_CONFIDENCE_THRESHOLD", "0.8"))


# ---------------------------------------------------------------------------
# Field maps
# ---------------------------------------------------------------------------
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
    "Items":                       None,  # xử lý riêng -> line_items
}

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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def get_field_value(field: DocumentField):
    """Lấy giá trị đã ép kiểu từ DocumentField, fallback về .content nếu không rõ kiểu."""
    if field is None:
        return None

    t = field.type
    if t == "string":
        return field.value_string
    elif t == "date":
        return field.value_date
    elif t == "time":
        return field.value_time
    elif t == "integer":
        return field.value_integer
    elif t == "number":
        return field.value_number
    elif t == "currency":
        cur = field.value_currency
        return Decimal(str(cur.amount)) if cur is not None else None
    elif t == "phoneNumber":
        return field.value_phone_number
    elif t == "countryRegion":
        return field.value_country_region
    elif t == "selectionMark":
        return field.value_selection_mark
    elif t == "address":
        return field.content
    elif t == "boolean":
        return field.value_boolean
    elif t == "array":
        return [get_field_value(item) for item in field.value_array] if field.value_array else []
    elif t == "object":
        return {k: get_field_value(v) for k, v in field.value_object.items()} if field.value_object else {}
    else:
        return field.content


def _extract_line_items(
    items_field: DocumentField,
    invoice_job_id: str,
    sub_map: dict,
) -> list[InvoiceLineItem]:
    """Dựng InvoiceLineItem từ mảng Items của Azure."""
    line_items: list[InvoiceLineItem] = []

    if isinstance(items_field, dict):
        rows = items_field.get("valueArray") or []
    else:
        rows = getattr(items_field, "value_array", None) or []

    for i, row in enumerate(rows):
        if isinstance(row, dict):
            cells = row.get("valueObject") or {}
        else:
            cells = getattr(row, "value_object", None) or {}

        item_data = {}
        for az_name, target in sub_map.items():
            cell = cells.get(az_name)
            if cell is not None:
                item_data[target] = get_field_value(cell)

        if not item_data:  # bỏ qua dòng rỗng
            continue

        line_items.append(
            InvoiceLineItem(invoice_id=invoice_job_id, line_number=i + 1, **item_data)
        )

    return line_items


def _read_bytes(file_path: str) -> bytes:
    """Đọc file đồng bộ — luôn gọi qua asyncio.to_thread để không chặn event loop."""
    with open(file_path, "rb") as f:
        return f.read()

def _failed_invoice(
    job_id: str,
    file_name: str,
    content_hash: str,
    raw_fields: dict,
    line_items: list,
) -> Invoice:
    """Invoice đại diện cho một lần trích xuất thất bại, để pipeline chạy tiếp."""
    return Invoice(
        job_id=job_id,
        file_name=file_name,
        status="failed",
        content_hash=content_hash,
        raw_fields=raw_fields,
        line_items=line_items,
    )


# ---------------------------------------------------------------------------
# Trích xuất một file
# ---------------------------------------------------------------------------
async def extract(batch_id: str, file_path: str, document_intelligence_client: DocumentIntelligenceClient,) -> Invoice:
    """
    Trích xuất dữ liệu có cấu trúc từ một file hoá đơn.
    Luôn trả về Invoice — lỗi được bắt và biểu diễn bằng status="failed".
    """
    job_id = f"{batch_id}_{os.path.basename(file_path)}"
    file_name = os.path.basename(file_path)
    status = "success"

    # Khởi tạo trước try để nhánh except không cần locals()
    raw_fields: dict = {}
    mapped: dict = {}
    line_items: list[InvoiceLineItem] = []
    content_hash = ""

    try:
        # Đọc file trong thread pool: open()/read() là thao tác CHẶN,
        # gọi thẳng trong event loop sẽ đóng băng mọi task khác.
        file_bytes = await asyncio.to_thread(_read_bytes, file_path)

        # Hash từ bytes đã đọc, không đọc lại đĩa lần hai.
        content_hash = compute_hash(file_bytes)

        # --- Vùng giới hạn: chỉ OCR_MAX_CONCURRENCY task vào được cùng lúc ---
        async with OCR_SEMAPHORE:
            # Truyền bytes thay vì file handle: nếu azure-core retry ngầm,
            # một stream đã đọc hết sẽ không rewind được và gửi body rỗng.
            poller = await document_intelligence_client.begin_analyze_document(
                "prebuilt-invoice", body=file_bytes
            )
            # BƯỚC 7 (chưa làm): thêm polling_interval / độ trễ ban đầu ở đây
            # sau khi đo được p50 latency thực tế.
            analyzed_result = await poller.result()
        # --- Hết vùng giới hạn: vé được trả lại ngay khi thoát khối with ---

        documents = analyzed_result.documents
        if not documents:
            raise ValueError(f"Azure không trả về document nào cho {file_path}")

        extracted_invoice = documents[0]

        if extracted_invoice.fields:
            for field_name, field_value in extracted_invoice.fields.items():
                raw_fields[field_name] = {
                    "value": field_value.content,
                    "confidence": field_value.confidence,
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
                if confidence is None or confidence < CONFIDENCE_THRESHOLD:
                    status = "review"
        else:
            status = "review"

        return Invoice(
            job_id=job_id,
            file_name=file_name,
            status=status,
            content_hash=content_hash,
            template_name=analyzed_result.model_id,
            **mapped,
            raw_fields=raw_fields,
            line_items=line_items,
        )

    except HttpResponseError as e:
        # Tách riêng 429 để phân biệt "bị throttle" với "file hỏng".
        # Chưa retry ở bước này — chỉ cần nhìn thấy nó trong log.
        if e.status_code == 429:
            retry_after = e.response.headers.get("Retry-After") if e.response else None
            print(f"[429 THROTTLED] {file_name} | Retry-After={retry_after} | batch={batch_id}")
        else:
            print(f"[HTTP {e.status_code}] {file_name}: {e.message}")

        return _failed_invoice(job_id, file_name, content_hash, raw_fields, line_items)

    except Exception as e:
        print(f"<--Extraction.py--> lỗi khi trích xuất {file_path}: {e!r}")
        return _failed_invoice(job_id, file_name, content_hash, raw_fields, line_items)


# ---------------------------------------------------------------------------
# Timeout wrapper & Batch Extraction
# ---------------------------------------------------------------------------
async def extract_with_timeout(
    batch_id: str,
    file_path: str,
    document_intelligence_client: DocumentIntelligenceClient,
    timeout_seconds: float = 60.0,
) -> Invoice:
    """Bọc extract() bằng timeout 60 giây. Nếu vượt quá, đánh dấu status='failed'."""
    job_id = f"{batch_id}_{os.path.basename(file_path)}"
    file_name = os.path.basename(file_path)

    try:
        return await asyncio.wait_for(
            extract(batch_id, file_path, document_intelligence_client),
            timeout=timeout_seconds,
        )
    except asyncio.TimeoutError:
        print(f"[TIMEOUT FAILED] {file_name} quá thời gian chờ ({timeout_seconds}s).")
        return _failed_invoice(
            job_id=job_id,
            file_name=file_name,
            content_hash="",
            raw_fields={"error": "too long to process"},
            line_items=[],
        )


async def extract_invoices(file_paths: list[str], batch_id: str) -> list[Invoice]:
    """
    Trích xuất hoá đơn cho một batch. Trả về list Invoice.
    File lỗi hoặc quá thời gian đều được trả về dưới dạng Invoice(status='failed').
    """
    load_dotenv()

    # Get environmental keys
    endpoint = os.getenv("DOCUMENTINTELLIGENCE_ENDPOINT")
    key = os.getenv("DOCUMENTINTELLIGENCE_API_KEY")
    credential = AzureKeyCredential(key)

    async with DocumentIntelligenceClient(credential=credential, endpoint=endpoint) as client:
        tasks = [extract_with_timeout(batch_id, fp, client, timeout_seconds=60.0) for fp in file_paths]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    invoices: list[Invoice] = []
    for file_path, result in zip(file_paths, results):
        if isinstance(result, BaseException):
            print(f"<--Extraction.py--> {file_path} ném lỗi ngoài dự kiến: {result!r}")
            continue
        invoices.append(result)

    return invoices