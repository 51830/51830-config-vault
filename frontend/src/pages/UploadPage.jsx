import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function UploadPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { uploadConfig } = useAppStore();

  const [file, setFile] = useState(null);
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const uploadResult = await uploadConfig(id, file, note);
      setResult(uploadResult);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDone = () => {
    navigate(`/apps/${id}`);
  };

  const handleReview = () => {
    navigate(`/apps/${id}/review/${result.config_file.id}`);
  };

  const handleUploadAnother = () => {
    setFile(null);
    setNote('');
    setResult(null);
    setError('');
  };

  if (result) {
    return (
      <div className="upload-page">
        <div className="page-header">
          <h1>Upload Successful</h1>
        </div>
        <div className="upload-success">
          <div className="success-icon">&#10003;</div>
          <p>File <strong>{result.config_file.filename}</strong> uploaded successfully!</p>
          <p>Version: <strong>v{result.config_file.version}</strong></p>
          <p>Total items parsed: <strong>{result.total_items}</strong></p>

          <div className="parsed-keys-preview">
            <h3>Parsed Keys</h3>
            <div className="key-list">
              {result.parsed_keys.slice(0, 20).map((key) => (
                <span key={key} className="key-chip">{key}</span>
              ))}
              {result.parsed_keys.length > 20 && (
                <p>...and {result.parsed_keys.length - 20} more keys</p>
              )}
            </div>
          </div>

          <div className="upload-actions">
            <button className="btn-primary" onClick={handleReview}>
              Review & Select Items
            </button>
            <button className="btn-secondary" onClick={handleUploadAnother}>
              Upload Another File
            </button>
            <button className="btn-link" onClick={handleDone}>
              Back to App Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <div className="page-header">
        <div>
          <button className="btn-link" onClick={() => navigate(`/apps/${id}`)}>
            &larr; Back to App
          </button>
          <h1>Upload Config File</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        <div
          className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          {file ? (
            <div className="file-info">
              <p className="file-name">{file.name}</p>
              <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="drop-zone-text">
              <p>Drag and drop a config file here</p>
              <p className="text-muted">or click to browse</p>
              <p className="text-muted small">Supported: .env, .json, .yml, .yaml, .toml, .ini, .cfg, .php</p>
            </div>
          )}
          <input
            id="file-input"
            type="file"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept=".env,.json,.yml,.yaml,.toml,.ini,.cfg,.php"
          />
        </div>

        <div className="form-group">
          <label htmlFor="note">Note (optional)</label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What changed in this version?"
            rows={2}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(`/apps/${id}`)}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={uploading || !file}>
            {uploading ? 'Uploading & Parsing...' : 'Upload'}
          </button>
        </div>
      </form>
    </div>
  );
}