import React, { useState } from 'react';
import apiClient from '../api/client';

export default function ExportButton({ configFileId, filename }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(
        `/api/v1/export/config-files/${configFileId}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const ext = filename.split('.').pop();
      link.setAttribute('download', `config-${configFileId}.${ext}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Export failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="export-button-wrapper">
      <button className="btn-sm" onClick={handleExport} disabled={loading}>
        {loading ? 'Exporting...' : 'Export'}
      </button>
      {error && <span className="export-error">Error: {error}</span>}
    </span>
  );
}