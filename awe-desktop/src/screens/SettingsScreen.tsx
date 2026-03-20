import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Cpu,
  Database,
  Globe,
  Palette,
  Save,
  RefreshCw,
  Check,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { checkOllama } from '../lib/api';

const SettingsScreen: React.FC = () => {
  const { 
    systemInfo,
    selectedProvider,
    selectedModel,
    ocrConfig,
    theme,
    setSelectedProvider,
    setSelectedModel,
    setOCRConfig,
    setTheme,
    setScreen,
    setError
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'llm' | 'ocr' | 'appearance' | 'about'>('llm');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  const tabs = [
    { id: 'llm', icon: <Cpu size={18} />, label: 'LLM Settings' },
    { id: 'ocr', icon: <Database size={18} />, label: 'OCR Settings' },
    { id: 'appearance', icon: <Palette size={18} />, label: 'Appearance' },
    { id: 'about', icon: <Globe size={18} />, label: 'About' }
  ];

  const handleCheckOllama = async () => {
    setOllamaStatus('checking');
    try {
      const status = await checkOllama();
      setOllamaStatus(status.available ? 'available' : 'unavailable');
    } catch {
      setOllamaStatus('unavailable');
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '240px',
        background: 'white',
        borderRight: '1px solid #e2e8f0',
        padding: '24px 16px'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1e293b'
          }}>
            Settings
          </h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.id ? '#f0fdf4' : 'transparent',
                color: activeTab === tab.id ? '#1a5f2a' : '#64748b',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
          <button
            onClick={() => setScreen('welcome')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#64748b',
              fontSize: '13px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        {activeTab === 'llm' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>
              LLM Configuration
            </h3>

            {/* Current Model */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
                Current Model
              </h4>
              {selectedModel ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Cpu size={24} color="#1a5f2a" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, color: '#1e293b' }}>{selectedModel.name}</p>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>
                      Provider: {selectedProvider?.name || 'Ollama'}
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#64748b' }}>No model selected</p>
              )}
            </div>

            {/* Ollama Status */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                  Ollama Status
                </h4>
                <button
                  onClick={handleCheckOllama}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#64748b'
                  }}
                >
                  <RefreshCw size={12} />
                  Check
                </button>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {ollamaStatus === 'checking' && (
                  <span style={{ color: '#64748b' }}>Checking...</span>
                )}
                {ollamaStatus === 'available' && (
                  <>
                    <Check size={16} color="#10b981" />
                    <span style={{ color: '#10b981' }}>Ollama is running</span>
                  </>
                )}
                {ollamaStatus === 'unavailable' && (
                  <>
                    <AlertCircle size={16} color="#ef4444" />
                    <span style={{ color: '#ef4444' }}>Ollama not detected</span>
                  </>
                )}
              </div>
            </div>

            {/* Custom Endpoint */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
                Custom LLM Endpoint
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                Configure a custom OpenAI-compatible endpoint
              </p>
              <input
                type="text"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                placeholder="http://localhost:1234/v1"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '12px'
                }}
              />
              <button
                style={{
                  background: '#1a5f2a',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px'
                }}
              >
                <Save size={14} />
                Save Configuration
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'ocr' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>
              OCR Settings
            </h3>

            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
                OCR Provider
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['tesseract', 'paddleocr'].map(provider => (
                  <label
                    key={provider}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: ocrConfig.provider === provider ? '#f0fdf4' : '#f8fafc',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: `2px solid ${ocrConfig.provider === provider ? '#1a5f2a' : 'transparent'}`
                    }}
                  >
                    <input
                      type="radio"
                      name="ocr-provider"
                      checked={ocrConfig.provider === provider}
                      onChange={() => setOCRConfig({ ...ocrConfig, provider: provider as any })}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: ocrConfig.provider === provider ? '#1a5f2a' : '#d1d5db',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {ocrConfig.provider === provider && (
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: '#1a5f2a'
                        }} />
                      )}
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, color: '#1e293b', textTransform: 'capitalize' }}>
                        {provider}
                      </p>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>
                        {provider === 'tesseract' && 'Open-source OCR engine'}
                        {provider === 'paddleocr' && 'Deep learning based OCR'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
                Language
              </h4>
              <select
                value={ocrConfig.language}
                onChange={(e) => setOCRConfig({ ...ocrConfig, language: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="eng">English</option>
                <option value="ara">Arabic</option>
                <option value="eng+ara">English + Arabic</option>
              </select>
            </div>
          </motion.div>
        )}

        {activeTab === 'appearance' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>
              Appearance
            </h3>

            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
                Theme
              </h4>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['light', 'dark'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t as any)}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '8px',
                      border: `2px solid ${theme === t ? '#1a5f2a' : '#e2e8f0'}`,
                      background: t === 'light' ? '#ffffff' : '#1e293b',
                      cursor: 'pointer'
                    }}
                  >
                    <p style={{
                      fontWeight: 500,
                      color: t === 'light' ? '#1e293b' : '#ffffff',
                      textTransform: 'capitalize'
                    }}>
                      {t}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'about' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>
              About AWE Desktop
            </h3>

            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #1a5f2a 0%, #0d3318 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px'
                }}>
                  📝
                </div>
                <div>
                  <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
                    AWE Desktop
                  </h4>
                  <p style={{ color: '#64748b' }}>Version 1.0.0</p>
                </div>
              </div>
              
              <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '16px' }}>
                Automated Writing Evaluation System - A desktop application for AI-powered 
                writing assessment using local LLMs. Designed for educators and students 
                at Sultan Qaboos University.
              </p>

              <div style={{
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <p style={{ fontSize: '13px', color: '#64748b' }}>
                  <strong>Developer:</strong> Dr. Waleed Mandour<br />
                  <strong>Institution:</strong> Sultan Qaboos University<br />
                  <strong>Year:</strong> 2026
                </p>
              </div>

              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                © 2026 Dr. Waleed Mandour. All rights reserved.
              </p>
            </div>

            {/* System Info */}
            {systemInfo && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
                  System Information
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '13px'
                }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Platform:</span>
                    <span style={{ color: '#1e293b', marginLeft: '8px' }}>
                      {systemInfo.platform}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Architecture:</span>
                    <span style={{ color: '#1e293b', marginLeft: '8px' }}>
                      {systemInfo.arch}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>CPU Cores:</span>
                    <span style={{ color: '#1e293b', marginLeft: '8px' }}>
                      {systemInfo.cpuCores}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>RAM:</span>
                    <span style={{ color: '#1e293b', marginLeft: '8px' }}>
                      {systemInfo.totalMemoryGB} GB
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SettingsScreen;
