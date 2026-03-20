import React from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  RotateCcw, 
  Home,
  CheckCircle,
  TrendingUp,
  Lightbulb,
  Award,
  Printer
} from 'lucide-react';
import { useAppStore } from '../lib/store';

const ResultsScreen: React.FC = () => {
  const { 
    currentAssessment, 
    currentEssay,
    selectedCourse,
    setScreen,
    resetAssessment
  } = useAppStore();

  if (!currentAssessment) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <p>No assessment results available</p>
          <button onClick={() => setScreen('upload')} style={styles.primaryButton}>
            Start New Assessment
          </button>
        </div>
      </div>
    );
  }

  const getBandColor = (score: number) => {
    if (score >= 7) return '#10b981';
    if (score >= 5) return '#f59e0b';
    return '#ef4444';
  };

  const getBandBackground = (score: number) => {
    if (score >= 7) return '#f0fdf4';
    if (score >= 5) return '#fef3c7';
    return '#fef2f2';
  };

  const handleExport = () => {
    const report = generateTextReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-${currentEssay?.studentName || 'essay'}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const generateTextReport = () => {
    return `
================================================================================
                          AWE DESKTOP - ASSESSMENT REPORT
================================================================================

Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Time: ${new Date().toLocaleTimeString()}

--------------------------------------------------------------------------------
                              STUDENT INFORMATION
--------------------------------------------------------------------------------
Name: ${currentEssay?.studentName || 'Not specified'}
ID: ${currentEssay?.studentId || 'Not specified'}
Course: ${selectedCourse?.name || 'Not specified'} (${selectedCourse?.code || ''})

--------------------------------------------------------------------------------
                              ASSESSMENT SUMMARY
--------------------------------------------------------------------------------
Word Count: ${currentAssessment.wordCount}
Overall Band: ${currentAssessment.overallBand}

CRITERIA SCORES:
${currentAssessment.criteria.map(c => 
  `  • ${c.name.padEnd(22)} Band ${c.band} (${c.score}/${c.maxScore})`
).join('\n')}

--------------------------------------------------------------------------------
                              DETAILED FEEDBACK
--------------------------------------------------------------------------------

${currentAssessment.criteria.map(c => `
${c.name.toUpperCase()}
${'─'.repeat(50)}
Band: ${c.band}
Score: ${c.score}/${c.maxScore}

Feedback:
${c.feedback}
`).join('\n')}

--------------------------------------------------------------------------------
                                  ANALYSIS
--------------------------------------------------------------------------------

STRENGTHS:
${currentAssessment.strengths.map(s => `  ✓ ${s}`).join('\n')}

AREAS FOR IMPROVEMENT:
${currentAssessment.improvements.map(i => `  • ${i}`).join('\n')}

SUGGESTIONS:
${currentAssessment.suggestions.map(s => `  → ${s}`).join('\n')}

--------------------------------------------------------------------------------
                              TECHNICAL DETAILS
--------------------------------------------------------------------------------
Model: ${currentAssessment.llmModel}
Provider: ${currentAssessment.llmProvider}
Processing Time: ${Math.round(currentAssessment.processingTime / 1000)} seconds

================================================================================
                    Developed by Dr. Waleed Mandour, 2026
                    Center for Preparatory Studies
                    Sultan Qaboos University
================================================================================
    `;
  };

  return (
    <div style={styles.container}>
      {/* Header with Score */}
      <div style={styles.headerSection}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Assessment Complete</h1>
            <p style={styles.subtitle}>
              {selectedCourse?.name} • {currentEssay?.studentName || 'Anonymous'}
            </p>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            style={styles.scoreCard}
          >
            <div style={styles.scoreHeader}>Overall Band</div>
            <div style={styles.scoreValue}>{currentAssessment.overallBand}</div>
            <div style={styles.scoreSubtext}>IELTS Scale</div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Criteria Scores Row */}
        <div style={styles.criteriaRow}>
          {currentAssessment.criteria.map((criterion, index) => (
            <motion.div
              key={criterion.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              style={styles.criteriaCard}
            >
              <div style={styles.criteriaHeader}>
                <span style={styles.criteriaName}>{criterion.name}</span>
                <span style={{
                  ...styles.criteriaBand,
                  background: getBandBackground(criterion.score),
                  color: getBandColor(criterion.score),
                }}>
                  Band {criterion.band}
                </span>
              </div>
              <div style={styles.criteriaScoreRow}>
                <span style={{
                  ...styles.criteriaScore,
                  color: getBandColor(criterion.score),
                }}>
                  {criterion.score.toFixed(1)}
                </span>
                <span style={styles.criteriaMax}>/ {criterion.maxScore}</span>
              </div>
              <div style={styles.criteriaBar}>
                <div style={{
                  ...styles.criteriaBarFill,
                  width: `${(criterion.score / criterion.maxScore) * 100}%`,
                  background: getBandColor(criterion.score),
                }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div style={styles.twoColumns}>
          {/* Left Column - Detailed Feedback */}
          <div style={styles.feedbackColumn}>
            <h2 style={styles.sectionTitle}>Detailed Feedback</h2>
            {currentAssessment.criteria.map((criterion, index) => (
              <motion.div
                key={criterion.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                style={styles.feedbackCard}
              >
                <div style={styles.feedbackHeader}>
                  <h3 style={styles.feedbackTitle}>{criterion.name}</h3>
                  <span style={{
                    ...styles.feedbackBadge,
                    background: getBandBackground(criterion.score),
                    color: getBandColor(criterion.score),
                  }}>
                    {criterion.band}
                  </span>
                </div>
                <p style={styles.feedbackText}>{criterion.feedback}</p>
              </motion.div>
            ))}
          </div>

          {/* Right Column - Analysis */}
          <div style={styles.analysisColumn}>
            {/* Strengths */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              style={{ ...styles.analysisCard, borderLeftColor: '#10b981' }}
            >
              <div style={styles.analysisHeader}>
                <CheckCircle size={20} color="#10b981" />
                <h3 style={{ ...styles.analysisTitle, color: '#166534' }}>Strengths</h3>
              </div>
              <ul style={styles.analysisList}>
                {currentAssessment.strengths.map((item, i) => (
                  <li key={i} style={styles.analysisItem}>{item}</li>
                ))}
              </ul>
            </motion.div>

            {/* Improvements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              style={{ ...styles.analysisCard, borderLeftColor: '#f59e0b' }}
            >
              <div style={styles.analysisHeader}>
                <TrendingUp size={20} color="#f59e0b" />
                <h3 style={{ ...styles.analysisTitle, color: '#92400e' }}>Areas for Improvement</h3>
              </div>
              <ul style={styles.analysisList}>
                {currentAssessment.improvements.map((item, i) => (
                  <li key={i} style={styles.analysisItem}>{item}</li>
                ))}
              </ul>
            </motion.div>

            {/* Suggestions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              style={{ ...styles.analysisCard, borderLeftColor: '#3b82f6' }}
            >
              <div style={styles.analysisHeader}>
                <Lightbulb size={20} color="#3b82f6" />
                <h3 style={{ ...styles.analysisTitle, color: '#1e40af' }}>Suggestions</h3>
              </div>
              <ul style={styles.analysisList}>
                {currentAssessment.suggestions.map((item, i) => (
                  <li key={i} style={styles.analysisItem}>{item}</li>
                ))}
              </ul>
            </motion.div>

            {/* Technical Info */}
            <div style={styles.techInfo}>
              <Award size={16} />
              <span>
                Assessed by {currentAssessment.llmModel} in {Math.round(currentAssessment.processingTime / 1000)}s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button
          onClick={() => {
            resetAssessment();
            setScreen('welcome');
          }}
          style={styles.secondaryButton}
        >
          <Home size={16} />
          Home
        </button>
        <div style={styles.footerActions}>
          <button
            onClick={() => setScreen('upload')}
            style={styles.tertiaryButton}
          >
            <RotateCcw size={16} />
            New Assessment
          </button>
          <button
            onClick={handleExport}
            style={styles.primaryButton}
          >
            <Download size={16} />
            Export Report
          </button>
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
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  headerSection: {
    background: 'linear-gradient(135deg, #1a5f2a 0%, #0d3318 100%)',
    padding: '32px 40px',
    color: 'white',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '15px',
    opacity: 0.8,
  },
  scoreCard: {
    background: '#c9a227',
    borderRadius: '16px',
    padding: '20px 32px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  scoreHeader: {
    fontSize: '13px',
    opacity: 0.9,
    marginBottom: '4px',
  },
  scoreValue: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1,
  },
  scoreSubtext: {
    fontSize: '12px',
    opacity: 0.8,
    marginTop: '4px',
  },
  mainContent: {
    flex: 1,
    padding: '32px 40px',
    overflow: 'auto',
  },
  criteriaRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    maxWidth: '1200px',
    margin: '0 auto 32px',
  },
  criteriaCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #f1f5f9',
  },
  criteriaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  criteriaName: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748b',
  },
  criteriaBand: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  },
  criteriaScoreRow: {
    marginBottom: '12px',
  },
  criteriaScore: {
    fontSize: '32px',
    fontWeight: 700,
  },
  criteriaMax: {
    fontSize: '16px',
    color: '#94a3b8',
  },
  criteriaBar: {
    height: '6px',
    background: '#f1f5f9',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  criteriaBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },
  twoColumns: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  feedbackColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '16px',
  },
  feedbackCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #f1f5f9',
  },
  feedbackHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  feedbackTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1e293b',
  },
  feedbackBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 600,
  },
  feedbackText: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: 1.6,
  },
  analysisColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  analysisCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    borderLeft: '4px solid',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  analysisHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  analysisTitle: {
    fontSize: '15px',
    fontWeight: 600,
  },
  analysisList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  analysisItem: {
    fontSize: '13px',
    color: '#64748b',
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9',
    lineHeight: 1.5,
  },
  techInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    background: '#f8fafc',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#94a3b8',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    background: 'white',
    borderTop: '1px solid #e2e8f0',
  },
  footerActions: {
    display: 'flex',
    gap: '12px',
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#1a5f2a',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'white',
    cursor: 'pointer',
  },
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#64748b',
    cursor: 'pointer',
  },
  tertiaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#64748b',
    cursor: 'pointer',
  },
};

export default ResultsScreen;
