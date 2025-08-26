import React from 'react';

const COLORS = {
  success: '#16a34a',
  error: '#dc2626',
  info: '#2563eb',
  warning: '#f59e0b'
};

/**
 * Simple toast message.
 */
const Toast = ({ message, type = 'info' }) => {
  return (
    <div
      style={{
        padding: '0.5rem 1rem',
        background: COLORS[type] || COLORS.info,
        color: '#fff',
        borderRadius: '4px',
        margin: '0.25rem 0'
      }}
    >
      {message}
    </div>
  );
};

export default Toast;

