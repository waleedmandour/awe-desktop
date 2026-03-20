"""
AWE System Desktop - Python Backend Server
Local LLM and OCR Support

Developed by: Dr. Waleed Mandour, 2026
Sultan Qaboos University
"""

import sys
import os
import argparse
import asyncio
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AWE System Desktop Backend",
    description="Local LLM and OCR API for Automated Writing Evaluation",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import local modules
sys.path.insert(0, str(Path(__file__).parent))
from llm.provider import LLMProvider
from ocr.processor import OCRProcessor
from utils.system_checker import SystemChecker


# Initialize components
llm_provider = LLMProvider()
ocr_processor = OCRProcessor()
system_checker = SystemChecker()


# Request/Response Models
class AssessmentRequest(BaseModel):
    text: str
    course_code: str
    topic: Optional[str] = None
    criteria: Optional[List[Dict[str, Any]]] = None


class LLMConfigRequest(BaseModel):
    provider: str  # ollama, lmstudio, openai, custom
    url: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None
    temperature: Optional[float] = 0.3
    max_tokens: Optional[int] = 2000


class OCRConfigRequest(BaseModel):
    provider: str  # tesseract, paddleocr, easyocr
    language: Optional[str] = "eng"
    tesseract_path: Optional[str] = None


# API Routes
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "AWE System Desktop Backend",
        "version": "1.0.0"
    }


@app.get("/api/system/specs")
async def get_system_specs():
    """Get detailed system specifications"""
    return system_checker.get_full_specs()


@app.get("/api/system/compatibility")
async def check_compatibility():
    """Check system compatibility for LLM inference"""
    return system_checker.check_llm_compatibility()


@app.get("/api/llm/status")
async def get_llm_status():
    """Check LLM provider status"""
    return await llm_provider.check_all_providers()


@app.get("/api/llm/models")
async def get_available_models(provider: str = "ollama"):
    """Get available models from specified provider"""
    return await llm_provider.list_models(provider)


@app.post("/api/llm/configure")
async def configure_llm(config: LLMConfigRequest):
    """Configure LLM provider"""
    return await llm_provider.configure(
        provider=config.provider,
        url=config.url,
        model=config.model,
        api_key=config.api_key,
        temperature=config.temperature,
        max_tokens=config.max_tokens
    )


@app.post("/api/ocr/process")
async def process_image(
    file: UploadFile = File(...),
    provider: str = Form(default="tesseract"),
    language: str = Form(default="eng")
):
    """Process image with OCR"""
    try:
        # Read image data
        image_data = await file.read()
        
        # Process with specified OCR provider
        result = await ocr_processor.process(
            image_data=image_data,
            provider=provider,
            language=language
        )
        
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"OCR processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ocr/configure")
async def configure_ocr(config: OCRConfigRequest):
    """Configure OCR provider"""
    return ocr_processor.configure(
        provider=config.provider,
        language=config.language,
        tesseract_path=config.tesseract_path
    )


@app.post("/api/assess")
async def assess_essay(request: AssessmentRequest):
    """Assess essay using configured LLM"""
    try:
        result = await llm_provider.assess_essay(
            text=request.text,
            course_code=request.course_code,
            topic=request.topic,
            criteria=request.criteria
        )
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Assessment error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/assess/stream")
async def assess_essay_stream(request: AssessmentRequest):
    """Assess essay with streaming response"""
    async def generate():
        async for chunk in llm_provider.assess_essay_stream(
            text=request.text,
            course_code=request.course_code,
            topic=request.topic,
            criteria=request.criteria
        ):
            yield f"data: {chunk}\n\n"
    
    from fastapi.responses import StreamingResponse
    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/api/criteria/{course_code}")
async def get_criteria(course_code: str):
    """Get assessment criteria for a course"""
    criteria_map = {
        "0230": {
            "program": "foundation",
            "max_score": 6,
            "criteria": [
                {"name": "Task Response", "max": 6, "description": "How well the essay addresses the given task"},
                {"name": "Coherence & Cohesion", "max": 6, "description": "Logical organization and linking of ideas"},
                {"name": "Lexical Resource", "max": 6, "description": "Range and accuracy of vocabulary"},
                {"name": "Grammatical Range & Accuracy", "max": 6, "description": "Range and accuracy of grammar"}
            ]
        },
        "0340": {
            "program": "foundation",
            "max_score": 6,
            "criteria": [
                {"name": "Task Response", "max": 6, "description": "How well the essay addresses the given task"},
                {"name": "Coherence & Cohesion", "max": 6, "description": "Logical organization and linking of ideas"},
                {"name": "Lexical Resource", "max": 6, "description": "Range and accuracy of vocabulary"},
                {"name": "Grammatical Range & Accuracy", "max": 6, "description": "Range and accuracy of grammar"}
            ]
        },
        "LANC2160": {
            "program": "post-foundation",
            "max_score": 5,
            "criteria": [
                {"name": "Task Achievement", "max": 5, "description": "How well the summary captures main points"},
                {"name": "Coherence & Cohesion", "max": 5, "description": "Logical organization and linking of ideas"},
                {"name": "Lexical Resource", "max": 5, "description": "Range and accuracy of vocabulary"},
                {"name": "Grammatical Range & Accuracy", "max": 5, "description": "Range and accuracy of grammar"}
            ]
        }
    }
    
    if course_code not in criteria_map:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return criteria_map[course_code]


def main():
    parser = argparse.ArgumentParser(description="AWE System Desktop Backend")
    parser.add_argument("--port", type=int, default=5000, help="Server port")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Server host")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    args = parser.parse_args()
    
    logger.info(f"Starting AWE System Backend on {args.host}:{args.port}")
    uvicorn.run(
        "server:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )


if __name__ == "__main__":
    main()
