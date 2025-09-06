// src/components/ui/Badge.jsx
import React from 'react';

/**
 * Composant badge pour afficher des statuts
 * @param {ReactNode} children - Contenu du badge
 * @param {string} variant - Couleur: 'default', 'success', 'warning', 'danger', 'info'
 * @param {string} size - Taille: 'small', 'medium', 'large'
 */
const Badge = ({ 
  children, 
  variant = 'default',
  size = 'medium',
  className = '',
  ...props 
}) => {
  // Variantes de couleur
  const variants = {
    default: {
      background: '#f3f4f6',
      color: '#374151',
      border: '1px solid #e5e7eb'
    },
    success: {
      background: '#d1fae5',
      color: '#065f46',
      border: '1px solid #a7f3d0'
    },
    warning: {
      background: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fde68a'
    },
    danger: {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    },
    info: {
      background: '#dbeafe',
      color: '#1e40af',
      border: '1px solid #bfdbfe'
    },
    purple: {
      background: '#ede9fe',
      color: '#6b21a8',
      border: '1px solid #ddd6fe'
    }
  };

  // Tailles
  const sizes = {
    small: {
      padding: '2px 6px',
      fontSize: '10px',
      fontWeight: '600',
      lineHeight: '1.2'
    },
    medium: {
      padding: '4px 8px',
      fontSize: '12px',
      fontWeight: '600',
      lineHeight: '1.2'
    },
    large: {
      padding: '6px 12px',
      fontSize: '14px',
      fontWeight: '600',
      lineHeight: '1.2'
    }
  };

  // Styles combinés
  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    ...variants[variant],
    ...sizes[size]
  };

  return (
    <span style={styles} className={className} {...props}>
      {children}
    </span>
  );
};

export default Badge;

/* EXEMPLES D'UTILISATION :

// Badge de stock
<Badge variant={product.stock > 10 ? 'success' : 'warning'}>
  {product.stock} en stock
</Badge>

// Badge de statut
<Badge variant="info" size="small">
  Nouveau
</Badge>

// Badge de prix
<Badge variant="success" size="large">
  -20%
</Badge>

// Badge personnalisé
<Badge 
  variant="purple" 
  style={{ borderRadius: '20px' }}
>
  VIP
</Badge>

*/
