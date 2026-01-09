import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import AppLayout from '../../components/AppLayout';
import './StudentCourses.css';

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseDetail, setCourseDetail] = useState(null);
  const { courseId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (courseId) {
      loadCourseDetail(courseId);
    } else {
      loadCourses();
    }
  }, []);

  const loadCourses = async () => {
    try {
      const res = await axiosClient.get('/api/student/courses');
      setCourses(res.data.data || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseDetail = async (id) => {
    try {
      console.log('Loading course detail for id:', id);
      setLoading(true);
      const res = await axiosClient.get(`/api/student/courses/${id}`);
      console.log('GET /api/student/courses/:id response:', res.data);
      setCourseDetail(res.data.data || null);
    } catch (error) {
      console.error('Failed to load course detail:', error);
      // If not enrolled or error, fall back to list view
      setCourseDetail(null);
      loadCourses();
    } finally {
      setLoading(false);
    }
  };

  const handleContinueLearning = (courseId) => {
    // Navigate to student courses route with courseId param so the same page loads detail
    navigate(`/student/courses/${courseId}`);
  };

  if (loading) {
    return <AppLayout><div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div></AppLayout>;
  }

  return (
    <AppLayout showGreeting={false}>
      <div className="student-courses">
        {!courseDetail && <h1>My Courses</h1>}

        {courseDetail ? (
          <div className="course-detail">
            <h2>{courseDetail.course.title}</h2>
            <p>By {courseDetail.course.instructor?.fullName || 'Unknown'}</p>
            <div style={{ marginTop: 12 }}>
              <strong>Progress:</strong> {courseDetail.enrollment?.completionPercentage || courseDetail.enrollment?.hoursSpent || 0}%
            </div>
            {/* Render lessons if available */}
            <div style={{ marginTop: 16 }}>
              <h3>Lessons</h3>
              {courseDetail.course.lessons && courseDetail.course.lessons.length > 0 ? (
                <ul>
                  {courseDetail.course.lessons.map(lesson => (
                    <li key={lesson._id}>{lesson.title}</li>
                  ))}
                </ul>
              ) : (
                <p>No lessons available for this course.</p>
              )}
            </div>
            <button className="btn btn-secondary" onClick={() => navigate('/student/courses')} style={{ marginTop: 12 }}>
              Back to Courses
            </button>
          </div>
        ) : (
          <>
            {courses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h2>No Courses Yet</h2>
                <p>Start your learning journey by enrolling in a course</p>
                <button className="btn btn-primary" onClick={() => navigate('/courses')}>
                  Browse Courses
                </button>
              </div>
            ) : (
              <>
                {/* Filter Tabs */}
                <div className="filter-tabs">
                  <button className="tab active">All Courses</button>
                  <button className="tab">In Progress</button>
                  <button className="tab">Completed</button>
                </div>

                {/* Courses Grid */}
                <div className="courses-grid">
                  {courses.map(course => (
                    <div key={course._id} className="course-card">
                      {/* Course Thumbnail */}
                      {course.thumbnail && (
                        <div className="course-thumbnail">
                          <img src={course.thumbnail} alt={course.title} />
                        </div>
                      )}

                      {/* Course Content */}
                      <div className="course-body">
                        <h3>{course.title}</h3>
                        <p className="instructor">
                          By {course.instructor?.fullName || 'Unknown Instructor'}
                        </p>

                        {/* Progress Bar */}
                        <div className="progress-section">
                          <div className="progress-info">
                            <span>Progress</span>
                            <span className="progress-percentage">{course.completionPercentage}%</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${course.completionPercentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Course Stats */}
                        <div className="course-stats">
                          <div className="stat">
                            <span className="label">Lessons</span>
                            <span className="value">{course.completedLessons}/{course.totalLessons}</span>
                          </div>
                          <div className="stat">
                            <span className="label">Hours</span>
                            <span className="value">{course.hoursSpent}h</span>
                          </div>
                          <div className="stat">
                            <span className="label">Level</span>
                            <span className="value">{course.level}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {course.completionPercentage === 100 && course.certificateDownloadedAt && (
                          <div className="status-badge completed">
                            ✓ Completed
                          </div>
                        )}

                        {/* Continue Button */}
                        <button 
                          className="btn btn-continue"
                          onClick={() => handleContinueLearning(course._id)}
                        >
                          {course.completionPercentage === 100 ? 'Review' : 'Continue Learning'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default StudentCourses;
