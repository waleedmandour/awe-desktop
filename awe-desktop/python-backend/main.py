#!/usr/bin/env python3
"""
AWE Desktop - Python Backend Server
FastAPI server for local LLM-based writing assessment
"""

import sys
import os
import platform
import asyncio
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
import json

# FastAPI imports
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# System monitoring
import psutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AWE Desktop API",
    description="Backend API for AWE Desktop - Automated Writing Evaluation System",
    version="1.0.0"
)

# Enable CORS for Electron frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== MODELS ==============

class OCRRequest(BaseModel):
    image: str  # Base64 encoded image
    provider: Optional[str] = "tesseract"
    language: Optional[str] = "eng"

class OCRResult(BaseModel):
    text: str
    confidence: float
    blocks: List[Dict[str, Any]]
    processing_time: float

class AssessmentRequest(BaseModel):
    text: str
    provider: Optional[str] = None
    model: Optional[str] = None
    criteria: Optional[List[str]] = None

class AssessmentCriteria(BaseModel):
    name: str
    score: float
    max_score: float = 9.0
    band: str
    description: str
    feedback: str

class AssessmentResult(BaseModel):
    id: str
    timestamp: datetime
    text: str
    word_count: int
    overall_band: str
    overall_score: float
    criteria: List[AssessmentCriteria]
    strengths: List[str]
    improvements: List[str]
    suggestions: List[str]
    llm_provider: str
    llm_model: str
    processing_time: float

class LLMProvider(BaseModel):
    id: str
    name: str
    type: str
    base_url: str
    models: List[Dict[str, Any]]
    is_available: bool
    is_default: bool

class LLMModel(BaseModel):
    id: str
    name: str
    size: Optional[str] = None
    parameters: Optional[str] = None
    quantization: Optional[str] = None
    context_length: Optional[int] = None
    is_downloaded: Optional[bool] = None
    download_size: Optional[str] = None

class SystemInfo(BaseModel):
    platform: str
    arch: str
    cpu_cores: int
    cpu_model: str
    total_memory_gb: float
    free_memory_gb: float
    gpu: Optional[str] = None

class LLMRecommendation(BaseModel):
    recommended: str
    alternatives: List[str]
    reason: str
    max_model_size: str

class SystemInfoResponse(BaseModel):
    system_info: SystemInfo
    llm_recommendation: LLMRecommendation

# ============== SYSTEM UTILITIES ==============

def get_system_info() -> SystemInfo:
    """Get system information"""
    mem = psutil.virtual_memory()
    
    return SystemInfo(
        platform=platform.system(),
        arch=platform.machine(),
        cpu_cores=psutil.cpu_count(logical=False) or psutil.cpu_count() or 1,
        cpu_model=platform.processor() or "Unknown",
        total_memory_gb=round(mem.total / (1024**3), 1),
        free_memory_gb=round(mem.available / (1024**3), 1),
        gpu=detect_gpu()
    )

