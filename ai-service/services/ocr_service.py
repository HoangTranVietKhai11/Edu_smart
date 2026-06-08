import os
from PIL import Image
import pytesseract
from typing import Optional

# Configure tesseract path for Windows
if os.name == 'nt':
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


def extract_text_from_image(image_path: str) -> str:
    """
    OCR: Extract text from image using Tesseract.
    Supports Vietnamese and English text.
    """
    try:
        image = Image.open(image_path)

        # Try Vietnamese + English first, fallback to English only
        try:
            text = pytesseract.image_to_string(image, lang='vie+eng', config='--psm 6')
        except Exception:
            text = pytesseract.image_to_string(image, lang='eng', config='--psm 6')

        return text.strip()
    except Exception as e:
        print(f"OCR Error: {e}")
        return ""


def preprocess_image(image_path: str) -> str:
    """Enhance image for better OCR results."""
    try:
        from PIL import ImageFilter, ImageEnhance
        img = Image.open(image_path).convert('L')  # Grayscale
        img = img.filter(ImageFilter.SHARPEN)
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(2.0)
        enhanced_path = image_path.replace('.', '_enhanced.')
        img.save(enhanced_path)
        return enhanced_path
    except Exception:
        return image_path
