#!/usr/bin/env python3
"""
AWE Desktop - Python Backend Server
FastAPI server for local LLM-based writing assessment
Supports both Text LLMs and Vision LLMs for OCR
"""

import sys
import os
import platform
import asyncio
import logging
import base64
import json
import time
from typing import Optional, List, Dict, Any
from datetime import datetime

# FastAPI imports
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# System monitoring
import psutil

# HTTP client
import aiohttp

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

# ============== CONFIGURATION ==============

# Default endpoints
DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434"
DEFAULT_LM_STUDIO_URL = "http://127.0.0.1:1234"

# Store custom endpoints
CUSTOM_LLM_ENDPOINT = None
CUSTOM_VLM_ENDPOINT = None

# ============== MODELS ==============

class OCRRequest(BaseModel):
    image: str  # Base64 encoded image
    provider: Optional[str] = "auto"  # auto, tesseract, paddleocr, llava, moondream, vision-llm, custom
    language: Optional[str] = "eng"
    vision_model: Optional[str] = "llava:7b"  # For vision LLM OCR
    custom_endpoint: Optional[str] = None

class OCRResult(BaseModel):
    text: str
    confidence: float
    method: str
    model: Optional[str] = None
    blocks: List[Dict[str, Any]]
    processing_time: float

class AssessmentRequest(BaseModel):
    text: str
    provider: Optional[str] = None
    model: Optional[str] = None
    endpoint: Optional[str] = None
    api_key: Optional[str] = None
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
    supports_vision: bool = False

class EndpointConfig(BaseModel):
    name: str
    url: str
    api_key: Optional[str] = None
    model: Optional[str] = None
    supports_vision: bool = False

class SystemInfo(BaseModel):
    platform: str
    arch: str
    cpu_cores: int
    cpu_model: str
    total_memory_gb: float
    free_memory_gb: float
    gpu: Optional[str] = None

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
        import subprocess
        result = subprocess.run(
            ['nvidia-smi', '--query-gpu=name', '--format=csv,noheader'],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip().split('\n')[0]
    except:
        pass
    return None

# ============== LLM PROVIDER DETECTION ==============

async def check_ollama() -> Dict[str, Any]:
    """Check Ollama availability and models"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{DEFAULT_OLLAMA_URL}/api/tags",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    models = []
                    for model in data.get("models", []):
                        model_name = model.get("name", "")
                        # Check if it's a vision model
                        is_vision = any(v in model_name.lower() for v in ['llava', 'moondream', 'minicpm', 'vision', 'bakllava', 'cogvlm'])
                        models.append({
                            "id": model_name,
                            "name": model_name,
                            "size": model.get("size", ""),
                            "is_downloaded": True,
                            "supports_vision": is_vision
                        })
                    return {"available": True, "models": models}
    except:
        pass
    return {"available": False, "models": []}

async def check_lm_studio() -> Dict[str, Any]:
    """Check LM Studio availability"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{DEFAULT_LM_STUDIO_URL}/v1/models",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    models = []
                    for model in data.get("data", []):
                        models.append({
                            "id": model.get("id", ""),
                            "name": model.get("id", ""),
                            "is_downloaded": True
                        })
                    return {"available": True, "models": models}
    except:
        pass
    return {"available": False, "models": []}

async def get_llm_providers() -> List[Dict[str, Any]]:
    """Get available LLM providers"""
    providers = []
    
    # Check Ollama
    ollama_status = await check_ollama()
    providers.append({
        "id": "ollama",
        "name": "Ollama",
        "type": "ollama",
        "base_url": DEFAULT_OLLAMA_URL,
        "models": ollama_status["models"],
        "is_available": ollama_status["available"],
        "is_default": True,
        "supports_vision": any(m.get("supports_vision") for m in ollama_status["models"])
    })
    
    # Check LM Studio
    lm_studio_status = await check_lm_studio()
    providers.append({
        "id": "lm-studio",
        "name": "LM Studio",
        "type": "local",
        "base_url": DEFAULT_LM_STUDIO_URL,
        "models": lm_studio_status["models"],
        "is_available": lm_studio_status["available"],
        "is_default": False,
        "supports_vision": True  # LM Studio supports vision models
    })
    
    # OpenAI
    providers.append({
        "id": "openai",
        "name": "OpenAI API",
        "type": "openai",
        "base_url": "https://api.openai.com/v1",
        "models": [
            {"id": "gpt-4o", "name": "GPT-4o", "supports_vision": True},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo", "supports_vision": True},
            {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "supports_vision": False}
        ],
        "is_available": False,
        "is_default": False,
        "supports_vision": True
    })
    
    # Anthropic
    providers.append({
        "id": "anthropic",
        "name": "Anthropic Claude",
        "type": "anthropic",
        "base_url": "https://api.anthropic.com/v1",
        "models": [
            {"id": "claude-3-opus", "name": "Claude 3 Opus", "supports_vision": True},
            {"id": "claude-3-sonnet", "name": "Claude 3 Sonnet", "supports_vision": True},
            {"id": "claude-3-haiku", "name": "Claude 3 Haiku", "supports_vision": True}
        ],
        "is_available": False,
        "is_default": False,
        "supports_vision": True
    })
    
    # Custom endpoint
    providers.append({
        "id": "custom",
        "name": "Custom Endpoint",
        "type": "custom",
        "base_url": "",
        "models": [],
        "is_available": True,
        "is_default": False,
        "supports_vision": True
    })
    
    return providers

# ============== OCR FUNCTIONS ==============

async def perform_tesseract_ocr(image_data: bytes, language: str = "eng") -> OCRResult:
    """Perform OCR using Tesseract"""
    start_time = time.time()
    
    try:
        import pytesseract
        from PIL import Image
        import io
        
        image = Image.open(io.BytesIO(image_data))
        text = pytesseract.image_to_string(image, lang=language)
        
        data = pytesseract.image_to_data(image, lang=language, output_type=pytesseract.Output.DICT)
        confidences = [int(c) for c in data['conf'] if int(c) > 0]
        avg_confidence = sum(confidences) / len(confidences) / 100 if confidences else 0.5
        
        return OCRResult(
            text=text.strip(),
            confidence=avg_confidence,
            method="tesseract",
            blocks=[],
            processing_time=time.time() - start_time
        )
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Tesseract not installed. Install: pip install pytesseract && install Tesseract OCR"
        )

