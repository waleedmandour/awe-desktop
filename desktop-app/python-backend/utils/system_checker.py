"""
AWE System Desktop - System Checker Module
Hardware compatibility and requirements checking

Developed by: Dr. Waleed Mandour, 2026
Sultan Qaboos University
"""

import platform
import shutil
import subprocess
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import os

logger = logging.getLogger(__name__)


@dataclass
class SystemSpecs:
    """System specifications"""
    os_name: str
    os_version: str
    architecture: str
    cpu_name: str
    cpu_cores: int
    cpu_threads: int
    ram_total_gb: float
    ram_available_gb: float
    gpu_name: Optional[str]
    gpu_vram_gb: Optional[float]
    storage_available_gb: float


@dataclass
class RequirementCheck:
    """Requirement check result"""
    name: str
    minimum: float
    recommended: float
    actual: float
    passes_minimum: bool
    passes_recommended: bool
    message: str


class SystemChecker:
    """
    Check system compatibility for LLM inference.
    Provides detailed hardware analysis and recommendations.
    """
    
    # Minimum requirements for running local LLM
    MIN_REQUIREMENTS = {
        "cpu_cores": 4,
        "ram_gb": 8,
        "storage_gb": 15,
        "gpu_vram_gb": 4
    }
    
    # Recommended requirements for good performance
    RECOMMENDED_REQUIREMENTS = {
        "cpu_cores": 8,
        "ram_gb": 16,
        "storage_gb": 30,
        "gpu_vram_gb": 8
    }
    
    # Optimal requirements for large models
    OPTIMAL_REQUIREMENTS = {
        "cpu_cores": 12,
        "ram_gb": 32,
        "storage_gb": 50,
        "gpu_vram_gb": 12
    }
    
    def __init__(self):
        self._specs: Optional[SystemSpecs] = None
        
    def get_full_specs(self) -> Dict[str, Any]:
        """Get complete system specifications"""
        try:
            self._specs = self._gather_specs()
            
            return {
                "os": {
                    "name": self._specs.os_name,
                    "version": self._specs.os_version,
                    "architecture": self._specs.architecture
                },
                "cpu": {
                    "name": self._specs.cpu_name,
                    "cores": self._specs.cpu_cores,
                    "threads": self._specs.cpu_threads
                },
                "memory": {
                    "total_gb": round(self._specs.ram_total_gb, 1),
                    "available_gb": round(self._specs.ram_available_gb, 1)
                },
                "gpu": {
                    "name": self._specs.gpu_name,
                    "vram_gb": self._specs.gpu_vram_gb
                },
                "storage": {
                    "available_gb": round(self._specs.storage_available_gb, 1)
                }
            }
        except Exception as e:
            logger.error(f"Error gathering system specs: {e}")
            return {"error": str(e)}
    
    def check_llm_compatibility(self) -> Dict[str, Any]:
        """Check if system can run local LLM"""
        if not self._specs:
            self._gather_specs()
        
        checks = []
        
        # CPU check
        cpu_check = RequirementCheck(
            name="CPU Cores",
            minimum=self.MIN_REQUIREMENTS["cpu_cores"],
            recommended=self.RECOMMENDED_REQUIREMENTS["cpu_cores"],
            actual=self._specs.cpu_cores,
            passes_minimum=self._specs.cpu_cores >= self.MIN_REQUIREMENTS["cpu_cores"],
            passes_recommended=self._specs.cpu_cores >= self.RECOMMENDED_REQUIREMENTS["cpu_cores"],
            message=self._get_cpu_message()
        )
        checks.append(cpu_check)
        
        # RAM check
        ram_check = RequirementCheck(
            name="RAM",
            minimum=self.MIN_REQUIREMENTS["ram_gb"],
            recommended=self.RECOMMENDED_REQUIREMENTS["ram_gb"],
            actual=self._specs.ram_total_gb,
            passes_minimum=self._specs.ram_total_gb >= self.MIN_REQUIREMENTS["ram_gb"],
            passes_recommended=self._specs.ram_total_gb >= self.RECOMMENDED_REQUIREMENTS["ram_gb"],
            message=self._get_ram_message()
        )
        checks.append(ram_check)
        
        # Storage check
        storage_check = RequirementCheck(
            name="Storage",
            minimum=self.MIN_REQUIREMENTS["storage_gb"],
            recommended=self.RECOMMENDED_REQUIREMENTS["storage_gb"],
            actual=self._specs.storage_available_gb,
            passes_minimum=self._specs.storage_available_gb >= self.MIN_REQUIREMENTS["storage_gb"],
            passes_recommended=self._specs.storage_available_gb >= self.RECOMMENDED_REQUIREMENTS["storage_gb"],
            message=self._get_storage_message()
        )
        checks.append(storage_check)
        
        # GPU check (optional but important)
        gpu_vram = self._specs.gpu_vram_gb or 0
        gpu_check = RequirementCheck(
            name="GPU VRAM",
            minimum=self.MIN_REQUIREMENTS["gpu_vram_gb"],
            recommended=self.RECOMMENDED_REQUIREMENTS["gpu_vram_gb"],
            actual=gpu_vram,
            passes_minimum=gpu_vram >= self.MIN_REQUIREMENTS["gpu_vram_gb"],
            passes_recommended=gpu_vram >= self.RECOMMENDED_REQUIREMENTS["gpu_vram_gb"],
            message=self._get_gpu_message()
        )
        checks.append(gpu_check)
        
        # Overall assessment
        passes_minimum = all(c.passes_minimum for c in checks[:3])  # GPU is optional
        passes_recommended = all(c.passes_recommended for c in checks)
        
        # Determine recommended model tier
        model_tier = self._get_recommended_model_tier()
        
        return {
            "compatible": passes_minimum,
            "recommended": passes_recommended,
            "checks": [
                {
                    "name": c.name,
                    "minimum": c.minimum,
                    "recommended": c.recommended,
                    "actual": c.actual,
                    "passes_minimum": c.passes_minimum,
                    "passes_recommended": c.passes_recommended,
                    "message": c.message
                }
                for c in checks
            ],
            "recommended_models": model_tier,
            "performance_tier": self._get_performance_tier()
        }
    
    def _gather_specs(self) -> SystemSpecs:
        """Gather system specifications"""
        
        # OS info
        os_name = platform.system()
        os_version = platform.version()
        architecture = platform.machine()
        
        # CPU info
        cpu_name = platform.processor() or "Unknown CPU"
        cpu_cores = os.cpu_count() or 4
        cpu_threads = cpu_cores  # Simplified
        
        # RAM info
        try:
            import psutil
            ram_total = psutil.virtual_memory().total / (1024 ** 3)
            ram_available = psutil.virtual_memory().available / (1024 ** 3)
        except ImportError:
            # Fallback without psutil
            ram_total = 8.0
            ram_available = 4.0
        
        # GPU info
        gpu_name, gpu_vram = self._get_gpu_info()
        
        # Storage info
        try:
            import psutil
            storage = psutil.disk_usage('/').free / (1024 ** 3)
        except:
            storage = 50.0
        
        return SystemSpecs(
            os_name=os_name,
            os_version=os_version,
            architecture=architecture,
            cpu_name=cpu_name,
            cpu_cores=cpu_cores,
            cpu_threads=cpu_threads,
            ram_total_gb=ram_total,
            ram_available_gb=ram_available,
            gpu_name=gpu_name,
            gpu_vram_gb=gpu_vram,
            storage_available_gb=storage
        )
    
    def _get_gpu_info(self) -> tuple:
        """Get GPU information"""
        gpu_name = None
        gpu_vram = None
        
        try:
            # Try nvidia-smi for NVIDIA GPUs
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=name,memory.total', '--format=csv,noheader'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                line = result.stdout.strip().split('\n')[0]
                parts = line.split(',')
                if len(parts) >= 2:
                    gpu_name = parts[0].strip()
                    # Parse VRAM (e.g., "8192 MiB")
                    vram_str = parts[1].strip().split()[0]
                    gpu_vram = float(vram_str) / 1024  # Convert MiB to GB
                    
        except (subprocess.TimeoutExpired, FileNotFoundError, ValueError):
            pass
        
        return gpu_name, gpu_vram
    
    def _get_cpu_message(self) -> str:
        if self._specs.cpu_cores >= 12:
            return "Excellent CPU for LLM inference with multiple cores."
        elif self._specs.cpu_cores >= 8:
            return "Good CPU for LLM inference. Consider GPU acceleration for larger models."
        elif self._specs.cpu_cores >= 4:
            return "Minimum CPU requirements met. CPU inference will be slow for larger models."
        else:
            return "CPU below minimum requirements. LLM inference may be very slow."
    
    def _get_ram_message(self) -> str:
        ram = self._specs.ram_total_gb
        if ram >= 32:
            return "Excellent RAM for running large models (70B+ parameters)."
        elif ram >= 16:
            return "Good RAM for medium models (up to 13B parameters)."
        elif ram >= 8:
            return "Minimum RAM for small models (up to 7B parameters with quantization)."
        else:
            return "Insufficient RAM for local LLM. Consider upgrading or using smaller models."
    
    def _get_storage_message(self) -> str:
        storage = self._specs.storage_available_gb
        if storage >= 100:
            return "Plenty of storage for multiple large models."
        elif storage >= 50:
            return "Good storage for several medium models."
        elif storage >= 20:
            return "Adequate storage for a few models."
        else:
            return "Limited storage. May need to manage model files carefully."
    
    def _get_gpu_message(self) -> str:
        vram = self._specs.gpu_vram_gb or 0
        if not self._specs.gpu_name:
            return "No NVIDIA GPU detected. CPU inference will be slower."
        elif vram >= 24:
            return "Excellent GPU for running large models with full precision."
        elif vram >= 12:
            return "Great GPU for running medium-large models."
        elif vram >= 8:
            return "Good GPU for running medium models with quantization."
        elif vram >= 4:
            return "GPU suitable for small models with heavy quantization."
        else:
            return "GPU VRAM limited. CPU inference may be preferable."
    
    def _get_recommended_model_tier(self) -> Dict[str, List[str]]:
        """Get recommended models based on system specs"""
        ram = self._specs.ram_total_gb
        vram = self._specs.gpu_vram_gb or 0
        
        models = {
            "fast": [],      # For quick responses
            "balanced": [],  # Good quality/speed trade-off
            "quality": []    # Best quality, slower
        }
        
        if vram >= 8 or ram >= 16:
            models["fast"] = ["llama3.2:1b", "phi3:mini"]
            models["balanced"] = ["llama3.2:3b", "mistral:7b", "gemma2:9b"]
            models["quality"] = ["llama3.1:8b", "qwen2.5:14b"]
        elif vram >= 4 or ram >= 8:
            models["fast"] = ["llama3.2:1b", "phi3:mini"]
            models["balanced"] = ["llama3.2:3b", "gemma2:2b"]
            models["quality"] = ["mistral:7b (quantized)"]
        else:
            models["fast"] = ["llama3.2:1b"]
            models["balanced"] = ["phi3:mini"]
            models["quality"] = ["Use cloud API for best results"]
        
        return models
    
    def _get_performance_tier(self) -> str:
        """Determine overall performance tier"""
        ram = self._specs.ram_total_gb
        vram = self._specs.gpu_vram_gb or 0
        cores = self._specs.cpu_cores
        
        score = 0
        if cores >= 12: score += 2
        elif cores >= 8: score += 1
        
        if ram >= 32: score += 2
        elif ram >= 16: score += 1
        
        if vram >= 12: score += 2
        elif vram >= 6: score += 1
        
        if score >= 5:
            return "high"
        elif score >= 3:
            return "medium"
        else:
            return "low"
    
    def check_python_installed(self) -> Dict[str, Any]:
        """Check if Python is installed"""
        python_cmd = shutil.which('python') or shutil.which('python3')
        
        if python_cmd:
            try:
                result = subprocess.run(
                    [python_cmd, '--version'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                version = result.stdout.strip() or result.stderr.strip()
                return {
                    "installed": True,
                    "path": python_cmd,
                    "version": version
                }
            except Exception as e:
                return {
                    "installed": True,
                    "path": python_cmd,
                    "error": str(e)
                }
        
        return {"installed": False}
    
    def check_ollama_installed(self) -> Dict[str, Any]:
        """Check if Ollama is installed"""
        ollama_cmd = shutil.which('ollama')
        
        if ollama_cmd:
            try:
                result = subprocess.run(
                    ['ollama', '--version'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                version = result.stdout.strip() or result.stderr.strip()
                return {
                    "installed": True,
                    "path": ollama_cmd,
                    "version": version
                }
            except Exception as e:
                return {
                    "installed": True,
                    "path": ollama_cmd,
                    "error": str(e)
                }
        
        return {"installed": False}
