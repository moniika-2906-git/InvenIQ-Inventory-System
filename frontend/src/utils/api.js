import API_URL from '../config';

// Token management
export const getToken = () => localStorage.getItem('inveniq_token');
export const setToken = (token) => localStorage.setItem('inveniq_token', token);
export const removeToken = () => localStorage.removeItem('inveniq_token');

// Authenticated fetch
export const authFetch = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  // Token expired
  if (response.status === 401) {
    removeToken();
    window.location.reload();
    return null;
  }

  return response;
};

// API calls
export const api = {
  get: (endpoint) => authFetch(endpoint),
  post: (endpoint, data) => authFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  put: (endpoint, data) => authFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};