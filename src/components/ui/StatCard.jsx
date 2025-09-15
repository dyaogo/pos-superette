// 📁 Créer : src/components/ui/StatCard.jsx

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'var(--color-primary)',
  gradient,
  className = '',
  onClick
}) => {
  const cardStyles = {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-lg)',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-md)',
    position: 'relative',
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all var(--transition-normal)'
  };

  const handleHover = (e, isEntering) => {
    if (onClick) {
      if (isEntering) {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
      } else {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }
    }
  };

  return (
    <div
      style={cardStyles}
      className={`stat-card animate-scale-in ${className}`}
      onClick={onClick}
      onMouseEnter={(e) => handleHover(e, true)}
      onMouseLeave={(e) => handleHover(e, false)}
    >
      {/* Gradient de fond */}
      {gradient && (
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '100%',
          height: '100%',
          background: gradient,
          opacity: 0.1,
          borderRadius: '50%'
        }} />
      )}

      {/* En-tête avec icône */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-md)',
        position: 'relative'
      }}>
        {Icon && (
          <div style={{
            background: gradient || `${color}15`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={20} color={color} />
          </div>
        )}
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--color-text-secondary)'
        }}>
          {title}
        </span>
      </div>

      {/* Valeur principale */}
      <div style={{
        fontSize: '32px',
        fontWeight: '800',
        color: 'var(--color-text-primary)',
        marginBottom: 'var(--space-sm)',
        position: 'relative'
      }}>
        {value}
      </div>

      {/* Indicateur de tendance */}
      {trend !== undefined && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xs)',
          padding: 'var(--space-xs) var(--space-sm)',
          borderRadius: 'var(--radius-full)',
          background: trend >= 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
          color: trend >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
          fontSize: '12px',
          fontWeight: '600',
          width: 'fit-content'
        }}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  );
};

export default StatCard;
