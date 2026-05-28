import os
import cv2

def denoise(file_path: str, batch_id: str) -> str:
    try:
        save_dir = f"data/denoised/{batch_id}"
        os.makedirs(save_dir, exist_ok=True)
        
        filename = os.path.basename(file_path)
        save_path = f"{save_dir}/{filename}"
        
        image = cv2.imread(file_path, cv2.IMREAD_GRAYSCALE)
        
        if image is None:
            raise ValueError(f"Could not read image: {file_path}")
        
        denoised_image = cv2.fastNlMeansDenoising(
            image,
            None,
            h=10,
            templateWindowSize=7,
            searchWindowSize=21
        )
        
        # denoised_image = cv2.medianBlur(image, ksize=3)
        
        cv2.imwrite(save_path, denoised_image)
        print(f'denoised image {file_path} saved to:', save_path)
        
        return save_path

    except Exception as e:
        print(f"<--DENOISE IMAGE> Error denoising images in batch {batch_id}: {e}")
        raise