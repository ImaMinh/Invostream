from pydantic import BaseModel


class DuplicateFileInfo(BaseModel):
    """Details about a file that was skipped because it was already processed."""
    file_name: str
    content_hash: str


class BatchUploadResponse(BaseModel):
    status: str
    accepted_count: int = 0
    duplicate_count: int = 0
    duplicates: list[DuplicateFileInfo] = []