from services.telemetry.exporter import export_metric_to_kafka
import time
import functools
import asyncio
import contextlib

# Layer 1: factory. Runs when you write @track_time("x").
# Captures step_name in a closure and hands back the real decorator.
def track_time(step_name):

    # Layer 2: the decorator. Runs ONCE, at import time, per decorated function.
    def main_wrapper_func(func):

        # Branch decided once at import. Async funcs must be awaited; calling
        # one without await returns a coroutine instantly and measures ~0ms.
        if asyncio.iscoroutinefunction(func):

            # wraps() copies __name__/__doc__ so tracebacks show the real
            # function, not "async_wrapper".
            @functools.wraps(func)
            # Layer 3: runs on EVERY call. *args/**kwargs forwards any signature.
            async def async_wrapper(*args, **kwargs):
                start_time = time.time()   # NOTE: monotonic() is safer; wall clock can jump back
                try:
                    # ---- success path ----
                    # Suspends here; elapsed includes I/O wait AND time the loop
                    # spent on other tasks. Wall-clock latency, not CPU work.
                    result = await func(*args, **kwargs)
                    duration_ms = int((time.time() - start_time) * 1000)

                    # BUG: item_id not computed here. Other 3 paths log it ->
                    # inconsistent log shape.
                    print(f"[METRIC] {step_name} | Status: SUCCESS | Time: {duration_ms}ms")

                    # Fire-and-forget so the export adds no latency.
                    # BUG: task not referenced -> can be GC'd before it runs.
                    asyncio.create_task(export_metric_to_kafka(
                        step_name=step_name,
                        start_time=start_time,
                        # 2nd time.time() call -> end_time - start_time != duration_ms
                        end_time=time.time(),
                        duration_ms=duration_ms,
                        success=1
                    ))
                    return result   # caller sees the original return value

                # ---- failure path ----
                # Exception, not BaseException: CancelledError/KeyboardInterrupt
                # pass through with no metric recorded.
                except Exception as e:
                    duration_ms = int((time.time() - start_time) * 1000)
                    # Heuristic ID. Falls through on falsy batch_id ("" or 0).
                    # On methods args[0] is self (not str) -> "unknown".
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
                    # Observe, don't swallow. BUG: `raise e` resets the traceback
                    # to this line; bare `raise` keeps the original origin.
                    raise e
            return async_wrapper

        # Comment in original says "concurrent" -- wrong. This is plain sync.
        else:
            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    # ---- success path ----
                    result = func(*args, **kwargs)   # no await; blocks until done
                    duration_ms = int((time.time() - start_time) * 1000)

                    item_id = kwargs.get('batch_id') or (args[0] if args and isinstance(args[0], str) else "unknown")
                    print(f"[METRIC] {step_name} | ID: {item_id} | Status: SUCCESS | Time: {duration_ms}ms")

                    # LIVE BUG: create_task needs a RUNNING event loop. A sync
                    # func called from a plain script has none -> RuntimeError.
                    # It fires AFTER result is computed but BEFORE `return
                    # result`, so the caller loses the return value entirely.
                    # Fix: wrap in try/except RuntimeError like track_block does.
                    asyncio.create_task(export_metric_to_kafka(
                        step_name=step_name,
                        start_time=start_time,
                        end_time=time.time(),
                        duration_ms=duration_ms,
                        success=1
                    ))
                    return result

                # ---- failure path ----
                except Exception as e:
                    duration_ms = int((time.time() - start_time) * 1000)
                    item_id = kwargs.get('batch_id') or (args[0] if args and isinstance(args[0], str) else "unknown")
                    print(f"[METRIC] {step_name} | ID: {item_id} | Status: FAILED | Time: {duration_ms}ms | Error: {str(e)}")
                    # Same RuntimeError risk as above.
                    asyncio.create_task(export_metric_to_kafka(
                        step_name=step_name,
                        start_time=start_time,
                        end_time=time.time(),
                        duration_ms=duration_ms,
                        success=0,
                        error_message=str(e)
                    ))
                    raise e   # same traceback-reset issue
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