async def perform_paddle_ocr(image_data: bytes, language: str = "en") -> OCRResult:
    """Perform OCR using PaddleOCR"""
    start_time = time.time()
    
    try:
        from paddleocr import PaddleOCR
        from PIL import Image
        import io
        import numpy as np
        
        ocr = PaddleOCR(use_angle_cls=True, lang=language, show_log=False)
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
            text="\n".join(text_parts),
            confidence=avg_confidence,
            method="paddleocr",
            blocks=blocks,
            processing_time=time.time() - start_time
        )
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PaddleOCR not installed. Install: pip install paddleocr paddlepaddle"
        )

async def perform_vision_llm_ocr(
    image_data: bytes, 
    model: str = "llava:7b",
    provider: str = "ollama",
    endpoint: str = None,
    api_key: str = None
) -> OCRResult:
    """Perform OCR using Vision LLM (LLaVA, Moondream, etc.)"""
    start_time = time.time()
    
    # Convert image to base64
    image_base64 = base64.b64encode(image_data).decode('utf-8')
    
    # OCR prompt for vision model
    ocr_prompt = """You are an expert at reading handwritten and printed text from images. 
Please transcribe ALL text from this image exactly as it appears. 

Important instructions:
1. Transcribe the text word by word, preserving the original spelling and punctuation
2. Maintain the paragraph structure and line breaks
3. If text is unclear, make your best guess and indicate with [?] if very uncertain
4. Do not add any commentary or explanation - just transcribe the text
5. Start your response directly with the transcribed text

Transcribe the text:"""

    try:
        if provider == "ollama":
            result_text = await call_ollama_vision(ocr_prompt, image_base64, model)
        elif provider == "openai":
            result_text = await call_openai_vision(ocr_prompt, image_base64, model, api_key)
        elif provider == "anthropic":
            result_text = await call_anthropic_vision(ocr_prompt, image_base64, model, api_key)
        elif provider == "custom" and endpoint:
            result_text = await call_custom_vision(ocr_prompt, image_base64, model, endpoint, api_key)
        else:
            # Default to Ollama
            result_text = await call_ollama_vision(ocr_prompt, image_base64, model)
        
        return OCRResult(
            text=result_text.strip(),
            confidence=0.9,  # High confidence for LLM OCR
            method="vision-llm",
            model=model,
            blocks=[],
            processing_time=time.time() - start_time
        )
    except Exception as e:
        logger.error(f"Vision LLM OCR failed: {e}")
        raise HTTPException(status_code=500, detail=f"Vision LLM OCR failed: {str(e)}")

async def call_ollama_vision(prompt: str, image_base64: str, model: str = "llava:7b") -> str:
    """Call Ollama vision model"""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{DEFAULT_OLLAMA_URL}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "images": [image_base64],
                "stream": False
            },
            timeout=aiohttp.ClientTimeout(total=180)
        ) as response:
            if response.status == 200:
                data = await response.json()
                return data.get("response", "")
            else:
                error = await response.text()
                raise Exception(f"Ollama error: {error}")

