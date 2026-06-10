from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from db.sqlite.job_queue import get_queue_size
from db.clickhouse.client import get_clickhouse_client
from datetime import datetime, timedelta
import math

def safe_float(val, default=0.0):
    if val is None:
        return default
    if isinstance(val, float) and math.isnan(val):
        return default
    return val

# A router with prefix = /api/dashboard, every API below will follow this link.
router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# ===== API for general metrics =====
@router.get("/overview")
async def get_dashboard_metrics():
    """
    ======================================================================
    Tổng quan về các loại metrics cần có: 
        - DASHBOARD TỔNG QUAN OCR: 
            • Tổng số hóa đơn xử lý theo ngày / tuần / tháng (đang được triển khai)
            • Tỷ lệ OCR thành công (%) (tính average confidence)
            • Tỷ lệ phải can thiệp thủ công (%) (cái này tính tay sau đó bắn vào clickhouse)
            • Thời gian phản hồi trung bình, P95, P99
            • Số mẫu hóa đơn đang active (chỉ có một mẫu prebuilt-invoice của Azure)
            • Số mẫu mới đang training / testing (tính năng này đang chưa được triển khai)
        - DASHBOARD CAN THIỆP THỦ CÔNG: 
            • Số hóa đơn cần chỉnh tay (đang được phát triển)
            • Thời gian xử lý trung bình / hóa đơn (đã có trong processing metrics)
            • Trường dữ liệu bị sửa nhiều nhất  (đang được phát triển)
            • So sánh trước và sau khi retrain model. (tính năng chưa được triển khai)
            - REPORT ĐỊNH KỲ: 
                • Report hiệu quả OCR theo tháng 
                • Report chất lượng dữ liệu (field hay zsai) 
                • Report mẫu hóa đơn mới 
                • Report hiệu năng & SLA hệ thống
    ======================================================================
    """
    try:
        client = get_clickhouse_client()
        
        # --- DASHBOARD TỔNG QUAN OCR ---
        
        # 1. Tổng số hóa đơn xử lý theo ngày (trong 30 ngày)
        volume_query = """
            SELECT toDate(created_at) as date, COUNT() as count
            FROM invoice_facts
            GROUP BY date
            ORDER BY date
        """
        volume_result = client.query(volume_query)
        volume_by_day = [{"date": row[0].strftime("%Y-%m-%d"), "count": row[1]} for row in volume_result.result_rows]
        print("VOLUME BY DAY = ", volume_by_day)
        total_invoices = sum(item["count"] for item in volume_by_day)

        # 2. Tỷ lệ OCR thành công (%) (Dựa trên status success)
        success_query = """
            SELECT ROUND(countIf(status = 'success') * 100.0 / MAX2(1, COUNT()), 2)
            FROM invoice_facts
        """
        success_result = client.query(success_query)
        success_rate = success_result.result_rows[0][0] if success_result.result_rows else 0.0

        # Mới: Số lượng hóa đơn theo status
        status_query = """
            SELECT status, COUNT()
            FROM invoice_facts
            GROUP BY status
        """
        status_result = client.query(status_query)
        status_counts = {"success": 0, "review": 0, "failed": 0}
        for row in status_result.result_rows:
            if row[0] in status_counts:
                status_counts[row[0]] = row[1]


        # 3. Tỷ lệ phải can thiệp thủ công (%) 
        manual_intervention_query = """
            SELECT ROUND(countIf(was_manually_corrected = 1) * 100.0 / MAX2(1, COUNT()), 2)
            FROM invoice_facts
        """
        manual_result = client.query(manual_intervention_query)
        manual_intervention_rate = manual_result.result_rows[0][0] if manual_result.result_rows else 0.0

        # 4. Thời gian phản hồi (Latency) - Avg, P95, P99
        latency_query = """
            SELECT 
                ROUND(avg(total_processing_time_ms), 2) as avg_time,
                quantile(0.95)(total_processing_time_ms) as p95_time,
                quantile(0.99)(total_processing_time_ms) as p99_time
            FROM invoice_facts
            WHERE total_processing_time_ms > 0
        """
        latency_result = client.query(latency_query)
        latency = {"avg_ms": 0, "p95_ms": 0, "p99_ms": 0}
        if latency_result.result_rows:
            row = latency_result.result_rows[0]
            latency = {
                "avg_ms": round(safe_float(row[0])), 
                "p95_ms": round(safe_float(row[1])), 
                "p99_ms": round(safe_float(row[2]))
            }
            print("latency = ", latency)

        # 5. Số mẫu hóa đơn đang active
        # TODO: tạo feature lưu các mẫu hóa đơn đang có vào trong dim_templates
        template_query = """
            SELECT COUNT() 
            FROM dim_templates 
            WHERE status = 'active'
        """
        template_result = client.query(template_query)
        active_templates = template_result.result_rows[0][0] if template_result.result_rows else 0

        # --- DASHBOARD CAN THIỆP THỦ CÔNG ---
        
        # 6. Số hóa đơn cần chỉnh tay (Current queue đang chờ duyệt)
        review_queue_query = """
            SELECT COUNT()
            FROM invoice_facts
            WHERE status = 'review'
        """
        review_queue_result = client.query(review_queue_query)
        pending_reviews = review_queue_result.result_rows[0][0] if review_queue_result.result_rows else 0

        # 7. Thời gian xử lý thủ công trung bình / hóa đơn
        manual_time_query = """
            SELECT ROUND(avg(manual_correction_time_ms), 2)
            FROM invoice_facts
            WHERE was_manually_corrected = 1 AND created_at >= NOW() - INTERVAL 30 DAY
        """
        manual_time_result = client.query(manual_time_query)
        avg_manual_time_ms = 0.0
        if manual_time_result.result_rows:
            avg_manual_time_ms = safe_float(manual_time_result.result_rows[0][0])

        # 8. Trường dữ liệu bị sửa nhiều nhất
        most_corrected_fields_query = """
            SELECT field_name, COUNT() as correction_count
            FROM field_confidence
            WHERE was_corrected = 1 AND created_at >= NOW() - INTERVAL 30 DAY
            GROUP BY field_name
            ORDER BY correction_count DESC
            LIMIT 5
        """
        corrected_fields_result = client.query(most_corrected_fields_query)
        most_corrected_fields = [{"field": row[0], "count": row[1]} for row in corrected_fields_result.result_rows]

        return {
            "overview_ocr": {
                "total_invoices": total_invoices,
                "volume_by_day": volume_by_day,
                "success_rate_percent": success_rate,
                "status_counts": status_counts,
                "manual_intervention_rate_percent": manual_intervention_rate,
                "processing_latency": latency,
                "active_templates_count": active_templates
            },
            "manual_intervention": {
                "pending_reviews_count": pending_reviews,
                "avg_manual_correction_time_ms": avg_manual_time_ms,
                "most_corrected_fields": most_corrected_fields
            }
        }
    except Exception as e:
        print(f"Error fetching overview metrics: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    

# ===== API for accuracy metrics  ===== 
@router.get("/accuracy")
async def get_accuracy_level():
    """
    ======================================================================
    Tổng quan Dashboard chất lượng OCR: 
    - DASHBOARD CHẤT LƯỢNG OCR: 
        • Accuracy theo từng trường (ngày, tổng tiền, VAT, MST, tên NCC…) 
        • Accuracy theo từng hóa đơn (document-level) 
        • Tỷ lệ lỗi: sai ký tự, sai định dạng, thiếu trường, nhầm trường 
        • Accuracy theo thời gian
    ======================================================================
    """
    try:
        client = get_clickhouse_client()

        # 1. Accuracy theo từng trường
        field_accuracy_query = """
            SELECT field_name, ROUND(avg(confidence) * 100, 2) as avg_accuracy
            FROM field_confidence
            GROUP BY field_name
            ORDER BY avg_accuracy DESC
        """
        field_acc_result = client.query(field_accuracy_query)
        field_accuracy = [{"field": row[0], "accuracy": row[1]} for row in field_acc_result.result_rows]

        # 2. Accuracy trung bình theo từng hóa đơn (document-level)
        doc_accuracy_query = """
        SELECT ROUND(avg(avg_confidence) * 100, 2)
        FROM invoice_facts
        """
        doc_acc_result = client.query(doc_accuracy_query)
        document_accuracy = 0.0
        if doc_acc_result.result_rows:
            document_accuracy = safe_float(doc_acc_result.result_rows[0][0])

        # 3. Tỷ lệ lỗi: phân loại lỗi (chỉ tính những field có đánh dấu error_type)
        error_type_query = """
            SELECT error_type, COUNT() as error_count
            FROM field_confidence
            GROUP BY error_type
            ORDER BY error_count DESC
        """
        error_result = client.query(error_type_query)
        total_errors = sum(row[1] for row in error_result.result_rows)
        error_rates = []
        if total_errors > 0:
            error_rates = [{"error_type": row[0], "percentage": round((row[1] / total_errors) * 100, 2), "count": row[1]} for row in error_result.result_rows]

        # 4. Accuracy theo thời gian (theo từng ngày trong tuần qua)
        acc_over_time_query = """
            SELECT toDate(created_at) as date, ROUND(avg(avg_confidence) * 100, 2) as avg_accuracy
            FROM invoice_facts
            GROUP BY date
            ORDER BY date
        """
        time_result = client.query(acc_over_time_query)
        accuracy_over_time = [{"date": row[0].strftime("%Y-%m-%d"), "accuracy": row[1]} for row in time_result.result_rows]

        return {
            "field_accuracy": field_accuracy,
            "document_accuracy": document_accuracy,
            "error_rates": error_rates,
            "accuracy_over_time": accuracy_over_time
        }
    except Exception as e:
        print(f"Error fetching accuracy metrics: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# ===== API for performance metrics  ===== 
@router.get("/processing_metrics")
async def get_processing_metrics():
    """
    ========================================================================================
    Tổng quan dashboard hiệu năng hệ thống:
    - DASHBOARD HIỆU NĂNG HỆ THỐNG: 
        • Thời gian xử lý từng bước (upload, preprocessing, OCR, postprocess, mapping) 
        • Throughput (invoice/phút) 
        • Queue / backlog 
        • Timeout rate 
        • Biểu đồ latency theo thời gian
    ========================================================================================
    """
    try:
        client = get_clickhouse_client()
        
        # 1. Thời gian xử lý trung bình từng bước (upload, preprocessing, OCR, postprocess, db_insert)
        step_times_query = """
            SELECT step_name, ROUND(avg(duration_ms), 2) as avg_duration_ms
            FROM processing_metrics
            GROUP BY step_name
        """
        step_times_result = client.query(step_times_query)
        step_times = {row[0]: row[1] for row in step_times_result.result_rows}
        
        # 2. Throughput (invoice/phút) trong 1 giờ qua dựa trên số lượng db_insert thành công
        throughput_query = """
        SELECT COUNT() / 60 
        FROM processing_metrics 
        WHERE step_name = 'db_insert' AND success = 1 AND created_at >= NOW() - INTERVAL 1 HOUR
        """
        throughput_result = client.query(throughput_query)
        throughput = round(throughput_result.result_rows[0][0], 2) if throughput_result.result_rows else 0.0
        
        # 3. Queue / backlog (Chênh lệch giữa số lượng upload và db_insert)
        backlog_query = """
            SELECT 
                (SUM(CASE WHEN step_name = 'upload' THEN 1 ELSE 0 END) - 
                SUM(CASE WHEN step_name = 'db_insert' THEN 1 ELSE 0 END))
            FROM processing_metrics
        """
        backlog_result = client.query(backlog_query)
        backlog = int(backlog_result.result_rows[0][0]) if backlog_result.result_rows else 0
        backlog = max(0, backlog) # Đảm bảo không âm
        
        # 4. Timeout rate / Error rate
        timeout_query = """
            SELECT 
                countIf(success = 0) * 100.0 / MAX2(1, COUNT())
            FROM processing_metrics
        """
        timeout_result = client.query(timeout_query)
        timeout_rate = round(timeout_result.result_rows[0][0], 2) if timeout_result.result_rows else 0.0
        
        # 5. Biểu đồ latency theo thời gian (24h qua)
        latency_query = """
            SELECT 
                toStartOfHour(created_at) as time_window, 
                ROUND(avg(duration_ms), 2) as avg_latency
            FROM processing_metrics 
            WHERE step_name = 'db_insert' AND created_at >= NOW() - INTERVAL 24 HOUR
            GROUP BY time_window 
            ORDER BY time_window
        """
        latency_result = client.query(latency_query)
        latency_chart = [{"time": row[0].strftime("%H:%M"), "latency_ms": row[1]} for row in latency_result.result_rows]
        
        return {
            "step_times_ms": step_times,
            "throughput_per_minute": throughput,
            "backlog": backlog,
            "timeout_rate_percent": timeout_rate,
            "latency_chart": latency_chart
        }
    except Exception as e:
        print(f"Error fetching processing metrics: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


