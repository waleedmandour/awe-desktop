"""
AWE System Desktop - LLM Provider Module
Supports multiple LLM backends: Ollama, LM Studio, OpenAI-compatible, Custom

Developed by: Dr. Waleed Mandour, 2026
Sultan Qaboos University
"""

import json
import logging
import asyncio
from typing import Optional, List, Dict, Any, AsyncGenerator
from dataclasses import dataclass, field
import httpx

logger = logging.getLogger(__name__)


@dataclass
class LLMConfig:
    """LLM Configuration"""
    provider: str = "ollama"
    url: str = "http://localhost:11434"
    model: str = "llama3.2"
    api_key: Optional[str] = None
    temperature: float = 0.3
    max_tokens: int = 2000
    timeout: int = 120


@dataclass
class ProviderStatus:
    """LLM Provider Status"""
    name: str
    available: bool
    url: str
    models: List[str] = field(default_factory=list)
    error: Optional[str] = None


class LLMProvider:
    """
    Multi-provider LLM support for essay assessment.
    Supports: Ollama, LM Studio, OpenAI-compatible APIs, and custom endpoints.
    """
    
    # Default endpoints for each provider
    DEFAULT_URLS = {
        "ollama": "http://localhost:11434",
        "lmstudio": "http://localhost:1234",
        "openai": "https://api.openai.com/v1",
        "custom": ""
    }
    
    # Recommended models for essay assessment (by RAM)
    RECOMMENDED_MODELS = {
        "8gb": ["llama3.2:1b", "phi3:mini", "gemma2:2b"],
        "16gb": ["llama3.2:3b", "phi3:medium", "gemma2:9b", "mistral:7b"],
        "32gb": ["llama3.1:8b", "mistral-nemo:12b", "qwen2.5:14b"],
        "64gb": ["llama3.1:70b", "qwen2.5:32b", "mixtral:8x7b"]
    }
    
    def __init__(self, config: Optional[LLMConfig] = None):
        self.config = config or LLMConfig()
        self.providers_status: Dict[str, ProviderStatus] = {}
        
    async def _make_request(
        self, 
        url: str, 
        payload: Dict[str, Any], 
        headers: Dict[str, str],
        stream: bool = False
    ) -> Any:
        """Make HTTP request to LLM endpoint"""
        timeout = httpx.Timeout(self.config.timeout, connect=30.0)
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            if stream:
                async with client.stream("POST", url, json=payload, headers=headers) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            yield line
            else:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return response.json()
    
    def _build_assessment_prompt(
        self,
        text: str,
        course_code: str,
        topic: Optional[str],
        criteria: Optional[List[Dict]]
    ) -> str:
        """Build the assessment prompt"""
        
        # Determine assessment criteria based on course
        if criteria:
            criteria_list = criteria
        elif course_code in ["0230", "0340"]:
            criteria_list = [
                {"name": "Task Response", "max": 6},
                {"name": "Coherence & Cohesion", "max": 6},
                {"name": "Lexical Resource", "max": 6},
                {"name": "Grammatical Range & Accuracy", "max": 6}
            ]
        else:  # LANC2160
            criteria_list = [
                {"name": "Task Achievement", "max": 5},
                {"name": "Coherence & Cohesion", "max": 5},
                {"name": "Lexical Resource", "max": 5},
                {"name": "Grammatical Range & Accuracy", "max": 5}
            ]
        
        criteria_text = "\n".join([
            f"- {c['name']}: Score 0-{c['max']}"
            for c in criteria_list
        ])
        
        total_max = sum(c['max'] for c in criteria_list)
        
        prompt = f"""You are an expert IELTS writing examiner. Assess the following student essay.

Course: {course_code}
{f"Topic: {topic}" if topic else ""}

Student Essay:
\"\"\"
{text}
\"\"\"

Assess this essay based on the following criteria:
{criteria_text}

For each criterion, provide:
1. A score (within the range specified)
2. Specific, constructive feedback
3. Suggestions for improvement

Respond ONLY with valid JSON in this exact format:
{{
  "scores": [
    {{
      "criterionName": "Task Response",
      "score": <score>,
      "maxScore": <max>,
      "feedback": "<detailed feedback>"
    }}
  ],
  "totalScore": <sum of scores>,
  "maxScore": {total_max},
  "percentage": <percentage>,
  "bandScore": <IELTS-style band 1-9>,
  "overallFeedback": "<comprehensive feedback summary>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "areasToImprove": ["<area 1>", "<area 2>"]
}}"""
        
        return prompt
    
    async def configure(
        self,
        provider: str,
        url: Optional[str] = None,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """Configure LLM provider"""
        self.config.provider = provider
        self.config.url = url or self.DEFAULT_URLS.get(provider, url)
        if model:
            self.config.model = model
        if api_key:
            self.config.api_key = api_key
        if temperature is not None:
            self.config.temperature = temperature
        if max_tokens:
            self.config.max_tokens = max_tokens
            
        return {
            "provider": self.config.provider,
            "url": self.config.url,
            "model": self.config.model,
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_tokens,
            "configured": True
        }
    
    async def check_all_providers(self) -> Dict[str, ProviderStatus]:
        """Check status of all LLM providers"""
        providers = ["ollama", "lmstudio"]
        
        for provider in providers:
            url = self.DEFAULT_URLS.get(provider, "")
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    if provider == "ollama":
                        response = await client.get(f"{url}/api/tags")
                        if response.status_code == 200:
                            data = response.json()
                            models = [m.get("name", "") for m in data.get("models", [])]
                            self.providers_status[provider] = ProviderStatus(
                                name=provider,
                                available=True,
                                url=url,
                                models=models
                            )
                        else:
                            raise Exception(f"Status code: {response.status_code}")
                    elif provider == "lmstudio":
                        response = await client.get(f"{url}/v1/models")
                        if response.status_code == 200:
                            data = response.json()
                            models = [m.get("id", "") for m in data.get("data", [])]
                            self.providers_status[provider] = ProviderStatus(
                                name=provider,
                                available=True,
                                url=url,
                                models=models
                            )
                        else:
                            raise Exception(f"Status code: {response.status_code}")
            except Exception as e:
                self.providers_status[provider] = ProviderStatus(
                    name=provider,
                    available=False,
                    url=url,
                    error=str(e)
                )
        
        return {k: v.__dict__ for k, v in self.providers_status.items()}
    
    async def list_models(self, provider: str) -> List[str]:
        """List available models from a provider"""
        url = self.DEFAULT_URLS.get(provider, self.config.url)
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                if provider == "ollama":
                    response = await client.get(f"{url}/api/tags")
                    if response.status_code == 200:
                        data = response.json()
                        return [m.get("name", "") for m in data.get("models", [])]
                elif provider == "lmstudio":
                    response = await client.get(f"{url}/v1/models")
                    if response.status_code == 200:
                        data = response.json()
                        return [m.get("id", "") for m in data.get("data", [])]
        except Exception as e:
            logger.error(f"Error listing models for {provider}: {e}")
        
        return []
    
    async def assess_essay(
        self,
        text: str,
        course_code: str,
        topic: Optional[str] = None,
        criteria: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Assess essay using configured LLM"""
        
        prompt = self._build_assessment_prompt(text, course_code, topic, criteria)
        
        # Build request based on provider
        if self.config.provider == "ollama":
            endpoint = f"{self.config.url}/api/generate"
            payload = {
                "model": self.config.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": self.config.temperature,
                    "num_predict": self.config.max_tokens
                }
            }
            headers = {"Content-Type": "application/json"}
            
            result = await self._make_request(endpoint, payload, headers)
            
            # Parse Ollama response
            response_text = result.get("response", "")
            
        elif self.config.provider in ["lmstudio", "openai", "custom"]:
            # OpenAI-compatible API
            endpoint = f"{self.config.url}/v1/chat/completions"
            payload = {
                "model": self.config.model,
                "messages": [
                    {"role": "system", "content": "You are an expert writing assessment AI. Respond only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": self.config.temperature,
                "max_tokens": self.config.max_tokens,
                "stream": False
            }
            headers = {"Content-Type": "application/json"}
            
            if self.config.api_key:
                headers["Authorization"] = f"Bearer {self.config.api_key}"
            
            result = await self._make_request(endpoint, payload, headers)
            
            # Parse OpenAI-compatible response
            response_text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        else:
            raise ValueError(f"Unknown provider: {self.config.provider}")
        
        # Parse JSON response
        try:
            # Clean response (remove markdown code blocks if present)
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            
            assessment = json.loads(cleaned)
            assessment["success"] = True
            assessment["model"] = self.config.model
            assessment["provider"] = self.config.provider
            
            return assessment
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response: {e}")
            return {
                "success": False,
                "error": "Failed to parse assessment response",
                "raw_response": response_text
            }
    
    async def assess_essay_stream(
        self,
        text: str,
        course_code: str,
        topic: Optional[str] = None,
        criteria: Optional[List[Dict]] = None
    ) -> AsyncGenerator[str, None]:
        """Assess essay with streaming response"""
        
        prompt = self._build_assessment_prompt(text, course_code, topic, criteria)
        
        if self.config.provider == "ollama":
            endpoint = f"{self.config.url}/api/generate"
            payload = {
                "model": self.config.model,
                "prompt": prompt,
                "stream": True,
                "options": {
                    "temperature": self.config.temperature,
                    "num_predict": self.config.max_tokens
                }
            }
            headers = {"Content-Type": "application/json"}
            
            async for line in self._make_request(endpoint, payload, headers, stream=True):
                try:
                    data = json.loads(line)
                    if "response" in data:
                        yield json.dumps({"token": data["response"]})
                except json.JSONDecodeError:
                    continue
                    
        elif self.config.provider in ["lmstudio", "openai", "custom"]:
            endpoint = f"{self.config.url}/v1/chat/completions"
            payload = {
                "model": self.config.model,
                "messages": [
                    {"role": "system", "content": "You are an expert writing assessment AI. Respond only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": self.config.temperature,
                "max_tokens": self.config.max_tokens,
                "stream": True
            }
            headers = {"Content-Type": "application/json"}
            
            if self.config.api_key:
                headers["Authorization"] = f"Bearer {self.config.api_key}"
            
            async for line in self._make_request(endpoint, payload, headers, stream=True):
                if line.startswith("data: "):
                    line = line[6:]
                if line == "[DONE]":
                    break
                try:
                    data = json.loads(line)
                    delta = data.get("choices", [{}])[0].get("delta", {})
                    if "content" in delta:
                        yield json.dumps({"token": delta["content"]})
                except json.JSONDecodeError:
                    continue
    
    def get_recommended_models(self, ram_gb: int) -> List[str]:
        """Get recommended models based on available RAM"""
        if ram_gb < 8:
            return self.RECOMMENDED_MODELS["8gb"]
        elif ram_gb < 16:
            return self.RECOMMENDED_MODELS["8gb"] + self.RECOMMENDED_MODELS["16gb"]
        elif ram_gb < 32:
            return self.RECOMMENDED_MODELS["16gb"] + self.RECOMMENDED_MODELS["32gb"]
        else:
            return self.RECOMMENDED_MODELS["32gb"] + self.RECOMMENDED_MODELS["64gb"]
