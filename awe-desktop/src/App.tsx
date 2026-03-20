import React, { useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './lib/store';
import { checkBackendHealth, getSystemInfo, checkOllama, getLLMProviders } from './lib/api';

// Screens
import WelcomeScreen from './screens/WelcomeScreen';
import SetupScreen from './screens/SetupScreen';
import LLMSetupScreen from './screens/LLMSetupScreen';
import CourseSelectScreen from './screens/CourseSelectScreen';
import UploadScreen from './screens/UploadScreen';
import ProcessingScreen from './screens/ProcessingScreen';
import ReviewScreen from './screens/ReviewScreen';
import AssessmentScreen from './screens/AssessmentScreen';
import ResultsScreen from './screens/ResultsScreen';
import SettingsScreen from './screens/SettingsScreen';
import HistoryScreen from './screens/HistoryScreen';

// Components
import TitleBar from './components/TitleBar';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorModal from './components/ErrorModal';

const App: React.FC = () => {
  const {
    currentScreen,
    systemInfo,
    setSystemInfo,
    setLLMProviders,
    setSelectedProvider,
    setSelectedModel,
    isLoading,
    error,
    setError,
    setScreen,
    resetAssessment
  } = useAppStore();

  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      try {
        // Check if running in Electron
        if (window.electronAPI?.isElectron) {
          // Get system info
          const sysInfo = await getSystemInfo();
          setSystemInfo(sysInfo);

          // Check Ollama availability
          const ollamaStatus = await checkOllama();
          
          if (ollamaStatus.available && ollamaStatus.models.length > 0) {
            // Auto-select first available model
            setSelectedModel(ollamaStatus.models[0]);
          }

          // Get available LLM providers
          try {
            const providers = await getLLMProviders();
            setLLMProviders(providers);
          } catch {
            // Use default providers if backend not ready
            setLLMProviders(getDefaultProviders());
          }
        }
      } catch (err) {
        console.error('Failed to initialize app:', err);
      }
    };

    initApp();
  }, [setSystemInfo, setLLMProviders, setSelectedModel]);

  // Listen for menu events
  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubNew = window.electronAPI.onMenuNewAssessment(() => {
      resetAssessment();
      setScreen('welcome');
    });

    const unsubFile = window.electronAPI.onFileOpened((filePath) => {
      console.log('File opened:', filePath);
      // Handle file opening
    });

    const unsubSettings = window.electronAPI.onOpenSettings((tab) => {
      console.log('Open settings:', tab);
      setScreen('settings');
    });

    const unsubSystem = window.electronAPI.onCheckSystem(() => {
      setScreen('setup');
    });

    return () => {
      unsubNew();
      unsubFile();
      unsubSettings();
      unsubSystem();
    };
  }, [resetAssessment, setScreen]);

  const renderScreen = useCallback(() => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'setup':
        return <SetupScreen />;
      case 'llm-setup':
        return <LLMSetupScreen />;
      case 'course-select':
        return <CourseSelectScreen />;
      case 'upload':
        return <UploadScreen />;
      case 'processing':
        return <ProcessingScreen />;
      case 'review':
        return <ReviewScreen />;
      case 'assessment':
        return <AssessmentScreen />;
      case 'results':
        return <ResultsScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'history':
        return <HistoryScreen />;
      default:
        return <WelcomeScreen />;
    }
  }, [currentScreen]);

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Title Bar for Electron */}
      {window.electronAPI?.isElectron && <TitleBar />}
      
      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        overflow: 'hidden',
        position: 'relative'
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ width: '100%', height: '100%' }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay />}

      {/* Error Modal */}
      {error && (
        <ErrorModal 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}
    </div>
  );
};

// Default LLM providers
function getDefaultProviders(): import('./types').LLMProvider[] {
  return [
    {
      id: 'ollama',
      name: 'Ollama',
      type: 'ollama',
      baseUrl: 'http://127.0.0.1:11434',
      models: [],
      isAvailable: true,
      isDefault: true
    },
    {
      id: 'lm-studio',
      name: 'LM Studio',
      type: 'local',
      baseUrl: 'http://127.0.0.1:1234',
      models: [],
      isAvailable: true,
      isDefault: false
    },
    {
      id: 'openai',
      name: 'OpenAI API',
      type: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      models: [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
      ],
      isAvailable: false,
      isDefault: false
    },
    {
      id: 'custom',
      name: 'Custom Endpoint',
      type: 'custom',
      baseUrl: '',
      models: [],
      isAvailable: true,
      isDefault: false
    }
  ];
}

export default App;
