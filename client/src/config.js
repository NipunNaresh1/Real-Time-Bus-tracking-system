// Centralized config for API and Socket endpoints
// Set REACT_APP_API_URL in your hosting provider (e.g., Netlify) to your backend URL
// Example: https://bus-tracker-backend.onrender.com

const API_URL = process.env.REACT_APP_API_URL || '';

export const getApiBase = () => API_URL;
export const getSocketUrl = () => API_URL || undefined; // undefined = same origin when proxied in dev

const config = {
  API_URL,
};

export default config;
