import os
from PIL import Image

def grayscale(file_paths: list[str], batch_id: str):
    
    save_dir = f"data/grayscaled/{batch_id}"
    os.makedirs(save_dir)
    
    grayscaled_paths = []
    
    for image_path in file_paths:
        filename = os.path.basename(image_path)
        save_path = f"{save_dir}/{filename}"
    
        image = Image.open(image_path)
        
        grayscaled_image = image.convert('L')
        grayscaled_image.save(save_path)
        
        print(f'saved grayscaled image {image_path} to:', save_path)
        
        grayscaled_paths.append(save_path)
        
    return grayscaled_paths