def detect_gpu() -> Optional[str]:
    """Detect GPU if available"""
    try:
        # Try NVIDIA GPU detection
        import subprocess
        result = subprocess.run(
            ['nvidia-smi', '--query-gpu=name', '--format=csv,noheader'],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip().split('\n')[0]
    except:
        pass
    
    try:
        # Try AMD GPU detection on Windows
        if platform.system() == 'Windows':
            import wmi
            c = wmi.WMI()
            for gpu in c.Win32_VideoController():
                return gpu.Name
    except:
        pass
    
    return None

def get_llm_recommendation(sys_info: SystemInfo) -> LLMRecommendation:
    """Recommend LLM based on system specs"""
    ram = sys_info.total_memory_gb
    cores = sys_info.cpu_cores
    
    if ram >= 32 and cores >= 8:
        return LLMRecommendation(
            recommended="llama3:8b",
            alternatives=["llama3:70b", "mistral:7b", "codellama:34b"],
            reason="Your system can handle large models with excellent performance.",
            max_model_size="70B"
        )
    elif ram >= 16 and cores >= 4:
        return LLMRecommendation(
            recommended="llama3:8b",
            alternatives=["mistral:7b", "phi3:14b", "gemma:7b"],
            reason="Your system is well-suited for medium-sized models.",
            max_model_size="14B"
        )
    elif ram >= 8:
        return LLMRecommendation(
            recommended="phi3:mini",
            alternatives=["tinyllama:1.1b", "gemma:2b", "llama3:8b-q4"],
            reason="Your system can run smaller models efficiently.",
            max_model_size="8B (quantized)"
        )
    else:
        return LLMRecommendation(
            recommended="tinyllama:1.1b",
            alternatives=["phi3:mini-q4"],
            reason="For optimal performance, consider using a smaller model or upgrading RAM.",
            max_model_size="3B"
        )

# ============== LLM PROVIDERS ==============

async def check_ollama() -> Dict[str, Any]:
    """Check Ollama availability and models"""
    import aiohttp
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                "http://127.0.0.1:11434/api/tags",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    models = []
                    for model in data.get("models", []):
                        models.append({
                            "id": model.get("name", ""),
                            "name": model.get("name", ""),
                            "size": model.get("size", ""),
                            "is_downloaded": True
                        })
                    return {"available": True, "models": models}
    except:
        pass
    
    return {"available": False, "models": []}

async def get_llm_providers() -> List[LLMProvider]:
    """Get available LLM providers"""
    providers = []
    
    # Check Ollama
    ollama_status = await check_ollama()
    providers.append(LLMProvider(
        id="ollama",
        name="Ollama",
        type="ollama",
        base_url="http://127.0.0.1:11434",
        models=ollama_status["models"],
        is_available=ollama_status["available"],
        is_default=True
    ))
    
    # LM Studio
    providers.append(LLMProvider(
        id="lm-studio",
        name="LM Studio",
        type="local",
        base_url="http://127.0.0.1:1234",
        models=[],
        is_available=True,
        is_default=False
    ))
    
    # OpenAI
    providers.append(LLMProvider(
        id="openai",
        name="OpenAI API",
        type="openai",
        base_url="https://api.openai.com/v1",
        models=[
            {"id": "gpt-4o", "name": "GPT-4o"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo"},
            {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo"}
        ],
        is_available=False,
        is_default=False
    ))
    
    # Custom endpoint
    providers.append(LLMProvider(
        id="custom",
        name="Custom Endpoint",
        type="custom",
        base_url="",
        models=[],
        is_available=True,
        is_default=False
    ))
    
    return providers

# ============== OCR FUNCTIONS ==============

async def perform_ocr_tesseract(image_data: bytes, language: str = "eng") -> OCRResult:
    """Perform OCR using Tesseract"""
    import time
    start_time = time.time()
    
    try:
        import pytesseract
        from PIL import Image
        import io
        
        image = Image.open(io.BytesIO(image_data))
        text = pytesseract.image_to_string(image, lang=language)
        
        # Get confidence data
        data = pytesseract.image_to_data(image, lang=language, output_type=pytesseract.Output.DICT)
        confidences = [int(c) for c in data['conf'] if int(c) > 0]
        avg_confidence = sum(confidences) / len(confidences) / 100 if confidences else 0.5
        
        return OCRResult(
            text=text.strip(),
            confidence=avg_confidence,
            blocks=[],
            processing_time=time.time() - start_time
        )
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Tesseract not installed. Please install pytesseract and Tesseract OCR."
        )

async def perform_ocr_paddle(image_data: bytes, language: str = "en") -> OCRResult:
    """Perform OCR using PaddleOCR"""
    import time
    start_time = time.time()
    
    try:
        from paddleocr import PaddleOCR
        from PIL import Image
        import io
        import numpy as np
        
        ocr = PaddleOCR(use_angle_cls=True, lang=language)
        image = Image.open(io.BytesIO(image_data))
        image_array = np.array(image)
        
        result = ocr.ocr(image_array)
        
        text_parts = []
        blocks = []
        
        for line in result:
            for word_info in line:
                text_parts.append(word_info[1][0])
                blocks.append({
                    "text": word_info[1][0],
                    "confidence": word_info[1][1],
                    "bounding_box": {
                        "x": min(p[0] for p in word_info[0]),
                        "y": min(p[1] for p in word_info[0]),
                        "width": max(p[0] for p in word_info[0]) - min(p[0] for p in word_info[0]),
                        "height": max(p[1] for p in word_info[0]) - min(p[1] for p in word_info[0])
                    }
                })
        
        avg_confidence = sum(b["confidence"] for b in blocks) / len(blocks) if blocks else 0
        
        return OCRResult(
            text=" ".join(text_parts),
            confidence=avg_confidence,
            blocks=blocks,
            processing_time=time.time() - start_time
        )
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PaddleOCR not installed. Please install paddleocr."
        )

# ============== LLM FUNCTIONS ==============

async def call_ollama(prompt: str, model: str = "llama3:8b") -> str:
    """Call Ollama API"""
    import aiohttp
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "http://127.0.0.1:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            timeout=aiohttp.ClientTimeout(total=120)
        ) as response:
            if response.status == 200:
                data = await response.json()
                return data.get("response", "")
            else:
                raise HTTPException(status_code=500, detail="Ollama request failed")

async def call_openai(prompt: str, model: str, api_key: str) -> str:
    """Call OpenAI API"""
    import aiohttp
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are an expert writing assessment assistant."},
                    {"role": "user", "content": prompt}
                ]
            },
            timeout=aiohttp.ClientTimeout(total=120)
        ) as response:
            if response.status == 200:
                data = await response.json()
                return data["choices"][0]["message"]["content"]
            else:
                raise HTTPException(status_code=500, detail="OpenAI request failed")

