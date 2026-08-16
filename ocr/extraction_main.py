import asyncio
import os
from datetime import datetime
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError
from azure.ai.documentintelligence.aio import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import DocumentField

from models.invoice import Invoice
from ocr.extraction_modules import extract_with_timeout
from db.postgresql.invoices import insert_invoice
from services.telemetry.progress import progress_tracker


# GLOBALS
NUM_WORKERS = 3
RESULTS: list = []


async def extraction_worker(
    queue: asyncio.Queue,
    batch_id: str,
    client: DocumentIntelligenceClient,
    worker_id: int,
    batch_results: list,
):
    """
    Main worker script that polls files from the buffer queue and processes extraction.
    """
    while True:
        file_path = await queue.get()

        if file_path is None:
            now = datetime.now().strftime("%H:%M:%S.%f")[:-3]
            print(
                f"[{now}] [Worker {worker_id}] Received shutdown signal. Exiting worker..."
            )
            queue.task_done()
            break

        file_name = os.path.basename(file_path)
        start_ts = datetime.now()
        print(
            f"[{start_ts.strftime('%H:%M:%S.%f')[:-3]}] [Worker {worker_id}] ▶ START extraction: {file_name}"
        )

        try:
            res = await extract_with_timeout(
                batch_id, file_path, client, timeout_seconds=60.0
            )
            done_ts = datetime.now()
            duration = (done_ts - start_ts).total_seconds()
            print(
                f"[{done_ts.strftime('%H:%M:%S.%f')[:-3]}] [Worker {worker_id}] ✔ DONE extraction: {file_name} ({duration:.2f}s)"
            )

            if res and not isinstance(res, BaseException):
                invoice_id = await insert_invoice(res)
                if invoice_id:
                    print(
                        f"[{done_ts.strftime('%H:%M:%S.%f')[:-3]}] [Worker {worker_id}] ✔ SUCCESSFUL insertion: {file_name} -> UUID: {invoice_id}"
                    )
                    batch_results.append(res)

        except Exception as e:
            print(f"<custom_extraction.py> {file_path} error: {e!r}")
            batch_results.append(e)
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
    batch_results: list = []

    # -- API authentication --
    endpoint = os.getenv("DOCUMENTINTELLIGENCE_ENDPOINT")
    key = os.getenv("DOCUMENTINTELLIGENCE_API_KEY")
    credential = AzureKeyCredential(key)

    # -- Data structures --
    queue = asyncio.Queue(maxsize=20)

    # -- API Client and initiate workers --
    async with DocumentIntelligenceClient(
        credential=credential, endpoint=endpoint
    ) as client:
        # -- Initialize worker tasks --
        workers = [
            asyncio.create_task(
                extraction_worker(queue, batch_id, client, i, batch_results)
            )
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
    for result in batch_results:
        if isinstance(result, BaseException):
            print(f"<custom_extraction.py> processing error: {result!r}")
            continue
        invoices.append(result)

    return invoices
