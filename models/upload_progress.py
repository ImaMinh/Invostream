from datetime import datetime

from pydantic import BaseModel, Field, computed_field


class UploadProgress(BaseModel):
    """
    - Represents the real-time telemetry snapshot and progress metrics for a batch invoice upload job.
    - Maintains file processing outcomes (successful, review needed, failed), timestamping, 
    and dynamically computes completion status and progress percentages for live SSE streaming.
    """
    upload_id: str
    user_id: str = "default_user" # placeholder for future implementation of multi-user login
    total_files: int 
    successful_files: int = 0  
    review_files: int = 0  
    failed_files: int = 0  
    current_file: str = ""
    status: str = "processing"  
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())

    @computed_field
    @property
    def finished_processed(self) -> int:
        return self.successful_files + self.review_files + self.failed_files

    @computed_field
    @property
    def under_process(self) -> int:
        return max(0, self.total_files - self.finished_processed)

    @computed_field
    @property
    def progress_percent(self) -> float:
        if self.total_files == 0:
            return 0.0
        return round((self.finished_processed / self.total_files) * 100, 1)
