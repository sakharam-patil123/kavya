import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import AppLayout from '../../components/AppLayout';
import './StudentCourses.css';

const StudentEnrolledCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadEnrolledCourses();
  }, []);

  const loadEnrolledCourses = async () => {
    try {
      const res = await axiosClient.get('/api/student/enrolled-courses');
      console.log('GET /api/student/enrolled-courses response:', res.data);
      setCourses(res.data.data || []);
    } catch (error) {
      console.error('Failed to load enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: compute progress percentage from available lesson counts.
  // Prefer explicit completed/total lesson counts. Only use a raw
  // completionPercentage fallback when there is supporting lesson data.
  const computeCompletionPct = (course) => {
    const completedFromTop = course.completedLessons ?? null;
    const totalFromTop = course.totalLessons ?? null;
    const completedFromProgress = course.progress?.completedLessons ?? null;
    const totalFromProgress = course.progress?.totalLessons ?? null;
    const lessonsLen = Array.isArray(course.lessons) ? course.lessons.length : null;

    const completed = Number(
      completedFromTop ?? completedFromProgress ?? 0
    );
    const total = Number(
      totalFromTop ?? totalFromProgress ?? (lessonsLen ?? 0)
    );

    let pct = 0;

    if (total > 0) {
      pct = Math.floor((completed / total) * 10) * 10;
      pct = Math.max(0, Math.min(100, pct));
      return pct;
    }

    // If we don't have a total but backend supplied both completed/total under progress, use those
    if (totalFromProgress && totalFromProgress > 0) {
      const c = Number(completedFromProgress || 0);
      const t = Number(totalFromProgress || 0);
      pct = Math.floor((c / t) * 10) * 10;
      pct = Math.max(0, Math.min(100, pct));
      return pct;
    }

    // Only use raw completionPercentage if there is lesson data to support it
    if ((lessonsLen && lessonsLen > 0) || totalFromTop || totalFromProgress) {
      const raw = Number(course.progress?.completionPercentage ?? 0);
      pct = Math.max(0, Math.min(100, Math.floor(raw)));
      return pct;
    }

    // No lesson/total information — assume 0% (do not treat optimistic enrollments as complete)
    return 0;
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

                  <div className="progress-section" style={{ marginTop: 8 }}>
                    <div className="progress-info">
                      <span>Progress</span>
                      <span className="progress-percentage">{computeCompletionPct(course)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${computeCompletionPct(course)}%` }}></div>
                    </div>
                  </div>

                  <button 
                    className="btn btn-continue"
                    onClick={() => handleContinueLearning(course._id)}
                    style={{ marginTop: 12 }}
                  >
                    {computeCompletionPct(course) === 100 ? 'Review' : 'Continue Learning'}
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
