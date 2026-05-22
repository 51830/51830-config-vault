import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AppsPage from './pages/AppsPage';
import AppDetailPage from './pages/AppDetailPage';
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
              <AppsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/apps/:id"
          element={
            <ProtectedRoute>
              <AppDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/apps/:id/upload"
          element={
            <ProtectedRoute>
              <div>Upload Page (coming soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/apps/:id/review/:configId"
          element={
            <ProtectedRoute>
              <div>Review Page (coming soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/apps/:id/diff/:configId"
          element={
            <ProtectedRoute>
              <div>Diff Page (coming soon)</div>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/apps" replace />} />
      </Routes>
    </BrowserRouter>
  );
}