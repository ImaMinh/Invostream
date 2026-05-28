from pydantic import BaseModel

class BatchUploadResponse(BaseModel):
    batch_id: str
    status: str
    