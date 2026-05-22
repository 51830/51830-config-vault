import { create } from 'zustand';
import apiClient from '../api/client';

const useAppStore = create((set, get) => ({
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),

  // Apps state
  apps: [],
  totalApps: 0,
  appsLoading: false,

  // Auth actions
  login: async (username, password) => {
    const response = await apiClient.post('/api/v1/auth/login', {
      username,
      password,
    });
    const { access_token, username: uname, role } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify({ username: uname, role }));
    set({ token: access_token, user: { username: uname, role }, isAuthenticated: true });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  // Apps actions
  fetchApps: async (page = 1, perPage = 20, search = '') => {
    set({ appsLoading: true });
    try {
      const params = { page, per_page: perPage };
      if (search) params.search = search;
      const response = await apiClient.get('/api/v1/apps', { params });
      set({ apps: response.data.items, totalApps: response.data.total, appsLoading: false });
    } catch (err) {
      set({ appsLoading: false });
      throw err;
    }
  },

  createApp: async (data) => {
    const response = await apiClient.post('/api/v1/apps', data);
    return response.data;
  },

  deleteApp: async (id) => {
    await apiClient.delete(`/api/v1/apps/${id}`);
  },

  // Config files state
  configFiles: [],
  totalConfigFiles: 0,
  configFilesLoading: false,

  // Detail actions
  fetchConfigFiles: async (appId, page = 1, perPage = 50) => {
    set({ configFilesLoading: true });
    try {
      const response = await apiClient.get(`/api/v1/apps/${appId}/configs`, {
        params: { page, per_page: perPage },
      });
      set({ configFiles: response.data.items, totalConfigFiles: response.data.total, configFilesLoading: false });
    } catch (err) {
      set({ configFilesLoading: false });
      throw err;
    }
  },

  fetchApp: async (id) => {
    const response = await apiClient.get(`/api/v1/apps/${id}`);
    return response.data;
  },

  // Upload actions
  uploadConfig: async (appId, file, note) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('note', note || '');
    const response = await apiClient.post(`/api/v1/apps/${appId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  fetchConfigItems: async (configId, selectedOnly = false) => {
    const params = { per_page: 500 };
    if (selectedOnly) params.selected_only = true;
    const response = await apiClient.get(`/api/v1/configs/${configId}/items`, { params });
    return response.data;
  },

  fetchDecryptedItem: async (itemId) => {
    const response = await apiClient.get(`/api/v1/configs/items/${itemId}?decrypt=true`);
    return response.data;
  },

  fetchItemsForDiff: async (configId) => {
    const response = await apiClient.get(`/api/v1/configs/${configId}/items`, {
      params: { per_page: 500 },
    });
    return response.data;
  },

  updateConfigItem: async (itemId, data) => {
    const response = await apiClient.put(`/api/v1/configs/items/${itemId}`, data);
    return response.data;
  },

  bulkSelectItems: async (configId, selectedKeys) => {
    const response = await apiClient.put(`/api/v1/configs/${configId}/items/bulk-select`, {
      selected_keys: selectedKeys,
    });
    return response.data;
  },

  // Users state
  users: [],
  usersLoading: false,

  // Users actions
  fetchUsers: async () => {
    set({ usersLoading: true });
    try {
      const response = await apiClient.get('/api/v1/users');
      set({ users: response.data, usersLoading: false });
    } catch (err) {
      set({ usersLoading: false });
      throw err;
    }
  },

  createUser: async (data) => {
    const response = await apiClient.post('/api/v1/users', data);
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await apiClient.put(`/api/v1/users/${userId}`, { role });
    return response.data;
  },

  deleteUser: async (userId) => {
    await apiClient.delete(`/api/v1/users/${userId}`);
  },
}));

export default useAppStore;