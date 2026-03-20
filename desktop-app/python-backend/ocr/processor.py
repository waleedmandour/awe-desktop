"""
AWE System Desktop - OCR Processor Module
Supports multiple OCR backends: Tesseract, PaddleOCR, EasyOCR

Developed by: Dr. Waleed Mandour, 2026
Sultan Qaboos University
"""

import logging
import io
import os
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class OCRConfig:
    """OCR Configuration"""
    provider: str = "tesseract"
    language: str = "eng"
    tesseract_path: Optional[str] = None
    confidence_threshold: float = 0.6


class OCRProcessor:
    """
    Multi-provider OCR support for handwritten text extraction.
    Supports: Tesseract, PaddleOCR, EasyOCR
    """
    
    SUPPORTED_LANGUAGES = {
        "eng": "English",
        "ara": "Arabic",
        "fra": "French",
        "deu": "German",
        "spa": "Spanish",
        "chi_sim": "Chinese (Simplified)",
        "jpn": "Japanese"
    }
    
    def __init__(self, config: Optional[OCRConfig] = None):
        self.config = config or OCRConfig()
        self._tesseract = None
        self._paddleocr = None
        self._easyocr = None
        
    def configure(
        self,
        provider: Optional[str] = None,
        language: Optional[str] = None,
        tesseract_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """Configure OCR provider"""
        if provider:
            self.config.provider = provider
        if language:
            self.config.language = language
        if tesseract_path:
            self.config.tesseract_path = tesseract_path
            if self._tesseract:
                import pytesseract
                pytesseract.pytesseract.tesseract_cmd = tesseract_path
                
        return {
            "provider": self.config.provider,
            "language": self.config.language,
            "configured": True
        }
    
    def _load_image(self, image_data: bytes) -> np.ndarray:
        """Load image from bytes"""
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        return np.array(image)
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for better OCR results"""
        try:
            import cv2
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # Apply adaptive thresholding
            binary = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 11, 2
            )
            
            # Denoise
            denoised = cv2.fastNlMeansDenoising(binary, None, 10, 7, 21)
            
            return denoised
        except ImportError:
            logger.warning("OpenCV not available, skipping preprocessing")
            return image
    
    async def process(
        self,
        image_data: bytes,
        provider: Optional[str] = None,
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process image with OCR"""
        
        provider = provider or self.config.provider
        language = language or self.config.language
        
        try:
            # Load image
            image = self._load_image(image_data)
            
            if provider == "tesseract":
                result = await self._process_tesseract(image, language)
            elif provider == "paddleocr":
                result = await self._process_paddleocr(image, language)
            elif provider == "easyocr":
                result = await self._process_easyocr(image, language)
            else:
                raise ValueError(f"Unknown OCR provider: {provider}")
            
            # Calculate word count
            text = result.get("text", "")
            result["word_count"] = len(text.split())
            result["character_count"] = len(text)
            result["success"] = True
            result["provider"] = provider
            
            return result
            
        except Exception as e:
            logger.error(f"OCR processing error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "text": "",
                "provider": provider
            }
    
    async def _process_tesseract(
        self, 
        image: np.ndarray, 
        language: str
    ) -> Dict[str, Any]:
        """Process image with Tesseract OCR"""
        try:
            import pytesseract
        except ImportError:
            raise ImportError(
                "Tesseract not installed. Install with: pip install pytesseract"
            )
        
        # Set custom path if configured
        if self.config.tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = self.config.tesseract_path
        
        # Preprocess image
        processed = self._preprocess_image(image)
        
        # Run OCR
        data = pytesseract.image_to_data(
            processed,
            lang=language,
            output_type=pytesseract.Output.DICT
        )
        
        # Extract text with confidence filtering
        words = []
        confidences = []
        
        for i, word in enumerate(data["text"]):
            conf = float(data["conf"][i])
            if word.strip() and conf > 0:
                words.append(word)
                confidences.append(conf)
        
        text = " ".join(words)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        return {
            "text": text,
            "confidence": avg_confidence / 100,  # Normalize to 0-1
            "word_count": len(words),
            "details": {
                "words_detected": len(words),
                "average_confidence": avg_confidence
            }
        }
    
    async def _process_paddleocr(
        self, 
        image: np.ndarray, 
        language: str
    ) -> Dict[str, Any]:
        """Process image with PaddleOCR"""
        try:
            from paddleocr import PaddleOCR
        except ImportError:
            raise ImportError(
                "PaddleOCR not installed. Install with: pip install paddleocr paddlepaddle"
            )
        
        # Initialize PaddleOCR (lazy loading)
        if self._paddleocr is None:
            lang_map = {
                "eng": "en",
                "ara": "ar",
                "fra": "fr",
                "deu": "german",
                "spa": "es",
                "chi_sim": "ch",
                "jpn": "japan"
            }
            self._paddleocr = PaddleOCR(
                use_angle_cls=True,
                lang=lang_map.get(language, "en"),
                show_log=False
            )
        
        # Run OCR
        result = self._paddleocr.ocr(image, cls=True)
        
        # Extract text
        texts = []
        confidences = []
        
        for line in result:
            if line:
                for word_info in line:
                    text = word_info[1][0]
                    conf = word_info[1][1]
                    texts.append(text)
                    confidences.append(conf)
        
        full_text = " ".join(texts)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        return {
            "text": full_text,
            "confidence": avg_confidence,
            "word_count": len(full_text.split()),
            "details": {
                "lines_detected": len(result),
                "average_confidence": avg_confidence
            }
        }
    
    async def _process_easyocr(
        self, 
        image: np.ndarray, 
        language: str
    ) -> Dict[str, Any]:
        """Process image with EasyOCR"""
        try:
            import easyocr
        except ImportError:
            raise ImportError(
                "EasyOCR not installed. Install with: pip install easyocr"
            )
        
        # Initialize EasyOCR (lazy loading)
        if self._easyocr is None:
            lang_map = {
                "eng": "en",
                "ara": "ar",
                "fra": "fr",
                "deu": "de",
                "spa": "es",
                "chi_sim": "ch_sim",
                "jpn": "ja"
            }
            self._easyocr = easyocr.Reader(
                [lang_map.get(language, "en")],
                gpu=True  # Will fall back to CPU if no GPU
            )
        
        # Run OCR
        result = self._easyocr.readtext(image)
        
        # Extract text
        texts = []
        confidences = []
        
        for detection in result:
            bbox, text, conf = detection
            texts.append(text)
            confidences.append(conf)
        
        full_text = " ".join(texts)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        return {
            "text": full_text,
            "confidence": avg_confidence,
            "word_count": len(full_text.split()),
            "details": {
                "detections": len(result),
                "average_confidence": avg_confidence
            }
        }
    
    def get_available_providers(self) -> List[Dict[str, Any]]:
        """Check which OCR providers are available"""
        providers = []
        
        # Check Tesseract
        try:
            import pytesseract
            # Try to get version
            version = pytesseract.get_tesseract_version()
            providers.append({
                "name": "tesseract",
                "available": True,
                "version": str(version),
                "languages": list(self.SUPPORTED_LANGUAGES.keys())
            })
        except Exception as e:
            providers.append({
                "name": "tesseract",
                "available": False,
                "error": str(e)
            })
        
        # Check PaddleOCR
        try:
            from paddleocr import PaddleOCR
            providers.append({
                "name": "paddleocr",
                "available": True,
                "languages": ["en", "ar", "fr", "de", "es", "ch", "ja"]
            })
        except ImportError:
            providers.append({
                "name": "paddleocr",
                "available": False,
                "error": "PaddleOCR not installed"
            })
        
        # Check EasyOCR
        try:
            import easyocr
            providers.append({
                "name": "easyocr",
                "available": True,
                "languages": ["en", "ar", "fr", "de", "es", "ch_sim", "ja"]
            })
        except ImportError:
            providers.append({
                "name": "easyocr",
                "available": False,
                "error": "EasyOCR not installed"
            })
        
        return providers
