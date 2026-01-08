import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import AppLayout from '../../components/AppLayout';

const StudentNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await axiosClient.get('/api/student/notes');
      setNotes(res.data.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <AppLayout><div style={{ padding: 20 }}>Loading notes...</div></AppLayout>;

  return (
    <AppLayout>
      <div>
        <h2>Notes</h2>
        {notes.length === 0 ? (
          <div>No notes available.</div>
        ) : (
          <ul>
            {notes.map(n => (
              <li key={n._id} style={{ marginBottom: 10 }}>
                <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
                <div style={{ fontSize: 12, color: '#666' }}>{new Date(n.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
};

export default StudentNotes;