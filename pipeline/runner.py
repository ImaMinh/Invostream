
from db.sqlite.job_queue import enqueue_jobs
from image_process.ingest import ingest_image
from ocr.extraction import extract_invoices
from db.postgresql.invoices import insert_invoice

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
        processed_images_paths, failures = ingest_image(file_paths, batch_id)
        
        # -- 3rd task, send the processed paths over to OCR extraction --
        try: 
            extraction_results = extract_invoices(processed_images_paths, batch_id)
            print(f"<PIPELINE RUNNER> successfully received extraction results for batch {batch_id}: ex.: {extraction_results[0]}")
        except Exception as e:
            print(f"Error extracting invoices from {processed_images_paths} in batch {batch_id}: {e}")
        
        # -- 4th task, send the extracted data over to db insertion --
        for extracted_data in extraction_results:
            try: 
                invoice_uuid = await insert_invoice(extracted_data)
                print(f"<PIPELINE RUNNER> successfully inserted invoice with UUID {invoice_uuid} into database for batch {batch_id} and image {extracted_data.file_name}")
            except Exception as e:
                print(f"Error inserting invoice data into database for batch {batch_id} and image {extracted_data.file_name}: {e}")
                continue  # Continue processing the next invoice even if one fails
         
        # create multi-processors tasks.
        # multi-processors tasks takes over the logic.
        # receives the results from multi-processors tasks. 
    except Exception as e:
        print(e)
        raise
    