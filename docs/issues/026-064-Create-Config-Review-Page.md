# [064] Create Config Review Page

**Issue #26 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

Issue [063] sudah membuat Upload Page. Setelah upload, user perlu halaman review untuk melihat parsed key-value, memilih mana yang akan disimpan (is_selected), dan menandai sensitif.

## Goal
Buat Config Review Page yang menampilkan tabel key-value dari hasil parsing dengan checkbox selection, sensitive toggle, dan save selection.

## Steps

### 1. Buat KeyValueTable component frontend/src/components/KeyValueTable.jsx
```jsx
import React from 'react';

export default function KeyValueTable({ items, onToggleSelect, onToggleSensitive, showSelect = true }) {
  if (!items || items.length === 0) {
    return <div className="empty-state">No items to display</div>;
  }

  return (
    <table className="data-table key-value-table">
      <thead>
        <tr>
          {showSelect && <th className="col-select">Select</th>}
          <th className="col-key">Key</th>
          <th className="col-value">Value</th>
          <th className="col-sensitive">Sensitive</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={item.id || index} className={item.is_selected ? 'selected-row' : ''}>
            {showSelect && (
              <td>
                <input
                  type="checkbox"
                  checked={item.is_selected}
                  onChange={() => onToggleSelect && onToggleSelect(item.id || index)}
                />
              </td>
            )}
            <td><code>{item.key_path}</code></td>
            <td className="value-cell">
              {item.is_sensitive ? (
                <span className="sensitive-value">â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢</span>
              ) : (
                <code>{item.value_preview || item.value || 'encrypted'}</code>
              )}
            </td>
            <td>
              {item.is_sensitive ? (
                <span className="sensitive-badge" onClick={() => onToggleSensitive && onToggleSensitive(item.id || index)}>
                  Sensitive
                </span>
              ) : (
                <span className="normal-badge" onClick={() => onToggleSensitive && onToggleSensitive(item.id || index)}>
                  Normal
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 2. Buat frontend/src/pages/ConfigReviewPage.jsx
```jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import KeyValueTable from '../components/KeyValueTable';

export default function ConfigReviewPage() {
  const { id: appId, configId } = useParams();
  const navigate = useNavigate();
  const { fetchConfigItems, updateConfigItem, bulkSelectItems } = useAppStore();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchConfigItems(configId);
        setItems(result.items.map((item) => ({ ...item, value: item.value_preview })));
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load config items');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [configId, fetchConfigItems]);

  const handleToggleSelect = useCallback(async (itemId) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, is_selected: !i.is_selected } : i))
    );
  }, [items]);

  const handleToggleSensitive = useCallback(async (itemId) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const newSensitive = !item.is_sensitive;
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, is_sensitive: newSensitive } : i))
    );
    try {
      await updateConfigItem(itemId, { is_sensitive: newSensitive });
    } catch (err) {
      // Revert on error
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, is_sensitive: !newSensitive } : i))
      );
    }
  }, [items, updateConfigItem]);

  const handleSaveSelection = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const selectedKeys = items.filter((i) => i.is_selected).map((i) => i.key_path);
      await bulkSelectItems(configId, selectedKeys);
      setSuccess(`Selection saved: ${selectedKeys.length} items selected`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save selection');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = () => {
    setItems((prev) => prev.map((i) => ({ ...i, is_selected: true })));
  };

  const handleDeselectAll = () => {
    setItems((prev) => prev.map((i) => ({ ...i, is_selected: false })));
  };

  const selectedCount = items.filter((i) => i.is_selected).length;

  return (
    <div className="review-page">
      <div className="page-header">
        <div>
          <button className="btn-link" onClick={() => navigate(`/apps/${appId}`)}>
            &larr; Back to App
          </button>
          <h1>Review Config Items</h1>
        </div>
        <div className="header-actions">
          <button className="btn-sm" onClick={handleSelectAll}>Select All</button>
          <button className="btn-sm" onClick={handleDeselectAll}>Deselect All</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="selection-info">
        <span className="badge">{selectedCount} of {items.length} selected</span>
      </div>

      {loading ? (
        <div className="loading">Loading items...</div>
      ) : (
        <KeyValueTable
          items={items}
          onToggleSelect={handleToggleSelect}
          onToggleSensitive={handleToggleSensitive}
        />
      )}

      <div className="review-actions">
        <button
          className="btn-primary"
          onClick={handleSaveSelection}
          disabled={saving || loading}
        >
          {saving ? 'Saving...' : 'Save Selection'}
        </button>
      </div>
    </div>
  );
}
```

### 3. Update App.jsx routing
```jsx
import ConfigReviewPage from './pages/ConfigReviewPage';

<Route path="/apps/:id/review/:configId" element={<ProtectedRoute><ConfigReviewPage /></ProtectedRoute>} />
```

## Verification
- [ ] Tabel key-value menampilkan semua parsed items
- [ ] Checkbox selection berfungsi (toggle select)
- [ ] Klik badge sensitive/normal toggle is_sensitive
- [ ] Tombol "Select All" dan "Deselect All" berfungsi
- [ ] Tombol "Save Selection" menyimpan pilihan
- [ ] Counter menampilkan jumlah selected items
- [ ] Value sensitif ditampilkan sebagai `â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢`

## Depends on
#20