async def call_openai_vision(prompt: str, image_base64: str, model: str, api_key: str) -> str:
    """Call OpenAI vision model"""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                    ]
                }],
                "max_tokens": 4096
            },
            timeout=aiohttp.ClientTimeout(total=180)
        ) as response:
            if response.status == 200:
                data = await response.json()
                return data["choices"][0]["message"]["content"]
            else:
                error = await response.text()
                raise Exception(f"OpenAI error: {error}")

async def call_anthropic_vision(prompt: str, image_base64: str, model: str, api_key: str) -> str:
    """Call Anthropic vision model"""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": model,
                "max_tokens": 4096,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": image_base64}},
                        {"type": "text", "text": prompt}
                    ]
                }]
            },
            timeout=aiohttp.ClientTimeout(total=180)
        ) as response:
            if response.status == 200:
                data = await response.json()
                return data["content"][0]["text"]
            else:
                error = await response.text()
                raise Exception(f"Anthropic error: {error}")

async def call_custom_vision(prompt: str, image_base64: str, model: str, endpoint: str, api_key: str = None) -> str:
    """Call custom OpenAI-compatible vision endpoint"""
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    
    payload = {
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
            ]
        }],
        "max_tokens": 4096
    }
    if model:
        payload["model"] = model
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{endpoint.rstrip('/')}/chat/completions",
            headers=headers,
            json=payload,
            timeout=aiohttp.ClientTimeout(total=180)
        ) as response:
            if response.status == 200:
                data = await response.json()
                return data["choices"][0]["message"]["content"]
            else:
                error = await response.text()
                raise Exception(f"Custom endpoint error: {error}")

# ============== LLM ASSESSMENT FUNCTIONS ==============

async def call_ollama_llm(prompt: str, model: str = "llama3:8b") -> str:
    """Call Ollama LLM"""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{DEFAULT_OLLAMA_URL}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=aiohttp.ClientTimeout(total=180)
        ) as response:
            if response.status == 200:
                data = await response.json()
                return data.get("response", "")
            else:
                raise Exception("Ollama request failed")

async def call_openai_llm(prompt: str, model: str, api_key: str) -> str:
    """Call OpenAI LLM"""
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
            timeout=aiohttp.ClientTimeout(total=180)
        ) as response:
            if response.status == 200:
                data = await response.json()
                return data["choices"][0]["message"]["content"]
            else:
                raise Exception("OpenAI request failed")

async def call_custom_llm(prompt: str, endpoint: str, model: str = None, api_key: str = None) -> str:
    """Call custom LLM endpoint"""
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
            f"{endpoint.rstrip('/')}/chat/completions",
            headers=headers,
            json=payload,
            timeout=aiohttp.ClientTimeout(total=180)
        ) as response:
            if response.status == 200:
                data = await response.json()
                return data["choices"][0]["message"]["content"]
            else:
                raise Exception("Custom LLM request failed")

def create_assessment_prompt(text: str) -> str:
    """Create assessment prompt for LLM"""
    return f"""You are an expert IELTS writing examiner. Assess the following essay and provide detailed feedback.

ESSAY:
{text}

Provide your assessment in this exact JSON format (respond ONLY with valid JSON, no markdown):
{{
    "task_response": {{
        "score": <number 1-9>,
        "band": "<band score like 6.5>",
        "feedback": "<detailed feedback paragraph>"
    }},
    "coherence_cohesion": {{
        "score": <number 1-9>,
        "band": "<band score>",
        "feedback": "<detailed feedback paragraph>"
    }},
    "lexical_resource": {{
        "score": <number 1-9>,
        "band": "<band score>",
        "feedback": "<detailed feedback paragraph>"
    }},
    "grammar_accuracy": {{
        "score": <number 1-9>,
        "band": "<band score>",
        "feedback": "<detailed feedback paragraph>"
    }},
    "overall_band": "<overall band score>",
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
    "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}}"""

async def assess_with_llm(
    text: str,
    provider: str = "ollama",
    model: str = "llama3:8b",
    endpoint: str = None,
    api_key: str = None
) -> Dict[str, Any]:
    """Assess essay using LLM"""
    import uuid
    
    prompt = create_assessment_prompt(text)
    start_time = time.time()
    word_count = len(text.split())
    
    try:
        if provider == "ollama":
            response = await call_ollama_llm(prompt, model)
        elif provider == "openai":
            response = await call_openai_llm(prompt, model, api_key)
        elif provider == "custom" and endpoint:
            response = await call_custom_llm(prompt, endpoint, model, api_key)
        else:
            response = await call_ollama_llm(prompt, model)
        
        # Parse JSON response
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                result = json.loads(response[json_start:json_end])
            else:
                result = json.loads(response)
        except json.JSONDecodeError:
            result = create_default_assessment(text)
        
        processing_time = time.time() - start_time
        
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
        return create_default_assessment(text)

