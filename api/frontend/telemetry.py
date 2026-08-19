from fastapi import APIRouter, Depends
from typing import List
from models.system_performance import MonthlyProcessingTimeMetric, MonthlyIPMMetric
from services.telemetry.system_performance_metrics import monthly_processing_time_service, monthly_ipm_service
from services.security.clerk_auth import verify_clerk_token

router = APIRouter(prefix="/api/telemetry/system", tags=["system-telemetry"])


# -- Historical Metrics over last month --
@router.get("/monthly-latency", response_model=List[MonthlyProcessingTimeMetric])
async def get_monthly_latency(user: dict = Depends(verify_clerk_token)):
    """
    Returns monthly average processing time metrics per invoice scoped by user.
    """
    user_id = user.get("sub")
    return await monthly_processing_time_service.get_metrics(user_id=user_id)


# -- Historical monthly and peak throughput --
@router.get("/monthly-ipm", response_model=List[MonthlyIPMMetric])
async def get_monthly_ipm(user: dict = Depends(verify_clerk_token)):
    """
    Returns monthly average and peak Invoices Per Minute (IPM) throughput metrics scoped by user.
    """
    user_id = user.get("sub")
    return await monthly_ipm_service.get_metrics(user_id=user_id)
