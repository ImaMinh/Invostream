import asyncio
import os
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError
from azure.ai.documentintelligence.aio import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import DocumentField

from models.invoice import Invoice
from ocr.extraction import extract_with_timeout


# GLOBALS
NUM_WORKERS = 3
RESULTS: list = []


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

async def extraction_worker(
    queue: asyncio.Queue,
    batch_id: str,
    client: DocumentIntelligenceClient,
    worker_id: int
): 
    """
    Main worker script that polls files from the buffer queue and processes extraction.
    """
    while True:
        file_path = await queue.get()

        if file_path is None:
            print(f"[Worker {worker_id}] Received shutdown signal. Exiting worker...")
            queue.task_done()
            break

        print(f"[Worker {worker_id}] Received file for extraction: {file_path}")

        try:
            res = await extract_with_timeout(batch_id, file_path, client, timeout_seconds=60.0)
            RESULTS.append(res)
        except Exception as e:
            print(f"<--custom_extraction.py--> {file_path} error: {e!r}")
            RESULTS.append(e)
        finally:
            queue.task_done()

# ==============================
# ======= MAIN FUNCTION ========
# ==============================
async def extract_invoices(file_paths: list[str], batch_id: str) -> list[Invoice]:
    """         
    Extract invoices for a process batch using a bounded queue of size 20.
    Returns a list of extracted invoices as Invoice objects.
    """
    RESULTS.clear()

    # -- API authentication -- 
    endpoint = os.getenv("DOCUMENTINTELLIGENCE_ENDPOINT")
    key = os.getenv("DOCUMENTINTELLIGENCE_API_KEY")
    credential = AzureKeyCredential(key)

    # -- Data structures --
    queue = asyncio.Queue(maxsize=20)

    # -- API Client and initiate workers --
    async with DocumentIntelligenceClient(
        credential=credential,
        endpoint=endpoint
    ) as client:

        # -- Initialize worker tasks -- 
        workers = [
            asyncio.create_task(extraction_worker(queue, batch_id, client, i))
            for i in range(NUM_WORKERS)
        ]

        # -- Push file paths into the queue (pauses if queue reaches maxsize 20) --
        for file_path in file_paths:
            await queue.put(file_path)

        # -- Push sentinel values (None) to signal workers to stop --
        for _ in range(NUM_WORKERS):
            await queue.put(None)

        # -- Wait for queue tasks to complete and workers to exit --
        await queue.join()
        await asyncio.gather(*workers)

    invoices: list[Invoice] = []
    for result in RESULTS:
        if isinstance(result, BaseException):
            print(f"<--custom_extraction.py--> processing error: {result!r}")
            continue
        invoices.append(result)

    return invoices