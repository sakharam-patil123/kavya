import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import './AdminAnnouncements.css';

const AdminAnnouncements = () => {
  const [inputText, setInputText] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  // Load saved announcements on mount
  useEffect(() => {
    const saved = localStorage.getItem('adminAnnouncements');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setMessages(data);
      } catch (e) {
        console.error('Error loading messages:', e);
      }
    }
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(file);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSendMessage = () => {
    if (!inputText.trim() && !imagePreview) {
      return;
    }

    try {
      setSending(true);
      const newMessage = {
        id: Date.now(),
        text: inputText.trim(),
        image: imagePreview,
        timestamp: new Date().toISOString(),
        isAdmin: true
      };

      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      localStorage.setItem('adminAnnouncements', JSON.stringify(updatedMessages));

      // Reset inputs
      setInputText('');
      setImage(null);
      setImagePreview(null);

      // Show brief success feedback
      setTimeout(() => setSending(false), 300);
    } catch (e) {
      console.error('Error sending message:', e);
      setSending(false);
      alert('Failed to send announcement');
    }
  };

  const handleDeleteMessage = (id) => {
    const updatedMessages = messages.filter(msg => msg.id !== id);
    setMessages(updatedMessages);
    localStorage.setItem('adminAnnouncements', JSON.stringify(updatedMessages));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSendMessage();
    }
  };

  return (
    <AppLayout showGreeting={false}>
      <div className="admin-announcements-page">
        <h2>Admin Announcements</h2>

        <div className="chatbox-container">
          {/* Messages Display Area */}
          <div className="messages-area">
            {messages.length === 0 ? (
              <div className="no-messages">No announcements yet. Start typing below...</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="message admin-message">
                  <div className="message-header">
                    <span className="admin-badge">Admin</span>
                    <span className="message-time">{new Date(msg.timestamp).toLocaleString()}</span>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteMessage(msg.id)}
                      title="Delete announcement"
                    >
                      ✕
                    </button>
                  </div>
                  {msg.text && <div className="message-text">{msg.text}</div>}
                  {msg.image && (
                    <img src={msg.image} alt="Announcement" className="message-image" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="input-area">
            <textarea
              className="message-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type announcement message here... (Ctrl+Enter to send)"
              rows={4}
            />

            {imagePreview && (
              <div className="input-image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  className="remove-preview-btn"
                  onClick={handleRemoveImage}
                >
                  ✕
                </button>
              </div>
            )}

            <div className="input-controls">
              <label className="file-upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                📎 Attach Image
              </label>

              <button
                className="send-btn"
                onClick={handleSendMessage}
                disabled={sending || (!inputText.trim() && !imagePreview)}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminAnnouncements;