def create_default_assessment(text: str) -> Dict[str, Any]:
    """Create default assessment when LLM fails"""
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
            {"name": "Task Response", "score": 6.0, "max_score": 9.0, "band": "6.0", "description": "Addresses the task", "feedback": "Assessment unavailable - check LLM connection"},
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
    return {"status": "ok", "version": "1.0.0"}

@app.get("/api/system-info")
async def get_system_info_endpoint():
    """Get system information"""
    sys_info = get_system_info()
    
    # Get LLM recommendation
    ram = sys_info.total_memory_gb
    cores = sys_info.cpu_cores
    
    if ram >= 32 and cores >= 8:
        recommendation = {
            "recommended": "llama3:8b",
            "alternatives": ["llama3:70b", "mistral:7b"],
            "reason": "Your system can handle large models with excellent performance.",
            "max_model_size": "70B"
        }
    elif ram >= 16 and cores >= 4:
        recommendation = {
            "recommended": "llama3:8b",
            "alternatives": ["mistral:7b", "phi3:14b"],
            "reason": "Your system is well-suited for medium-sized models.",
            "max_model_size": "14B"
        }
    elif ram >= 8:
        recommendation = {
            "recommended": "phi3:mini",
            "alternatives": ["tinyllama:1.1b", "gemma:2b"],
            "reason": "Your system can run smaller models efficiently.",
            "max_model_size": "8B (quantized)"
        }
    else:
        recommendation = {
            "recommended": "tinyllama:1.1b",
            "alternatives": ["phi3:mini-q4"],
            "reason": "For optimal performance, consider using a smaller model.",
            "max_model_size": "3B"
        }
    
    return {"system_info": sys_info, "llm_recommendation": recommendation}

@app.get("/api/llm/providers")
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
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{DEFAULT_OLLAMA_URL}/api/pull",
                json={"name": model},
                timeout=aiohttp.ClientTimeout(total=600)
            ) as response:
                if response.status == 200:
                    return {"status": "success", "model": model}
                else:
                    raise HTTPException(status_code=500, detail="Failed to pull model")
    except:
        raise HTTPException(status_code=503, detail="Ollama not available")

@app.post("/api/ocr", response_model=OCRResult)
async def perform_ocr(request: OCRRequest):
    """Perform OCR on an image"""
    try:
        # Decode base64 image
        if "," in request.image:
            image_data = base64.b64decode(request.image.split(",")[1])
        else:
            image_data = base64.b64decode(request.image)
        
        provider = request.provider.lower() if request.provider else "auto"
        
        # Determine best OCR method
        if provider == "vision-llm" or provider == "llava" or provider == "moondream":
            return await perform_vision_llm_ocr(
                image_data, 
                model=request.vision_model or "llava:7b",
                provider="ollama",
                endpoint=request.custom_endpoint
            )
        elif provider == "tesseract":
            return await perform_tesseract_ocr(image_data, request.language)
        elif provider == "paddleocr":
            return await perform_paddle_ocr(image_data, request.language)
        else:
            # Auto: try vision LLM first, fallback to tesseract
            try:
                return await perform_vision_llm_ocr(image_data, model="llava:7b", provider="ollama")
            except:
                return await perform_tesseract_ocr(image_data, request.language)
                
    except Exception as e:
        logger.error(f"OCR failed: {e}")
        return OCRResult(
            text="[OCR processing failed]",
            confidence=0.0,
            method="error",
            blocks=[],
            processing_time=0.0
        )

@app.post("/api/assess", response_model=AssessmentResult)
async def assess_essay(request: AssessmentRequest):
    """Assess an essay using LLM"""
    result = await assess_with_llm(
        text=request.text,
        provider=request.provider or "ollama",
        model=request.model or "llama3:8b",
        endpoint=request.endpoint,
        api_key=request.api_key
    )
    return result

@app.post("/api/endpoint/configure")
async def configure_endpoint(config: EndpointConfig):
    """Configure custom endpoint"""
    global CUSTOM_LLM_ENDPOINT, CUSTOM_VLM_ENDPOINT
    
    if config.supports_vision:
        CUSTOM_VLM_ENDPOINT = config.dict()
    else:
        CUSTOM_LLM_ENDPOINT = config.dict()
    
    return {"status": "configured", "endpoint": config.dict()}

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
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")

if __name__ == "__main__":
    main()
