import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import { listAnnouncements } from '../../api/announcementService';
import './Announcements.css';

const StudentAnnouncements = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load announcements from backend
    const loadMessages = async () => {
      try {
        const data = await listAnnouncements();
        setMessages(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Error loading announcements:', err);
        setError('Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Refresh announcements every 5 seconds for real-time updates
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout>
      <div className="announcements-page">
        <h2>Announcements</h2>

        {loading ? (
          <p>Loading announcements...</p>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : messages.length === 0 ? (
          <div className="no-announcements">No announcements yet.</div>
        ) : (
          <div className="messages-list">
            {messages.map((msg) => (
              <div key={msg._id} className="announcement-message">
                <div className="message-header">
                  <span className="admin-badge">Admin Announcement</span>
                  <span className="message-time">{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                {msg.title && <div className="message-title"><strong>{msg.title}</strong></div>}
                {msg.message && <div className="message-text">{msg.message}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default StudentAnnouncements;
