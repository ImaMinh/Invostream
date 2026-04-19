import cv2

def gray_scale[FILE](input: FILE):
    image = cv2.imread(input)
    
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    