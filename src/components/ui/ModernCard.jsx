// 📁 Créer : src/components/ui/ModernCard.jsx

import React from 'react';

const ModernCard = ({ 
  children, 
  variant = 'default', 
  className = '', 
  hover = true,
  padding = 'normal',
  ...props 
}) => {
  const baseStyles = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-md)',
    transition: 'all var(--transition-normal)',
    position: 'relative',
    overflow: 'hidden'
  };

  const variants = {
    default: {},
    glass: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    gradient: {
      background: 'var(--gradient-card)'
    }
  };

  const paddings = {
    none: { padding: 0 },
    small: { padding: 'var(--space-md)' },
    normal: { padding: 'var(--space-lg)' },
    large: { padding: 'var(--space-xl)' }
  };

  const hoverStyles = hover ? {
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 'var(--shadow-lg)'
    }
  } : {};

  return (
    <div
      style={{
        ...baseStyles,
        ...variants[variant],
        ...paddings[padding],
        ...hoverStyles
      }}
      className={`modern-card ${className}`}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      } : undefined}
      {...props}
    >
      {/* Ligne brillante en haut */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--color-border), transparent)'
      }} />
      {children}
    </div>
  );
};

export default ModernCard;
