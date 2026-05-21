# [065] Create Diff Page

**Issue #27 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [062] sudah membuat App Detail Page dengan tombol Diff. Sekarang kita perlu halaman perbandingan antar versi config untuk melihat perubahan key-value.

## Goal
Buat Diff Page yang membandingkan dua versi config file, menampilkan key-value yang bertambah, berubah, dan dihapus.

## Steps

### 1. Tambahkan fungsi diff di store
```javascript
// Di frontend/src/store/useAppStore.js, tambahkan:

const useAppStore = create((set, get) => ({
  // ... existing state ...

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
}));
```

### 2. Buat frontend/src/pages/DiffPage.jsx
```jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function DiffPage() {
  const { id: appId, configId } = useParams();
  const [searchParams] = useSearchParams();
  const compareVersion = searchParams.get('compare');
  const navigate = useNavigate();
  const { fetchConfigFiles, fetchItemsForDiff } = useAppStore();

  const [currentVersion, setCurrentVersion] = useState(null);
  const [compareVersionData, setCompareVersionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [diffs, setDiffs] = useState({ added: [], removed: [], changed: [] });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Load current version items
        const currentResult = await fetchItemsForDiff(configId);
        const currentMap = {};
        currentResult.items.forEach((item) => {
          currentMap[item.key_path] = item;
        });

        let compareMap = {};
        if (compareVersion) {
          // Parse v number from compare param
          const vNum = parseInt(compareVersion.replace('v', ''));
          // Find the config file with that version
          const configsResult = await fetchConfigFiles(appId, 1, 100);
          const compareConfig = configsResult.items.find((cf) => cf.version === vNum);
          if (compareConfig) {
            const compareResult = await fetchItemsForDiff(compareConfig.id);
            compareResult.items.forEach((item) => {
              compareMap[item.key_path] = item;
            });
          }
          setCompareVersionData({ version: vNum });
        }

        setCurrentVersion({ items: currentResult.items });

        // Compute diff
        const added = [];
        const removed = [];
        const changed = [];

        Object.keys(currentMap).forEach((key) => {
          if (!compareMap[key]) {
            added.push({ key, value: currentMap[key].value_preview });
          } else if (currentMap[key].value_preview !== compareMap[key].value_preview) {
            changed.push({
              key,
              oldValue: compareMap[key].value_preview,
              newValue: currentMap[key].value_preview,
            });
          }
        });

        Object.keys(compareMap).forEach((key) => {
          if (!currentMap[key]) {
            removed.push({ key, value: compareMap[key].value_preview });
          }
        });

        setDiffs({ added, removed, changed });
      } catch (err) {
        console.error('Failed to load diff:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [configId, appId, compareVersion, fetchConfigFiles, fetchItemsForDiff]);

  if (loading) return <div className="loading">Loading diff...</div>;

  return (
    <div className="diff-page">
      <div className="page-header">
        <div>
          <button className="btn-link" onClick={() => navigate(`/apps/${appId}`)}>
            &larr; Back to App
          </button>
          <h1>Version Diff</h1>
        </div>
      </div>

      <div className="diff-info">
        <span className="version-badge">Current: v{currentVersion?.items?.[0]?.config_file_id || '?'}</span>
        {compareVersionData && (
          <span className="version-badge compare">Comparing with: v{compareVersionData.version}</span>
        )}
      </div>

      <div className="diff-sections">
        {diffs.added.length > 0 && (
          <div className="diff-section">
            <h3 className="diff-title added">Added ({diffs.added.length})</h3>
            <table className="data-table diff-table">
              <thead>
                <tr><th>Key</th><th>Value</th></tr>
              </thead>
              <tbody>
                {diffs.added.map((d) => (
                  <tr key={d.key} className="diff-added">
                    <td><code>{d.key}</code></td>
                    <td><code>{d.value}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {diffs.removed.length > 0 && (
          <div className="diff-section">
            <h3 className="diff-title removed">Removed ({diffs.removed.length})</h3>
            <table className="data-table diff-table">
              <thead>
                <tr><th>Key</th><th>Value</th></tr>
              </thead>
              <tbody>
                {diffs.removed.map((d) => (
                  <tr key={d.key} className="diff-removed">
                    <td><code>{d.key}</code></td>
                    <td><code>{d.value}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {diffs.changed.length > 0 && (
          <div className="diff-section">
            <h3 className="diff-title changed">Changed ({diffs.changed.length})</h3>
            <table className="data-table diff-table">
              <thead>
                <tr><th>Key</th><th>Old Value</th><th>New Value</th></tr>
              </thead>
              <tbody>
                {diffs.changed.map((d) => (
                  <tr key={d.key} className="diff-changed">
                    <td><code>{d.key}</code></td>
                    <td className="old-value"><code>{d.oldValue}</code></td>
                    <td className="new-value"><code>{d.newValue}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {diffs.added.length === 0 && diffs.removed.length === 0 && diffs.changed.length === 0 && (
          <div className="empty-state">No differences found between these versions.</div>
        )}
      </div>
    </div>
  );
}
```

### 3. Update App.jsx routing
```jsx
import DiffPage from './pages/DiffPage';

<Route path="/apps/:id/diff/:configId" element={<ProtectedRoute><DiffPage /></ProtectedRoute>} />
```

## Verification
- [ ] Halaman diff menampilkan perbandingan antar versi
- [ ] Section "Added" menampilkan key baru dengan highlight hijau
- [ ] Section "Removed" menampilkan key yang dihapus dengan highlight merah
- [ ] Section "Changed" menampilkan key dengan old/new value
- [ ] Jika tidak ada perbedaan, tampilkan empty state
- [ ] Version badges menampilkan versi yang dibandingkan

## Depends on
#20

