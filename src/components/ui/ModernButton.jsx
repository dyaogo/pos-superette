// 📁 Créer : src/components/ui/ModernButton.jsx

import React from 'react';

const ModernButton = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  ...props 
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'inherit',
    fontWeight: '600',
    textDecoration: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all var(--transition-normal)',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    position: 'relative',
    overflow: 'hidden',
    width: fullWidth ? '100%' : 'auto'
  };

  const variants = {
    primary: {
      background: 'var(--color-primary)',
      color: 'var(--color-text-inverse)',
      border: '1px solid var(--color-primary)'
    },
    secondary: {
      background: 'var(--color-surface)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border)'
    },
    success: {
      background: 'var(--color-success)',
      color: 'var(--color-text-inverse)',
      border: '1px solid var(--color-success)'
    },
    danger: {
      background: 'var(--color-danger)',
      color: 'var(--color-text-inverse)',
      border: '1px solid var(--color-danger)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-text-secondary)',
      border: '1px solid var(--color-border)'
    }
  };

  const sizes = {
    small: { 
      padding: 'var(--space-sm) var(--space-md)', 
      fontSize: '14px',
      minHeight: '32px'
    },
    medium: { 
      padding: 'var(--space-md) var(--space-lg)', 
      fontSize: '16px',
      minHeight: '40px'
    },
    large: { 
      padding: 'var(--space-lg) var(--space-xl)', 
      fontSize: '18px',
      minHeight: '48px'
    }
  };

  const handleClick = (e) => {
    if (disabled || loading) return;
    
    // Effet ripple
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    
    if (onClick) onClick(e);
  };

  return (
    <>
      <style>
        {`
          @keyframes ripple {
            to {
              transform: scale(2);
              opacity: 0;
            }
          }
        `}
      </style>
      <button
        style={{
          ...baseStyles,
          ...variants[variant],
          ...sizes[size],
          opacity: disabled || loading ? 0.6 : 1
        }}
        className={`modern-button ${className}`}
        onClick={handleClick}
        disabled={disabled || loading}
        {...props}
      >
        {/* Effet shimmer au hover */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          transition: 'left var(--transition-slow)'
        }} />
        
        {loading && (
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTop: '2px solid currentColor',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        )}
        
        {!loading && icon && iconPosition === 'left' && icon}
        {!loading && children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    </>
  );
};

export default ModernButton;
