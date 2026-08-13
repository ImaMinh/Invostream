import asyncio
from azure.ai.documentintelligence.aio import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import DocumentField
from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type
from azure.core.exceptions import HttpResponseError, ServiceRequestError
import 

@retry(
    reraise=True,
    stop=stop_after_attempt(5),
    wait=wait_random_exponential(min=1, max=10),
    retry=retry_if_exception_type((HttpResponseError, ServiceRequestError))
)
async def _analyze_document_with_retry(client: DocumentIntelligenceClient, file_bytes: bytes):
    poller = await client.begin_analyze_document('prebuilt-invoice', body=file_bytes)
    return await poller.result()

def get_field_value(field: DocumentField) -> Any:
    if field is None: return None
    t = field.type
    if t == "string": return field.value_string
    elif t == "currency":
        cur = field.value_currency
        return Decimal(str(cur.amount)) if cur is not None else None
    # ... handle other types ...
    return field.content

def _extract_line_items(items_field: DocumentField, invoice_job_id: str, sub_map: dict) -> List[InvoiceLineItem]:
    # (Implementation remains exactly the same as your prior code)
    pass 

async def process_single_file(batch_id: str, file_path: str, client: DocumentIntelligenceClient) -> Invoice:
    job_id = f"{batch_id}_{os.path.basename(file_path)}"
    
    # 1. Read bytes and close the file descriptor immediately
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    # 2. Transmit to Azure (includes automatic retries)
    analyzed_result = await _analyze_document_with_retry(client, file_bytes)
    
    # 3. Map the fields (simplified for brevity)
    documents = analyzed_result.documents
    if not documents:
        raise ValueError("No documents found in response.")
        
    extracted_invoice = documents[0]
    mapped_data = {}
    
    # ... (Insert your field mapping loop here) ...

    return Invoice(
        job_id=job_id,
        file_name=os.path.basename(file_path),
        status="success", # Evaluate confidence here
        content_hash=compute_hash_from_path(file_path),
        **mapped_data
    )