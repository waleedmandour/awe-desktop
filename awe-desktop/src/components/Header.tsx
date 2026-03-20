import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../lib/store';
import {
  Bell,
  Search,
  User,
  ChevronRight
} from 'lucide-react';

const Header: React.FC = () => {
  const { currentScreen, selectedCourse, currentEssay } = useAppStore();

  // Get page title based on current screen
  const getPageInfo = () => {
    switch (currentScreen) {
      case 'welcome':
        return { title: 'Dashboard', subtitle: 'Welcome to AWE Desktop' };
      case 'setup':
        return { title: 'System Setup', subtitle: 'Checking system compatibility' };
      case 'llm-setup':
        return { title: 'LLM Configuration', subtitle: 'Configure your AI model' };
      case 'course-select':
        return { title: 'Select Course', subtitle: 'Choose a course for assessment' };
      case 'upload':
        return { title: 'New Assessment', subtitle: 'Upload or paste essay content' };
      case 'processing':
        return { title: 'Processing', subtitle: 'Analyzing your essay' };
      case 'review':
        return { title: 'Review Essay', subtitle: 'Verify extracted text' };
      case 'assessment':
        return { title: 'Assessment', subtitle: 'AI is evaluating your essay' };
      case 'results':
        return { title: 'Assessment Results', subtitle: 'View detailed feedback' };
      case 'settings':
        return { title: 'Settings', subtitle: 'Configure application preferences' };
      case 'history':
        return { title: 'Assessment History', subtitle: 'View previous assessments' };
      default:
        return { title: 'AWE Desktop', subtitle: 'Automated Writing Evaluation' };
    }
  };

  const pageInfo = getPageInfo();

  // Build breadcrumb
  const getBreadcrumb = () => {
    const crumbs = [{ label: 'Home', screen: 'welcome' }];
    
    if (currentScreen !== 'welcome') {
      if (selectedCourse && ['upload', 'review', 'processing', 'assessment', 'results'].includes(currentScreen)) {
        crumbs.push({ label: selectedCourse.code, screen: 'course-select' });
      }
      crumbs.push({ label: pageInfo.title, screen: currentScreen });
    }
    
    return crumbs;
  };

  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 24px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0
    }}>
      {/* Left Section - Title & Breadcrumb */}
      <div>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 4
        }}>
          {getBreadcrumb().map((crumb, index, arr) => (
            <React.Fragment key={crumb.screen}>
              <button
                onClick={() => useAppStore.getState().setScreen(crumb.screen as any)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 12,
                  color: index === arr.length - 1 ? '#1a5f2a' : '#64748b',
                  fontWeight: index === arr.length - 1 ? 600 : 400
                }}
              >
                {crumb.label}
              </button>
              {index < arr.length - 1 && (
                <ChevronRight size={12} color="#94a3b8" />
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Page Title */}
        <h1 style={{
          fontSize: 20,
          fontWeight: 600,
          color: '#1e293b',
          margin: 0
        }}>
          {pageInfo.title}
        </h1>
      </div>

      {/* Right Section - Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          width: 240
        }}>
          <Search size={16} style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8'
          }} />
          <input
            type="text"
            placeholder="Search..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 13,
              background: '#f8fafc',
              outline: 'none'
            }}
          />
        </div>

        {/* Notifications */}
        <motion.button
          whileHover={{ backgroundColor: '#f1f5f9' }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <Bell size={18} color="#64748b" />
          <span style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#ef4444'
          }} />
        </motion.button>

        {/* User */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 12px 6px 6px',
          borderRadius: 24,
          background: '#f8fafc',
          cursor: 'pointer'
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a5f2a 0%, #2a8f42 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={16} color="white" />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', margin: 0 }}>
              Educator
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