async def call_custom_llm(prompt: str, base_url: str, model: str = None, api_key: str = None) -> str:
    """Call custom OpenAI-compatible endpoint"""
    import aiohttp
    
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    
    payload = {
        "messages": [
            {"role": "system", "content": "You are an expert writing assessment assistant."},
            {"role": "user", "content": prompt}
        ]
    }
    if model:
        payload["model"] = model
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{base_url.rstrip('/')}/chat/completions",
            headers=headers,
            json=payload,
            timeout=aiohttp.ClientTimeout(total=120)
        ) as response:
            if response.status == 200:
                data = await response.json()
                return data["choices"][0]["message"]["content"]
            else:
                raise HTTPException(status_code=500, detail="Custom LLM request failed")

def create_assessment_prompt(text: str) -> str:
    """Create assessment prompt for LLM"""
    return f"""You are an expert IELTS writing examiner. Please assess the following essay and provide detailed feedback.

ESSAY:
{text}

Please provide your assessment in the following JSON format:
{{
    "task_response": {{
        "score": <1-9>,
        "band": "<band score like '6.5'>",
        "feedback": "<detailed feedback>"
    }},
    "coherence_cohesion": {{
        "score": <1-9>,
        "band": "<band score>",
        "feedback": "<detailed feedback>"
    }},
    "lexical_resource": {{
        "score": <1-9>,
        "band": "<band score>",
        "feedback": "<detailed feedback>"
    }},
    "grammar_accuracy": {{
        "score": <1-9>,
        "band": "<band score>",
        "feedback": "<detailed feedback>"
    }},
    "overall_band": "<overall band score>",
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
    "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}}

Provide realistic, constructive feedback. Respond ONLY with valid JSON."""

async def assess_with_llm(
    text: str, 
    provider: str = "ollama", 
    model: str = "llama3:8b",
    api_key: str = None,
    base_url: str = None
) -> Dict[str, Any]:
    """Assess essay using LLM"""
    import time
    import uuid
    import json
    
    prompt = create_assessment_prompt(text)
    start_time = time.time()
    
    try:
        if provider == "ollama":
            response = await call_ollama(prompt, model)
        elif provider == "openai":
            response = await call_openai(prompt, model, api_key)
        elif provider == "custom" and base_url:
            response = await call_custom_llm(prompt, base_url, model, api_key)
        else:
            # Fallback to Ollama
            response = await call_ollama(prompt, model)
        
        # Parse response
        try:
            # Try to extract JSON from response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                result = json.loads(response[json_start:json_end])
            else:
                result = json.loads(response)
        except json.JSONDecodeError:
            # Create a default response if parsing fails
            result = create_default_assessment(text)
        
        # Build assessment result
        processing_time = time.time() - start_time
        word_count = len(text.split())
        
        return {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "text": text,
            "word_count": word_count,
            "overall_band": result.get("overall_band", "6.0"),
            "overall_score": float(result.get("overall_band", "6.0")),
            "criteria": [
                {
                    "name": "Task Response",
                    "score": result.get("task_response", {}).get("score", 6.0),
                    "max_score": 9.0,
                    "band": result.get("task_response", {}).get("band", "6.0"),
                    "description": "Addresses the task appropriately",
                    "feedback": result.get("task_response", {}).get("feedback", "")
                },
                {
                    "name": "Coherence & Cohesion",
                    "score": result.get("coherence_cohesion", {}).get("score", 6.0),
                    "max_score": 9.0,
                    "band": result.get("coherence_cohesion", {}).get("band", "6.0"),
                    "description": "Well-organized with clear progression",
                    "feedback": result.get("coherence_cohesion", {}).get("feedback", "")
                },
                {
                    "name": "Lexical Resource",
                    "score": result.get("lexical_resource", {}).get("score", 6.0),
                    "max_score": 9.0,
                    "band": result.get("lexical_resource", {}).get("band", "6.0"),
                    "description": "Adequate vocabulary for the task",
                    "feedback": result.get("lexical_resource", {}).get("feedback", "")
                },
                {
                    "name": "Grammar Accuracy",
                    "score": result.get("grammar_accuracy", {}).get("score", 6.0),
                    "max_score": 9.0,
                    "band": result.get("grammar_accuracy", {}).get("band", "6.0"),
                    "description": "Good control of simple and complex sentences",
                    "feedback": result.get("grammar_accuracy", {}).get("feedback", "")
                }
            ],
            "strengths": result.get("strengths", ["Clear structure", "Relevant content"]),
            "improvements": result.get("improvements", ["Expand arguments", "Add examples"]),
            "suggestions": result.get("suggestions", ["Practice transitions", "Review grammar"]),
            "llm_provider": provider,
            "llm_model": model,
            "processing_time": processing_time
        }
        
    except Exception as e:
        logger.error(f"Assessment failed: {e}")
        # Return a fallback assessment
        return create_default_assessment(text)

