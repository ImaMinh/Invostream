import os
import uuid
import asyncio
import traceback

from fastapi import UploadFile
from fastapi import HTTPException

from db.postgresql.invoices import insert_invoice
from db.sqlite.job_queue import enqueue_jobs

from tests.scripts.extraction import extract_invoices
from models.invoice import Invoice
from models.batch import DuplicateFileInfo
from services.dedup.deduplication import compute_hash, find_existing


# --- Cấu hình ---
# Số batch được xử lý song song. Đây là tầng giới hạn THỨ NHẤT.
# Tầng thứ hai là OCR_SEMAPHORE trong extraction.py (giới hạn request tới Azure).
MAX_CONCURRENT_BATCHES = int(os.getenv("MAX_CONCURRENT_BATCHES", "3"))

# maxsize tạo backpressure: khi queue đầy, batch_setup bị chặn ở await JOB_QUEUE.put()
# thay vì tích luỹ job trong bộ nhớ.
JOB_QUEUE_MAXSIZE = int(os.getenv("JOB_QUEUE_MAXSIZE", "20"))

JOB_QUEUE: asyncio.Queue = asyncio.Queue(maxsize=JOB_QUEUE_MAXSIZE)


def save_files_to_disk(
    uploaded_files: list[tuple[str | None, bytes, str]],
    batch_id: str,
) -> list[tuple[str, str]]:
    """
    Lưu file xuống đĩa. Trả về list (file_path, content_hash).

    Args:
        uploaded_files: list (filename, file_bytes, content_hash) từ tầng API.
        batch_id: batch ID sinh ra trong batch_setup.
    """
    try:
        save_dir = f"data/raw/{batch_id}"
        os.makedirs(save_dir)

        results = []
        for file_name, file_content, content_hash in uploaded_files:
            if not (file_content and file_name):
                continue

            file_name = file_name.split("/").pop()
            file_path = f"{save_dir}/{file_name}"
            with open(file_path, "wb") as f:
                f.write(file_content)

            results.append((file_path, content_hash))

        return results

    except Exception as error:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error))


async def batch_setup(chunk: list[UploadFile]) -> list[DuplicateFileInfo]:
    """
    Nhận một chunk file từ tầng ingestion. Đọc bytes, kiểm tra trùng lặp,
    và chỉ enqueue những file chưa từng xử lý.
    Trả về list DuplicateFileInfo cho các file bị bỏ qua.
    """
    try:
        # -- 1. đọc bytes và tính content hash --
        file_data: list[tuple[str | None, bytes, str]] = []
        for file in chunk:
            raw_bytes = await file.read()
            content_hash = compute_hash(raw_bytes)
            file_data.append((file.filename, raw_bytes, content_hash))

        # -- 2. kiểm tra hash nào đã có trong database --
        all_hashes = [hash for _, _, hash in file_data]
        existing_hashes = await find_existing(all_hashes)

        # -- 3. tách file mới khỏi file trùng --
        novel_files = []
        duplicates: list[DuplicateFileInfo] = []
        seen_in_batch: set[str] = set()  # dedup trong cùng một batch

        for file_name, file_bytes, content_hash in file_data:
            if content_hash in existing_hashes or content_hash in seen_in_batch:
                duplicates.append(DuplicateFileInfo(
                    file_name=file_name or "unknown",
                    content_hash=content_hash,
                ))
                print(f"<--BATCH--> bỏ qua file trùng: {file_name} (hash: {content_hash[:12]}...)")
            else:
                novel_files.append((file_name, file_bytes, content_hash))
                seen_in_batch.add(content_hash)

        # -- 4. lưu và enqueue các file mới --
        if novel_files:
            batch_id = str(uuid.uuid4())
            saved_results = save_files_to_disk(novel_files, batch_id)
            file_paths = [fp for fp, _ in saved_results]

            await enqueue_jobs(batch_id=batch_id, file_paths=file_paths)

            # Chặn ở đây nếu queue đầy — đây chính là backpressure.
            await JOB_QUEUE.put({
                "batch_id": batch_id,
                "file_paths": file_paths,
            })

        return duplicates

    except Exception as error:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error))


async def handle_batch_result(invoices: list[Invoice], batch_id: str) -> None:
    """
    Ghi kết quả của một batch xuống database.
    Một invoice lỗi không làm dừng các invoice còn lại.
    """
    saved = 0
    for invoice in invoices:
        try:
            invoice_uuid = await insert_invoice(invoice)

            # insert_invoice trả None nếu DB bắt được trùng lặp
            if invoice_uuid is None:
                continue

            saved += 1
            print(f"<BATCH {batch_id}> đã lưu {invoice.file_name} → {invoice_uuid}")

        except Exception:
            print(f"<BATCH {batch_id}> lỗi khi lưu {invoice.file_name}")
            traceback.print_exc()
            continue

    print(f"<BATCH {batch_id}> ghi xong {saved}/{len(invoices)} invoice")


async def batch_consumer(consumer_id: int) -> None:
    """
    Một consumer: lấy batch từ queue, xử lý, lặp lại vô hạn.
    Số consumer chính là giới hạn số batch chạy song song.
    """
    while True:
        job = await JOB_QUEUE.get()
        batch_id = job["batch_id"]
        file_paths = job["file_paths"]

        try:
            print(f"[consumer {consumer_id}] nhận batch {batch_id} ({len(file_paths)} file)")

            invoices = await extract_invoices(file_paths, batch_id)
            await handle_batch_result(invoices, batch_id)

            print(f"[consumer {consumer_id}] xong batch {batch_id}")

        except Exception:
            # Không raise HTTPException ở đây: không còn HTTP request nào để trả về,
            # và exception trong background task sẽ bị nuốt im lặng.
            print(f"[consumer {consumer_id}] batch {batch_id} THẤT BẠI")
            traceback.print_exc()

        finally:
            # Phải nằm trong finally, nếu không một lỗi bất kỳ sẽ khiến
            # JOB_QUEUE.join() treo vĩnh viễn.
            JOB_QUEUE.task_done()


async def main_process() -> None:
    """
    Khởi động N consumer chạy song song trong cùng một event loop.
    Gọi hàm này từ FastAPI lifespan startup.
    """
    print(f"<-- MAIN PROCESS --> khởi động {MAX_CONCURRENT_BATCHES} consumer")

    consumers = [
        asyncio.create_task(batch_consumer(i), name=f"batch_consumer_{i}")
        for i in range(MAX_CONCURRENT_BATCHES)
    ]

    # Giữ tham chiếu tới task — nếu không, garbage collector có thể thu hồi chúng.
    await asyncio.gather(*consumers)