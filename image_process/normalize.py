import os
from PIL import Image

def normalize_dpi(image_path: str, batch_id: str, target_dpi=300):
    save_dir = f"data/normalized/{batch_id}"
    os.makedirs(save_dir, exist_ok=True)

    filename = os.path.basename(image_path)
    save_path = f"{save_dir}/{filename}"

    image = Image.open(image_path)
    image.save(save_path, dpi=(target_dpi, target_dpi))
    
    print(f'saved image {image_path} to:', save_path)
    
    return save_path

# def dpi_normalize(file_paths: list[str], batch_id: str):
#     save_dir = f"data/normalized/{batch_id}"
#     os.makedirs(save_dir)  
    
#     normalized_paths = []
    
#     for image_path in file_paths:
#         normalized_paths.append(normalize(image_path, save_dir, target_dpi=600))
        
#     return normalized_paths
  

    
    
    
    