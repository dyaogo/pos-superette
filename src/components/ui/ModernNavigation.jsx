// 📁 Créer : src/components/ui/ModernNavigation.jsx

import React from 'react';

const ModernNavigation = ({ 
  items = [], 
  activeItem, 
  onItemClick, 
  orientation = 'horizontal',
  variant = 'pills',
  className = '' 
}) => {
  const navStyles = {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    gap: 'var(--space-xs)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-xs)',
    boxShadow: 'var(--shadow-sm)'
  };

  const itemStyles = (item, isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    borderRadius: 'var(--radius-md)',
    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
    background: isActive ? 'var(--color-primary-bg)' : 'transparent',
    textDecoration: 'none',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all var(--transition-normal)',
    userSelect: 'none',
    position: 'relative',
    overflow: 'hidden',
    border: variant === 'outlined' ? `1px solid ${isActive ? 'var(--color-primary)' : 'transparent'}` : 'none'
  });

  return (
    <nav style={navStyles} className={`modern-navigation ${className}`}>
      {items.map((item, index) => {
        const isActive = activeItem === item.id;
        const Icon = item.icon;
        
        return (
          <div
            key={item.id}
            style={itemStyles(item, isActive)}
            onClick={() => onItemClick && onItemClick(item.id)}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--color-surface-hover)';
                e.currentTarget.style.color = 'var(--color-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
            className="animate-fade-in"
            style={{
              ...itemStyles(item, isActive),
              animationDelay: `${index * 50}ms`
            }}
          >
            {/* Effet de slide pour l'item actif */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'var(--color-primary-bg)',
              transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
              transformOrigin: 'left',
              transition: 'transform var(--transition-normal)',
              zIndex: -1
            }} />
            
            {Icon && <Icon size={18} />}
            <span>{item.label}</span>
            
            {item.badge && (
              <span style={{
                background: 'var(--color-danger)',
                color: 'white',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: 'var(--radius-full)',
                minWidth: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {item.badge}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default ModernNavigation;
