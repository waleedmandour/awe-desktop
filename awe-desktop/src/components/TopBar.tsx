import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronRight, 
  Clock, 
  User,
  Cpu
} from 'lucide-react';
import { useAppStore } from '../lib/store';

const TopBar: React.FC = () => {
  const { 
    currentScreen, 
    selectedModel, 
    selectedCourse,
    currentEssay 
  } = useAppStore();

  const getBreadcrumb = () => {
    const crumbs: { label: string; screen?: string }[] = [
      { label: 'Home', screen: 'welcome' }
    ];

    if (currentScreen === 'setup') {
      crumbs.push({ label: 'System Check' });
    } else if (currentScreen === 'llm-setup') {
      crumbs.push({ label: 'LLM Configuration' });
    } else if (currentScreen === 'course-select') {
      crumbs.push({ label: 'Courses' });
    } else if (currentScreen === 'upload') {
      crumbs.push({ label: 'New Assessment' });
    } else if (currentScreen === 'processing') {
      crumbs.push({ label: 'Processing' });
    } else if (currentScreen === 'review') {
      crumbs.push({ label: 'Review Text' });
    } else if (currentScreen === 'assessment') {
      crumbs.push({ label: 'Assessment' });
    } else if (currentScreen === 'results') {
      crumbs.push({ label: 'Results' });
    } else if (currentScreen === 'settings') {
      crumbs.push({ label: 'Settings' });
    } else if (currentScreen === 'history') {
      crumbs.push({ label: 'History' });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumb();

  return (
    <div style={styles.topBar}>
      {/* Left: Breadcrumb */}
      <div style={styles.breadcrumb}>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight size={14} style={{ color: '#94a3b8' }} />
            )}
            <span style={{
              ...styles.breadcrumbItem,
              color: index === breadcrumbs.length - 1 ? '#1e293b' : '#64748b',
              fontWeight: index === breadcrumbs.length - 1 ? 500 : 400,
            }}>
              {crumb.label}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right: Status Info */}
      <div style={styles.statusArea}>
        {/* Active Model */}
        {selectedModel && (
          <div style={styles.statusPill}>
            <Cpu size={14} style={{ color: '#1a5f2a' }} />
            <span style={styles.statusPillText}>{selectedModel.name}</span>
          </div>
        )}

        {/* Active Course */}
        {selectedCourse && (
          <div style={{ ...styles.statusPill, background: '#fef3c7' }}>
            <span style={{ ...styles.statusPillText, color: '#92400e' }}>
              {selectedCourse.code}
            </span>
          </div>
        )}

        {/* Essay Info */}
        {currentEssay && (
          <div style={{ ...styles.statusPill, background: '#f0fdf4' }}>
            <span style={{ ...styles.statusPillText, color: '#166534' }}>
              {currentEssay.wordCount} words
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    height: '56px',
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    flexShrink: 0,
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  breadcrumbItem: {
    fontSize: '14px',
  },
  statusArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: '#f1f5f9',
    borderRadius: '20px',
    fontSize: '12px',
  },
  statusPillText: {
    fontWeight: 500,
    color: '#475569',
  },
};

export default TopBar;
