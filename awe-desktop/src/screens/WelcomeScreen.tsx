import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Cpu, Database, Zap } from 'lucide-react';
import { useAppStore } from '../lib/store';

const WelcomeScreen: React.FC = () => {
  const { systemInfo, setScreen, selectedModel } = useAppStore();

  const handleStart = () => {
    if (selectedModel) {
      setScreen('course-select');
    } else {
      setScreen('setup');
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #1a5f2a 0%, #0d3318 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          textAlign: 'center',
          maxWidth: '600px'
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{
            fontSize: '80px',
            marginBottom: '24px'
          }}
        >
          📝
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: '48px',
            fontWeight: 700,
            color: 'white',
            marginBottom: '12px',
            letterSpacing: '-1px'
          }}
        >
          AWE Desktop
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            fontSize: '20px',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '8px'
          }}
        >
          Automated Writing Evaluation System
        </motion.p>

        {/* Institution */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            fontSize: '16px',
            color: '#c9a227',
            marginBottom: '48px'
          }}
        >
          Sultan Qaboos University
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            marginBottom: '48px'
          }}
        >
          <Feature icon={<Cpu size={24} />} title="AI-Powered" description="Local LLM Support" />
          <Feature icon={<Database size={24} />} title="Offline" description="No Internet Required" />
          <Feature icon={<Zap size={24} />} title="Fast" description="Instant Analysis" />
        </motion.div>

        {/* System Info */}
        {systemInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px 24px',
              marginBottom: '32px'
            }}
          >
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '8px'
            }}>
              System Detected
            </p>
            <p style={{
              fontSize: '14px',
              color: 'white'
            }}>
              {systemInfo.cpuCores} Cores • {systemInfo.totalMemoryGB}GB RAM
              {selectedModel && ` • ${selectedModel.name} Ready`}
            </p>
          </motion.div>
        )}

        {/* Start Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStart}
          style={{
            background: '#c9a227',
            color: 'white',
            border: 'none',
            padding: '16px 48px',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 10px 40px rgba(201, 162, 39, 0.3)'
          }}
        >
          Get Started
          <ArrowRight size={20} />
        </motion.button>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{
            marginTop: '40px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)'
          }}
        >
          Developed by: Dr. Waleed Mandour, 2026
        </motion.p>
      </motion.div>
    </div>
  );
};

// Feature Component
const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description
}) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{
      color: '#c9a227',
      marginBottom: '8px'
    }}>
      {icon}
    </div>
    <p style={{
      fontSize: '14px',
      fontWeight: 600,
      color: 'white',
      marginBottom: '4px'
    }}>
      {title}
    </p>
    <p style={{
      fontSize: '12px',
      color: 'rgba(255,255,255,0.6)'
    }}>
      {description}
    </p>
  </div>
);

export default WelcomeScreen;
