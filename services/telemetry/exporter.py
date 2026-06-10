"""
================================================================================
Exporter script to send metric data to Kafka topic: invostream.telemetry
================================================================================
"""

from aiokafka import AIOKafkaProducer
import json
import os
from datetime import datetime

_producer = None

async def get_kafka_producer():
    global _producer
    if _producer is None:
        kafka_server = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
        _producer = AIOKafkaProducer(bootstrap_servers=kafka_server)
        await _producer.start()

    return _producer

async def export_metric_to_kafka(
    step_name: str, 
    start_time: float, 
    end_time: float, 
    duration_ms: int, 
    success: int, 
    error_message: str = ""
):
    """
    Asynchronously sends telemetry metrics of a processing step to a Kafka Topic.
    This function is non-blocking to ensure the main application logic is not delayed.

    Args:
        step_name (str): The name of the processing step being measured (e.g., 'upload', 'ocr_worker', 'db_insert').
        start_time (float): The start time of the processing step (from time.time()).
        end_time (float): The end time of the processing step (from time.time()).
        duration_ms (int): The actual processing duration in milliseconds.
        success (int): The execution status of the step. 1 = Success, 0 = Failed.
        invoice_id (str, optional): The UUID of the invoice. Defaults to None.
        job_id (str, optional): The specific job identifier. Defaults to None.
        batch_id (str, optional): The batch identifier. Defaults to None.
        error_message (str, optional): A string containing the error message if the process failed. Defaults to "".
    """
    
    try:
        producer = await get_kafka_producer()
        
        payload = {
            "step_name": step_name,
            "started_at": datetime.fromtimestamp(start_time).isoformat(),
            "finished_at": datetime.fromtimestamp(end_time).isoformat(),
            "duration_ms": duration_ms,
            "success": success,
            "error_message": error_message,
        }
        
        await producer.send_and_wait("invostream.telemetry", json.dumps(payload).encode('utf-8'))
        
    except Exception as e:
        print(f"Failed to send telemetry to Kafka: {e}")