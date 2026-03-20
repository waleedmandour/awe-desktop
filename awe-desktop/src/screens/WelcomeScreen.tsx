import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Upload, 
  History, 
  Settings,
  FileText,
  Brain,
  Eye,
  CheckCircle,
  Zap,
  Database
} from 'lucide-react';
import { useAppStore } from '../lib/store';

const WelcomeScreen: React.FC = () => {
  const { 
    systemInfo, 
    selectedModel, 
    selectedProvider,
    setScreen 
  } = useAppStore();

  const features = [
    {
      icon: <Eye size={24} />,
      title: 'Vision LLM OCR',
      description: 'Transcribe handwritten scripts using LLaVA or Moondream vision models',
      color: '#3b82f6',
    },
    {
      icon: <Brain size={24} />,
      title: 'AI Assessment',
      description: 'Evaluate essays using local LLMs like Llama 3, Mistral, or GPT-4',
      color: '#8b5cf6',
    },
    {
      icon: <Database size={24} />,
      title: 'Custom Endpoints',
      description: 'Connect to any OpenAI-compatible API for LLM and VLM services',
      color: '#10b981',
    },
  ];

  const quickActions = [
    {
      icon: <Upload size={20} />,
      label: 'New Assessment',
      description: 'Upload an essay image or text',
      screen: 'upload',
      primary: true,
    },
    {
      icon: <History size={20} />,
      label: 'View History',
      description: 'Review past assessments',
      screen: 'history',
      primary: false,
    },
    {
      icon: <Settings size={20} />,
      label: 'Configure LLM',
      description: 'Set up your AI models',
      screen: 'llm-setup',
      primary: false,
    },
  ];

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.heroSection}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={styles.heroContent}
        >
          <div style={styles.logoLarge}>📝</div>
          <h1 style={styles.heroTitle}>AWE Desktop</h1>
          <p style={styles.heroSubtitle}>
            Automated Writing Evaluation System
          </p>
          <div style={styles.heroInstitution}>
            <span style={styles.heroInstitutionMain}>Center for Preparatory Studies</span>
            <span style={styles.heroInstitutionSub}>Sultan Qaboos University</span>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Features */}
        <div style={styles.featuresSection}>
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
              style={styles.featureCard}
            >
              <div style={{
                ...styles.featureIcon,
                backgroundColor: `${feature.color}15`,
                color: feature.color,
              }}>
                {feature.icon}
              </div>
              <div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDescription}>{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div style={styles.twoColumns}>
          {/* Quick Actions */}
          <div style={styles.quickActionsSection}>
            <h2 style={styles.sectionTitle}>Quick Actions</h2>
            <div style={styles.quickActions}>
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setScreen(action.screen as any)}
                  style={{
                    ...styles.quickActionButton,
                    ...(action.primary ? styles.quickActionPrimary : {}),
                  }}
                >
                  <span style={{
                    ...styles.quickActionIcon,
                    ...(action.primary ? styles.quickActionIconPrimary : {}),
                  }}>
                    {action.icon}
                  </span>
                  <div style={styles.quickActionContent}>
                    <span style={{
                      ...styles.quickActionLabel,
                      ...(action.primary ? styles.quickActionLabelPrimary : {}),
                    }}>
                      {action.label}
                    </span>
                    <span style={styles.quickActionDesc}>{action.description}</span>
                  </div>
                  <ArrowRight size={18} style={{
                    marginLeft: 'auto',
                    color: action.primary ? 'white' : '#94a3b8',
                  }} />
                </motion.button>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div style={styles.systemSection}>
            <h2 style={styles.sectionTitle}>System Status</h2>
            
            <div style={styles.systemCard}>
              {/* System Info */}
              <div style={styles.systemInfoRow}>
                <span style={styles.systemLabel}>Platform</span>
                <span style={styles.systemValue}>
                  {systemInfo?.platform || 'Windows'} ({systemInfo?.arch || 'x64'})
                </span>
              </div>
              <div style={styles.systemInfoRow}>
                <span style={styles.systemLabel}>Memory</span>
                <span style={styles.systemValue}>
                  {systemInfo?.totalMemoryGB || 16} GB
                </span>
              </div>
              <div style={styles.systemInfoRow}>
                <span style={styles.systemLabel}>CPU Cores</span>
                <span style={styles.systemValue}>
                  {systemInfo?.cpuCores || 8}
                </span>
              </div>
              <div style={styles.systemInfoRow}>
                <span style={styles.systemLabel}>GPU</span>
                <span style={styles.systemValue}>
                  {systemInfo?.gpu || 'Not detected'}
                </span>
              </div>
            </div>

            {/* LLM Status */}
            <div style={styles.llmStatusCard}>
              <div style={styles.llmStatusHeader}>
                <Zap size={16} color={selectedModel ? '#10b981' : '#94a3b8'} />
                <span style={styles.llmStatusLabel}>Active Model</span>
              </div>
              {selectedModel ? (
                <div style={styles.llmStatusValue}>
                  <CheckCircle size={16} color="#10b981" />
                  <span>{selectedModel.name}</span>
                </div>
              ) : (
                <div style={styles.llmStatusEmpty}>
                  <span>No model configured</span>
                  <button
                    onClick={() => setScreen('llm-setup')}
                    style={styles.configureButton}
                  >
                    Configure
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={styles.footer}
        >
          <span style={styles.footerText}>
            Developed by Dr. Waleed Mandour, 2026
          </span>
        </motion.div>
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
    overflow: 'auto',
  },
  heroSection: {
    background: 'linear-gradient(135deg, #1a5f2a 0%, #0d3318 100%)',
    padding: '48px 48px',
    display: 'flex',
    justifyContent: 'center',
  },
  heroContent: {
    textAlign: 'center',
    maxWidth: '600px',
  },
  logoLarge: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  heroTitle: {
    fontSize: '40px',
    fontWeight: 700,
    color: 'white',
    marginBottom: '8px',
    letterSpacing: '-1px',
  },
  heroSubtitle: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: '20px',
  },
  heroInstitution: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  heroInstitutionMain: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#c9a227',
  },
  heroInstitutionSub: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
  },
  mainContent: {
    flex: 1,
    padding: '32px 48px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  featuresSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '32px',
  },
  featureCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #f1f5f9',
  },
  featureIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '4px',
  },
  featureDescription: {
    fontSize: '13px',
    color: '#64748b',
    lineHeight: 1.5,
  },
  twoColumns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
  },
  quickActionsSection: {
    // No additional styles
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '16px',
  },
  quickActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  quickActionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  quickActionPrimary: {
    background: 'linear-gradient(135deg, #1a5f2a 0%, #2a8f42 100%)',
    border: 'none',
  },
  quickActionIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
  },
  quickActionIconPrimary: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
  },
  quickActionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  quickActionLabel: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1e293b',
  },
  quickActionLabelPrimary: {
    color: 'white',
  },
  quickActionDesc: {
    fontSize: '13px',
    color: '#64748b',
  },
  systemSection: {
    // No additional styles
  },
  systemCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    marginBottom: '16px',
  },
  systemInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  systemLabel: {
    fontSize: '14px',
    color: '#64748b',
  },
  systemValue: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1e293b',
  },
  llmStatusCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  llmStatusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  llmStatusLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#64748b',
  },
  llmStatusValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '15px',
    fontWeight: 500,
    color: '#1e293b',
  },
  llmStatusEmpty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  configureButton: {
    background: '#1a5f2a',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center',
    paddingTop: '24px',
    borderTop: '1px solid #e2e8f0',
  },
  footerText: {
    fontSize: '13px',
    color: '#94a3b8',
  },
};

export default WelcomeScreen;
