import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gh_tracker_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        // Token expired or invalid
        localStorage.removeItem('gh_tracker_token');
        localStorage.removeItem('gh_tracker_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        message = 'Session expired. Please log in again.';
      } else if (status === 403) {
        message = data?.detail || 'Access forbidden. You do not have permission to perform this action.';
      } else if (status === 404) {
        message = data?.detail || 'Requested resource was not found.';
      } else if (status === 429) {
        message = 'GitHub API rate limit reached. Please wait or configure a GitHub Personal Access Token in Settings.';
      } else if (status >= 500) {
        message = data?.detail || 'Internal server error occurred. Please verify backend logs.';
      } else if (data?.detail) {
        message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } else if (error.request) {
      message = 'Unable to connect to the backend server. Please verify the FastAPI service is running.';
    }

    const enhancedError = new Error(message);
    enhancedError.status = error.response?.status;
    enhancedError.originalError = error;
    return Promise.reject(enhancedError);
  }
);

export default api;
