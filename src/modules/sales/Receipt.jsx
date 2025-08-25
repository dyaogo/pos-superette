import React from 'react';

const Receipt = ({ data, onClose, appSettings, isDark }) => {
  if (!data) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: isDark ? '#2d3748' : 'white',
        padding: '25px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '20px', color: isDark ? '#f7fafc' : '#2d3748' }}>Reçu</h3>
        {data.receiptNumber && (
          <p style={{ marginBottom: '10px' }}>Reçu: {data.receiptNumber}</p>
        )}
        <p style={{ marginBottom: '10px' }}>
          Total: {data.total.toLocaleString()} {appSettings.currency}
        </p>
        {data.change > 0 && (
          <p style={{ marginBottom: '10px' }}>
            Monnaie: {data.change.toLocaleString()} {appSettings.currency}
          </p>
        )}
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default Receipt;
