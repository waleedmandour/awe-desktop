import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft,
  Cpu,
  HardDrive,
  MemoryStick,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import type { SystemInfo } from '../types';

interface Requirement {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  warning?: boolean;
  value: string;
  required: string;
}

const SetupScreen: React.FC = () => {
  const { systemInfo, setScreen } = useAppStore();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [allPassed, setAllPassed] = useState(false);
  const [hasWarnings, setHasWarnings] = useState(false);

  useEffect(() => {
    if (systemInfo) {
      checkRequirements(systemInfo);
    }
  }, [systemInfo]);

  const checkRequirements = (info: SystemInfo) => {
    const reqs: Requirement[] = [
      {
        id: 'os',
        name: 'Operating System',
        description: 'Windows 10 or later recommended',
        passed: info.platform === 'win32' || info.platform === 'darwin',
        value: info.platform === 'win32' ? 'Windows' : info.platform === 'darwin' ? 'macOS' : 'Linux',
        required: 'Windows 10+ / macOS 10.15+'
      },
      {
        id: 'ram',
        name: 'RAM',
        description: 'Minimum 8GB for optimal performance',
        passed: info.totalMemoryGB >= 8,
        warning: info.totalMemoryGB >= 4 && info.totalMemoryGB < 8,
        value: `${info.totalMemoryGB} GB`,
        required: '8 GB (4 GB minimum)'
      },
      {
        id: 'cpu',
        name: 'CPU Cores',
        description: 'Multi-core processor recommended',
        passed: info.cpuCores >= 4,
        warning: info.cpuCores >= 2 && info.cpuCores < 4,
        value: `${info.cpuCores} Cores`,
        required: '4+ Cores'
      },
      {
        id: 'storage',
        name: 'Free Storage',
        description: 'Space for LLM models (varies by model)',
        passed: info.freeMemoryGB >= 10,
        warning: info.freeMemoryGB >= 5 && info.freeMemoryGB < 10,
        value: `${info.freeMemoryGB} GB`,
        required: '10 GB+ recommended'
      }
    ];

    setRequirements(reqs);
    setAllPassed(reqs.every(r => r.passed));
    setHasWarnings(reqs.some(r => r.warning));
  };

  const getStatusIcon = (req: Requirement) => {
    if (req.passed && !req.warning) {
      return <CheckCircle size={24} color="#10b981" />;
    } else if (req.warning) {
      return <AlertTriangle size={24} color="#f59e0b" />;
    } else {
      return <XCircle size={24} color="#ef4444" />;
    }
  };

  const getRecommendedLLM = () => {
    if (!systemInfo?.llmRecommendation) return null;
    return systemInfo.llmRecommendation;
  };

  const recommendation = getRecommendedLLM();

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
          maxWidth: '800px',
          margin: 'auto',
          padding: '40px'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            System Compatibility
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b'
          }}>
            Checking your system for optimal performance
          </p>
        </div>

        {/* Requirements Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {requirements.map((req, index) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                {getStatusIcon(req)}
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1e293b',
                    marginBottom: '4px'
                  }}>
                    {req.name}
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '8px'
                  }}>
                    {req.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px'
                  }}>
                    <span style={{ color: '#94a3b8' }}>Required: {req.required}</span>
                    <span style={{ 
                      color: req.passed ? '#10b981' : '#ef4444',
                      fontWeight: 500
                    }}>
                      {req.value}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* LLM Recommendation */}
        {recommendation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              background: 'linear-gradient(135deg, #1a5f2a 0%, #0d3318 100%)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '32px',
              color: 'white'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <Cpu size={24} />
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
                Recommended LLM Configuration
              </h3>
            </div>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '12px'
            }}>
              {recommendation.reason}
            </p>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '12px'
            }}>
              <span style={{ color: '#c9a227', fontWeight: 600 }}>
                Recommended Model:
              </span>
              <span style={{ marginLeft: '8px' }}>
                {recommendation.recommended}
              </span>
            </div>
            <p style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.6)'
            }}>
              Max model size supported: {recommendation.maxModelSize}
            </p>
          </motion.div>
        )}

        {/* Warning Message */}
        {hasWarnings && !allPassed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={20} color="#f59e0b" />
              <p style={{ color: '#92400e', fontSize: '14px' }}>
                Your system meets minimum requirements but may experience slower performance. 
                Consider using smaller quantized models.
              </p>
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
            onClick={() => setScreen('welcome')}
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
            onClick={() => setScreen('llm-setup')}
            style={{
              background: '#1a5f2a',
              border: 'none',
              padding: '12px 24px',
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
            Configure LLM
            <ArrowRight size={16} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default SetupScreen;
