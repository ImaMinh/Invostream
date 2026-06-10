from image_process.normalize import normalize_dpi
from image_process.grayscale import grayscale
from image_process.deskew_step import deskew_images
from image_process.adaptive_thresholding import threshold
from image_process.denoise import denoise
import os
from services.telemetry.tracer import track_time

def process_image(image_path: str, batch_id: str):
     # 1. Extract the file extension
    ext = os.path.splitext(image_path)[1].lower()

    # 2. If it's a PDF, DO NOT touch it with OpenCV. Azure loves raw PDFs.
    if ext == ".pdf":
        print(f"<INGEST IMAGE -- IMAGE PROCESS> Skipping preprocessing for PDF: {image_path}")
        return image_path

    # 3. if it's an image file, proceed with the following preprocessing steps:
    path = normalize_dpi(image_path, batch_id, target_dpi=300)
    path = grayscale(path, batch_id)
    path = deskew_images(path, batch_id)
    path = threshold(path, batch_id)
    path = denoise(path, batch_id)
    return path


@track_time("preprocessing")
def ingest_image(file_paths: list[str], batch_id: str) -> tuple[list[str], list[str]]:
    print("<INGEST IMAGE -- IMAGE PROCESS> Received batch: ", batch_id)

    results, failures = [], []
    for image_path in file_paths:
        try:
            results.append(process_image(image_path, batch_id))
        except Exception as e:
            print(f"<INGEST IMAGE -- IMAGE PROCESS> Failed {image_path}: {e}")
            failures.append(image_path)

    return results, failures
    
    
