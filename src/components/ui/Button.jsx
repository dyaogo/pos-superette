// src/components/ui/Button.jsx
import React from 'react';

/**
 * Composant bouton moderne et réutilisable
 * @param {ReactNode} children - Contenu du bouton
 * @param {string} variant - Style: 'primary', 'secondary', 'success', 'danger', 'ghost'
 * @param {string} size - Taille: 'small', 'medium', 'large'
 * @param {boolean} disabled - Bouton désactivé
 * @param {boolean} fullWidth - Largeur 100%
 * @param {ReactNode} icon - Icône à afficher
 * @param {string} iconPosition - Position: 'left', 'right'
 * @param {boolean} loading - État de chargement
 * @param {function} onClick - Fonction de clic
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  loading = false,
  onClick,
  className = '',
  ...props 
}) => {
  // Styles de base
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: 'none',
    borderRadius: '8px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '600',
    textDecoration: 'none',
    userSelect: 'none',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'inherit'
  };

  // Variantes de couleur
  const variants = {
    primary: {
      background: '#3b82f6',
      color: 'white',
      border: '1px solid #3b82f6'
    },
    secondary: {
      background: 'white',
      color: '#374151',
      border: '1px solid #d1d5db'
    },
    success: {
      background: '#10b981',
      color: 'white',
      border: '1px solid #10b981'
    },
    danger: {
      background: '#ef4444',
      color: 'white',
      border: '1px solid #ef4444'
    },
    warning: {
      background: '#f59e0b',
      color: 'white',
      border: '1px solid #f59e0b'
    },
    ghost: {
      background: 'transparent',
      color: '#6b7280',
      border: '1px solid transparent'
    }
  };

  // Tailles
  const sizes = {
    small: { 
      padding: '8px 12px', 
      fontSize: '14px',
      minHeight: '32px'
    },
    medium: { 
      padding: '12px 16px', 
      fontSize: '16px',
      minHeight: '40px'
    },
    large: { 
      padding: '16px 24px', 
      fontSize: '18px',
      minHeight: '48px'
    }
  };

  // Styles au survol
  const hoverStyles = {
    primary: { background: '#2563eb' },
    secondary: { background: '#f9fafb', borderColor: '#9ca3af' },
    success: { background: '#059669' },
    danger: { background: '#dc2626' },
    warning: { background: '#d97706' },
    ghost: { background: '#f3f4f6' }
  };

  // Combiner les styles
  const combinedStyles = {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size],
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || loading ? 0.6 : 1
  };

  // Gestionnaires d'événements
  const handleMouseEnter = (e) => {
    if (!disabled && !loading) {
      Object.assign(e.target.style, hoverStyles[variant]);
      e.target.style.transform = 'translateY(-1px)';
      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    }
  };

  const handleMouseLeave = (e) => {
    if (!disabled && !loading) {
      Object.assign(e.target.style, variants[variant]);
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = 'none';
    }
  };

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      // Effet de clic
      e.target.style.transform = 'scale(0.98)';
      setTimeout(() => {
        e.target.style.transform = 'translateY(0)';
      }, 100);
      
      onClick(e);
    }
  };

  return (
    <button
      style={combinedStyles}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      {...props}
    >
      {/* Spinner de chargement */}
      {loading && (
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid currentColor',
          borderTop: '2px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      )}
      
      {/* Icône à gauche */}
      {icon && iconPosition === 'left' && !loading && icon}
      
      {/* Contenu du bouton */}
      {children}
      
      {/* Icône à droite */}
      {icon && iconPosition === 'right' && !loading && icon}
      
      {/* CSS pour l'animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default Button;

/* EXEMPLES D'UTILISATION :

// Bouton simple
<Button onClick={() => console.log('Clic!')}>
  Cliquez-moi
</Button>

// Bouton avec icône
<Button variant="success" icon={<CheckIcon size={16} />}>
  Confirmer
</Button>

// Bouton de chargement
<Button loading={isLoading} disabled={isLoading}>
  {isLoading ? 'Traitement...' : 'Valider'}
</Button>

// Bouton pleine largeur
<Button variant="primary" fullWidth>
  Payer maintenant
</Button>

*/
