import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  BookOpen,
  Users,
  FileText
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import type { Course } from '../types';
import { v4 as uuidv4 } from 'uuid';

const CourseSelectScreen: React.FC = () => {
  const { courses, selectedCourse, setCourses, setSelectedCourse, setScreen } = useAppStore();
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    instructor: ''
  });

  const handleCreateCourse = () => {
    if (!newCourse.code || !newCourse.name) return;
    
    const course: Course = {
      id: uuidv4(),
      code: newCourse.code,
      name: newCourse.name,
      instructor: newCourse.instructor,
      description: '',
      assessmentType: 'ielts',
      rubric: [],
      studentCount: 0,
      essaysCount: 0,
      createdAt: new Date()
    };
    
    setCourses([...courses, course]);
    setSelectedCourse(course);
    setShowNewCourse(false);
    setNewCourse({ code: '', name: '', instructor: '' });
  };

  const defaultCourses: Course[] = [
    {
      id: 'default-1',
      code: 'ENG 101',
      name: 'Academic Writing I',
      instructor: 'Dr. Smith',
      description: 'Introduction to academic writing',
      assessmentType: 'ielts',
      rubric: [],
      studentCount: 25,
      essaysCount: 0,
      createdAt: new Date()
    },
    {
      id: 'default-2',
      code: 'ENG 201',
      name: 'Academic Writing II',
      instructor: 'Dr. Johnson',
      description: 'Advanced academic writing',
      assessmentType: 'ielts',
      rubric: [],
      studentCount: 20,
      essaysCount: 0,
      createdAt: new Date()
    }
  ];

  const displayCourses = courses.length > 0 ? courses : defaultCourses;

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
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            Select Course
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b'
          }}>
            Choose a course for this assessment session
          </p>
        </div>

        {/* Course Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {displayCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedCourse(course)}
              style={{
                background: selectedCourse?.id === course.id ? '#f0fdf4' : 'white',
                border: `2px solid ${selectedCourse?.id === course.id ? '#1a5f2a' : '#e2e8f0'}`,
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #1a5f2a 0%, #0d3318 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BookOpen size={20} color="white" />
                </div>
                <span style={{
                  background: '#f1f5f9',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#64748b'
                }}>
                  {course.code}
                </span>
              </div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '4px'
              }}>
                {course.name}
              </h3>
              <p style={{
                fontSize: '13px',
                color: '#64748b',
                marginBottom: '12px'
              }}>
                {course.instructor}
              </p>
              <div style={{
                display: 'flex',
                gap: '16px',
                fontSize: '12px',
                color: '#94a3b8'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={12} />
                  {course.studentCount} students
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FileText size={12} />
                  {course.essaysCount} essays
                </span>
              </div>
            </motion.div>
          ))}

          {/* Add New Course Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: displayCourses.length * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowNewCourse(true)}
            style={{
              background: '#f8fafc',
              border: '2px dashed #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '150px'
            }}
          >
            <Plus size={32} color="#94a3b8" />
            <p style={{ marginTop: '8px', color: '#94a3b8', fontSize: '14px' }}>
              Add New Course
            </p>
          </motion.div>
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setScreen('llm-setup')}
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
            onClick={() => selectedCourse && setScreen('upload')}
            disabled={!selectedCourse}
            style={{
              background: selectedCourse ? '#1a5f2a' : '#cbd5e1',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'white',
              cursor: selectedCourse ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Continue
            <ArrowRight size={16} />
          </motion.button>
        </div>
      </motion.div>

      {/* New Course Modal */}
      {showNewCourse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowNewCourse(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%'
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>
              Add New Course
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                Course Code *
              </label>
              <input
                type="text"
                value={newCourse.code}
                onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                placeholder="e.g., ENG 301"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                Course Name *
              </label>
              <input
                type="text"
                value={newCourse.name}
                onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                placeholder="e.g., Advanced Academic Writing"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                Instructor
              </label>
              <input
                type="text"
                value={newCourse.instructor}
                onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                placeholder="e.g., Dr. Smith"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowNewCourse(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCourse}
                disabled={!newCourse.code || !newCourse.name}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: newCourse.code && newCourse.name ? '#1a5f2a' : '#cbd5e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: newCourse.code && newCourse.name ? 'pointer' : 'not-allowed'
                }}
              >
                Create Course
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default CourseSelectScreen;
