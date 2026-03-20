import axios from 'axios';
import type { SystemInfo, LLMModel, OCRResult, AssessmentResult, LLMProvider } from '../types';

// Get the Python backend URL from Electron or use default
const getBaseUrl = async (): Promise<string> => {
  if (window.electronAPI?.getPythonUrl) {
    return window.electronAPI.getPythonUrl();
  }
  return 'http://127.0.0.1:8765';
};

// Create axios instance with dynamic base URL
const createApiClient = async () => {
  const baseUrl = await getBaseUrl();
  return axios.create({
    baseURL: baseUrl,
    timeout: 120000, // 2 minutes timeout for LLM operations
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

// System Information
export const getSystemInfo = async (): Promise<SystemInfo> => {
  if (window.electronAPI?.getSystemInfo) {
    return window.electronAPI.getSystemInfo();
  }
  const client = await createApiClient();
  const response = await client.get('/api/system-info');
  return response.data;
};

// LLM Management
export const checkOllama = async (): Promise<{ available: boolean; models: LLMModel[] }> => {
  if (window.electronAPI?.checkOllama) {
    return window.electronAPI.checkOllama();
  }
  try {
    const client = await createApiClient();
    const response = await client.get('/api/llm/ollama/status');
    return response.data;
  } catch {
    return { available: false, models: [] };
  }
};

export const getLLMProviders = async (): Promise<LLMProvider[]> => {
  const client = await createApiClient();
  const response = await client.get('/api/llm/providers');
  return response.data;
};

export const pullModel = async (modelName: string, onProgress?: (progress: number) => void): Promise<void> => {
  const client = await createApiClient();
  const response = await client.post('/api/llm/ollama/pull', { model: modelName }, {
    onDownloadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    }
  });
  return response.data;
};

export const setLLMProvider = async (providerId: string, config?: Record<string, unknown>): Promise<void> => {
  const client = await createApiClient();
  await client.post('/api/llm/provider', { providerId, config });
};

// OCR
export const performOCR = async (
  imageData: string, 
  provider?: 'tesseract' | 'paddleocr' | 'google-vision'
): Promise<OCRResult> => {
  const client = await createApiClient();
  const response = await client.post('/api/ocr', { 
    image: imageData,
    provider: provider || 'tesseract'
  });
  return response.data;
};

// Assessment
export const assessEssay = async (
  text: string,
  options?: {
    provider?: string;
    model?: string;
    criteria?: string[];
  }
): Promise<AssessmentResult> => {
  const client = await createApiClient();
  const response = await client.post('/api/assess', {
    text,
    provider: options?.provider,
    model: options?.model,
    criteria: options?.criteria || ['task-response', 'coherence', 'lexical', 'grammar']
  });
  return response.data;
};

// File Operations
export const selectImage = async (): Promise<{ path: string; base64: string; name: string } | null> => {
  if (window.electronAPI?.selectImage) {
    return window.electronAPI.selectImage();
  }
  throw new Error('File selection is only available in the desktop app');
};

// Health Check
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const client = await createApiClient();
    const response = await client.get('/health');
    return response.data.status === 'ok';
  } catch {
    return false;
  }
};

// GPU Detection
export const getGPUInfo = async (): Promise<{ available: boolean; name: string; memory: string }> => {
  const client = await createApiClient();
  const response = await client.get('/api/system/gpu');
  return response.data;
};
