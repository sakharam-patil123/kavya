import React, { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import SmallChatBox from "../components/SmallChatBox";
import { jsPDF } from "jspdf";
import avatarFemale from "../assets/avatar-female.svg";
import profileAvatar from "../assets/profile.png";
import 'bootstrap/dist/css/bootstrap.min.css';

import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  Edit3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import "../assets/Profile.css";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSmallChatOpen, setIsSmallChatOpen] = useState(false);
  const [loadingCertCourseId, setLoadingCertCourseId] = useState(null);

  const [profile, setProfile] = useState({
    initials: "",
    name: "",
    badge: "Premium Member",
    bio: "Passionate learner exploring web development and computer science. On a mission to master full-stack development!",
    email: "",
    phone: "+91 ",
    location: "",
    joined: " ",
    gender: "",
    avatar: null,
    stats: {
      courses: 0,
      hours: 0,
      achievements: 0,
      avg: "0%",
    },
  });
  const [streakDays, setStreakDays] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [userRole, setUserRole] = useState('student'); // Default to student

  

  // Check if user is a student (show all sections) or other role (hide certain sections)
  const isStudent = userRole === 'student';

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Get role from localStorage or API
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) {
          setUserRole(storedRole);
        }

        const api = await import("../api");
        const profileRes = await api.getProfile();

        if (profileRes && profileRes._id) {
          // Update role from response if available
          if (profileRes.role) {
            setUserRole(profileRes.role);
            localStorage.setItem('userRole', profileRes.role);
          }
          setProfile((prev) => ({
            ...prev,
            name: profileRes.fullName || prev.name,
            email: profileRes.email || prev.email,
            phone: profileRes.phone || prev.phone,
            location: profileRes.location || prev.location,
            bio: profileRes.bio || prev.bio,
            gender: profileRes.gender || prev.gender,
            avatar: profileRes.avatar || null,
            initials: ((profileRes.fullName || prev.name) + "")
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase(),
            joined: profileRes.createdAt
              ? `Joined ${new Date(profileRes.createdAt).toLocaleString()}`
              : prev.joined,
          }));
        }

        // Load streak
        try {
          const streakData = await api.getStreak();
          if (streakData && streakData.streakDays !== undefined) {
            setStreakDays(streakData.streakDays);
          }
        } catch (err) {
          console.warn("Could not load streak", err);
        }

        // Load dynamic progress, skills, certificates and activity
        try {
          const progress = await api.getProgressOverview();

          if (progress && progress.stats) {
            console.log('📚 Profile: Courses Enrolled =', progress.stats.enrolledCourses ?? 0);
            console.log('⏰ Profile: Hours Learned =', progress.stats.learningHours ?? 0);
            setProfile((prev) => ({
              ...prev,
              stats: {
                courses: progress.stats.enrolledCourses ?? 0,
                hours: progress.stats.learningHours ?? 0,
                achievements: progress.stats.achievements ?? 0,
                avg: `${progress.stats.avgScore ?? 0}%`,
              },
            }));
          }

          if (progress && Array.isArray(progress.skills)) {
            setSkills(progress.skills);
          }

          if (progress && Array.isArray(progress.certificates)) {
            setCertificates(progress.certificates);
            // Migrate any guest-scoped completion dates to the user-scoped key so
            // certificates recorded before login are available in the profile.
            try {
              const userId = profileRes && (profileRes._id || profileRes.id) ? (profileRes._id || profileRes.id) : null;
              if (userId) {
                progress.certificates.forEach((c) => {
                  try {
                    const cid = c.courseId || c.id || (c.course && c.course.id);
                    if (!cid) return;
                    const guestKey = `completionDate_guest_${cid}`;
                    const userKey = `completionDate_${userId}_${cid}`;
                    const guestVal = window.localStorage.getItem(guestKey);
                    if (guestVal && !window.localStorage.getItem(userKey)) {
                      window.localStorage.setItem(userKey, guestVal);
                      window.localStorage.removeItem(guestKey);
                      console.log('🔁 Migrated guest completion date to user key for course', cid);
                    }
                  } catch (e) {
                    // ignore per-course migration errors
                  }
                });
              }
            } catch (e) {
              // ignore migration errors
            }
          }

          if (progress && Array.isArray(progress.recentActivity)) {
            setActivities(
              progress.recentActivity.map((a) => ({
                text: a.description || a.action,
                time: new Date(a.createdAt).toLocaleString(),
                color: a.color || "#1b65d4",
              }))
            );
          }
        } catch (err) {
          // If progress endpoint fails (e.g. new backend not deployed), keep graceful defaults
          console.warn("Could not load progress overview", err);
        }
      } catch (err) {
        // ignore if unauthenticated — log for visibility
        console.warn('Could not load profile or user not authenticated', err?.message || err);
      }
    };

    loadProfileData();

    // Re-fetch data when window regains focus (e.g., after enrolling in another tab)
    const handleFocus = () => {
      console.log('🔄 Profile: Window focused, reloading data...');
      loadProfileData();
    };
    window.addEventListener('focus', handleFocus);

    // Re-fetch data when enrollment happens (custom event)
    const handleEnrollmentUpdate = () => {
      console.log('🔄 Profile: Enrollment updated! Reloading data...');
      loadProfileData();
    };
    window.addEventListener('enrollmentUpdated', handleEnrollmentUpdate);

    // Re-fetch when a course completion is recorded elsewhere (Courses page writes completion)
    const handleCourseCompletion = (ev) => {
      console.log('🔔 Profile: detected courseCompletionRecorded', ev?.detail);
      loadProfileData();
    };
    window.addEventListener('courseCompletionRecorded', handleCourseCompletion);
    console.log('✅ Profile: Event listeners registered');

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('enrollmentUpdated', handleEnrollmentUpdate);
      window.removeEventListener('courseCompletionRecorded', handleCourseCompletion);
    };
  }, []);
  

  const [skills, setSkills] = useState([
    { name: "Course Progress", percent: 0, color: "#1b65d4" },
    { name: "Quiz Performance", percent: 0, color: "#2db88e" },
    { name: "Engagement", percent: 0, color: "#4acb9a" },
    { name: "Overall Skill", percent: 0, color: "#27c5aa" },
  ]);

  const [activities, setActivities] = useState([]);

  const [certificates, setCertificates] = useState([]);

  // Helper to compute completion key for localStorage per user+course
  const getCompletionStorageKey = (profileObj, courseId) => {
    try {
      const cid = courseId || (profileObj && profileObj.currentCourseId) || null;
      const userId = profileObj?._id || profileObj?.id || null;
      if (!cid) return null;
      return userId ? `completionDate_${userId}_${cid}` : `completionDate_guest_${cid}`;
    } catch (e) {
      return null;
    }
  };

  const certificateAvailable = (cert) => {
    try {
      const courseId = cert.courseId || cert.id || (cert.course && cert.course.id);
      const key = getCompletionStorageKey(profile, courseId);
      if (!key) return false;
      return !!window.localStorage.getItem(key);
    } catch (e) {
      return false;
    }
  };

  const prefs = {
    goal: "2 hours",
    level: "Intermediate",
    style: "Visual",
    notifications: "Enabled",
  };

  const handleDownloadCertificate = async (cert) => {
    // Generate client-side certificate that matches Courses page behavior.
    const courseId = cert.courseId || cert.id || (cert.course && cert.course.id);
    if (!courseId) {
      alert('Cannot determine course id for this certificate');
      return;
    }

    try {
      setLoadingCertCourseId(courseId);

      // If no recorded completion date, ask user to confirm writing today's date
      if (!certificateAvailable(cert)) {
        const ok = window.confirm('We do not have a recorded completion date for this course. If you proceed, today will be recorded as the completion date and used on the certificate. Continue?');
        if (!ok) return;
        try {
          const key = getCompletionStorageKey(profile, courseId);
          if (key) window.localStorage.setItem(key, new Date().toISOString());
        } catch (e) {
          console.warn('Could not persist forced completion date', e);
        }
      }

      // Build display name
      let profileName = profile?.name || profile?.fullName || profile?.full_name || '';
      if (!profileName) {
        const first = (profile?.firstName || profile?.first_name || '').trim();
        const last = (profile?.lastName || profile?.last_name || '').trim();
        profileName = `${first} ${last}`.trim();
      }
      if (!profileName) profileName = window.localStorage.getItem('profileName') || 'Student';
      const displayName = profileName.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      const certTitle = cert.title || cert.courseTitle || cert.name || 'Course Completion';

      // Read stored completion ISO for this user+course
      let completionIso = null;
      try {
        const key = getCompletionStorageKey(profile, courseId);
        completionIso = key ? window.localStorage.getItem(key) : null;
      } catch (e) {
        completionIso = null;
      }
      const completionDate = completionIso ? new Date(completionIso).toLocaleDateString() : new Date().toLocaleDateString();

      // Generate PDF
      const doc = new jsPDF('landscape', 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(5);
      doc.rect(20, 20, pageWidth - 40, 550);
      doc.setFont('times', 'bold');
      doc.setFontSize(32);
      doc.setTextColor(27, 51, 127);
      doc.text('Certificate of Completion', pageWidth / 2, 100, { align: 'center' });
      doc.setFontSize(18);
      doc.setFont('times', 'italic');
      doc.setTextColor(0, 0, 0);
      doc.text('This certificate is proudly presented to', pageWidth / 2, 150, { align: 'center' });
      doc.setFont('times', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(27, 51, 127);
      doc.text(displayName, pageWidth / 2, 200, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text(`for successfully completing the`, pageWidth / 2, 240, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(60, 60, 60);
      doc.text(`${certTitle}`, pageWidth / 2, 270, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.text(`Date: ${completionDate}`, pageWidth / 2, 320, { align: 'center' });
      doc.setFontSize(16);
      doc.setTextColor(100, 100, 100);
      doc.text('KavyaLearn Academy', pageWidth / 2, 370, { align: 'center' });

      const safeTitle = (certTitle || 'Course').replace(/[^a-z0-9]/gi, '_');
      doc.save(`${safeTitle}_Certificate.pdf`);

      setCertificates((prev) => prev.map((c) => (c.courseId === courseId || c.id === courseId ? { ...c, status: 'Downloaded' } : c)));
    } catch (err) {
      console.error('Certificate generation failed', err);
      alert(err?.message || 'Certificate could not be generated.');
    } finally {
      setLoadingCertCourseId(null);
    }
  };

  const handleChange = (e) => {
  const { name, value } = e.target;

  // PHONE VALIDATION
  if (name === "phone") {
    // remove all non-digits
    const digitsOnly = value.replace(/\D/g, "");

    // limit to 10 digits
    if (digitsOnly.length > 10) return;

    setProfile({ ...profile, phone: digitsOnly });
    return;
  }

  // NORMAL FIELDS
  setProfile({ ...profile, [name]: value });
};


  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      const api = await import("../api");
      const result = await api.uploadProfilePhoto(file);
      
      if (result.avatar) {
        setProfile((prev) => ({
          ...prev,
          avatar: result.avatar,
        }));
        alert("✅ Profile photo uploaded successfully!");
      }
    } catch (error) {
      alert(error.message || "Failed to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = (e) => {
  e.preventDefault();

  // ---------------- PHONE VALIDATION ----------------
  if (!/^\d{10}$/.test(profile.phone)) {
    alert("Phone number must be exactly 10 digits and contain only numbers.");
    return;
  }
  // ---------------------------------------------------

  (async () => {
    try {
      const api = await import('../api');
      const payload = {
        fullName: profile.name,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        gender: profile.gender,
      }; 

      const updated = await api.updateProfile(payload);

      if (updated && updated._id) {
        setProfile((prev) => ({
          ...prev,
          name: updated.fullName || prev.name,
          phone: updated.phone ?? prev.phone,
          avatar: updated.avatar ?? prev.avatar,
        }));
        alert('✅ Profile updated successfully!');
      }
    } catch (err) {
      alert(err?.message || 'Failed to update profile');
    } finally {
      setIsEditing(false);
    }
  })();
};


  // prevent background scrolling when modal is open
  useEffect(() => {
    document.body.classList.toggle("modal-open", isEditing || isContactModalOpen);
  }, [isEditing, isContactModalOpen]);

  return (
    <AppLayout showGreeting={false}>
      <div className="profile-page">
        {/* === Profile Card === */}
        <div className="profile-wrapper">
          <div className="profile-top-card">
            <div className="avatar">
              {profile.avatar ? (
                <img 
                  src={profile.avatar} 
                  alt={profile.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                (profile.gender === 'female') ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <img 
                      src={avatarFemale} 
                      alt="female avatar"
                      style={{ width: '90%', height: '90%' }}
                    />
                  </div>
                ) : (profile.gender === 'male') ? (
                  <img
                    src={profileAvatar}
                    alt="male avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  profile.initials
                )
              )}
            </div>

            <div className="profile-main">
              <div className="profile-main-row">
                <h2 className="profile-name">{profile.name}</h2>
                <span className="badge">{profile.badge}</span>
              </div>

              <p className="profile-bio">{profile.bio}</p>
              <div className="profile-contacts">
                <div className="left">
                  <div className="contact-item">
                    <Mail size={16} /> {profile.email}
                  </div>
                  <div className="contact-item">
                    <MapPin size={16} /> {profile.address || profile.location || 'India'}
                  </div>
                </div>
                <div className="right">
                  <div className="contact-item">
                    <Phone size={16} /> {profile.phone}
                  </div>
                  <div className="contact-item">
                    <Calendar size={16} /> {profile.joined}
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-action">
              <button className="btn-edit" onClick={() => setIsEditing(true)}>
                <Edit3 size={16} /> Edit Profile
              </button>
            </div>
          </div>

          <div className="profile-stat-grid">
            {isStudent && (
              <>
                <ProfileStatCard
                  icon={<BookOpen color="#1b337f" size={25} />}
                  value={profile.stats.courses}
                  label="Courses Enrolled"
                  iconColor="#eaf1ff"
                  valueColor="#1b337f"
                />
                <ProfileStatCard
                  icon={<Clock color="#00796b" size={25} />}
                  value={profile.stats.hours}
                  label="Hours Learned"
                  iconColor="#eaf1ff"
                  valueColor="#00796b"
                />
                <ProfileStatCard
                  icon={<Award color="#60b684ff" size={25} />}
                  value={profile.stats.achievements}
                  label="Achievements"
                  iconColor="#eaf1ff"
                  valueColor="#60b684ff"
                />
                <ProfileStatCard
                  icon={<TrendingUp color="#388e3c" size={25} />}
                  value={profile.stats.avg}
                  label="Avg. Score"
                  iconColor="#eaf1ff"
                  valueColor="#388e3c"
                />
              </>
            )}
          </div>
        </div>

        {/* === Skills and Activity (Only for Students) === */}
        {isStudent && (
        <div className="skills-activity-section">
          <div className="skills-card">
            <h3>Skills & Progress</h3>
            {skills.map((skill, i) => (
              <div className="skill-item" key={i}>
                <div className="skill-header">
                  <span>{skill.name}</span>
                  <span className="percent">{skill.percent}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${skill.percent}%`,
                      background: skill.color,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="activity-card">
            <h3>Recent Activity</h3>
            <ul>
              {activities.map((a, i) => (
                <li key={i}>
                  <span
                    className="activity-dot"
                    style={{ background: a.color }}
                  ></span>
                  <div>
                    <p className="activity-text">{a.text}</p>
                    <p className="activity-time">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        )}

        {/* === Bottom Section (Only for Students) === */}
        {isStudent && (
        <div className="bottom-sections">
          <div className="left-column">
            <div className="certificates-section">
              <div className="certificates-header">
                <h3>Certificates</h3>
                <button className="view-all-btn">View All</button>
              </div>
              <div className="certificates-grid">
                {certificates.map((cert, i) => (
                  <div className="certificate-card" key={cert.id || i}>
                    <div className="cert-info">
                      <div className="cert-icon">
                        <Award size={18} />
                      </div>
                      <div>
                        <h4>{cert.title}</h4>
                        <p>
                          {cert.enrolledAt
                            ? new Date(cert.enrolledAt).toLocaleDateString()
                            : ""}
                        </p>
                        <p className="cert-status">
                          Status: {cert.status || "Pending"}
                        </p>
                      </div>
                    </div>
                    <button
                      className="download-btn"
                      disabled={loadingCertCourseId === (cert.courseId || cert.id || (cert.course && cert.course.id))}
                      onClick={() => handleDownloadCertificate(cert)}
                      title={!certificateAvailable(cert) ? 'Certificate not yet recorded — click to record and download' : undefined}
                    >
                      {cert.status === "Downloaded" ? "Re-download" : "Download"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="right-columnn">
            <div className="preferences-card">
              <h3>Learning Preferences</h3>
              <div className="pref-row">
                <span>Daily Goal</span>
                <span>{prefs.goal}</span>
              </div>
              <div className="pref-row">
                <span>Difficulty Level</span>
                <span>{prefs.level}</span>
              </div>
              <div className="pref-row">
                <span>Learning Style</span>
                <span>{prefs.style}</span>
              </div>
              <div className="pref-row">
                <span>Notifications</span>
                <span>{prefs.notifications}</span>
              </div>
            </div>

            <div className="streak-card">
              <h3>Achievement Streak</h3>
              <div className="streak-icon">
                <Award size={36} color="white" />
              </div>
              <h4>{streakDays} {streakDays === 1 ? 'Day' : 'Days'}</h4>
              <p>{streakDays === 0 ? 'Start your streak by logging in daily!' : 'Keep up the great work!'}</p>
            </div>

            <div className="support-card">
              <h3>Need Help?</h3>
              <p>
                Contact our support team or chat with{" "}
                <strong>Kavya AI Tutor</strong> for assistance.
              </p>
              <div className="support-buttons">
                <button className="support-btn" onClick={() => setIsContactModalOpen(true)}>Contact Support</button>
                <button className="ai-btn" onClick={() => setIsSmallChatOpen(true)}>Chat with AI Tutor</button>
                {isSmallChatOpen && (
                  <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 4000 }}>
                    <SmallChatBox initialCategory={"Profile / General Dashboard"} onClose={() => setIsSmallChatOpen(false)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* === 🧩 Modal for Editing Profile === */}
        {isEditing && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Edit Profile</h2>
              <form className="edit-form" onSubmit={handleSubmit}>
      {/* Profile Photo */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
          Profile Photo
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          disabled={uploadingPhoto}
          style={{ width: "100%", padding: "0.5rem" }}
        />

        {uploadingPhoto && (
          <p style={{ marginTop: "0.5rem", color: "#666" }}>Uploading...</p>
        )}

        {profile.avatar && (
          <div style={{ marginTop: "0.5rem" }}>
            <img
              src={profile.avatar}
              alt="Preview"
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          </div>
        )}
      </div>

      {/* Inputs */}
      <input
        type="text"
        name="name"
        value={profile.name}
        onChange={handleChange}
        placeholder="Name"
      />

      <input
        type="email"
        name="email"
        value={profile.email}
        onChange={handleChange}
        placeholder="Email"
      />

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          name="phone"
          value={profile.phone}
          onChange={handleChange}
          placeholder="Phone"
          inputMode="numeric"
          style={{ flex: 1 }}
        />

        <select name="gender" value={profile.gender} onChange={handleChange} style={{ flex: 1 }}>
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <input
        type="text"
        name="location"
        value={profile.location}
        onChange={handleChange}
        placeholder="Location"
      />

      <textarea
        name="bio"
        value={profile.bio}
        onChange={handleChange}
        placeholder="Bio"
        rows={3}
      />

      {/* Buttons */}
      <div className="form-buttons">
        <button type="submit" className="btn-save">
          Save Changes
        </button>

        <button
          type="button"
          className="btn-cancel"
          onClick={() => setIsEditing(false)}
        >
          Cancel
        </button>
      </div>
    </form>
            </div>
          </div>
        )}

        {/* === 🧩 Modal for Contact Support === */}
        {isContactModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Contact Support</h2>
              <p>Call our support team for assistance:</p>
              <div className="contact-phone-section">
                <Phone size={24} />
                <a href="tel:+918888999910" className="phone-link">+91 8888999910</a>
              </div>
              <div className="form-buttons">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsContactModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

/* Small sub-component for Stats */
function ProfileStatCard({ icon, value, label, iconColor, valueColor }) {
  return (
    <div className="profile-stat-card">
      <div className="stat-left">
        <div className="icon" style={{ backgroundColor: iconColor }}>
          {icon}
        </div>
        <p className="stat-label">{label}</p>
      </div>
      <h4 className="stat-value" style={{ color: valueColor }}>
        {value}
      </h4>
    </div>
  );
}
