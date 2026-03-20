import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Screen, 
  SystemInfo, 
  LLMProvider, 
  LLMModel, 
  OCRConfig, 
  Course, 
  Essay, 
  AssessmentResult 
} from '../types';

interface AppState {
  // Navigation
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  
  // System
  systemInfo: SystemInfo | null;
  setSystemInfo: (info: SystemInfo | null) => void;
  
  // LLM Configuration
  llmProviders: LLMProvider[];
  setLLMProviders: (providers: LLMProvider[]) => void;
  selectedProvider: LLMProvider | null;
  setSelectedProvider: (provider: LLMProvider | null) => void;
  selectedModel: LLMModel | null;
  setSelectedModel: (model: LLMModel | null) => void;
  
  // OCR Configuration
  ocrConfig: OCRConfig;
  setOCRConfig: (config: OCRConfig) => void;
  
  // Courses
  courses: Course[];
  setCourses: (courses: Course[]) => void;
  addCourse: (course: Course) => void;
  selectedCourse: Course | null;
  setSelectedCourse: (course: Course | null) => void;
  
  // Essays
  essays: Essay[];
  setEssays: (essays: Essay[]) => void;
  addEssay: (essay: Essay) => void;
  updateEssay: (id: string, updates: Partial<Essay>) => void;
  currentEssay: Essay | null;
  setCurrentEssay: (essay: Essay | null) => void;
  
  // Assessment
  currentAssessment: AssessmentResult | null;
  setCurrentAssessment: (assessment: AssessmentResult | null) => void;
  
  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Reset
  reset: () => void;
  resetAssessment: () => void;
}

const initialState = {
  currentScreen: 'welcome' as Screen,
  systemInfo: null,
  llmProviders: [],
  selectedProvider: null,
  selectedModel: null,
  ocrConfig: {
    provider: 'tesseract' as const,
    language: 'eng',
    confidence: 0.7
  },
  courses: [],
  selectedCourse: null,
  essays: [],
  currentEssay: null,
  currentAssessment: null,
  isLoading: false,
  error: null,
  theme: 'light' as const
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      
      // Navigation
      setScreen: (screen) => set({ currentScreen: screen }),
      
      // System
      setSystemInfo: (systemInfo) => set({ systemInfo }),
      
      // LLM Configuration
      setLLMProviders: (llmProviders) => set({ llmProviders }),
      setSelectedProvider: (selectedProvider) => set({ selectedProvider }),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
      
      // OCR Configuration
      setOCRConfig: (ocrConfig) => set({ ocrConfig }),
      
      // Courses
      setCourses: (courses) => set({ courses }),
      addCourse: (course) => set((state) => ({ 
        courses: [...state.courses, course] 
      })),
      setSelectedCourse: (selectedCourse) => set({ selectedCourse }),
      
      // Essays
      setEssays: (essays) => set({ essays }),
      addEssay: (essay) => set((state) => ({ 
        essays: [...state.essays, essay] 
      })),
      updateEssay: (id, updates) => set((state) => ({
        essays: state.essays.map(e => 
          e.id === id ? { ...e, ...updates } : e
        ),
        currentEssay: state.currentEssay?.id === id 
          ? { ...state.currentEssay, ...updates } 
          : state.currentEssay
      })),
      setCurrentEssay: (currentEssay) => set({ currentEssay }),
      
      // Assessment
      setCurrentAssessment: (currentAssessment) => set({ currentAssessment }),
      
      // UI State
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setTheme: (theme) => set({ theme }),
      
      // Reset
      reset: () => set(initialState),
      resetAssessment: () => set({
        currentEssay: null,
        currentAssessment: null,
        error: null
      })
    }),
    {
      name: 'awe-desktop-storage',
      partialize: (state) => ({
        courses: state.courses,
        essays: state.essays,
        selectedProvider: state.selectedProvider,
        selectedModel: state.selectedModel,
        ocrConfig: state.ocrConfig,
        theme: state.theme
      })
    }
  )
);
