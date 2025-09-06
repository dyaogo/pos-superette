// src/components/ui/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = '#3b82f6',
  text,
  fullScreen = false 
}) => {
  const sizes = {
    small: '16px',
    medium: '24px',
    large: '32px',
    xl: '48px'
  };

  const spinnerStyles = {
    width: sizes[size],
    height: sizes[size],
    border: `3px solid #f3f4f6`,
    borderTop: `3px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    ...(fullScreen && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(255, 255, 255, 0.9)',
      zIndex: 9999
    })
  };

  return (
    <div style={containerStyles}>
      <div style={spinnerStyles} />
      {text && (
        <p style={{
          margin: 0,
          color: '#6b7280',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {text}
        </p>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;

/* USAGE:
<LoadingSpinner text="Chargement des produits..." />
<LoadingSpinner size="large" fullScreen text="Traitement en cours..." />
*/
