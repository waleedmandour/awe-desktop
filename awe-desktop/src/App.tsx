import React, { useEffect, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './lib/store';
import { checkOllama, getLLMProviders } from './lib/api';

// Components
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorModal from './components/ErrorModal';

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

// Types
import type { Screen } from './types';

const App: React.FC = () => {
  const {
    currentScreen,
    systemInfo,
    setSystemInfo,
    setLLMProviders,
    setSelectedModel,
    isLoading,
    error,
    setError,
    setScreen,
    resetAssessment
  } = useAppStore();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      try {
        if (window.electronAPI?.isElectron) {
          const sysInfo = await window.electronAPI.getSystemInfo();
          setSystemInfo(sysInfo);

          const ollamaStatus = await checkOllama();
          if (ollamaStatus.available && ollamaStatus.models.length > 0) {
            setSelectedModel(ollamaStatus.models[0]);
          }

          try {
            const providers = await getLLMProviders();
            setLLMProviders(providers);
          } catch {
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

    const unsubSettings = window.electronAPI.onOpenSettings(() => {
      setScreen('settings');
    });

    const unsubSystem = window.electronAPI.onCheckSystem(() => {
      setScreen('setup');
    });

    return () => {
      unsubNew();
      unsubSettings();
      unsubSystem();
    };
  }, [resetAssessment, setScreen]);

  // Check if screen should use full layout
  const isFullLayout = ['processing', 'assessment'].includes(currentScreen);
  
  // Check if screen should show sidebar
  const showSidebar = !isFullLayout;

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
    <div style={styles.container}>
      {/* Title Bar for Electron */}
      {window.electronAPI?.isElectron && (
        <div style={styles.titleBar}>
          <span style={styles.titleBarIcon}>📝</span>
          <span style={styles.titleBarText}>AWE Desktop</span>
          <span style={styles.titleBarInstitution}>
            Center for Preparatory Studies, Sultan Qaboos University
          </span>
        </div>
      )}

      <div style={styles.mainLayout}>
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar 
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* Main Content Area */}
        <div style={{
          ...styles.contentArea,
          marginLeft: showSidebar ? (sidebarCollapsed ? 60 : 220) : 0
        }}>
          {/* Top Bar */}
          {!isFullLayout && <TopBar />}

          {/* Screen Content */}
          <div style={styles.screenContent}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%', height: '100%' }}
              >
                {renderScreen()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

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

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#f8fafc',
  },
  titleBar: {
    height: '32px',
    background: 'linear-gradient(135deg, #1a5f2a 0%, #0d3318 100%)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    gap: '8px',
    // @ts-ignore
    WebkitAppRegion: 'drag',
  },
  titleBarIcon: {
    fontSize: '14px',
  },
  titleBarText: {
    color: 'white',
    fontSize: '13px',
    fontWeight: 600,
  },
  titleBarInstitution: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '12px',
    marginLeft: 'auto',
  },
  mainLayout: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'margin-left 0.2s ease',
  },
  screenContent: {
    flex: 1,
    overflow: 'auto',
  },
};

// Default providers
function getDefaultProviders() {
  return [
    {
      id: 'ollama',
      name: 'Ollama',
      type: 'ollama',
      baseUrl: 'http://127.0.0.1:11434',
      models: [],
      isAvailable: true,
      isDefault: true,
      supportsVision: true,
    },
    {
      id: 'lm-studio',
      name: 'LM Studio',
      type: 'local',
      baseUrl: 'http://127.0.0.1:1234',
      models: [],
      isAvailable: true,
      isDefault: false,
      supportsVision: true,
    },
    {
      id: 'openai',
      name: 'OpenAI API',
      type: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      models: [
        { id: 'gpt-4o', name: 'GPT-4o', supportsVision: true },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', supportsVision: true },
      ],
      isAvailable: false,
      isDefault: false,
      supportsVision: true,
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      type: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      models: [
        { id: 'claude-3-opus', name: 'Claude 3 Opus', supportsVision: true },
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', supportsVision: true },
      ],
      isAvailable: false,
      isDefault: false,
      supportsVision: true,
    },
    {
      id: 'custom',
      name: 'Custom Endpoint',
      type: 'custom',
      baseUrl: '',
      models: [],
      isAvailable: true,
      isDefault: false,
      supportsVision: true,
    },
  ];
}

export default App;
