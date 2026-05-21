# [060] Create Login Page

**Issue #22 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [021] sudah membuat login endpoint. Sekarang kita perlu membuat halaman login di frontend React.

## Goal
Buat Login Page dengan form username/password, menyimpan JWT token ke localStorage, redirect ke halaman apps list setelah login berhasil.

## Steps

### 1. Buat API client backend/app/api/client.js
```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk attach token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor untuk handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2. Buat store backend/app/store/useAppStore.js
```javascript
import { create } from 'zustand';
import apiClient from '../api/client';

const useAppStore = create((set, get) => ({
  // Auth state
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),

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
}));

export default useAppStore;
```

### 3. Buat halaman login frontend/src/pages/LoginPage.jsx
```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/apps');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      navigate('/apps');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Login failed. Please try again.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Config Vault</h1>
        <p className="subtitle">Centralized Configuration Management</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 4. Update App.jsx dengan routing
```jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import useAppStore from './store/useAppStore';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/apps"
          element={
            <ProtectedRoute>
              <div>Apps List (coming soon)</div>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/apps" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Verification
- [ ] Halaman login tampil di `http://localhost:3000/login`
- [ ] Form login dengan username/password benar redirect ke `/apps`
- [ ] Form login dengan username/password salah menampilkan error message
- [ ] Form kosong menampilkan validation error
- [ ] Setelah login, token tersimpan di localStorage
- [ ] User sudah login langsung redirect ke `/apps`

## Depends on
#20
