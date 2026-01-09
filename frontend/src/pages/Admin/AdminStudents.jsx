import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import AppLayout from "../../components/AppLayout";
import CreateUserModal from "../../components/CreateUserModal";
import "../../assets/admin-dark-mode.css";



const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showFreeModal, setShowFreeModal] = useState(false);
  const [modalStudent, setModalStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState(null);

  const loadStudents = async () => {
    try {
      const res = await axiosClient.get("/api/admin/users?role=student");

      // Expect backend to send enrolledCourses & achievements
      setStudents(res.data.data || res.data);
    } catch (err) {
      console.error("Failed loading students", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  if (loading) return <AppLayout><div style={{ padding: '20px', textAlign: 'center' }}>Loading students...</div></AppLayout>;

  return (
    <AppLayout showGreeting={false}>
      <div className="admin-students-page">
      {/* FORM SECTION */}
      {showForm && (
        <div style={{
          background: '#fff',
          borderRadius: '15px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3>Add New Student</h3>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowForm(false)}
              style={{ padding: '8px 16px' }}
            >
              ✕ Close
            </button>
          </div>
          <CreateUserModal
            isOpen={true}
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              loadStudents();
              setShowForm(false);
            }}
          />
        </div>
      )}

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 className="admin-heading">Student Management</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Hide Form" : "Add Student"}
        </button>
      </div>

      {/* STUDENT TABLE */}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Student Info</th>
            <th>Parent</th>
            <th>Courses</th>
            <th>Free Course</th>
            <th>Performance</th>
            <th>Achievements</th>
          </tr>
        </thead>

        <tbody>
          {students.map((s) => (
            <tr key={s._id}>
              {/* STUDENT PERSONAL INFO */}
              <td>
                <strong>{s.fullName}</strong> <br />
                Email: {s.email} <br />
                Phone: {s.phone || "-"} <br />
                Gender: {s.gender || "Not set"} <br />
                Age: {s.age || "Not set"} <br />
                Address: {s.address && typeof s.address === 'object' 
                  ? `${s.address.street || ''}, ${s.address.city || ''}, ${s.address.state || ''} ${s.address.zipCode || ''}`.trim() || "Not available"
                  : s.address || "Not available"} <br />
                Status:{" "}
                <span
                  className={`badge bg-${
                    s.status === "active" ? "success" : "danger"
                  }`}
                >
                  {s.status || "active"}
                </span>
              </td>

              {/* PARENT DETAILS */}
              <td>
                {s.parent ? (
                  <>
                    Name: {s.parent.fullName} <br />
                    Phone: {s.parent.phone} <br />
                    Email: {s.parent.email} <br />
                  </>
                ) : (
                  "No Parent Assigned"
                )}
              </td>

              {/* ENROLLED COURSES */}
              <td>
                {s.enrolledCourses?.length > 0 ? (
                  s.enrolledCourses.map((e) => (
                    <div
                      key={e._id}
                      style={{
                        padding: "6px",
                        borderBottom: "1px solid #ddd",
                        marginBottom: 5,
                      }}
                    >
                      <strong>{e.courseId?.title}</strong> <br />
                      Instructor: {e.instructorId?.fullName || "N/A"} <br />
                      Progress: {e.progressPercentage}% <br />
                      Completed: {e.completed ? "Yes" : "No"}
                    </div>
                  ))
                ) : (
                  <span className="text-muted">No courses purchased</span>
                )}
              </td>

              {/* FREE COURSE ACTION */}
              <td>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setModalStudent(s);
                    setShowFreeModal(true);
                    setModalMessage(null);
                    // load courses lazily
                    if (courses.length === 0) {
                      axiosClient.get('/api/admin/courses').then(res => setCourses(res.data.data || res.data)).catch(() => setCourses([]));
                    }
                  }}
                >
                  Free Course
                </button>
              </td>

              {/* PERFORMANCE SECTION */}
              <td>
                Total Courses: {s.enrolledCourses?.length || 0} <br />
                Completed Courses:{" "}
                {s.enrolledCourses?.filter((c) => c.completed).length || 0}{" "}
                <br />
                Avg Progress:{" "}
                {s.enrolledCourses?.length
                  ? (
                      s.enrolledCourses.reduce(
                        (acc, c) => acc + c.progressPercentage,
                        0
                      ) / s.enrolledCourses.length
                    ).toFixed(1)
                  : "0"}
                % <br />
                Last Active: {s.lastActive || "N/A"}
              </td>

              {/* ACHIEVEMENTS */}
              <td>
                {s.achievements?.length > 0 ? (
                  s.achievements.map((a, i) => (
                    <div key={i}>
                      🏅 {a.title} <br />
                      <small>{a.date}</small>
                      <hr />
                    </div>
                  ))
                ) : (
                  <span className="text-muted">No achievements</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Free Course Modal */}
      {showFreeModal && modalStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: 420 }}>
            <h3>Assign Free Course to {modalStudent.fullName}</h3>
            <div style={{ marginTop: 12 }}>
              <label>Course</label>
              <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }}>
                <option value="">-- Select course --</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>
            {modalMessage && <div style={{ marginTop: 8 }}>{modalMessage}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => { setShowFreeModal(false); setModalStudent(null); setSelectedCourseId(''); setModalMessage(null); }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={modalLoading}
                onClick={async () => {
                  if (!selectedCourseId) { setModalMessage('Please select a course'); return; }
                  setModalLoading(true);
                  try {
                    await axiosClient.post('/api/admin/enrollments', { studentId: modalStudent._id, courseId: selectedCourseId, isFree: true });
                    setModalMessage('Course added as free successfully');
                    // refresh students table
                    await loadStudents();
                    setTimeout(() => {
                      setShowFreeModal(false);
                      setModalStudent(null);
                      setSelectedCourseId('');
                      setModalMessage(null);
                    }, 900);
                  } catch (err) {
                    const msg = err?.response?.data?.message || 'Failed to add course';
                    setModalMessage(msg);
                  } finally {
                    setModalLoading(false);
                  }
                }}
              >
                {modalLoading ? 'Adding...' : 'Add Course'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
};

export default AdminStudents;
