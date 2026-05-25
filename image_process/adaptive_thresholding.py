import os
import cv2
import numpy as np
from PIL import Image

def threshold(file_paths: list[str], batch_id: str):
    
    save_dir = f"data/thresholded/{batch_id}"
    os.makedirs(save_dir)
    
    thresholded_paths = []
    
    for image_path in file_paths:
        filename = os.path.basename(image_path)
        save_path = f"{save_dir}/{filename}"
        
        image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

        if image is None:
            print(f'failed to read image: {image_path}')
            continue
        
        thresholded_image = cv2.adaptiveThreshold(image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 41, 5)
        
        cv2.imwrite(save_path, thresholded_image)
        print(f'thresholded image {image_path} saved to:', save_path)
        
        thresholded_paths.append(save_path)
        
    return thresholded_paths