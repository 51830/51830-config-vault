import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import ExportButton from '../components/ExportButton';

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
                    <ExportButton
                      configFileId={cf.id}
                      appName={app.name}
                      version={cf.version}
                      fileType={cf.file_type}
                    />
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