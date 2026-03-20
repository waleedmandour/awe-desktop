// System Information
export interface SystemInfo {
  totalMemoryGB: number;
  freeMemoryGB: number;
  cpuCores: number;
  cpuModel: string;
  platform: string;
  arch: string;
  gpu: string | null;
  llmRecommendation: {
    recommended: string;
    alternatives: string[];
    reason: string;
    maxModelSize: string;
  };
}

// LLM Provider Configuration
export interface LLMProvider {
  id: string;
  name: string;
  type: 'ollama' | 'openai' | 'anthropic' | 'local' | 'custom';
  baseUrl: string;
  apiKey?: string;
  models: LLMModel[];
  isAvailable: boolean;
  isDefault: boolean;
  supportsVision: boolean;
}

export interface LLMModel {
  id: string;
  name: string;
  size?: string;
  parameters?: string;
  quantization?: string;
  contextLength?: number;
  isDownloaded?: boolean;
  downloadSize?: string;
  supportsVision?: boolean;
}

// Custom Endpoint Configuration
export interface CustomEndpoint {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  model?: string;
  isVision: boolean;
}

// OCR Configuration
export interface OCRConfig {
  provider: 'tesseract' | 'paddleocr' | 'vision-llm' | 'auto';
  language: string;
  confidence: number;
  visionModel?: string;
  customEndpoint?: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  method: string;
  model?: string;
  blocks: TextBlock[];
  processingTime: number;
}

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Assessment Types
export interface AssessmentCriteria {
  name: string;
  score: number;
  maxScore: number;
  band: string;
  description: string;
  feedback: string;
}

export interface AssessmentResult {
  id: string;
  timestamp: Date;
  text: string;
  wordCount: number;
  overallBand: string;
  overallScore: number;
  criteria: AssessmentCriteria[];
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  llmProvider: string;
  llmModel: string;
  processingTime: number;
}

// Course and Essay Types
export interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  description: string;
  assessmentType: 'ielts' | 'toefl' | 'academic' | 'custom';
  rubric: RubricCriteria[];
  studentCount: number;
  essaysCount: number;
  createdAt: Date;
}

export interface RubricCriteria {
  name: string;
  weight: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number;
  description: string;
}

export interface Essay {
  id: string;
  courseId: string;
  studentName: string;
  studentId: string;
  text: string;
  wordCount: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  assessment?: AssessmentResult;
  imageUrl?: string;
  ocrMethod?: string;
  createdAt: Date;
  assessedAt?: Date;
}

// Application State
export type Screen = 
  | 'welcome' 
  | 'setup' 
  | 'llm-setup'
  | 'course-select' 
  | 'upload' 
  | 'processing' 
  | 'review' 
  | 'assessment' 
  | 'results'
  | 'settings'
  | 'history';

export interface AppState {
  currentScreen: Screen;
  systemInfo: SystemInfo | null;
  llmProviders: LLMProvider[];
  selectedProvider: LLMProvider | null;
  selectedModel: LLMModel | null;
  selectedVisionModel: LLMModel | null;
  customEndpoints: CustomEndpoint[];
  ocrConfig: OCRConfig;
  courses: Course[];
  selectedCourse: Course | null;
  essays: Essay[];
  currentEssay: Essay | null;
  currentAssessment: AssessmentResult | null;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  theme: 'light' | 'dark';
}

// Electron API Types
export interface ElectronAPI {
  getSystemInfo: () => Promise<SystemInfo>;
  selectImage: () => Promise<{ path: string; base64: string; name: string } | null>;
  readFile: (filePath: string) => Promise<string>;
  getPythonUrl: () => Promise<string>;
  checkOllama: () => Promise<{ available: boolean; models: LLMModel[] }>;
  onMenuNewAssessment: (callback: () => void) => () => void;
  onFileOpened: (callback: (filePath: string) => void) => () => void;
  onOpenSettings: (callback: (tab: string) => void) => () => void;
  onCheckSystem: (callback: () => void) => () => void;
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
