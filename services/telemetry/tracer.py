from services.telemetry.exporter import export_metric_to_kafka
import time
import functools
import asyncio
import contextlib

def track_time(step_name):
    def main_wrapper_func(func):
        
        # For asynchronous code
        if asyncio.iscoroutinefunction(func):
            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    duration_ms = int((time.time() - start_time) * 1000)
                    
                    print(f"[METRIC] {step_name} | Status: SUCCESS | Time: {duration_ms}ms")
                    asyncio.create_task(export_metric_to_kafka(
                        step_name=step_name,
                        start_time=start_time,
                        end_time=time.time(),
                        duration_ms=duration_ms,
                        success=1
                    ))
                    return result
                except Exception as e:
                    duration_ms = int((time.time() - start_time) * 1000)
                    item_id = kwargs.get('batch_id') or (args[0] if args and isinstance(args[0], str) else "unknown")
                    print(f"[METRIC] {step_name} | ID: {item_id} | Status: FAILED | Time: {duration_ms}ms | Error: {str(e)}")
                    asyncio.create_task(export_metric_to_kafka(
                        step_name=step_name,
                        start_time=start_time,
                        end_time=time.time(),
                        duration_ms=duration_ms,
                        success=0,
                        error_message=str(e)
                    ))
                    raise e
            return async_wrapper
            
        # For concurrent code
        else:
            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    duration_ms = int((time.time() - start_time) * 1000)
                    
                    item_id = kwargs.get('batch_id') or (args[0] if args and isinstance(args[0], str) else "unknown")
                    print(f"[METRIC] {step_name} | ID: {item_id} | Status: SUCCESS | Time: {duration_ms}ms")
                    asyncio.create_task(export_metric_to_kafka(
                        step_name=step_name,
                        start_time=start_time,
                        end_time=time.time(),
                        duration_ms=duration_ms,
                        success=1
                    ))
                    return result
                except Exception as e:
                    duration_ms = int((time.time() - start_time) * 1000)
                    item_id = kwargs.get('batch_id') or (args[0] if args and isinstance(args[0], str) else "unknown")
                    print(f"[METRIC] {step_name} | ID: {item_id} | Status: FAILED | Time: {duration_ms}ms | Error: {str(e)}")
                    asyncio.create_task(export_metric_to_kafka(
                        step_name=step_name,
                        start_time=start_time,
                        end_time=time.time(),
                        duration_ms=duration_ms,
                        success=0,
                        error_message=str(e)
                    ))
                    raise e
            return sync_wrapper
            
    return main_wrapper_func


@contextlib.contextmanager
def track_block(step_name: str, batch_id: str):
    """
    Context manager to track time for a specific block of code (like Mapping, API call).
    Usage:
        with track_block("mapping", batch_id):
            # do mapping logic here
    """
    start_time = time.time()
    try:
        yield
        duration_ms = int((time.time() - start_time) * 1000)
        print(f"[METRIC] {step_name} | ID: {batch_id} | Status: SUCCESS | Time: {duration_ms}ms")
        
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(export_metric_to_kafka(
                step_name=step_name,
                start_time=start_time,
                end_time=time.time(),
                duration_ms=duration_ms,
                success=1
            ))
        except RuntimeError:
            # If no running event loop, we can't create task easily without passing the event loop.
            pass
            
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        print(f"[METRIC] {step_name} | ID: {batch_id} | Status: FAILED | Time: {duration_ms}ms | Error: {str(e)}")
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(export_metric_to_kafka(
                step_name=step_name,
                start_time=start_time,
                end_time=time.time(),
                duration_ms=duration_ms,
                success=0,
                error_message=str(e)
            ))
        except RuntimeError:
            pass
        raise e