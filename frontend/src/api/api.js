import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Axios Request Interceptor to attach Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const registerUser = async (username, email, password) => {
  const response = await api.post('/auth/register', { username, email, password });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data && response.data.access_token) {
    localStorage.setItem('token', response.data.access_token);
    // Store email to identify user
    localStorage.setItem('user_email', email);
  }
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user_email');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const getLoggedInUserEmail = () => {
  return localStorage.getItem('user_email') || 'User';
};

// Organizations endpoints
export const getOrganizations = async () => {
  const response = await api.get('/organizations/');
  return response.data;
};

export const createOrganization = async (name) => {
  const response = await api.post('/organizations/', { name });
  return response.data;
};

// Projects endpoints
export const getProjects = async (orgId) => {
  const response = await api.get(`/projects/${orgId}`);
  return response.data;
};

export const createProject = async (name, orgId) => {
  const response = await api.post('/projects/', { name, organization_id: orgId });
  return response.data;
};

// Queues endpoints
export const getQueues = async (projectId) => {
  const response = await api.get(`/queues/${projectId}`);
  return response.data;
};

export const createQueue = async (projectId, name, priority = 1, status = 'active') => {
  const response = await api.post(`/queues/?project_id=${projectId}`, { name, priority, status });
  return response.data;
};

export const updateQueueStatus = async (queueId, status) => {
  const response = await api.patch(`/queues/${queueId}/status`, { status });
  return response.data;
};

export default api;
