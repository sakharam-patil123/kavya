import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';

const CreateCourseModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    category: '', 
    level: 'Beginner', 
    duration: '', 
    price: 0,
    status: 'active',
    resourceUrl: '',
    resourceName: ''
  });
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed.');
      return;
    }

    try {
      setUploading(true);
      const payload = new FormData();
      payload.append('file', file);

      const res = await axiosClient.post('/api/uploads', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const url = res.data.url || res.data.secure_url;
      setFormData(prev => ({ ...prev, resourceUrl: url, resourceName: file.name }));
      setUploading(false);
    } catch (err) {
      setUploading(false);
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/api/admin/courses', formData);
      setFormData({ 
        title: '', 
        description: '', 
        category: '', 
        level: 'Beginner', 
        duration: '', 
        price: 0,
        status: 'active',
        resourceUrl: '',
        resourceName: ''
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  if (!isOpen) return null;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
      <input type="text" name="title" placeholder="Course Title" value={formData.title} onChange={handleChange} required className="form-control" style={{ gridColumn: '1 / -1' }} />
      <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="form-control" style={{ gridColumn: '1 / -1', minHeight: '100px' }}></textarea>
      <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleChange} required className="form-control" />
      <select name="level" value={formData.level} onChange={handleChange} className="form-control">
        <option value="Beginner">Beginner</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Advanced">Advanced</option>
      </select>
      <input type="text" name="duration" placeholder="Duration (e.g., 4 weeks)" value={formData.duration} onChange={handleChange} required className="form-control" />
      <input type="number" name="price" placeholder="Price" value={formData.price} onChange={handleChange} required className="form-control" />
      <select name="status" value={formData.status} onChange={handleChange} className="form-control">
        <option value="draft">Draft</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>

      <div style={{ gridColumn: '1 / -1' }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Upload PDF resource (optional)</label>
        <input type="file" accept="application/pdf" onChange={handleFileChange} className="form-control" />
        {uploading && <div style={{ marginTop: 8 }}>Uploading...</div>}
        {formData.resourceUrl && (
          <div style={{ marginTop: 8 }}>
            Uploaded: <a href={formData.resourceUrl} target="_blank" rel="noopener noreferrer">{formData.resourceName || 'View file'}</a>
          </div>
        )}
      </div>

      <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1' }}>Create Course</button>
    </form>
  );
};

export default CreateCourseModal;
