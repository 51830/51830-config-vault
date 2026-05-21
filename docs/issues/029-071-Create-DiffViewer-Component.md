# [071] Create DiffViewer Component

**Issue #29 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

[065] sudah membuat Diff Page. Sekarang kita perlu membuat komponen DiffViewer yang dapat menampilkan perbandingan dua versi file konfigurasi secara side-by-side.

## Goal
Buat komponen DiffViewer menggunakan react-diff-viewer yang menampilkan perbedaan antara dua versi konfigurasi dengan highlight baris yang berubah.

## Steps

### 1. Install react-diff-viewer (jika belum ada)
```bash
npm install react-diff-viewer-continued
```

### 2. Buat komponen `frontend/src/components/DiffViewer.jsx`
Komponen ini menerima:
- `oldConfig` â€” object { version, items: [{ key, value }] }
- `newConfig` â€” object { version, items: [{ key, value }] }
- `showOnlyChanges` â€” boolean untuk filter hanya baris yang berubah
- `splitView` â€” boolean untuk toggle side-by-side vs unified view

Proses: flatten kedua config jadi string key=value, lalu bandingkan dengan diff.

```jsx
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
          <span className="diff-arrow">+</span>
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
```

### 3. Tambahkan CSS styling
```css
.diff-viewer {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.diff-versions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.diff-version-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
}

.diff-version-badge.old {
  background: #ffeef0;
  color: #cb2431;
}

.diff-version-badge.new {
  background: #e6ffed;
  color: #22863a;
}

.diff-arrow {
  color: #999;
  font-size: 16px;
}

.diff-stats {
  display: flex;
  gap: 12px;
  font-size: 13px;
}

.stat-added { color: #22863a; }
.stat-removed { color: #cb2431; }
.stat-changed { color: #0366d6; }
.stat-total { color: #666; }

.diff-content {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
}

.diff-line {
  white-space: pre;
}
```

## Verification
- [ ] DiffViewer menampilkan side-by-side diff dari dua versi konfigurasi
- [ ] Baris yang ditambahkan di-highlight hijau
- [ ] Baris yang dihapus di-highlight merah
- [ ] Baris yang berubah di-highlight biru
- [ ] Header menampilkan versi yang dibandingkan
- [ ] Statistik perubahan (added, removed, changed, total) muncul
- [ ] showOnlyChanges filter berfungsi
- [ ] Empty state ketika tidak ada data untuk dibandingkan
- [ ] Render baris kode dengan font monospace

## Depends on
#22
