import os
import cv2

def denoise(file_paths: list[str], batch_id: str) -> list[str]:
    save_dir = f"data/denoised/{batch_id}"
    os.makedirs(save_dir)
    
    denoised_paths = []
    
    for image_path in file_paths:
        filename = os.path.basename(image_path)
        save_path = f"{save_dir}/{filename}"
        
        image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        
        if image is None:
            print(f'failed to read image: {image_path}')
            continue
        
        # denoised_image = cv2.fastNlMeansDenoising(
        #     image,
        #     None,
        #     h=10,
        #     templateWindowSize=7,
        #     searchWindowSize=21
        # )
        
        denoised_image = cv2.medianBlur(image, ksize=3)
        
        cv2.imwrite(save_path, denoised_image)
        print(f'denoised image {image_path} saved to:', save_path)
        
        denoised_paths.append(save_path)
    
    return denoised_paths