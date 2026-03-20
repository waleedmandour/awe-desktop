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
  AlertCircle,
  Eye,
  Link,
  Plus,
  Trash2
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
    setError
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'llm' | 'vlm' | 'custom'>('llm');
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<LLMModel[]>([]);
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState(0);
  
  // Custom endpoint state
  const [customEndpoints, setCustomEndpoints] = useState<Array<{
    id: string;
    name: string;
    url: string;
    apiKey: string;
    model: string;
    isVision: boolean;
  }>>([]);
  const [newEndpoint, setNewEndpoint] = useState({
    name: '',
    url: '',
    apiKey: '',
    model: '',
    isVision: false,
  });
  const [showAddEndpoint, setShowAddEndpoint] = useState(false);

  useEffect(() => {
    checkOllamaStatus();
    loadCustomEndpoints();
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const status = await checkOllama();
      setOllamaAvailable(status.available);
      setOllamaModels(status.models);
      
      if (status.available && status.models.length > 0 && !selectedModel) {
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

  const loadCustomEndpoints = () => {
    const saved = localStorage.getItem('awe-custom-endpoints');
    if (saved) {
      setCustomEndpoints(JSON.parse(saved));
    }
  };

  const saveCustomEndpoints = (endpoints: typeof customEndpoints) => {
    setCustomEndpoints(endpoints);
    localStorage.setItem('awe-custom-endpoints', JSON.stringify(endpoints));
  };

  const handleAddEndpoint = () => {
    if (!newEndpoint.name || !newEndpoint.url) {
      setError('Name and URL are required');
      return;
    }
    
    const endpoint = {
      ...newEndpoint,
      id: Date.now().toString(),
    };
    
    saveCustomEndpoints([...customEndpoints, endpoint]);
    setNewEndpoint({ name: '', url: '', apiKey: '', model: '', isVision: false });
    setShowAddEndpoint(false);
  };

  const handleRemoveEndpoint = (id: string) => {
    saveCustomEndpoints(customEndpoints.filter(e => e.id !== id));
  };

  const handlePullModel = async (modelName: string) => {
    setPullingModel(modelName);
    setPullProgress(0);
    
    try {
      await pullModel(modelName, (progress) => {
        setPullProgress(progress);
      });
      await checkOllamaStatus();
    } catch (err: any) {
      setError(`Failed to pull model: ${err.message}`);
    } finally {
      setPullingModel(null);
      setPullProgress(0);
    }
  };

  const getRecommendedLLMModels = () => {
    const rec = systemInfo?.llmRecommendation;
    if (!rec) return ['llama3:8b', 'mistral:7b', 'phi3:mini'];
    return [rec.recommended, ...rec.alternatives.slice(0, 2)];
  };

  const getRecommendedVLMModels = () => {
    return ['llava:7b', 'llava:13b', 'moondream', 'minicpm-v'];
  };

  const visionModels = ollamaModels.filter(m => 
    m.id.toLowerCase().includes('llava') || 
    m.id.toLowerCase().includes('moondream') ||
    m.id.toLowerCase().includes('minicpm') ||
    m.id.toLowerCase().includes('vision') ||
    m.id.toLowerCase().includes('bakllava')
  );

  const textModels = ollamaModels.filter(m => !visionModels.some(vm => vm.id === m.id));

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>LLM Configuration</h1>
          <p style={styles.subtitle}>
            Configure AI models for writing assessment and OCR
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('llm')}
          style={{
            ...styles.tab,
            ...(activeTab === 'llm' ? styles.tabActive : {}),
          }}
        >
          <Cpu size={18} />
          Text LLM
        </button>
        <button
          onClick={() => setActiveTab('vlm')}
          style={{
            ...styles.tab,
            ...(activeTab === 'vlm' ? styles.tabActive : {}),
          }}
        >
          <Eye size={18} />
          Vision LLM (OCR)
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          style={{
            ...styles.tab,
            ...(activeTab === 'custom' ? styles.tabActive : {}),
          }}
        >
          <Link size={18} />
          Custom Endpoints
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Text LLM Tab */}
        {activeTab === 'llm' && (
          <div style={styles.tabContent}>
            {/* Ollama Status */}
            <div style={styles.statusCard}>
              <div style={styles.statusHeader}>
                <div style={styles.statusInfo}>
                  <div style={{
                    ...styles.statusIcon,
                    background: ollamaAvailable ? '#dcfce7' : '#fef2f2',
                  }}>
                    <Cpu size={24} color={ollamaAvailable ? '#16a34a' : '#ef4444'} />
                  </div>
                  <div>
                    <h3 style={styles.statusTitle}>Ollama</h3>
                    <p style={styles.statusText}>
                      {ollamaAvailable ? 'Connected' : 'Not detected'}
                    </p>
                  </div>
                </div>
                <button onClick={checkOllamaStatus} style={styles.refreshButton}>
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>

              {!ollamaAvailable && (
                <div style={styles.warningBox}>
                  <AlertCircle size={20} color="#f59e0b" />
                  <div style={styles.warningContent}>
                    <p style={styles.warningTitle}>Ollama is not running</p>
                    <p style={styles.warningText}>
                      Download from{' '}
                      <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" style={styles.link}>
                        ollama.ai <ExternalLink size={12} />
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Available Models */}
            {ollamaAvailable && (
              <>
                {textModels.length > 0 && (
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Downloaded Models</h3>
                    <div style={styles.modelGrid}>
                      {textModels.map(model => (
                        <motion.div
                          key={model.id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => setSelectedModel(model)}
                          style={{
                            ...styles.modelCard,
                            ...(selectedModel?.id === model.id ? styles.modelCardSelected : {}),
                          }}
                        >
                          <div style={styles.modelInfo}>
                            <span style={styles.modelName}>{model.name}</span>
                            <span style={styles.modelSize}>{model.size}</span>
                          </div>
                          {selectedModel?.id === model.id && (
                            <Check size={20} color="#1a5f2a" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Recommended Models</h3>
                  <div style={styles.modelGrid}>
                    {getRecommendedLLMModels().map(modelName => {
                      const isDownloaded = textModels.some(m => 
                        m.id === modelName || m.name.includes(modelName.split(':')[0])
                      );
                      const isPulling = pullingModel === modelName;
                      
                      return (
                        <div key={modelName} style={styles.modelCard}>
                          <div style={styles.modelInfo}>
                            <span style={styles.modelName}>{modelName}</span>
                            <span style={styles.modelSize}>
                              {isDownloaded ? 'Downloaded' : 'Click to download'}
                            </span>
                          </div>
                          {isDownloaded ? (
                            <Check size={20} color="#16a34a" />
                          ) : isPulling ? (
                            <div style={styles.progressContainer}>
                              <div style={styles.progressBar}>
                                <div style={{
                                  ...styles.progressFill,
                                  width: `${pullProgress}%`,
                                }} />
                              </div>
                              <span style={styles.progressText}>{pullProgress}%</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handlePullModel(modelName)}
                              style={styles.downloadButton}
                            >
                              <Download size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Vision LLM Tab */}
        {activeTab === 'vlm' && (
          <div style={styles.tabContent}>
            <div style={styles.infoBox}>
              <Eye size={24} color="#3b82f6" />
              <div>
                <h3 style={styles.infoTitle}>Vision Models for OCR</h3>
                <p style={styles.infoText}>
                  Vision LLMs like LLaVA can transcribe handwritten text with higher accuracy 
                  than traditional OCR. They work best for handwritten essays and complex layouts.
                </p>
              </div>
            </div>

            {/* Downloaded Vision Models */}
            {visionModels.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Downloaded Vision Models</h3>
                <div style={styles.modelGrid}>
                  {visionModels.map(model => (
                    <motion.div
                      key={model.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedModel(model)}
                      style={{
                        ...styles.modelCard,
                        ...(selectedModel?.id === model.id ? styles.modelCardSelected : {}),
                      }}
                    >
                      <div style={styles.modelInfo}>
                        <span style={styles.modelName}>{model.name}</span>
                        <span style={styles.modelSize}>{model.size}</span>
                      </div>
                      {selectedModel?.id === model.id && (
                        <Check size={20} color="#1a5f2a" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Vision Models */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Available Vision Models</h3>
              <div style={styles.modelGrid}>
                {getRecommendedVLMModels().map(modelName => {
                  const isDownloaded = visionModels.some(m => 
                    m.id === modelName || m.name.includes(modelName.split(':')[0])
                  );
                  const isPulling = pullingModel === modelName;
                  
                  return (
                    <div key={modelName} style={styles.modelCard}>
                      <div style={styles.modelInfo}>
                        <span style={styles.modelName}>{modelName}</span>
                        <span style={styles.modelSize}>
                          {isDownloaded ? 'Downloaded' : 'Vision model for OCR'}
                        </span>
                      </div>
                      {isDownloaded ? (
                        <Check size={20} color="#16a34a" />
                      ) : isPulling ? (
                        <div style={styles.progressContainer}>
                          <div style={styles.progressBar}>
                            <div style={{
                              ...styles.progressFill,
                              width: `${pullProgress}%`,
                            }} />
                          </div>
                          <span style={styles.progressText}>{pullProgress}%</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePullModel(modelName)}
                          style={styles.downloadButton}
                        >
                          <Download size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Custom Endpoints Tab */}
        {activeTab === 'custom' && (
          <div style={styles.tabContent}>
            <div style={styles.infoBox}>
              <Link size={24} color="#8b5cf6" />
              <div>
                <h3 style={styles.infoTitle}>Custom API Endpoints</h3>
                <p style={styles.infoText}>
                  Add any OpenAI-compatible API endpoint. Supports cloud services like OpenAI, 
                  Anthropic, or self-hosted solutions like vLLM, LM Studio, and more.
                </p>
              </div>
            </div>

            {/* Saved Endpoints */}
            {customEndpoints.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Configured Endpoints</h3>
                <div style={styles.endpointList}>
                  {customEndpoints.map(endpoint => (
                    <div key={endpoint.id} style={styles.endpointCard}>
                      <div style={styles.endpointInfo}>
                        <div style={styles.endpointHeader}>
                          <span style={styles.endpointName}>{endpoint.name}</span>
                          {endpoint.isVision && (
                            <span style={styles.visionBadge}>
                              <Eye size={12} /> Vision
                            </span>
                          )}
                        </div>
                        <span style={styles.endpointUrl}>{endpoint.url}</span>
                        {endpoint.model && (
                          <span style={styles.endpointModel}>Model: {endpoint.model}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveEndpoint(endpoint.id)}
                        style={styles.removeButton}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Endpoint */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Add New Endpoint</h3>
                <button
                  onClick={() => setShowAddEndpoint(!showAddEndpoint)}
                  style={styles.addButton}
                >
                  <Plus size={18} />
                  Add Endpoint
                </button>
              </div>

              {showAddEndpoint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={styles.addForm}
                >
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Name *</label>
                      <input
                        type="text"
                        value={newEndpoint.name}
                        onChange={(e) => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
                        placeholder="My OpenAI API"
                        style={styles.formInput}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Model</label>
                      <input
                        type="text"
                        value={newEndpoint.model}
                        onChange={(e) => setNewEndpoint({ ...newEndpoint, model: e.target.value })}
                        placeholder="gpt-4o"
                        style={styles.formInput}
                      />
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Base URL *</label>
                    <input
                      type="text"
                      value={newEndpoint.url}
                      onChange={(e) => setNewEndpoint({ ...newEndpoint, url: e.target.value })}
                      placeholder="https://api.openai.com/v1"
                      style={styles.formInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>API Key (optional)</label>
                    <input
                      type="password"
                      value={newEndpoint.apiKey}
                      onChange={(e) => setNewEndpoint({ ...newEndpoint, apiKey: e.target.value })}
                      placeholder="sk-..."
                      style={styles.formInput}
                    />
                  </div>

                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newEndpoint.isVision}
                      onChange={(e) => setNewEndpoint({ ...newEndpoint, isVision: e.target.checked })}
                    />
                    <span>Supports vision/images (for OCR)</span>
                  </label>

                  <div style={styles.formActions}>
                    <button
                      onClick={() => setShowAddEndpoint(false)}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddEndpoint}
                      style={styles.saveButton}
                    >
                      Save Endpoint
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button
          onClick={() => setScreen('welcome')}
          style={styles.backButton}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          onClick={() => setScreen('course-select')}
          disabled={!selectedModel}
          style={{
            ...styles.continueButton,
            ...(selectedModel ? {} : styles.continueButtonDisabled),
          }}
        >
          Continue
          <ArrowRight size={16} />
        </button>
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
  tabs: {
    display: 'flex',
    gap: '8px',
    padding: '16px 32px',
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: '#f8fafc',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabActive: {
    background: '#1a5f2a',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: '24px 32px',
    overflow: 'auto',
  },
  tabContent: {
    maxWidth: '900px',
  },
  statusCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  statusInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statusIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '2px',
  },
  statusText: {
    fontSize: '14px',
    color: '#64748b',
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
  },
  warningBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    background: '#fef3c7',
    borderRadius: '8px',
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#92400e',
    marginBottom: '4px',
  },
  warningText: {
    fontSize: '13px',
    color: '#a16207',
  },
  link: {
    color: '#1a5f2a',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  section: {
    marginBottom: '24px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '12px',
  },
  modelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  modelCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  modelCardSelected: {
    borderColor: '#1a5f2a',
    background: '#f0fdf4',
  },
  modelInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  modelName: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#1e293b',
  },
  modelSize: {
    fontSize: '12px',
    color: '#64748b',
  },
  downloadButton: {
    padding: '8px',
    background: '#1a5f2a',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  progressBar: {
    width: '80px',
    height: '6px',
    background: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#1a5f2a',
    transition: 'width 0.2s',
  },
  progressText: {
    fontSize: '12px',
    color: '#64748b',
    width: '30px',
  },
  infoBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '20px',
    background: '#eff6ff',
    borderRadius: '12px',
    marginBottom: '24px',
    border: '1px solid #bfdbfe',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1e40af',
    marginBottom: '4px',
  },
  infoText: {
    fontSize: '14px',
    color: '#3b82f6',
    lineHeight: 1.5,
  },
  endpointList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  endpointCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
  },
  endpointInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  endpointHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  endpointName: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#1e293b',
  },
  visionBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    background: '#f0fdf4',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#166534',
  },
  endpointUrl: {
    fontSize: '13px',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  endpointModel: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  removeButton: {
    padding: '8px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: '#1a5f2a',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  addForm: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e2e8f0',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748b',
    marginBottom: '6px',
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#1e293b',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '10px 20px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#64748b',
    cursor: 'pointer',
  },
  saveButton: {
    padding: '10px 20px',
    background: '#1a5f2a',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'white',
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 32px',
    background: 'white',
    borderTop: '1px solid #e2e8f0',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#64748b',
    cursor: 'pointer',
  },
  continueButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: '#1a5f2a',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'white',
    cursor: 'pointer',
  },
  continueButtonDisabled: {
    background: '#cbd5e1',
    cursor: 'not-allowed',
  },
};

export default LLMSetupScreen;
