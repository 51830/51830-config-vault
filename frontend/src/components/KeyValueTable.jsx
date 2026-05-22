import React from 'react';

export default function KeyValueTable({ items, onToggleSelect, onToggleSensitive, showSelect = true }) {
  if (!items || items.length === 0) {
    return <div className="empty-state">No items to display</div>;
  }

  return (
    <table className="data-table key-value-table">
      <thead>
        <tr>
          {showSelect && <th className="col-select">Select</th>}
          <th className="col-key">Key</th>
          <th className="col-value">Value</th>
          <th className="col-sensitive">Sensitive</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={item.id || index} className={item.is_selected ? 'selected-row' : ''}>
            {showSelect && (
              <td>
                <input
                  type="checkbox"
                  checked={item.is_selected}
                  onChange={() => onToggleSelect && onToggleSelect(item.id || index)}
                />
              </td>
            )}
            <td><code>{item.key_path}</code></td>
            <td className="value-cell">
              {item.is_sensitive ? (
                <span className="sensitive-value">••••••••</span>
              ) : (
                <code>{item.value_preview || item.value || 'encrypted'}</code>
              )}
            </td>
            <td>
              {item.is_sensitive ? (
                <span className="sensitive-badge" onClick={() => onToggleSensitive && onToggleSensitive(item.id || index)}>
                  Sensitive
                </span>
              ) : (
                <span className="normal-badge" onClick={() => onToggleSensitive && onToggleSensitive(item.id || index)}>
                  Normal
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}