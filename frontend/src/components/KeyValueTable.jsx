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
        cell: ({ getValue }) => (
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