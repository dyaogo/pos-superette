// 📁 Créer : src/components/ui/ModernInput.jsx

import React, { useState } from 'react';

const ModernInput = ({ 
  label,
  icon,
  error,
  success,
  className = '',
  onFocus,
  onBlur,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const inputStyles = {
    width: '100%',
    padding: icon ? 'var(--space-md) var(--space-md) var(--space-md) 40px' : 'var(--space-md)',
    border: `1px solid ${error ? 'var(--color-danger)' : success ? 'var(--color-success)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    fontFamily: 'inherit',
    fontSize: '14px',
    transition: 'all var(--transition-normal)',
    outline: 'none'
  };

  const focusStyles = isFocused ? {
    borderColor: error ? 'var(--color-danger)' : success ? 'var(--color-success)' : 'var(--color-primary)',
    boxShadow: `0 0 0 3px ${error ? 'var(--color-danger-bg)' : success ? 'var(--color-success-bg)' : 'var(--color-primary-bg)'}`
  } : {};

  return (
    <div className={`modern-input-group ${className}`}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: 'var(--space-sm)',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--color-text-primary)'
        }}>
          {label}
        </label>
      )}
      
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute',
            left: 'var(--space-md)',
            top: '50%',
            transform: 'translateY(-50%)',
            color: isFocused ? 'var(--color-primary)' : 'var(--color-text-muted)',
            transition: 'color var(--transition-normal)',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            {icon}
          </div>
        )}
        
        <input
          style={{
            ...inputStyles,
            ...focusStyles
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </div>
      
      {(error || success) && (
        <div style={{
          marginTop: 'var(--space-sm)',
          fontSize: '12px',
          color: error ? 'var(--color-danger)' : 'var(--color-success)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xs)'
        }}>
          {error ? '⚠️' : '✅'} {error || success}
        </div>
      )}
    </div>
  );
};

export default ModernInput;
