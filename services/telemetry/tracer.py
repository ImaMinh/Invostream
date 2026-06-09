import time
import functools

def track_step(step_name):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            invoice_id = args[0].id if args else "unknown" 
            try:
                result = func(*args, **kwargs)
                duration_ms = int((time.time() - start_time) * 1000)
                send_metric_to_kafka(invoice_id, step_name, duration_ms, success=1)
                return result
            except Exception as e:
                duration_ms = int((time.time() - start_time) * 1000)
                send_metric_to_kafka(invoice_id, step_name, duration_ms, success=0, error=str(e))
                raise e
        return wrapper
    return decorator