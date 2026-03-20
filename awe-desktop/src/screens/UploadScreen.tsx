import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Image, 
  FileText,
  Eye,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { performOCR, selectImage } from '../lib/api';
import type { Essay } from '../types';
import { v4 as uuidv4 } from 'uuid';

const UploadScreen: React.FC = () => {
  const { 
    selectedModel,
    selectedVisionModel,
    ocrConfig,
    setOCRConfig,
    setCurrentEssay, 
    setScreen,
    setIsLoading,
    setError
  } = useAppStore();

  const [uploadMethod, setUploadMethod] = useState<'image' | 'text'>('image');
  const [ocrMethod, setOCRMethod] = useState<'auto' | 'tesseract' | 'vision-llm'>('auto');
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
      setOcrStatus('idle');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectImage = async () => {
    try {
      const result = await selectImage();
      if (result) {
        setPreviewImage(result.base64);
        setOcrStatus('idle');
      }
    } catch (err: any) {
      setError(`Failed to select image: ${err.message}`);
    }
  };

  const handleOCRAndContinue = async () => {
    if (uploadMethod === 'image' && previewImage) {
      setScreen('processing');
      setIsLoading(true, 'Extracting text from image...');
      setOcrStatus('processing');
      
      try {
        const ocrResult = await performOCR({
          image: previewImage,
          provider: ocrMethod,
          visionModel: selectedVisionModel?.id || 'llava:7b',
          language: ocrConfig.language
        });
        
        const essay: Essay = {
          id: uuidv4(),
          courseId: '',
          studentName,
          studentId,
          text: ocrResult.text,
          wordCount: ocrResult.text.split(/\s+/).filter(Boolean).length,
          status: 'pending',
          imageUrl: previewImage,
          ocrMethod: ocrResult.method,
          createdAt: new Date()
        };
        
        setCurrentEssay(essay);
        setOcrStatus('done');
        setScreen('review');
      } catch (err: any) {
        setOcrStatus('error');
        setError(`OCR failed: ${err.message}`);
        setScreen('upload');
      } finally {
        setIsLoading(false);
      }
    } else if (uploadMethod === 'text' && textInput.trim()) {
      const essay: Essay = {
        id: uuidv4(),
        courseId: '',
        studentName,
        studentId,
        text: textInput.trim(),
        wordCount: textInput.trim().split(/\s+/).filter(Boolean).length,
        status: 'pending',
        createdAt: new Date()
      };
      
      setCurrentEssay(essay);
      setScreen('review');
    } else {
      setError('Please provide essay content to continue');
    }
  };

  const canContinue = (uploadMethod === 'image' && previewImage) || 
                      (uploadMethod === 'text' && textInput.trim().length > 50);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>New Assessment</h1>
        <p style={styles.subtitle}>
          Upload an essay image or paste text for AI-powered evaluation
        </p>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        <div style={styles.mainGrid}>
          {/* Left Column - Upload Area */}
          <div style={styles.leftColumn}>
            {/* Student Info */}
            <div style={styles.studentInfoSection}>
              <h3 style={styles.sectionTitle}>Student Information</h3>
              <div style={styles.studentInfoGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Student Name</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Optional"
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Student ID</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Optional"
                    style={styles.formInput}
                  />
                </div>
              </div>
            </div>

            {/* Upload Method Tabs */}
            <div style={styles.uploadTabs}>
              <button
                onClick={() => setUploadMethod('image')}
                style={{
                  ...styles.uploadTab,
                  ...(uploadMethod === 'image' ? styles.uploadTabActive : {}),
                }}
              >
                <Image size={18} />
                Upload Image
              </button>
              <button
                onClick={() => setUploadMethod('text')}
                style={{
                  ...styles.uploadTab,
                  ...(uploadMethod === 'text' ? styles.uploadTabActive : {}),
                }}
              >
                <FileText size={18} />
                Paste Text
              </button>
            </div>

            {/* Upload Area */}
            {uploadMethod === 'image' ? (
              <div style={styles.uploadArea}>
                {!previewImage ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={handleSelectImage}
                    style={{
                      ...styles.dropZone,
                      ...(dragActive ? styles.dropZoneActive : {}),
                    }}
                  >
                    <Upload size={48} color="#94a3b8" />
                    <p style={styles.dropZoneTitle}>
                      Drop your image here or click to browse
                    </p>
                    <p style={styles.dropZoneSubtitle}>
                      Supports JPG, PNG, BMP, TIFF
                    </p>
                    <div style={styles.dropZoneHint}>
                      <Eye size={16} />
                      <span>Vision LLM can read handwritten essays</span>
                    </div>
                  </div>
                ) : (
                  <div style={styles.previewContainer}>
                    <img
                      src={previewImage}
                      alt="Preview"
                      style={styles.previewImage}
                    />
                    <div style={styles.previewActions}>
                      <button
                        onClick={() => {
                          setPreviewImage(null);
                          setOcrStatus('idle');
                        }}
                        style={styles.removeButton}
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.textAreaContainer}>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste the essay text here..."
                  style={styles.textArea}
                />
                <div style={styles.textAreaFooter}>
                  <span style={styles.wordCount}>
                    {textInput.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - OCR Settings */}
          {uploadMethod === 'image' && (
            <div style={styles.rightColumn}>
              <div style={styles.settingsCard}>
                <h3 style={styles.sectionTitle}>
                  <Settings size={18} />
                  OCR Settings
                </h3>

                {/* OCR Method Selection */}
                <div style={styles.ocrMethodSection}>
                  <label style={styles.formLabel}>OCR Method</label>
                  <div style={styles.ocrMethodOptions}>
                    <button
                      onClick={() => setOCRMethod('auto')}
                      style={{
                        ...styles.ocrMethodButton,
                        ...(ocrMethod === 'auto' ? styles.ocrMethodButtonActive : {}),
                      }}
                    >
                      <CheckCircle size={16} />
                      Auto (Recommended)
                      <span style={styles.ocrMethodDesc}>
                        Vision LLM first, fallback to Tesseract
                      </span>
                    </button>
                    <button
                      onClick={() => setOCRMethod('vision-llm')}
                      style={{
                        ...styles.ocrMethodButton,
                        ...(ocrMethod === 'vision-llm' ? styles.ocrMethodButtonActive : {}),
                      }}
                    >
                      <Eye size={16} />
                      Vision LLM Only
                      <span style={styles.ocrMethodDesc}>
                        Best for handwriting using LLaVA
                      </span>
                    </button>
                    <button
                      onClick={() => setOCRMethod('tesseract')}
                      style={{
                        ...styles.ocrMethodButton,
                        ...(ocrMethod === 'tesseract' ? styles.ocrMethodButtonActive : {}),
                      }}
                    >
                      <FileText size={16} />
                      Tesseract Only
                      <span style={styles.ocrMethodDesc}>
                        Fast, good for printed text
                      </span>
                    </button>
                  </div>
                </div>

                {/* Language Selection */}
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Language</label>
                  <select
                    value={ocrConfig.language}
                    onChange={(e) => setOCRConfig({ ...ocrConfig, language: e.target.value })}
                    style={styles.formSelect}
                  >
                    <option value="eng">English</option>
                    <option value="ara">Arabic</option>
                    <option value="eng+ara">English + Arabic</option>
                    <option value="fra">French</option>
                    <option value="deu">German</option>
                  </select>
                </div>

                {/* Vision Model Status */}
                {(ocrMethod === 'auto' || ocrMethod === 'vision-llm') && (
                  <div style={styles.modelStatusCard}>
                    <div style={styles.modelStatusHeader}>
                      <Eye size={16} />
                      <span>Vision Model</span>
                    </div>
                    {selectedVisionModel ? (
                      <div style={styles.modelStatusAvailable}>
                        <CheckCircle size={16} color="#10b981" />
                        <span>{selectedVisionModel.name}</span>
                      </div>
                    ) : (
                      <div style={styles.modelStatusUnavailable}>
                        <AlertCircle size={16} color="#f59e0b" />
                        <span>No vision model configured</span>
                        <button
                          onClick={() => setScreen('llm-setup')}
                          style={styles.configureLink}
                        >
                          Configure
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Assessment Model */}
                <div style={styles.modelStatusCard}>
                  <div style={styles.modelStatusHeader}>
                    <span>📋</span>
                    <span>Assessment Model</span>
                  </div>
                  {selectedModel ? (
                    <div style={styles.modelStatusAvailable}>
                      <CheckCircle size={16} color="#10b981" />
                      <span>{selectedModel.name}</span>
                    </div>
                  ) : (
                    <div style={styles.modelStatusUnavailable}>
                      <AlertCircle size={16} color="#f59e0b" />
                      <span>No model selected</span>
                      <button
                        onClick={() => setScreen('llm-setup')}
                        style={styles.configureLink}
                      >
                        Configure
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
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
          onClick={handleOCRAndContinue}
          disabled={!canContinue}
          style={{
            ...styles.continueButton,
            ...(canContinue ? {} : styles.continueButtonDisabled),
          }}
        >
          {uploadMethod === 'image' ? 'Extract Text & Continue' : 'Continue'}
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
  content: {
    flex: 1,
    padding: '24px 32px',
    overflow: 'auto',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: '24px',
    maxWidth: '1200px',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  studentInfoSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  studentInfoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748b',
  },
  formInput: {
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    background: '#f8fafc',
  },
  formSelect: {
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    background: 'white',
    cursor: 'pointer',
  },
  uploadTabs: {
    display: 'flex',
    gap: '8px',
  },
  uploadTab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  uploadTabActive: {
    borderColor: '#1a5f2a',
    color: '#1a5f2a',
    background: '#f0fdf4',
  },
  uploadArea: {
    flex: 1,
    minHeight: '300px',
  },
  dropZone: {
    height: '100%',
    minHeight: '300px',
    border: '2px dashed #e2e8f0',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    background: 'white',
  },
  dropZoneActive: {
    borderColor: '#1a5f2a',
    background: '#f0fdf4',
  },
  dropZoneTitle: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#1e293b',
    marginTop: '16px',
  },
  dropZoneSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
  },
  dropZoneHint: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '16px',
    padding: '8px 12px',
    background: '#eff6ff',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#3b82f6',
  },
  previewContainer: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'contain',
    background: '#f8fafc',
  },
  previewActions: {
    padding: '12px 16px',
    borderTop: '1px solid #e2e8f0',
  },
  removeButton: {
    padding: '8px 16px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
  },
  textAreaContainer: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  textArea: {
    width: '100%',
    minHeight: '300px',
    padding: '16px',
    border: 'none',
    fontSize: '14px',
    lineHeight: 1.6,
    resize: 'vertical',
    outline: 'none',
  },
  textAreaFooter: {
    padding: '12px 16px',
    borderTop: '1px solid #e2e8f0',
    textAlign: 'right',
  },
  wordCount: {
    fontSize: '13px',
    color: '#64748b',
  },
  settingsCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  ocrMethodSection: {
    marginBottom: '20px',
  },
  ocrMethodOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  ocrMethodButton: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px',
    background: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#64748b',
    transition: 'all 0.15s ease',
  },
  ocrMethodButtonActive: {
    borderColor: '#1a5f2a',
    color: '#1a5f2a',
    background: '#f0fdf4',
  },
  ocrMethodDesc: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 400,
    color: '#94a3b8',
    marginTop: '2px',
    marginLeft: '26px',
  },
  modelStatusCard: {
    padding: '12px',
    background: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  modelStatusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '8px',
  },
  modelStatusAvailable: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1e293b',
  },
  modelStatusUnavailable: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#64748b',
  },
  configureLink: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: '#1a5f2a',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'underline',
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
    padding: '10px 24px',
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

export default UploadScreen;
