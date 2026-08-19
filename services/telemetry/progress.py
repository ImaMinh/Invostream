from datetime import datetime

from typing import AsyncGenerator, Literal, Optional

from models.upload_progress import UploadProgress

import asyncio


class UploadProgressTracker:
    """
    In-memory singleton class tracking batch states and managing
    asyncio queues for SSE event broadcasting.
    """

    def __init__(self):
        self._uploads: dict[str, UploadProgress] = {}

        # maps each upload_id to a list of active asyncio.Queue conns for live progress updates 
        self._listeners: dict[str, list[asyncio.Queue]] = {}

    def register_upload(self, upload_id: str, total_files: int, user_id: str="default_user")->UploadProgress:
        progress =UploadProgress(upload_id=upload_id, user_id=user_id, total_files=total_files)
        self._uploads[upload_id] = progress
        self._listeners[upload_id] = []
        return progress

    async def update_file_status(self, upload_id: str, file_name: str, outcome: Literal["success", "review", "failed"])->None:
        """
        Mutates batch state metrics and pushes updates to subscribers.
        """
        if upload_id not in self._uploads:
            return

        progress = self._uploads[upload_id]
        progress.current_file = file_name
        
        if outcome == "success":
            progress.successful_files += 1
        elif outcome == "review":
            progress.review_files += 1
        elif outcome == "failed":
            progress.failed_files += 1
        if progress.finished_processed >= progress.total_files:
            progress.status = "completed"

        progress.updated_at = datetime.now().isoformat()

        for queue in list(self._listeners.get(upload_id, [])):
            await queue.put(progress)

    async def subscribe(self, upload_id: str)->AsyncGenerator[str, None]:
        """
        Returns an async generator which streams real-time UploadProgress via SSE
        """
        queue: asyncio.Queue = asyncio.Queue()

        # if there are upload jobs associated with this job id
        # then append the job's queue to the existing list of queues of the job.
        if upload_id in self._listeners:
            self._listeners[upload_id].append(queue)
        # if there is None -> create a new list containing the current queue. 
        else: 
            self._listeners[upload_id] = [queue]

        if upload_id in self._uploads:
            yield f"data: {self._uploads[upload_id].model_dump_json()}\n\n"
        
        try: 
            # Continuously stream live updates until the batch completes
            while True: 
                # Wait for next progress event with a 60s timeout safety net
                progress: UploadProgress = await asyncio.wait_for(queue.get(), timeout=60.0)
                
                # Format and yield serialized payload as W3C SSE event frame
                yield f"data: {progress.model_dump_json()}\n\n"

                # Close stream naturally once batch reaches 100% completion
                if progress.status == "completed": 
                    break
        
        except asyncio.TimeoutError:
            # Send SSE comment heartbeat ping to prevent proxy/browser TCP timeouts
            yield ": keep-alive\n\n"

        finally: 
            # Cleanup queue on client disconnect or completion to prevent memory leaks
            if upload_id in self._listeners and queue in self._listeners[upload_id]:
                self._listeners[upload_id].remove(queue)

# ------------------------------------------------------------------
# Global Singleton Instance Export
# ------------------------------------------------------------------
upload_progress_tracker = UploadProgressTracker()
