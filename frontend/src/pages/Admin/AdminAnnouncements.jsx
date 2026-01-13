import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
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
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editVideo, setEditVideo] = useState(null);
  const [editVideoPreview, setEditVideoPreview] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [editFilePreview, setEditFilePreview] = useState(null);

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

  const handleSendMessage = () => {
    if (!inputText.trim() && !imagePreview && !videoPreview && !filePreview) {
      return;
    }

    try {
      setSending(true);
      const newMessage = {
        id: Date.now(),
        text: inputText.trim(),
        image: imagePreview,
        video: videoPreview,
        file: filePreview,
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
      setVideo(null);
      setVideoPreview(null);
      setFile(null);
      setFilePreview(null);

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

  const handleEditMessage = (msg) => {
    setEditingId(msg.id);
    setEditText(msg.text);
    setEditImagePreview(msg.image);
    setEditImage(null);
    setEditVideoPreview(msg.video);
    setEditVideo(null);
    setEditFilePreview(msg.file);
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
            {messages.length === 0 ? (
              <div className="no-messages">No announcements yet. Start typing below...</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="message admin-message">
                  <div className="message-header">
                    <span className="admin-badge">Admin</span>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleString()}
                      {msg.edited && <span className="edited-label"> (edited)</span>}
                    </span>
                    <div className="message-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEditMessage(msg)}
                        title="Edit announcement"
                      >
                        ✎
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteMessage(msg.id)}
                        title="Delete announcement"
                      >
                        ✕
                      </button>
                    </div>
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
