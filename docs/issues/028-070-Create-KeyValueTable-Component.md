# [070] Create KeyValueTable Component

**Issue #28 | Status: OPEN**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

[060] sudah membuat halaman Login. Sekarang kita perlu membuat komponen KeyValueTable untuk menampilkan key-value pair dari file konfigurasi. Komponen ini akan digunakan di AppDetailPage, UploadPage, dan ConfigReviewPage.

## Goal
Buat komponen KeyValueTable menggunakan TanStack Table yang bisa menampilkan key-value pairs dengan fitur: masking nilai sensitif, checkbox selection, dan inline edit.

## Steps

### 1. Install TanStack Table (jika belum ada)
```bash
npm install @tanstack/react-table
```

### 2. Buat komponen `frontend/src/components/KeyValueTable.jsx`
Buat komponen yang menerima props:
- `data` â€” array of { key, value, is_sensitive, is_selected }
- `onSelectionChange` â€” callback ketika selection berubah
- `onValueEdit` â€” callback ketika value di-edit
- `showSelection` â€” boolean untuk toggle checkbox column
- `readonly` â€” boolean untuk disable edit

```jsx
import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import SensitiveBadge from './SensitiveBadge';

export default function KeyValueTable({
  data,
  onSelectionChange,
  onValueEdit,
  showSelection = true,
  readonly = false,
}) {
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');

  const allSelected = data.length > 0 && selectedKeys.size === data.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedKeys(new Set());
      onSelectionChange?.([]);
    } else {
      const all = new Set(data.map((item) => item.key));
      setSelectedKeys(all);
      onSelectionChange?.(data.map((item) => item.key));
    }
  };

  const handleSelect = (key) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedKeys(next);
    onSelectionChange?.(Array.from(next));
  };

  const handleStartEdit = (item) => {
    if (readonly) return;
    setEditingKey(item.key);
    setEditValue(item.value);
  };

  const handleSaveEdit = (key) => {
    onValueEdit?.(key, editValue);
    setEditingKey(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const columns = useMemo(() => {
    const cols = [];

    if (showSelection) {
      cols.push({
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={handleSelectAll}
            title="Select all"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedKeys.has(row.original.key)}
            onChange={() => handleSelect(row.original.key)}
          />
        ),
        size: 50,
      });
    }

    cols.push(
      {
        header: 'Key',
        accessorKey: 'key',
        cell: ({ getValue, row }) => (
          <code className="key-cell">{getValue()}</code>
        ),
      },
      {
        header: 'Value',
        id: 'value',
        cell: ({ row }) => {
          const item = row.original;
          if (editingKey === item.key) {
            return (
              <div className="edit-cell">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                  className="edit-input"
                />
                <button onClick={() => handleSaveEdit(item.key)} title="Save">+/-</button>
                <button onClick={handleCancelEdit} title="Cancel">X</button>
              </div>
            );
          }

          return (
            <div
              className="value-cell"
              onClick={() => handleStartEdit(item)}
              title={readonly ? '' : 'Click to edit'}
            >
              {item.is_sensitive ? '********' : item.value || '(empty)'}
            </div>
          );
        },
      },
      {
        header: 'Sensitive',
        id: 'sensitive',
        cell: ({ row }) => (
          <SensitiveBadge isSensitive={row.original.is_sensitive} />
        ),
        size: 100,
      }
    );

    return cols;
  }, [data, showSelection, selectedKeys, allSelected, editingKey, editValue, readonly]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="key-value-table-wrapper">
      <table className="key-value-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{ width: header.getSize() }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="empty-state">
                No configuration items found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

### 3. Buat komponen `frontend/src/components/SensitiveBadge.jsx`
```jsx
import React from 'react';

export default function SensitiveBadge({ isSensitive }) {
  return (
    <span className={`badge ${isSensitive ? 'badge-sensitive' : 'badge-normal'}`}>
      {isSensitive ? 'Sensitive' : 'Normal'}
    </span>
  );
}
```

### 4. Tambahkan CSS styling
Di `frontend/src/App.css` atau file CSS global:

```css
.key-value-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.key-value-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.key-value-table th {
  background: #f5f5f5;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #e0e0e0;
}

.key-value-table td {
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.key-value-table tr:last-child td {
  border-bottom: none;
}

.key-value-table tr:hover {
  background: #fafafa;
}

.key-cell {
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'Consolas', 'Courier New', monospace;
  word-break: break-all;
}

.value-cell {
  cursor: pointer;
  min-height: 24px;
  color: #333;
}

.value-cell:hover {
  color: #1976d2;
}

.edit-cell {
  display: flex;
  gap: 4px;
  align-items: center;
}

.edit-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #1976d2;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'Consolas', 'Courier New', monospace;
}

.edit-cell button {
  padding: 2px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.edit-cell button:hover {
  background: #f0f0f0;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-sensitive {
  background: #fff3e0;
  color: #e65100;
}

.badge-normal {
  background: #e8f5e9;
  color: #2e7d32;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #999;
  font-style: italic;
}
```

## Verification
- [ ] KeyValueTable merender semua key-value pair dengan benar
- [ ] Checkbox selection berfungsi (select all, select individual)
- [ ] Klik pada value membuka inline edit mode
- [ ] Save edit memanggil onValueEdit callback
- [ ] Cancel edit membatalkan perubahan
- [ ] Sensitive value ditampilkan sebagai ***
- [ ] SensitiveBadge menampilkan 'Sensitive' atau 'Normal' dengan warna berbeda
- [ ] Empty state muncul ketika data kosong
- [ ] Komponen bisa di-render dalam mode readonly (tanpa edit)

## Depends on
#22
