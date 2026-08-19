from pydantic import BaseModel


class MonthlyProcessingTimeMetric(BaseModel):
    """
    Data model representing monthly average processing time per invoice.
    """
    month: str
    total_invoices: int
    avg_processing_time_seconds: float


class MonthlyIPMMetric(BaseModel):
    """
    Data model representing monthly Invoices Per Minute (IPM) throughput.
    """
    month: str
    total_invoices: int
    avg_ipm: float
    peak_ipm: int
