import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AppsPage from './pages/AppsPage';
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
        <Route path="/" element={<Navigate to="/apps" replace />} />
      </Routes>
    </BrowserRouter>
  );
}