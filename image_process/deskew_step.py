import os
import numpy as np
from PIL import Image
from deskew import determine_skew

def deskew_images(file_paths: list[str], batch_id: str):
    
    save_dir = f"data/deskewed/{batch_id}"
    os.makedirs(save_dir)
    
    deskewed_paths = []
    
    for image_path in file_paths:
        filename = os.path.basename(image_path)
        save_path = f"{save_dir}/{filename}"
        
        image = Image.open(image_path)
        
        grayscaled_array = np.array(image)
        angle = determine_skew(grayscaled_array)
        
        if angle is None:
            image.save(save_path)
            print(f'could not detect angle for {image_path}, saved as-is to:', save_path)
        else:
            deskewed_image = image.rotate(
                angle, 
                resample=Image.Resampling.BICUBIC, 
                expand=True, 
                fillcolor='white'
            )
            deskewed_image.save(save_path)
            print(f'deskewed image {image_path} (angle: {angle:.2f}) saved to:', save_path)
        
        deskewed_paths.append(save_path)
    
    return deskewed_paths
