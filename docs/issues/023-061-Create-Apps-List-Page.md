# [061] Create Apps List Page

**Issue #23 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [060] sudah membuat login page. Sekarang kita perlu membuat halaman utama yang menampilkan daftar aplikasi dengan fitur search dan create app.

## Goal
Buat Apps List Page dengan tabel daftar aplikasi, fitur search, create app modal, dan navigasi ke detail app.

## Steps

### 1. Tambahkan fungsi API di store
```javascript
// Di frontend/src/store/useAppStore.js, tambahkan:

const useAppStore = create((set, get) => ({
  // ... existing state ...

  // Apps state
  apps: [],
  totalApps: 0,
  appsLoading: false,

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
}));
```

### 2. Buat frontend/src/pages/AppsPage.jsx

```jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function AppsPage() {
  const navigate = useNavigate();
  const { apps, totalApps, appsLoading, fetchApps, createApp, deleteApp } = useAppStore();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', note: '' });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 20;

  const loadApps = useCallback(() => {
    fetchApps(page, perPage, search);
  }, [page, search, fetchApps]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadApps();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, loadApps]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.name.trim()) {
      setCreateError('App name is required');
      return;
    }

    setCreating(true);
    try {
      await createApp(createForm);
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', note: '' });
      loadApps();
    } catch (err) {
      setCreateError(err.response?.data?.detail || 'Failed to create app');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete app "${name}"? This will also delete all config files and items.`)) {
      return;
    }
    try {
      await deleteApp(id);
      loadApps();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete app');
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalApps / perPage));

  return (
    <div className="apps-page">
      <div className="page-header">
        <h1>Applications</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Add Application
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search applications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {appsLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Slug</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    {search ? 'No applications match your search.' : 'No applications yet. Create your first application!'}
                  </td>
                </tr>
              ) : (
                apps.map((app) => (
                  <tr key={app.id} onClick={() => navigate(`/apps/${app.id}`)} style={{ cursor: 'pointer' }}>
                    <td>{app.name}</td>
                    <td>{app.description || '-'}</td>
                    <td>{app.slug}</td>
                    <td>{app.updated_at}</td>
                    <td>
                      <button
                        className="btn-danger-sm"
                        onClick={(e) => { e.stopPropagation(); handleDelete(app.id, app.name); }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Application</h2>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreate}>
              {createError && <div className="error-message">{createError}</div>}
              <div className="form-group">
                <label>App Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="My Application"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="form-group">
                <label>Note</label>
                <textarea
                  value={createForm.note}
                  onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
                  placeholder="Optional note"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. Update App.jsx routing
```jsx
import AppsPage from './pages/AppsPage';

// Route untuk apps
<Route path="/apps" element={<ProtectedRoute><AppsPage /></ProtectedRoute>} />
```

## Verification
- [ ] Halaman `/apps` menampilkan daftar aplikasi dari API
- [ ] Search bar memfilter aplikasi (dengan debounce)
- [ ] Klik tombol "+ Add Application" membuka modal
- [ ] Create app dengan form validasi (name required)
- [ ] Create app sukses menutup modal dan refresh list
- [ ] Klik row navigasi ke `/apps/{id}`
- [ ] Delete button dengan konfirmasi
- [ ] Pagination untuk banyak data
- [ ] Empty state ketika tidak ada aplikasi

## Depends on
#20
