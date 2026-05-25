
from db.job_queue import enqueue_jobs
from image_process.ingest import ingest_image
from ocr.extraction import extract_invoices


async def pipeline_runner(file_paths: list[str], batch_id):
    """
    Orchestrate the end-to-end processing of one invoice batch.
    Receives a prepared batch, validate it is ready, enqueues or starts processing.
    Returns a batch receipt + status. 
    """
    try: 
        
        # -- 1st task: enqueue the job to the the <job queue> 
        await enqueue_jobs(batch_id=batch_id, file_paths=file_paths)
        
        # -- 2nd task, sending the images over to ingest.py --:
        processed_images_paths = await ingest_image(file_paths, batch_id)
        
        # -- 3rd task, send the processed paths over to OCR extraction --
        if(processed_images_paths):
            extracted_invoices = await extract_invoices(file_paths=processed_images_paths, batch_id=batch_id)
            print(extracted_invoices[0])
        
        # create multi-processors tasks.
        # multi-processors tasks takes over the logic.
        # receives the results from multi-processors tasks. 
    except Exception as e:
        print(e)
        raise
    