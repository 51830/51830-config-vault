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
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, is_selected: !i.is_selected } : i))
    );
  }, []);

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