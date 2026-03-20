import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Award,
  Trash2
} from 'lucide-react';
import { useAppStore } from '../lib/store';

const HistoryScreen: React.FC = () => {
  const { essays, setScreen, setCurrentEssay, setCurrentAssessment } = useAppStore();

  // Group essays by date
  const groupedEssays = essays.reduce((acc, essay) => {
    const date = new Date(essay.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(essay);
    return acc;
  }, {} as Record<string, typeof essays>);

  const handleViewEssay = (essay: typeof essays[0]) => {
    setCurrentEssay(essay);
    if (essay.assessment) {
      setCurrentAssessment(essay.assessment);
      setScreen('results');
    } else {
      setScreen('review');
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '4px'
            }}>
              Assessment History
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#64748b'
            }}>
              View your previous assessments
            </p>
          </div>
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
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* Essays List */}
        {essays.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
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
              <FileText size={28} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
              No Assessments Yet
            </h3>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Start a new assessment to see your history here
            </p>
            <button
              onClick={() => setScreen('upload')}
              style={{
                background: '#1a5f2a',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              New Assessment
            </button>
          </div>
        ) : (
          <div>
            {Object.entries(groupedEssays).map(([date, dateEssays]) => (
              <div key={date} style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#64748b',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Calendar size={14} />
                  {date}
                </h3>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {dateEssays.map((essay, index) => (
                    <motion.div
                      key={essay.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => handleViewEssay(essay)}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          background: essay.status === 'completed' ? '#f0fdf4' : '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FileText size={20} color={essay.status === 'completed' ? '#1a5f2a' : '#94a3b8'} />
                        </div>
                        <div>
                          <p style={{
                            fontSize: '15px',
                            fontWeight: 500,
                            color: '#1e293b',
                            marginBottom: '4px'
                          }}>
                            {essay.studentName || 'Anonymous Student'}
                          </p>
                          <p style={{ fontSize: '13px', color: '#64748b' }}>
                            {essay.wordCount} words • {essay.status === 'completed' ? 'Assessed' : 'Pending'}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {essay.assessment && (
                          <div style={{
                            background: '#f0fdf4',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <Award size={14} color="#1a5f2a" />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a5f2a' }}>
                              Band {essay.assessment.overallBand}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Delete essay logic
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#94a3b8'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default HistoryScreen;
