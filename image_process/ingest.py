# normalize
# deskew
# denoise
# grayscale
# quality check

import os
from image_process.normalize import dpi_normalize
from image_process.grayscale import grayscale
from image_process.deskew_step import deskew_images
from image_process.adaptive_thresholding import threshold
from image_process.denoise import denoise

async def ingest_image(file_paths: list[str], batch_id: str) -> list[str] | None:
    try:
        print("received batch: ", batch_id)  
        
        normalized_paths = dpi_normalize(file_paths, batch_id)
        
        grayscaled_paths = grayscale(normalized_paths, batch_id)
        
        deskewed_paths = deskew_images(grayscaled_paths, batch_id)
        
        thresholds_paths = threshold(deskewed_paths, batch_id)
        
        denoised_paths = denoise(thresholds_paths, batch_id)
        
        return denoised_paths
    except:
        pass