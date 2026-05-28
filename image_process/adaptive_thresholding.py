import os
import cv2
import numpy as np
from PIL import Image

def threshold(file_path: str, batch_id: str):
    try:
        save_dir = f"data/thresholded/{batch_id}"
        os.makedirs(save_dir, exist_ok=True)
        
        filename = os.path.basename(file_path)
        save_path = f"{save_dir}/{filename}"
        
        image = cv2.imread(file_path, cv2.IMREAD_GRAYSCALE)

        if image is None:
            raise ValueError(f"Could not read image: {file_path}")
        
        thresholded_image = cv2.adaptiveThreshold(image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 41, 5)
        
        cv2.imwrite(save_path, thresholded_image)
        print(f'thresholded image {file_path} saved to:', save_path)
            
        return save_path
    except Exception as e:
        print(f"<--THRESHOLD IMAGE> Error thresholding image {file_path} in batch {batch_id}: {e}")
        raise