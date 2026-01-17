import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import AppLayout from '../../components/AppLayout';
import './StudentCourses.css';

const StudentEnrolledCourses = () => {
  const [courses, setCourses] = useState([]);
  const [progressByCourseId, setProgressByCourseId] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadEnrolledCourses();
  }, []);

  const loadEnrolledCourses = async () => {
    try {
      const res = await axiosClient.get('/api/student/enrolled-courses');
      console.log('GET /api/student/enrolled-courses response:', res.data);
      const list = res.data.data || [];
      setCourses(list);
      // Build progress map keyed by course id to avoid reusing shared state
      const map = {};
      list.forEach(c => {
        map[c._id] = (c.progress && (c.progress.completionPercentage ?? 0)) || 0;
      });
      setProgressByCourseId(map);
    } catch (error) {
      console.error('Failed to load enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueLearning = (courseId) => {
    // Redirect to the main Courses page and pass the selected course id as query param
    navigate(`/courses?id=${courseId}`);
  };

  if (loading) {
    return <AppLayout><div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div></AppLayout>;
  }

  return (
    <AppLayout showGreeting={false}>
      <div className="student-courses">
        <h1>Enrolled Courses</h1>

        {courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎒</div>
            <h2>No Enrolled Courses</h2>
            <p>You don't have any courses yet. Browse available courses or contact an administrator.</p>
            <button className="btn btn-primary" onClick={() => navigate('/courses')}>
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map(course => (
              <div key={course._id} className="course-card">
                {course.thumbnail && (
                  <div className="course-thumbnail">
                    <img src={course.thumbnail} alt={course.title} />
                  </div>
                )}

                <div className="course-body">
                  <h3>{course.title}</h3>
                  <p className="instructor">By {course.instructor?.fullName || 'Unknown'}</p>

                  <div style={{ marginTop: 8 }}>
                    <strong>Access:</strong> {course.accessType || 'Paid'}
                  </div>

                  {/* <div className="progress-section" style={{ marginTop: 8 }}>
                    <div className="progress-info">
                      <span>Progress</span>
                      <span className="progress-percentage">{progressByCourseId[course._id] ?? 0}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progressByCourseId[course._id] ?? 0}%` }}
                      ></div>
                    </div>
                  </div> */}

                  <button 
                    className="btn btn-continue"
                    onClick={() => handleContinueLearning(course._id)}
                    style={{ marginTop: 12 }}
                  >
                    {progressByCourseId[course._id] === 100 ? 'Review' : 'Continue Learning'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default StudentEnrolledCourses;
