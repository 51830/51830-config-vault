import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AppsPage from './pages/AppsPage';
import AppDetailPage from './pages/AppDetailPage';
import UploadPage from './pages/UploadPage';
import ConfigReviewPage from './pages/ConfigReviewPage';
import DiffPage from './pages/DiffPage';
import UsersPage from './pages/UsersPage';
import Navbar from './components/Navbar';
import useAppStore from './store/useAppStore';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const user = useAppStore((state) => state.user);
  if (user?.role !== 'admin') {
    return <Navigate to="/apps" replace />;
  }
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  );
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
              <AppLayout>
                <AppsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/apps/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AppDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/apps/:id/upload"
          element={
            <ProtectedRoute>
              <AppLayout>
                <UploadPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/apps/:id/review/:configId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ConfigReviewPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/apps/:id/diff/:configId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DiffPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AppLayout>
                  <UsersPage />
                </AppLayout>
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/apps" replace />} />
      </Routes>
    </BrowserRouter>
  );
}