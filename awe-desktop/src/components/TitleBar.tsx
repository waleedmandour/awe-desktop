import React from 'react';
import { motion } from 'framer-motion';
import { Settings, History } from 'lucide-react';
import { useAppStore } from '../lib/store';

interface TitleBarProps {
  title?: string;
}

const TitleBar: React.FC<TitleBarProps> = ({ title = 'AWE Desktop' }) => {
  const { setScreen } = useAppStore();

  // Electron drag region style
  const dragStyle: React.CSSProperties = {
    height: '32px',
    background: 'linear-gradient(135deg, #1a5f2a 0%, #0d3318 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px',
    position: 'relative',
    zIndex: 1000,
    // @ts-ignore - Electron specific property
    WebkitAppRegion: 'drag'
  };

  const noDragStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    // @ts-ignore - Electron specific property
    WebkitAppRegion: 'no-drag'
  };

  return (
    <div className="drag-region" style={dragStyle}>
      {/* Left Section - App Icon and Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>📝</span>
        <span style={{ 
          color: 'white', 
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '0.5px'
        }}>
          {title}
        </span>
      </div>

      {/* Center Section - Empty (for dragging) */}
      <div style={{ flex: 1 }} />

      {/* Right Section - Custom Controls */}
      <div className="no-drag" style={noDragStyle}>
        <motion.button
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setScreen('history')}
          style={{
            width: '28px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer'
          }}
          title="History"
        >
          <History size={14} />
        </motion.button>
        
        <motion.button
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setScreen('settings')}
          style={{
            width: '28px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer'
          }}
          title="Settings"
        >
          <Settings size={14} />
        </motion.button>
      </div>
    </div>
  );
};

export default TitleBar;
