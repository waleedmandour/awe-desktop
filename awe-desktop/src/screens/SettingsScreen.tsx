import React from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  User, 
  Database,
  Palette,
  HelpCircle,
  Shield
} from 'lucide-react';
import { useAppStore } from '../lib/store';

const SettingsScreen: React.FC = () => {
  const { 
    selectedProvider,
    selectedModel,
    selectedVisionModel,
    ocrConfig,
    theme,
    setSelectedModel,
    setTheme,
    setScreen,
    setError
  } = useAppStore();

  const [activeTab, setActiveTab] = React.useState('general');

  const tabs = [
    { id: 'general', icon: <Settings size={18} />, label: 'General' },
    { id: 'llm', icon: <Database size={18} />, label: 'LLM Models' },
    { id: 'appearance', icon: <Palette size={18} />, label: 'Appearance' },
    { id: 'about', icon: <HelpCircle size={18} />, label: 'About' },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Settings</h1>
        <p style={styles.subtitle}>
          Configure AWE Desktop to match your preferences
        </p>
      </div>

      <div style={styles.content}>
        {/* Sidebar Tabs */}
        <div style={styles.sidebar}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tabButton,
                ...(activeTab === tab.id ? styles.tabButtonActive : {}),
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={styles.mainContent}>
          {activeTab === 'general' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>General Settings</h2>
              
              <div style={styles.settingCard}>
                <div style={styles.settingInfo}>
                  <h3 style={styles.settingName}>Default Assessment Model</h3>
                  <p style={styles.settingDesc}>
                    The LLM model used for evaluating essays
                  </p>
                </div>
                <div style={styles.settingValue}>
                  {selectedModel?.name || 'Not configured'}
                </div>
              </div>

              <div style={styles.settingCard}>
                <div style={styles.settingInfo}>
                  <h3 style={styles.settingName}>Default OCR Method</h3>
                  <p style={styles.settingDesc}>
                    Method for extracting text from images
                  </p>
                </div>
                <select
                  value={ocrConfig.provider}
                  style={styles.select}
                >
                  <option value="auto">Auto (Recommended)</option>
                  <option value="vision-llm">Vision LLM</option>
                  <option value="tesseract">Tesseract</option>
                </select>
              </div>

              <div style={styles.settingCard}>
                <div style={styles.settingInfo}>
                  <h3 style={styles.settingName}>OCR Language</h3>
                  <p style={styles.settingDesc}>
                    Primary language for text recognition
                  </p>
                </div>
                <select
                  value={ocrConfig.language}
                  style={styles.select}
                >
                  <option value="eng">English</option>
                  <option value="ara">Arabic</option>
                  <option value="eng+ara">English + Arabic</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'llm' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>LLM Configuration</h2>
              
              <div style={styles.settingCard}>
                <div style={styles.settingInfo}>
                  <h3 style={styles.settingName}>Assessment Model</h3>
                  <p style={styles.settingDesc}>
                    Model for evaluating and providing feedback on essays
                  </p>
                </div>
                <div style={styles.settingValue}>
                  {selectedModel ? (
                    <span style={styles.modelBadge}>
                      <Database size={14} />
                      {selectedModel.name}
                    </span>
                  ) : (
                    <button
                      onClick={() => setScreen('llm-setup')}
                      style={styles.configureButton}
                    >
                      Configure
                    </button>
                  )}
                </div>
              </div>

              <div style={styles.settingCard}>
                <div style={styles.settingInfo}>
                  <h3 style={styles.settingName}>Vision Model (OCR)</h3>
                  <p style={styles.settingDesc}>
                    Model for reading handwritten text from images
                  </p>
                </div>
                <div style={styles.settingValue}>
                  {selectedVisionModel ? (
                    <span style={styles.modelBadge}>
                      <Database size={14} />
                      {selectedVisionModel.name}
                    </span>
                  ) : (
                    <button
                      onClick={() => setScreen('llm-setup')}
                      style={styles.configureButton}
                    >
                      Configure
                    </button>
                  )}
                </div>
              </div>

              <div style={styles.infoBox}>
                <Shield size={20} />
                <div>
                  <h4 style={styles.infoTitle}>Privacy First</h4>
                  <p style={styles.infoText}>
                    When using local models (Ollama, LM Studio), all processing 
                    happens on your computer. Your essays never leave your device.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Appearance</h2>
              
              <div style={styles.settingCard}>
                <div style={styles.settingInfo}>
                  <h3 style={styles.settingName}>Theme</h3>
                  <p style={styles.settingDesc}>
                    Choose your preferred color scheme
                  </p>
                </div>
                <div style={styles.themeOptions}>
                  <button
                    onClick={() => setTheme('light')}
                    style={{
                      ...styles.themeButton,
                      ...(theme === 'light' ? styles.themeButtonActive : {}),
                    }}
                  >
                    ☀️ Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    style={{
                      ...styles.themeButton,
                      ...(theme === 'dark' ? styles.themeButtonActive : {}),
                    }}
                  >
                    🌙 Dark
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>About AWE Desktop</h2>
              
              <div style={styles.aboutCard}>
                <div style={styles.aboutIcon}>📝</div>
                <h3 style={styles.aboutTitle}>AWE Desktop</h3>
                <p style={styles.aboutVersion}>Version 1.0.0</p>
                <p style={styles.aboutDesc}>
                  Automated Writing Evaluation System - A desktop application 
                  for AI-powered writing assessment using local LLMs.
                </p>
                <div style={styles.aboutInfo}>
                  <p><strong>Developer:</strong> Dr. Waleed Mandour</p>
                  <p><strong>Department:</strong> Center for Preparatory Studies</p>
                  <p><strong>Institution:</strong> Sultan Qaboos University</p>
                  <p><strong>Year:</strong> 2026</p>
                </div>
                <p style={styles.aboutCopyright}>
                  © 2026 Dr. Waleed Mandour. All rights reserved.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#f8fafc',
    overflow: 'hidden',
  },
  header: {
    padding: '24px 32px',
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
  },
  content: {
    flex: 1,
    display: 'flex',
    padding: '24px 32px',
    gap: '24px',
    overflow: 'auto',
  },
  sidebar: {
    width: '220px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#64748b',
    cursor: 'pointer',
    textAlign: 'left',
  },
  tabButtonActive: {
    background: '#1a5f2a',
    color: 'white',
  },
  mainContent: {
    flex: 1,
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e2e8f0',
  },
  section: {
    maxWidth: '700px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '24px',
  },
  settingCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    background: '#f8fafc',
    borderRadius: '10px',
    marginBottom: '12px',
  },
  settingInfo: {
    flex: 1,
  },
  settingName: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#1e293b',
    marginBottom: '4px',
  },
  settingDesc: {
    fontSize: '13px',
    color: '#64748b',
  },
  settingValue: {
    display: 'flex',
    alignItems: 'center',
  },
  select: {
    padding: '10px 16px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  modelBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#f0fdf4',
    color: '#166534',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 500,
  },
  configureButton: {
    padding: '10px 20px',
    background: '#1a5f2a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  themeOptions: {
    display: 'flex',
    gap: '8px',
  },
  themeButton: {
    padding: '10px 20px',
    background: '#f1f5f9',
    border: '2px solid transparent',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  themeButtonActive: {
    borderColor: '#1a5f2a',
    background: '#f0fdf4',
  },
  infoBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    background: '#eff6ff',
    borderRadius: '10px',
    marginTop: '16px',
  },
  infoTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1e40af',
    marginBottom: '4px',
  },
  infoText: {
    fontSize: '13px',
    color: '#3b82f6',
    lineHeight: 1.5,
  },
  aboutCard: {
    textAlign: 'center',
    padding: '40px',
  },
  aboutIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  aboutTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '8px',
  },
  aboutVersion: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '24px',
  },
  aboutDesc: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: 1.6,
    marginBottom: '24px',
  },
  aboutInfo: {
    textAlign: 'left',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
    color: '#64748b',
  },
  aboutCopyright: {
    fontSize: '13px',
    color: '#94a3b8',
  },
};

export default SettingsScreen;
