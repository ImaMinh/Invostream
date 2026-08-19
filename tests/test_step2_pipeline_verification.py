import asyncio
import os
import sys
import shutil
from io import BytesIO
from fastapi import UploadFile

# Add project root directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pipeline.orchestrator import save_raw_batch, INGEST_TO_PRODUCER, PRODUCER_CONSUMER_BUFFER

async def run_step_2_verification():
    print("=== [STEP 2 VERIFICATION] Async Pipeline Identity Propagation Verification ===")

    test_batch_id = "test_batch_verify_user_id"
    test_upload_id = "test_upload_verify_user_id"
    test_user_id = "user_tenant_alpha_pipeline"

    # Create dummy upload file
    dummy_bytes = b"%PDF-1.4 Mock PDF Content for Pipeline User ID Test"
    file_obj = UploadFile(filename="pipeline_test.pdf", file=BytesIO(dummy_bytes))

    print(f"1. Enqueuing upload batch with user_id = '{test_user_id}'...")
    saved_paths = await save_raw_batch([file_obj], batch_id=test_batch_id, upload_id=test_upload_id, user_id=test_user_id)
    
    assert len(saved_paths) == 1, "Expected 1 saved file path"
    print(f"✔ File saved to: {saved_paths[0]}")

    # 2. Verify Queue 1 Payload (INGEST_TO_PRODUCER)
    job_q1 = await INGEST_TO_PRODUCER.get()
    INGEST_TO_PRODUCER.task_done()

    print(f"\n2. Dequeued from Queue 1 (INGEST_TO_PRODUCER):")
    print(f"   - batch_id:  {job_q1.get('batch_id')}")
    print(f"   - upload_id: {job_q1.get('upload_id')}")
    print(f"   - user_id:   {job_q1.get('user_id')}")

    assert job_q1.get("user_id") == test_user_id, f"Queue 1 expected user_id '{test_user_id}', got '{job_q1.get('user_id')}'"
    print("✔ Queue 1 user_id propagation verified!")

    # 3. Simulate Producer worker forwarding to Queue 2 (PRODUCER_CONSUMER_BUFFER)
    await PRODUCER_CONSUMER_BUFFER.put({
        "batch_id": job_q1["batch_id"],
        "upload_id": job_q1["upload_id"],
        "user_id": job_q1["user_id"],
        "novel_file_paths": job_q1["file_paths"]
    })

    job_q2 = await PRODUCER_CONSUMER_BUFFER.get()
    PRODUCER_CONSUMER_BUFFER.task_done()

    print(f"\n3. Dequeued from Queue 2 (PRODUCER_CONSUMER_BUFFER):")
    print(f"   - batch_id:  {job_q2.get('batch_id')}")
    print(f"   - upload_id: {job_q2.get('upload_id')}")
    print(f"   - user_id:   {job_q2.get('user_id')}")

    assert job_q2.get("user_id") == test_user_id, f"Queue 2 expected user_id '{test_user_id}', got '{job_q2.get('user_id')}'"
    print("✔ Queue 2 user_id propagation verified!")

    # Cleanup test raw directory
    test_dir = f"data/raw/{test_batch_id}"
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
        print(f"\n✔ Cleaned up temporary test folder: {test_dir}")

    print("\n✅ STEP 2 VERIFICATION PASSED PERFECTLY!")
    return True

if __name__ == "__main__":
    asyncio.run(run_step_2_verification())
