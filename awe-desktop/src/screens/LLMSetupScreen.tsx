import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Download, 
  RefreshCw,
  Server,
  Cpu,
  Settings,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { checkOllama, pullModel } from '../lib/api';
import type { LLMProvider, LLMModel } from '../types';

const LLMSetupScreen: React.FC = () => {
  const { 
    llmProviders, 
    selectedProvider, 
    selectedModel,
    systemInfo,
    setSelectedProvider, 
    setSelectedModel,
    setScreen,
    setIsLoading,
    setError
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'ollama' | 'other'>('ollama');
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<LLMModel[]>([]);
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState(0);
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');

  useEffect(() => {
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const status = await checkOllama();
      setOllamaAvailable(status.available);
      setOllamaModels(status.models);
      
      if (status.available && status.models.length > 0 && !selectedModel) {
        // Auto-select recommended model
        const recommended = systemInfo?.llmRecommendation?.recommended;
        const matchingModel = status.models.find(m => 
          m.id === recommended || m.name.includes(recommended?.split(':')[0] || '')
        );
        if (matchingModel) {
          setSelectedModel(matchingModel);
        }
      }
    } catch (err) {
      console.error('Failed to check Ollama:', err);
      setOllamaAvailable(false);
    }
  };

  const handlePullModel = async (modelName: string) => {
    setPullingModel(modelName);
    setPullProgress(0);
    
    try {
      await pullModel(modelName, (progress) => {
        setPullProgress(progress);
      });
      
      // Refresh models list
      await checkOllamaStatus();
    } catch (err: any) {
      setError(`Failed to pull model: ${err.message}`);
    } finally {
      setPullingModel(null);
      setPullProgress(0);
    }
  };

  const getRecommendedModels = () => {
    const rec = systemInfo?.llmRecommendation;
    if (!rec) return ['llama3:8b', 'mistral:7b'];
    return [rec.recommended, ...rec.alternatives.slice(0, 2)];
  };

  const handleProviderSelect = (provider: LLMProvider) => {
    setSelectedProvider(provider);
  };

  const handleContinue = () => {
    if (selectedModel || (selectedProvider && selectedProvider.type !== 'ollama')) {
      setScreen('course-select');
    } else {
      setError('Please select an LLM model to continue');
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      overflow: 'auto'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: '900px',
          margin: 'auto',
          padding: '40px'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            Configure LLM Provider
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b'
          }}>
            Select and configure your local LLM for writing assessment
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setActiveTab('ollama')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'ollama' ? '#1a5f2a' : 'white',
              color: activeTab === 'ollama' ? 'white' : '#64748b',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Cpu size={18} />
            Ollama (Recommended)
          </button>
          <button
            onClick={() => setActiveTab('other')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'other' ? '#1a5f2a' : 'white',
              color: activeTab === 'other' ? 'white' : '#64748b',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Server size={18} />
            Other Providers
          </button>
        </div>

        {/* Ollama Tab */}
        {activeTab === 'ollama' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ marginBottom: '32px' }}
          >
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
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: ollamaAvailable ? '#dcfce7' : '#fef2f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Cpu size={24} color={ollamaAvailable ? '#16a34a' : '#ef4444'} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                      Ollama Status
                    </h3>
                    <p style={{ fontSize: '14px', color: ollamaAvailable ? '#16a34a' : '#ef4444' }}>
                      {ollamaAvailable ? 'Running' : 'Not Detected'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={checkOllamaStatus}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    color: '#64748b'
                  }}
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>

              {!ollamaAvailable && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#fef2f2',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <AlertCircle size={20} color="#ef4444" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', color: '#991b1b', marginBottom: '4px' }}>
                      Ollama is not running. Please install and start Ollama to use local LLMs.
                    </p>
                    <a 
                      href="https://ollama.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        fontSize: '13px', 
                        color: '#1a5f2a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Download Ollama <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Available Models */}
            {ollamaAvailable && (
              <>
                {/* Downloaded Models */}
                {ollamaModels.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
                      Downloaded Models
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {ollamaModels.map(model => (
                        <motion.div
                          key={model.id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => setSelectedModel(model)}
                          style={{
                            background: selectedModel?.id === model.id ? '#f0fdf4' : 'white',
                            border: `2px solid ${selectedModel?.id === model.id ? '#1a5f2a' : '#e2e8f0'}`,
                            borderRadius: '8px',
                            padding: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <p style={{ fontWeight: 500, color: '#1e293b' }}>{model.name}</p>
                            <p style={{ fontSize: '12px', color: '#64748b' }}>
                              ID: {model.id} {model.size && `• ${model.size}`}
                            </p>
                          </div>
                          {selectedModel?.id === model.id && (
                            <Check size={20} color="#1a5f2a" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Models to Download */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
                    Recommended Models
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {getRecommendedModels().map(modelName => {
                      const isDownloaded = ollamaModels.some(m => 
                        m.id === modelName || m.name.includes(modelName.split(':')[0])
                      );
                      const isPulling = pullingModel === modelName;
                      
                      return (
                        <div
                          key={modelName}
                          style={{
                            background: 'white',
                            borderRadius: '8px',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          <div>
                            <p style={{ fontWeight: 500, color: '#1e293b' }}>{modelName}</p>
                            <p style={{ fontSize: '12px', color: '#64748b' }}>
                              {isDownloaded ? 'Already downloaded' : 'Click to download'}
                            </p>
                          </div>
                          {isDownloaded ? (
                            <Check size={20} color="#16a34a" />
                          ) : isPulling ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '100px',
                                height: '6px',
                                background: '#e2e8f0',
                                borderRadius: '3px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${pullProgress}%`,
                                  height: '100%',
                                  background: '#1a5f2a',
                                  transition: 'width 0.2s'
                                }} />
                              </div>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                {pullProgress}%
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handlePullModel(modelName)}
                              style={{
                                background: '#1a5f2a',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '13px'
                              }}
                            >
                              <Download size={14} />
                              Download
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Other Providers Tab */}
        {activeTab === 'other' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ marginBottom: '32px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {llmProviders.filter(p => p.id !== 'ollama').map(provider => (
                <motion.div
                  key={provider.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => handleProviderSelect(provider)}
                  style={{
                    background: selectedProvider?.id === provider.id ? '#f0fdf4' : 'white',
                    border: `2px solid ${selectedProvider?.id === provider.id ? '#1a5f2a' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                        {provider.name}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#64748b' }}>
                        {provider.type === 'local' && 'Local server endpoint'}
                        {provider.type === 'openai' && 'OpenAI API (requires API key)'}
                        {provider.type === 'anthropic' && 'Anthropic Claude API'}
                        {provider.type === 'custom' && 'Custom OpenAI-compatible endpoint'}
                      </p>
                    </div>
                    {selectedProvider?.id === provider.id && (
                      <Check size={20} color="#1a5f2a" />
                    )}
                  </div>

                  {/* Configuration fields */}
                  {selectedProvider?.id === provider.id && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ 
                          display: 'block', 
                          fontSize: '13px', 
                          color: '#64748b',
                          marginBottom: '6px'
                        }}>
                          Base URL
                        </label>
                        <input
                          type="text"
                          value={customEndpoint}
                          onChange={(e) => setCustomEndpoint(e.target.value)}
                          placeholder={provider.baseUrl}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      {(provider.type === 'openai' || provider.type === 'anthropic') && (
                        <div>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '13px', 
                            color: '#64748b',
                            marginBottom: '6px'
                          }}>
                            API Key
                          </label>
                          <input
                            type="password"
                            value={customApiKey}
                            onChange={(e) => setCustomApiKey(e.target.value)}
                            placeholder="Enter your API key"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setScreen('setup')}
            style={{
              background: 'transparent',
              border: '1px solid #e2e8f0',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ArrowLeft size={16} />
            Back
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            disabled={!selectedModel && !selectedProvider}
            style={{
              background: (selectedModel || selectedProvider) ? '#1a5f2a' : '#cbd5e1',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'white',
              cursor: (selectedModel || selectedProvider) ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Continue
            <ArrowRight size={16} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default LLMSetupScreen;
