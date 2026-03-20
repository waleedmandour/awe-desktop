import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Image, 
  FileText,
  Camera,
  X
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { selectImage, performOCR } from '../lib/api';
import type { Essay } from '../types';
import { v4 as uuidv4 } from 'uuid';

const UploadScreen: React.FC = () => {
  const { 
    selectedCourse, 
    selectedModel,
    currentEssay,
    setCurrentEssay, 
    setScreen,
    setIsLoading,
    setError
  } = useAppStore();

  const [uploadMethod, setUploadMethod] = useState<'image' | 'text'>('image');
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');

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
    };
    reader.readAsDataURL(file);
  };

  const handleSelectImage = async () => {
    try {
      const result = await selectImage();
      if (result) {
        setPreviewImage(result.base64);
      }
    } catch (err: any) {
      setError(`Failed to select image: ${err.message}`);
    }
  };

  const handleContinue = async () => {
    if (uploadMethod === 'image' && previewImage) {
      // Process image with OCR
      setScreen('processing');
      setIsLoading(true);
      
      try {
        const ocrResult = await performOCR(previewImage);
        
        const essay: Essay = {
          id: uuidv4(),
          courseId: selectedCourse?.id || '',
          studentName,
          studentId,
          text: ocrResult.text,
          wordCount: ocrResult.text.split(/\s+/).length,
          status: 'pending',
          imageUrl: previewImage,
          createdAt: new Date()
        };
        
        setCurrentEssay(essay);
        setScreen('review');
      } catch (err: any) {
        setError(`OCR failed: ${err.message}`);
        setScreen('upload');
      } finally {
        setIsLoading(false);
      }
    } else if (uploadMethod === 'text' && textInput.trim()) {
      const essay: Essay = {
        id: uuidv4(),
        courseId: selectedCourse?.id || '',
        studentName,
        studentId,
        text: textInput.trim(),
        wordCount: textInput.trim().split(/\s+/).length,
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
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            Upload Essay
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b'
          }}>
            Upload an image or paste the essay text for assessment
          </p>
        </div>

        {/* Student Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              color: '#64748b',
              marginBottom: '6px'
            }}>
              Student Name (Optional)
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter student name"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            />
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              color: '#64748b',
              marginBottom: '6px'
            }}>
              Student ID (Optional)
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter student ID"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            />
          </div>
        </div>

        {/* Upload Method Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setUploadMethod('image')}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: uploadMethod === 'image' ? '#1a5f2a' : 'white',
              color: uploadMethod === 'image' ? 'white' : '#64748b',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Image size={18} />
            Upload Image
          </button>
          <button
            onClick={() => setUploadMethod('text')}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: uploadMethod === 'text' ? '#1a5f2a' : 'white',
              color: uploadMethod === 'text' ? 'white' : '#64748b',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <FileText size={18} />
            Paste Text
          </button>
        </div>

        {/* Upload Area */}
        {uploadMethod === 'image' ? (
          <div style={{ marginBottom: '24px' }}>
            {!previewImage ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleSelectImage}
                style={{
                  background: dragActive ? '#f0fdf4' : 'white',
                  border: `2px dashed ${dragActive ? '#1a5f2a' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '48px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Upload size={28} color="#64748b" />
                </div>
                <p style={{ fontSize: '16px', fontWeight: 500, color: '#1e293b', marginBottom: '8px' }}>
                  Drop your image here or click to browse
                </p>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Supports JPG, PNG, BMP, TIFF
                </p>
              </div>
            ) : (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                    Preview
                  </span>
                  <button
                    onClick={() => setPreviewImage(null)}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      color: '#64748b'
                    }}
                  >
                    <X size={14} />
                    Remove
                  </button>
                </div>
                <img
                  src={previewImage}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste the essay text here..."
              style={{
                width: '100%',
                minHeight: '400px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '14px',
                lineHeight: 1.6,
                resize: 'vertical',
                background: 'white'
              }}
            />
            <p style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#94a3b8',
              textAlign: 'right'
            }}>
              Word count: {textInput.trim().split(/\s+/).filter(Boolean).length}
            </p>
          </div>
        )}

        {/* Model Info */}
        {selectedModel && (
          <div style={{
            background: '#f0fdf4',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '14px', color: '#166534' }}>
              Using model: <strong>{selectedModel.name}</strong>
            </span>
          </div>
        )}

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setScreen('course-select')}
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
            disabled={!canContinue}
            style={{
              background: canContinue ? '#1a5f2a' : '#cbd5e1',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'white',
              cursor: canContinue ? 'pointer' : 'not-allowed',
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

export default UploadScreen;
