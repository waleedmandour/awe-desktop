import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader, Scan, Brain, FileCheck } from 'lucide-react';
import { useAppStore } from '../lib/store';

const ProcessingScreen: React.FC = () => {
  const { currentEssay, setScreen } = useAppStore();
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);

  const stages = [
    { icon: <Scan size={24} />, label: 'Extracting text from image...', duration: 2000 },
    { icon: <Brain size={24} />, label: 'Analyzing writing quality...', duration: 3000 },
    { icon: <FileCheck size={24} />, label: 'Generating feedback...', duration: 2000 }
  ];

  useEffect(() => {
    // Simulate processing stages
    let currentStage = 0;
    let currentProgress = 0;
    
    const progressInterval = setInterval(() => {
      currentProgress += 2;
      setProgress(Math.min(currentProgress, 100));
      
      if (currentProgress >= (currentStage + 1) * 33) {
        currentStage = Math.min(currentStage + 1, stages.length - 1);
        setStage(currentStage);
      }
      
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        setTimeout(() => {
          setScreen('review');
        }, 500);
      }
    }, 100);

    return () => clearInterval(progressInterval);
  }, [setScreen]);

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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          textAlign: 'center',
          maxWidth: '400px'
        }}
      >
        {/* Animated Icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px'
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {stages[stage].icon}
          </motion.div>
        </motion.div>

        {/* Stage Label */}
        <motion.p
          key={stage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: '18px',
            fontWeight: 500,
            color: 'white',
            marginBottom: '24px'
          }}
        >
          {stages[stage].label}
        </motion.p>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
            style={{
              height: '100%',
              background: '#c9a227'
            }}
          />
        </div>

        {/* Progress Percentage */}
        <p style={{
          marginTop: '16px',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.6)'
        }}>
          {progress}% Complete
        </p>

        {/* Word Count */}
        {currentEssay && (
          <p style={{
            marginTop: '24px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.5)'
          }}>
            Processing {currentEssay.wordCount} words
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default ProcessingScreen;
