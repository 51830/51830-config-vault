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