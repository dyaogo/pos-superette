// 📁 Créer : src/components/ui/LoadingState.jsx

import React from 'react';

const LoadingState = ({ 
  type = 'spinner', 
  size = 'medium', 
  text = 'Chargement...', 
  fullScreen = false,
  className = '' 
}) => {
  const sizes = {
    small: { width: '16px', height: '16px' },
    medium: { width: '24px', height: '24px' },
    large: { width: '32px', height: '32px' }
  };

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-md)',
    ...(fullScreen && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999
    })
  };

  const Spinner = () => (
    <div
      style={{
        ...sizes[size],
        border: '2px solid var(--color-border)',
        borderTop: '2px solid var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    />
  );

  const Pulse = () => (
    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: '8px',
            height: '8px',
            background: 'var(--color-primary)',
            borderRadius: '50%',
            animation: `pulse 1.4s ease-in-out ${i * 0.16}s infinite both`
          }}
        />
      ))}
    </div>
  );

  const Skeleton = ({ width = '100%', height = '20px' }) => (
    <div
      style={{
        width,
        height,
        background: 'var(--color-surface-alt)',
        borderRadius: 'var(--radius-sm)',
        animation: 'pulse 2s infinite'
      }}
    />
  );

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
      <div style={containerStyles} className={`loading-state ${className}`}>
        {type === 'spinner' && <Spinner />}
        {type === 'pulse' && <Pulse />}
        {type === 'skeleton' && <Skeleton />}
        
        {text && (
          <span style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            fontWeight: '500'
          }}>
            {text}
          </span>
        )}
      </div>
    </>
  );
};

export default LoadingState;
