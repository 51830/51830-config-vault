import React from 'react';

export default function SensitiveBadge({ isSensitive }) {
  return (
    <span className={`badge ${isSensitive ? 'badge-sensitive' : 'badge-normal'}`}>
      {isSensitive ? 'Sensitive' : 'Normal'}
    </span>
  );
}