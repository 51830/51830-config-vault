import React, { useMemo, useState } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';

function flattenToLines(items) {
  return items.map((item) => `${item.key}=${item.value}`);
}

export default function DiffViewer({
  oldConfig,
  newConfig,
  showOnlyChanges = false,
  splitView = true,
}) {
  const oldLines = useMemo(() => flattenToLines(oldConfig?.items || []), [oldConfig]);
  const newLines = useMemo(() => flattenToLines(newConfig?.items || []), [newConfig]);

  const oldVersion = oldConfig?.version || '-';
  const newVersion = newConfig?.version || '-';

  const changedIndices = useMemo(() => {
    const indices = new Set();
    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      if (oldLines[i] !== newLines[i]) {
        indices.add(i);
      }
    }
    return indices;
  }, [oldLines, newLines]);

  const filteredOldLines = useMemo(() => {
    if (!showOnlyChanges) return oldLines;
    return oldLines.filter((_, i) => changedIndices.has(i));
  }, [oldLines, changedIndices, showOnlyChanges]);

  const filteredNewLines = useMemo(() => {
    if (!showOnlyChanges) return newLines;
    return newLines.filter((_, i) => changedIndices.has(i));
  }, [newLines, changedIndices, showOnlyChanges]);

  const stats = useMemo(() => {
    let added = 0, removed = 0, changed = 0;
    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      if (oldLines[i] === undefined) added++;
      else if (newLines[i] === undefined) removed++;
      else if (oldLines[i] !== newLines[i]) changed++;
    }
    return { added, removed, changed, total: newLines.length };
  }, [oldLines, newLines]);

  const displayOldLines = showOnlyChanges ? filteredOldLines : oldLines;
  const displayNewLines = showOnlyChanges ? filteredNewLines : newLines;

  return (
    <div className="diff-viewer">
      <div className="diff-header">
        <div className="diff-versions">
          <span className="diff-version-badge old">v{oldVersion}</span>
          <span className="diff-arrow">→</span>
          <span className="diff-version-badge new">v{newVersion}</span>
        </div>
        <div className="diff-stats">
          <span className="stat stat-added">+{stats.added} added</span>
          <span className="stat stat-removed">-{stats.removed} removed</span>
          <span className="stat stat-changed">~{stats.changed} changed</span>
          <span className="stat stat-total">{stats.total} total</span>
        </div>
      </div>

      <div className="diff-content">
        <ReactDiffViewer
          oldValue={displayOldLines.join('\n')}
          newValue={displayNewLines.join('\n')}
          splitView={splitView}
          showDiffOnly={showOnlyChanges}
          renderContent={(source) => (
            <span className="diff-line">{source}</span>
          )}
          leftTitle={oldVersion === '-' ? 'Nothing to compare' : `Version v${oldVersion}`}
          rightTitle={newVersion === '-' ? 'Nothing to compare' : `Version v${newVersion}`}
          styles={{
            variables: {
              light: {
                diffViewerBackground: '#fff',
                diffViewerColor: '#333',
                addedBackground: '#e6ffed',
                addedColor: '#24292e',
                removedBackground: '#ffeef0',
                removedColor: '#24292e',
                changedBackground: '#f1f8ff',
                changedColor: '#24292e',
                emptyLineBackground: '#fafbfc',
                gutterBackground: '#f7f8fa',
                gutterColor: '#6a737d',
                addedGutterBackground: '#cdffd8',
                removedGutterBackground: '#ffdce0',
                codeFoldBackground: '#f1f8ff',
                codeFoldGutterBackground: '#dbedff',
              },
            },
          }}
        />
      </div>
    </div>
  );
}