# [072] Create VersionTimeline Component

**Issue #30 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

[062] sudah membuat App Detail Page. Sekarang kita perlu membuat komponen VersionTimeline untuk menampilkan riwayat versi upload file konfigurasi per aplikasi secara kronologis.

## Goal
Buat komponen VersionTimeline yang menampilkan daftar versi upload file konfigurasi dalam bentuk timeline vertikal, dengan informasi timestamp, jumlah item, dan status.

## Steps

### 1. Buat komponen `frontend/src/components/VersionTimeline.jsx`
Komponen ini menerima:
- `versions` â€” array of { id, version, filename, note, uploaded_at, item_count }
- `activeVersion` â€” current active version ID
- `onVersionClick` â€” callback ketika versi diklik
- `onCompare` â€” callback untuk compare dua versi

```jsx
import React, { useState } from 'react';

export default function VersionTimeline({
  versions = [],
  activeVersion,
  onVersionClick,
  onCompare,
}) {
  const [compareMode, setCompareMode] = useState(false);
  const [compareFrom, setCompareFrom] = useState(null);
  const [compareTo, setCompareTo] = useState(null);

  if (versions.length === 0) {
    return (
      <div className="timeline-empty">
        No versions uploaded yet.
      </div>
    );
  }

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  const handleVersionClick = (version) => {
    if (compareMode) {
      if (!compareFrom) {
        setCompareFrom(version.id);
      } else if (!compareTo && version.id !== compareFrom) {
        setCompareTo(version.id);
        onCompare?.(compareFrom, version.id);
        setCompareMode(false);
        setCompareFrom(null);
        setCompareTo(null);
      }
    } else {
      onVersionClick?.(version.id);
    }
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setCompareFrom(null);
    setCompareTo(null);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="version-timeline">
      <div className="timeline-toolbar">
        <h3>Version History</h3>
        <button
          className={`btn-compare ${compareMode ? 'active' : ''}`}
          onClick={toggleCompareMode}
          disabled={versions.length < 2}
        >
          {compareMode ? 'Cancel Compare' : 'Compare Versions'}
        </button>
      </div>

      {compareMode && (
        <div className="compare-hint">
          {!compareFrom
            ? 'Click the first version to compare from'
            : 'Click the second version to compare to'}
        </div>
      )}

      <div className="timeline-list">
        {sortedVersions.map((version, index) => {
          const isActive = version.id === activeVersion;
          const isSelectedFrom = version.id === compareFrom;
          const isLast = index === sortedVersions.length - 1;

          return (
            <div
              key={version.id}
              className={[
                'timeline-item',
                isActive ? 'active' : '',
                isSelectedFrom ? 'selected-from' : '',
                compareMode && !isSelectedFrom ? 'compare-selectable' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleVersionClick(version)}
            >
              <div className="timeline-node">
                <div className="timeline-dot" />
                {!isLast && <div className="timeline-line" />}
              </div>

              <div className="timeline-card">
                <div className="timeline-card-header">
                  <span className="version-label">
                    v{version.version}
                    {isActive && <span className="active-badge">Current</span>}
                    {isSelectedFrom && <span className="compare-badge">From</span>}
                  </span>
                  <span className="version-date">{formatDate(version.uploaded_at)}</span>
                </div>
                <div className="timeline-card-body">
                  <div className="version-meta">
                    <span className="meta-filename">{version.filename}</span>
                    <span className="meta-count">{version.item_count} items</span>
                  </div>
                  {version.note && (
                    <p className="version-note">{version.note}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 2. Tambahkan CSS styling
```css
.version-timeline {
  font-size: 14px;
}

.timeline-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.timeline-toolbar h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.btn-compare {
  padding: 6px 16px;
  border: 1px solid #1976d2;
  border-radius: 4px;
  background: white;
  color: #1976d2;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-compare:hover:not(:disabled) {
  background: #e3f2fd;
}

.btn-compare.active {
  background: #ff9800;
  border-color: #ff9800;
  color: white;
}

.btn-compare:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.compare-hint {
  padding: 8px 12px;
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #f57f17;
}

.timeline-list {
  position: relative;
}

.timeline-item {
  display: flex;
  gap: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.timeline-item:hover {
  opacity: 0.85;
}

.timeline-item.compare-selectable {
  cursor: pointer;
}

.timeline-item.compare-selectable:hover .timeline-card {
  border-color: #ff9800;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2);
}

.timeline-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 20px;
}

.timeline-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #e0e0e0;
  border: 2px solid #bdbdbd;
  z-index: 1;
  flex-shrink: 0;
}

.timeline-item.active .timeline-dot {
  background: #1976d2;
  border-color: #1565c0;
}

.timeline-item.selected-from .timeline-dot {
  background: #ff9800;
  border-color: #f57c00;
}

.timeline-line {
  width: 2px;
  flex: 1;
  background: #e0e0e0;
  min-height: 20px;
}

.timeline-card {
  flex: 1;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.timeline-item.active .timeline-card {
  border-color: #1976d2;
  background: #f5f9ff;
}

.timeline-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.version-label {
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
}

.active-badge {
  display: inline-block;
  padding: 1px 8px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.compare-badge {
  display: inline-block;
  padding: 1px 8px;
  background: #fff3e0;
  color: #e65100;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.version-date {
  font-size: 12px;
  color: #999;
}

.version-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 13px;
}

.meta-filename {
  color: #555;
  font-family: 'Consolas', 'Courier New', monospace;
  background: #f5f5f5;
  padding: 1px 6px;
  border-radius: 3px;
}

.meta-count {
  color: #888;
}

.version-note {
  margin: 8px 0 0;
  color: #666;
  font-size: 13px;
  font-style: italic;
}

.timeline-empty {
  text-align: center;
  padding: 32px;
  color: #999;
  font-style: italic;
}
```

## Verification
- [ ] Timeline menampilkan versi secara urut (terbaru di atas)
- [ ] Setiap item menampilkan version label, filename, item count, timestamp
- [ ] Active version di-highlight dengan border biru
- [ ] Klik pada versi memanggil onVersionClick
- [ ] Compare mode: klik dua versi memanggil onCompare
- [ ] Compare mode hint ditampilkan
- [ ] Empty state muncul ketika versions kosong
- [ ] Button Compare Versions disabled jika hanya ada 1 versi
- [ ] Note ditampilkan jika ada

## Depends on
#22
