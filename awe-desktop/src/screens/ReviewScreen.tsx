import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Edit3,
  Check,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../lib/store';

const ReviewScreen: React.FC = () => {
  const { currentEssay, setCurrentEssay, setScreen } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(currentEssay?.text || '');

  if (!currentEssay) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p>No essay to review</p>
      </div>
    );
  }

  const wordCount = editedText.trim().split(/\s+/).filter(Boolean).length;
  const paragraphCount = editedText.split(/\n\n+/).filter(p => p.trim()).length;

  const handleSaveEdit = () => {
    setCurrentEssay({
      ...currentEssay,
      text: editedText,
      wordCount
    });
    setIsEditing(false);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px 40px',
        background: 'white',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '4px'
            }}>
              Review Extracted Text
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#64748b'
            }}>
              Please review and edit the extracted text before assessment
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{
              background: '#f1f5f9',
              padding: '8px 16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '20px', fontWeight: 600, color: '#1e293b' }}>
                {wordCount}
              </p>
              <p style={{ fontSize: '11px', color: '#64748b' }}>Words</p>
            </div>
            <div style={{
              background: '#f1f5f9',
              padding: '8px 16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '20px', fontWeight: 600, color: '#1e293b' }}>
                {paragraphCount}
              </p>
              <p style={{ fontSize: '11px', color: '#64748b' }}>Paragraphs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '24px 40px',
        overflow: 'auto'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}
        >
          {/* Toolbar */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentEssay.studentName && (
                <span style={{
                  background: '#f0fdf4',
                  color: '#166534',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {currentEssay.studentName}
                </span>
              )}
              {currentEssay.studentId && (
                <span style={{
                  background: '#f1f5f9',
                  color: '#64748b',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  ID: {currentEssay.studentId}
                </span>
              )}
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
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
                <Edit3 size={14} />
                Edit Text
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setEditedText(currentEssay.text);
                    setIsEditing(false);
                  }}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#64748b'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
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
                  <Check size={14} />
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Text Content */}
          <div style={{ padding: '24px' }}>
            {isEditing ? (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '400px',
                  border: 'none',
                  fontSize: '15px',
                  lineHeight: 1.8,
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            ) : (
              <div style={{
                fontSize: '15px',
                lineHeight: 1.8,
                color: '#1e293b',
                whiteSpace: 'pre-wrap'
              }}>
                {currentEssay.text}
              </div>
            )}
          </div>
        </motion.div>

        {/* OCR Warning */}
        {currentEssay.imageUrl && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: '#fef3c7',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertCircle size={20} color="#f59e0b" />
            <p style={{ fontSize: '13px', color: '#92400e' }}>
              Text was extracted from an image. Please verify accuracy and correct any OCR errors.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 40px',
        background: 'white',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setScreen('upload')}
          style={{
            background: 'transparent',
            border: '1px solid #e2e8f0',
            padding: '10px 20px',
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
          onClick={() => setScreen('assessment')}
          style={{
            background: '#1a5f2a',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Start Assessment
          <ArrowRight size={16} />
        </motion.button>
      </div>
    </div>
  );
};

export default ReviewScreen;
