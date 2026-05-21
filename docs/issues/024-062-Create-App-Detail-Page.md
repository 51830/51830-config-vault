# [062] Create App Detail Page

**Issue #24 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [061] sudah membuat Apps List Page. Sekarang kita perlu halaman detail app yang menampilkan daftar versi/config files, dengan navigasi ke upload, review, dan diff.

## Goal
Buat App Detail Page yang menampilkan info aplikasi, daftar versi config files, dan tombol aksi (upload, review, diff, export).

## Steps

### 1. Tambahkan fungsi API di store
```javascript
// Di frontend/src/store/useAppStore.js, tambahkan:

const useAppStore = create((set, get) => ({
  // ... existing state ...

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
}));
```

### 2. Buat frontend/src/pages/AppDetailPage.jsx
```jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function AppDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchApp, fetchConfigFiles, configFiles, totalConfigFiles, configFilesLoading } = useAppStore();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const appData = await fetchApp(id);
        setApp(appData);
        await fetchConfigFiles(id);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load app details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, fetchApp, fetchConfigFiles]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!app) return <div className="error-state">App not found</div>;

  return (
    <div className="app-detail-page">
      <div className="page-header">
        <div>
          <button className="btn-link" onClick={() => navigate('/apps')}>&larr; Back to Apps</button>
          <h1>{app.name}</h1>
          {app.description && <p className="app-description">{app.description}</p>}
          {app.note && <p className="app-note">Note: {app.note}</p>}
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => navigate(`/apps/${id}/upload`)}>
            Upload Config
          </button>
        </div>
      </div>

      <div className="version-history">
        <h2>
          Version History
          <span className="badge">{totalConfigFiles} versions</span>
        </h2>

        {configFilesLoading ? (
          <div className="loading">Loading versions...</div>
        ) : configFiles.length === 0 ? (
          <div className="empty-state">
            No config files uploaded yet. Upload your first config file!
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Filename</th>
                <th>Type</th>
                <th>Note</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {configFiles.map((cf) => (
                <tr key={cf.id}>
                  <td><span className="version-badge">v{cf.version}</span></td>
                  <td>{cf.filename}</td>
                  <td><span className="file-type">{cf.file_type}</span></td>
                  <td>{cf.note || '-'}</td>
                  <td>{cf.uploaded_at}</td>
                  <td className="action-buttons">
                    <button
                      className="btn-sm"
                      onClick={() => navigate(`/apps/${id}/review/${cf.id}`)}
                    >
                      Review
                    </button>
                    {cf.version > 1 && (
                      <button
                        className="btn-sm"
                        onClick={() => navigate(`/apps/${id}/diff/${cf.id}?compare=v${cf.version - 1}`)}
                      >
                        Diff
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

### 3. Update App.jsx routing
```jsx
import AppDetailPage from './pages/AppDetailPage';

<Route path="/apps/:id" element={<ProtectedRoute><AppDetailPage /></ProtectedRoute>} />
<Route path="/apps/:id/upload" element={<ProtectedRoute><div>Upload Page (coming soon)</div></ProtectedRoute>} />
<Route path="/apps/:id/review/:configId" element={<ProtectedRoute><div>Review Page (coming soon)</div></ProtectedRoute>} />
<Route path="/apps/:id/diff/:configId" element={<ProtectedRoute><div>Diff Page (coming soon)</div></ProtectedRoute>} />
```

## Verification
- [ ] Halaman `/apps/1` menampilkan detail app (nama, description, note)
- [ ] Daftar versi config files tampil dengan version badge
- [ ] Tombol "Upload Config" navigasi ke `/apps/{id}/upload`
- [ ] Tombol "Review" di setiap versi navigasi ke review page
- [ ] Tombol "Diff" muncul untuk versi > 1
- [ ] Back button kembali ke `/apps`
- [ ] Empty state ketika belum ada config files
- [ ] App tidak ditemukan menampilkan error

## Depends on
#20

