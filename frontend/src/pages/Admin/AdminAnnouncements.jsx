import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import { createAnnouncement, listAnnouncements, deleteAnnouncement } from '../../api/announcementService';
import './AdminAnnouncements.css';

const AdminAnnouncements = () => {
  const [inputText, setInputText] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editVideo, setEditVideo] = useState(null);
  const [editVideoPreview, setEditVideoPreview] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [editFilePreview, setEditFilePreview] = useState(null);

  // Load announcements from backend on mount
  useEffect(() => {
    loadAnnouncements();
    // Refresh announcements every 5 seconds for real-time updates
    const interval = setInterval(loadAnnouncements, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAnnouncements = async () => {
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

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideo(file);
        setVideoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      setFilePreview({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB'
      });
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleRemoveVideo = () => {
    setVideo(null);
    setVideoPreview(null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !imagePreview && !videoPreview && !filePreview) {
      return;
    }

    try {
      setSending(true);
      
      // Create announcement object with text only (for now, handling media in future enhancement)
      const announcementData = {
        title: inputText.substring(0, 100), // Use first 100 chars as title
        message: inputText.trim(),
        targetRole: 'all' // Default to all users
      };

      // Send to backend
      const newAnnouncement = await createAnnouncement(announcementData);

      // Add to local state
      const updatedMessages = [...messages, newAnnouncement];
      setMessages(updatedMessages);

      // Reset inputs
      setInputText('');
      setImage(null);
      setImagePreview(null);
      setVideo(null);
      setVideoPreview(null);
      setFile(null);
      setFilePreview(null);
      setError(null);

      // Show brief success feedback
      setTimeout(() => setSending(false), 300);
    } catch (err) {
      console.error('Error sending message:', err);
      setSending(false);
      setError('Failed to send announcement');
      alert('Failed to send announcement: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await deleteAnnouncement(id);
      const updatedMessages = messages.filter(msg => msg._id !== id);
      setMessages(updatedMessages);
      setError(null);
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setError('Failed to delete announcement');
      alert('Failed to delete announcement');
    }
  };

  const handleEditMessage = (msg) => {
    // Edit functionality can be implemented in future
    setEditingId(msg._id);
    setEditText(msg.message);
    setEditImagePreview(null);
    setEditImage(null);
    setEditVideoPreview(null);
    setEditVideo(null);
    setEditFilePreview(null);
    setEditFile(null);
  };

  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImage(file);
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditVideo(file);
        setEditVideoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFile(file);
      setEditFilePreview({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB'
      });
    }
  };

  const handleRemoveEditImage = () => {
    setEditImage(null);
    setEditImagePreview(null);
  };

  const handleRemoveEditVideo = () => {
    setEditVideo(null);
    setEditVideoPreview(null);
  };

  const handleRemoveEditFile = () => {
    setEditFile(null);
    setEditFilePreview(null);
  };

  const handleSaveEdit = () => {
    if (!editText.trim() && !editImagePreview && !editVideoPreview && !editFilePreview) {
      return;
    }

    const updatedMessages = messages.map(msg => {
      if (msg.id === editingId) {
        return {
          ...msg,
          text: editText.trim(),
          image: editImagePreview,
          video: editVideoPreview,
          file: editFilePreview,
          edited: true,
          editedAt: new Date().toISOString()
        };
      }
      return msg;
    });

    setMessages(updatedMessages);
    localStorage.setItem('adminAnnouncements', JSON.stringify(updatedMessages));
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditImage(null);
    setEditImagePreview(null);
    setEditVideo(null);
    setEditVideoPreview(null);
    setEditFile(null);
    setEditFilePreview(null);
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
            {loading ? (
              <div className="loading">Loading announcements...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : messages.length === 0 ? (
              <div className="no-messages">No announcements yet. Start typing below...</div>
            ) : (
              messages.map((msg) => (
                <div key={msg._id} className="message admin-message">
                  <div className="message-header">
                    <span className="admin-badge">Admin</span>
                    <span className="message-time">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                    <div className="message-actions">
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteMessage(msg._id)}
                        title="Delete announcement"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {msg.message && <div className="message-text">{msg.message}</div>}
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

            {videoPreview && (
              <div className="input-video-preview">
                <video src={videoPreview} controls />
                <button
                  type="button"
                  className="remove-preview-btn"
                  onClick={handleRemoveVideo}
                >
                  ✕
                </button>
              </div>
            )}

            {filePreview && (
              <div className="input-file-preview">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <div className="file-name">{filePreview.name}</div>
                  <div className="file-size">{filePreview.size}</div>
                </div>
                <button
                  type="button"
                  className="remove-preview-btn"
                  onClick={handleRemoveFile}
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
                🖼️ Image
              </label>

              <label className="file-upload-label">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  style={{ display: 'none' }}
                />
                🎥 Video
              </label>

              <label className="file-upload-label">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                📎 File
              </label>

              <button
                className="send-btn"
                onClick={handleSendMessage}
                disabled={sending || (!inputText.trim() && !imagePreview && !videoPreview && !filePreview)}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editingId && (
          <div className="edit-modal-overlay" onClick={cancelEdit}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="edit-modal-header">
                <h3>Edit Announcement</h3>
                <button className="modal-close-btn" onClick={cancelEdit}>✕</button>
              </div>

              <div className="edit-modal-content">
                <textarea
                  className="edit-textarea"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Edit announcement message..."
                  rows={4}
                />

                {editImagePreview && (
                  <div className="edit-image-preview">
                    <img src={editImagePreview} alt="Preview" />
                    <button
                      type="button"
                      className="remove-preview-btn"
                      onClick={handleRemoveEditImage}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {editVideoPreview && (
                  <div className="edit-video-preview">
                    <video src={editVideoPreview} controls />
                    <button
                      type="button"
                      className="remove-preview-btn"
                      onClick={handleRemoveEditVideo}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {editFilePreview && (
                  <div className="edit-file-preview">
                    <span className="file-icon">📄</span>
                    <div className="file-info">
                      <div className="file-name">{editFilePreview.name}</div>
                      <div className="file-size">{editFilePreview.size}</div>
                    </div>
                    <button
                      type="button"
                      className="remove-preview-btn"
                      onClick={handleRemoveEditFile}
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="edit-file-controls">
                  <label className="file-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageUpload}
                      style={{ display: 'none' }}
                    />
                    🖼️ Change Image
                  </label>

                  <label className="file-upload-label">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleEditVideoUpload}
                      style={{ display: 'none' }}
                    />
                    🎥 Change Video
                  </label>

                  <label className="file-upload-label">
                    <input
                      type="file"
                      onChange={handleEditFileUpload}
                      style={{ display: 'none' }}
                    />
                    📎 Change File
                  </label>
                </div>
              </div>

              <div className="edit-modal-footer">
                <button
                  className="btn-cancel"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
                <button
                  className="btn-save"
                  onClick={handleSaveEdit}
                  disabled={!editText.trim() && !editImagePreview && !editVideoPreview && !editFilePreview}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminAnnouncements;
