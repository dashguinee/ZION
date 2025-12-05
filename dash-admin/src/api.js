/**
 * API Service for DASH Admin
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://zion-production-39d8.up.railway.app';
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'dash-admin-2025';

async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': ADMIN_KEY,
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API Error');
  }

  return data;
}

// Stats
export const getStats = () => apiCall('/api/admin/stats');

// Users
export const getUsers = () => apiCall('/api/admin/users');
export const getUser = (username) => apiCall(`/api/admin/users/${username}`);
export const createUser = (userData) => apiCall('/api/admin/users', {
  method: 'POST',
  body: JSON.stringify(userData)
});
export const updateUser = (username, updates) => apiCall(`/api/admin/users/${username}`, {
  method: 'PUT',
  body: JSON.stringify(updates)
});
export const suspendUser = (username) => apiCall(`/api/admin/users/${username}/suspend`, {
  method: 'POST'
});
export const activateUser = (username) => apiCall(`/api/admin/users/${username}/activate`, {
  method: 'POST'
});
export const deleteUser = (username) => apiCall(`/api/admin/users/${username}`, {
  method: 'DELETE'
});

// Packages
export const getPackages = () => apiCall('/api/admin/packages');

// Export
export const exportUsers = () => apiCall('/api/admin/export');
