"""
TẠM THỜI KHÔNG ĐƯỢC DÙNG.

Sau refactor, OCR chạy trực tiếp trong event loop chính (xem batch.py),
vì gọi Azure là thao tác chờ mạng — không có việc CPU nào để cần process riêng.
Chạy nó trong process riêng khiến OCR_SEMAPHORE bị nhân lên N bản độc lập,
mỗi bản đếm riêng, nên không thành phần nào giới hạn được tổng số request.

File này giữ lại cho bước sau: khi wire ingest_image (OpenCV) vào pipeline,
ProcessPoolExecutor quay lại đúng chỗ của nó là bọc phần TIỀN XỬ LÝ ẢNH,
không phải phần gọi API.

Nguyên tắc: việc CPU vào process pool, việc mạng ở event loop chính.
"""

import os
import asyncio

from image_process.ingest import ingest_image


def run_worker(batch_file_paths, batch_id):
    # Tạo event loop mới. Không gây RuntimeError vì loop được tạo trong
    # một OS process mới (PID mới, không gian bộ nhớ mới).
    return asyncio.run(worker_process(batch_file_paths, batch_id))


async def worker_process(batch_file_paths: list[str], batch_id):
    """
    Worker process xử lý một batch.

    TODO (bước 8): đổi hàm này thành tiền xử lý ảnh thuần CPU —
    nhận list file path, chạy ingest_image cho từng file, trả về
    list bytes đã xử lý. Không gọi Azure ở đây.
    """
    pid = os.getpid()
    print(f"\n[PID: {pid}] WORKER PROCESS STARTED for batch: {batch_id} | Files: {len(batch_file_paths)}")

    raise NotImplementedError(
        "runner.py tạm thời không dùng. OCR đã chuyển sang event loop chính trong batch.py."
    )