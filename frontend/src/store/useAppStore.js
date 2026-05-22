import { create } from 'zustand';
import apiClient from '../api/client';

const useAppStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),

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
}));

export default useAppStore;