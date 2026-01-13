import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import './Announcements.css';

const ParentAnnouncements = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load announcements from localStorage
    const loadMessages = () => {
      try {
        const saved = localStorage.getItem('adminAnnouncements');
        if (saved) {
          const data = JSON.parse(saved);
          setMessages(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('Error loading announcements:', e);
      }
      setLoading(false);
    };

    loadMessages();

    // Listen for storage changes to update in real-time
    const handleStorageChange = (e) => {
      if (e.key === 'adminAnnouncements') {
        loadMessages();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AppLayout>
      <div className="announcements-page">
        <h2>Announcements</h2>

        {loading ? (
          <p>Loading...</p>
        ) : messages.length === 0 ? (
          <div className="no-announcements">No announcements yet.</div>
        ) : (
          <div className="messages-list">
            {messages.map((msg) => (
              <div key={msg.id} className="announcement-message">
                <div className="message-header">
                  <span className="admin-badge">Admin Announcement</span>
                  <span className="message-time">{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                {msg.text && <div className="message-text">{msg.text}</div>}
                {msg.image && (
                  <img src={msg.image} alt="Announcement" className="message-image" />
                )}
                {msg.video && (
                  <video src={msg.video} controls className="message-video" />
                )}
                {msg.file && (
                  <div className="message-file">
                    <span className="file-icon">📄</span>
                    <div className="file-info">
                      <div className="file-name">{msg.file.name}</div>
                      <div className="file-size">{msg.file.size}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ParentAnnouncements;