def create_default_assessment(text: str) -> Dict[str, Any]:
    """Create a default assessment when LLM fails"""
    import uuid
    word_count = len(text.split())
    
    return {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "text": text,
        "word_count": word_count,
        "overall_band": "6.0",
        "overall_score": 6.0,
        "criteria": [
            {"name": "Task Response", "score": 6.0, "max_score": 9.0, "band": "6.0", "description": "Addresses the task", "feedback": "Assessment unavailable - please check LLM connection"},
            {"name": "Coherence & Cohesion", "score": 6.0, "max_score": 9.0, "band": "6.0", "description": "Organized structure", "feedback": "Assessment unavailable"},
            {"name": "Lexical Resource", "score": 6.0, "max_score": 9.0, "band": "6.0", "description": "Adequate vocabulary", "feedback": "Assessment unavailable"},
            {"name": "Grammar Accuracy", "score": 6.0, "max_score": 9.0, "band": "6.0", "description": "Grammar control", "feedback": "Assessment unavailable"}
        ],
        "strengths": ["Unable to assess - check LLM connection"],
        "improvements": ["Please verify LLM is running"],
        "suggestions": ["Check Ollama or custom LLM configuration"],
        "llm_provider": "fallback",
        "llm_model": "none",
        "processing_time": 0
    }

# ============== API ENDPOINTS ==============

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "mode": "full"}

@app.get("/api/system-info", response_model=SystemInfoResponse)
async def get_system_info_endpoint():
    """Get system information and LLM recommendations"""
    sys_info = get_system_info()
    recommendation = get_llm_recommendation(sys_info)
    
    return SystemInfoResponse(
        system_info=sys_info,
        llm_recommendation=recommendation
    )

@app.get("/api/system/gpu")
async def get_gpu_info():
    """Get GPU information"""
    return {
        "available": True if detect_gpu() else False,
        "name": detect_gpu() or "Not detected",
        "memory": "Unknown"
    }

@app.get("/api/llm/providers", response_model=List[LLMProvider])
async def get_providers():
    """Get available LLM providers"""
    return await get_llm_providers()

@app.get("/api/llm/ollama/status")
async def get_ollama_status():
    """Check Ollama status"""
    return await check_ollama()

@app.post("/api/llm/ollama/pull")
async def pull_ollama_model(model: str = Form(...)):
    """Pull a model from Ollama"""
    import aiohttp
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "http://127.0.0.1:11434/api/pull",
                json={"name": model},
                timeout=aiohttp.ClientTimeout(total=600)
            ) as response:
                if response.status == 200:
                    return {"status": "success", "model": model}
                else:
                    raise HTTPException(status_code=500, detail="Failed to pull model")
    except aiohttp.ClientError:
        raise HTTPException(status_code=503, detail="Ollama not available")

@app.post("/api/ocr", response_model=OCRResult)
async def perform_ocr(request: OCRRequest):
    """Perform OCR on an image"""
    import base64
    import io
    
    try:
        # Decode base64 image
        if "," in request.image:
            image_data = base64.b64decode(request.image.split(",")[1])
        else:
            image_data = base64.b64decode(request.image)
        
        if request.provider == "paddleocr":
            return await perform_ocr_paddle(image_data, request.language)
        else:
            return await perform_ocr_tesseract(image_data, request.language)
            
    except Exception as e:
        # Return a placeholder if OCR fails
        logger.error(f"OCR failed: {e}")
        return OCRResult(
            text="[OCR processing failed - please install Tesseract or PaddleOCR]",
            confidence=0.0,
            blocks=[],
            processing_time=0.0
        )

@app.post("/api/assess", response_model=AssessmentResult)
async def assess_essay(request: AssessmentRequest):
    """Assess an essay using LLM"""
    result = await assess_with_llm(
        text=request.text,
        provider=request.provider or "ollama",
        model=request.model or "llama3:8b"
    )
    return result

@app.post("/api/llm/provider")
async def set_llm_provider(provider_id: str = Form(...), config: Optional[str] = Form(None)):
    """Set the active LLM provider"""
    # This would typically save to a config file
    return {"status": "ok", "provider": provider_id}

# ============== MAIN ==============

def main():
    """Run the FastAPI server"""
    import argparse
    import uvicorn
    
    parser = argparse.ArgumentParser(description="AWE Desktop Backend Server")
    parser.add_argument("--port", type=int, default=8765, help="Port to run server on")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host to bind to")
    args = parser.parse_args()
    
    print(f"Starting AWE Desktop Backend on {args.host}:{args.port}")
    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="info"
    )

if __name__ == "__main__":
    main()
