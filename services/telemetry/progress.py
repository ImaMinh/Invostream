import asyncio
from typing import Dict, AsyncGenerator
from pydantic import BaseModel, Field
from datetime import datetime


class BatchProgress(BaseModel):
    batch_id: str
    total_files: int
    processed_files: int = 0
    successful_files: int = 0
    failed_files: int = 0
    progress_percent: float = 0.0
    current_file: str = ""
    status: str = "processing"  # "processing", "completed", "failed"
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class BatchProgressTracker:
    """
    In-memory singleton tracker that handles real-time batch progress
    updates and streams Server-Sent Events (SSE) to active client listeners.
    """

    def __init__(self):
        self._batches: Dict[str, BatchProgress] = {}
        self._listeners: Dict[str, list[asyncio.Queue]] = {}

    def register_batch(self, batch_id: str, total_files: int) -> BatchProgress:
        progress = BatchProgress(batch_id=batch_id, total_files=total_files)
        self._batches[batch_id] = progress
        self._listeners[batch_id] = []
        return progress

    async def update_file_status(self, batch_id: str, file_name: str, success: bool):
        if batch_id not in self._batches:
            # Fallback auto-registration if batch was initiated prior to tracker startup
            self.register_batch(batch_id, total_files=20)

        progress = self._batches[batch_id]
        progress.processed_files += 1
        progress.current_file = file_name
        if success:
            progress.successful_files += 1
        else:
            progress.failed_files += 1

        progress.progress_percent = round(
            (progress.processed_files / max(1, progress.total_files)) * 100, 1
        )
        if progress.processed_files >= progress.total_files:
            progress.status = "completed"

        progress.updated_at = datetime.now().isoformat()

        # Dispatch updates to registered SSE queues
        for queue in list(self._listeners.get(batch_id, [])):
            await queue.put(progress)

    async def subscribe(self, batch_id: str) -> AsyncGenerator[str, None]:
        queue: asyncio.Queue = asyncio.Queue()
        if batch_id in self._listeners:
            self._listeners[batch_id].append(queue)
        else:
            self._listeners[batch_id] = [queue]

        # Send initial snapshot immediately
        if batch_id in self._batches:
            yield f"data: {self._batches[batch_id].model_dump_json()}\n\n"

        try:
            while True:
                # Wait for next progress event with a timeout safety net
                try:
                    progress: BatchProgress = await asyncio.wait_for(
                        queue.get(), timeout=30.0
                    )
                    yield f"data: {progress.model_dump_json()}\n\n"
                    if progress.status == "completed":
                        break
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat comment for SSE connection stability
                    yield ": keep-alive\n\n"
        finally:
            if batch_id in self._listeners and queue in self._listeners[batch_id]:
                self._listeners[batch_id].remove(queue)


# Global tracker instance
progress_tracker = BatchProgressTracker()
