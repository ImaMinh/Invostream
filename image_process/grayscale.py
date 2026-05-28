import os
from PIL import Image

def grayscale(file_path: str, batch_id: str):
    try:
        save_dir = f"data/grayscaled/{batch_id}"
        os.makedirs(save_dir, exist_ok=True)
        
        filename = os.path.basename(file_path)
        save_path = f"{save_dir}/{filename}"
        
        image = Image.open(file_path)
        
        grayscaled_image = image.convert('L')
        grayscaled_image.save(save_path)
        
        print(f'saved grayscaled image {file_path} to:', save_path)
        
        return save_path
    except Exception as e:
        print(f"<--GRAYSCALE IMAGE> Error grayscaling image {file_path} in batch {batch_id}: {e}")
        raise