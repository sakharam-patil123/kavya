const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const BASE = API_BASE ? `${API_BASE}/api` : '/api';

function authHeaders(isForm = false) {
  const token = localStorage.getItem('token');
  const headers = {};

  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm) headers['Content-Type'] = 'application/json';

  return headers;
}

/**
 * Create a new announcement
 * @param {Object} announcementData - {title, message, targetRole}
 */
export async function createAnnouncement(announcementData) {
  try {
    const res = await fetch(`${BASE}/admin/announcements`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(announcementData),
    });
    return res.json();
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
}

/**
 * Get all announcements
 */
export async function listAnnouncements() {
  try {
    const res = await fetch(`${BASE}/admin/announcements`, { headers: authHeaders() });
    return res.json();
  } catch (error) {
    console.error('Error fetching announcements:', error);
    throw error;
  }
}

/**
 * Delete an announcement by ID
 * @param {string} announcementId
 */
export async function deleteAnnouncement(announcementId) {
  try {
    const res = await fetch(`${BASE}/admin/announcements/${announcementId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return res.json();
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
}

/**
 * Get public announcements (for students/public users)
 */
export async function getPublicAnnouncements() {
  try {
    const res = await fetch(`${BASE}/announcements`, { headers: authHeaders() });
    return res.json();
  } catch (error) {
    console.error('Error fetching public announcements:', error);
    throw error;
  }
}
