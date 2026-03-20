import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Upload, 
  BookOpen, 
  Settings, 
  History, 
  Database,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../lib/store';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  screen: string;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { currentScreen, setScreen, currentEssay, currentAssessment } = useAppStore();

  const navItems: NavItem[] = [
    { id: 'home', icon: <Home size={20} />, label: 'Home', screen: 'welcome' },
    { id: 'upload', icon: <Upload size={20} />, label: 'New Assessment', screen: 'upload' },
    { id: 'courses', icon: <BookOpen size={20} />, label: 'Courses', screen: 'course-select' },
    { id: 'history', icon: <History size={20} />, label: 'History', screen: 'history' },
    { id: 'models', icon: <Database size={20} />, label: 'LLM Settings', screen: 'llm-setup' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Settings', screen: 'settings' },
  ];

  const isActive = (screen: string) => {
    if (currentScreen === screen) return true;
    if (screen === 'upload' && ['processing', 'review', 'assessment'].includes(currentScreen)) return true;
    if (screen === 'home' && currentScreen === 'setup') return true;
    return false;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 60 : 220 }}
      transition={{ duration: 0.2 }}
      style={styles.sidebar}
    >
      {/* Logo Section */}
      <div style={styles.logoSection}>
        <div style={styles.logoIcon}>
          📝
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={styles.logoTitle}>AWE Desktop</div>
            <div style={styles.logoSubtitle}>Writing Assessment</div>
          </motion.div>
        )}
      </div>

      {/* Navigation Items */}
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ backgroundColor: isActive(item.screen) ? 'rgba(26, 95, 42, 0.15)' : 'rgba(0,0,0,0.03)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setScreen(item.screen as any)}
            style={{
              ...styles.navItem,
              backgroundColor: isActive(item.screen) ? 'rgba(26, 95, 42, 0.12)' : 'transparent',
              borderLeftColor: isActive(item.screen) ? '#1a5f2a' : 'transparent',
            }}
            title={collapsed ? item.label : undefined}
          >
            <span style={{
              ...styles.navIcon,
              color: isActive(item.screen) ? '#1a5f2a' : '#64748b',
            }}>
              {item.icon}
            </span>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  ...styles.navLabel,
                  color: isActive(item.screen) ? '#1a5f2a' : '#64748b',
                  fontWeight: isActive(item.screen) ? 600 : 400,
                }}
              >
                {item.label}
              </motion.span>
            )}
          </motion.button>
        ))}
      </nav>

      {/* Quick Status */}
      {!collapsed && (currentEssay || currentAssessment) && (
        <div style={styles.statusSection}>
          <div style={styles.statusLabel}>Current Session</div>
          {currentEssay && (
            <div style={styles.statusItem}>
              <span style={styles.statusDot}>📄</span>
              <span style={styles.statusText}>
                {currentEssay.wordCount} words
              </span>
            </div>
          )}
          {currentAssessment && (
            <div style={styles.statusItem}>
              <span style={styles.statusDot}>✅</span>
              <span style={styles.statusText}>
                Band {currentAssessment.overallBand}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        style={styles.toggleButton}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Footer */}
      {!collapsed && (
        <div style={styles.footer}>
          <div style={styles.footerText}>Center for Preparatory Studies</div>
          <div style={styles.footerSubtext}>Sultan Qaboos University</div>
        </div>
      )}
    </motion.aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    position: 'fixed',
    left: 0,
    top: window.electronAPI?.isElectron ? 32 : 0,
    bottom: 0,
    background: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    overflow: 'hidden',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 16px',
    borderBottom: '1px solid #f1f5f9',
    minHeight: '80px',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #1a5f2a 0%, #0d3318 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  },
  logoTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1e293b',
  },
  logoSubtitle: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px',
  },
  nav: {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 12px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    borderLeft: '3px solid transparent',
    transition: 'background-color 0.15s ease',
    background: 'transparent',
  },
  navIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  navLabel: {
    fontSize: '14px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  statusSection: {
    padding: '12px 16px',
    borderTop: '1px solid #f1f5f9',
  },
  statusLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '4px',
  },
  statusDot: {
    fontSize: '12px',
  },
  statusText: {
    color: '#1e293b',
  },
  toggleButton: {
    position: 'absolute',
    bottom: '80px',
    right: '-12px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'white',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid #f1f5f9',
    background: '#f8fafc',
  },
  footerText: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    marginBottom: '2px',
  },
  footerSubtext: {
    fontSize: '10px',
    color: '#94a3b8',
  },
};

export default Sidebar;
