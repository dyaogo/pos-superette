// src/components/ui/Input.jsx
import React, { forwardRef } from 'react';

/**
 * Composant input moderne avec label, erreurs, et icônes
 * @param {string} label - Label du champ
 * @param {string} error - Message d'erreur
 * @param {string} helperText - Texte d'aide
 * @param {ReactNode} leftIcon - Icône à gauche
 * @param {ReactNode} rightIcon - Icône à droite
 * @param {boolean} fullWidth - Largeur 100%
 * @param {string} variant - Style: 'default', 'filled'
 */
const Input = forwardRef(({ 
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  variant = 'default',
  className = '',
  ...props 
}, ref) => {
  // Styles de base
  const baseStyles = {
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'inherit'
  };

  // Variantes
  const variants = {
    default: {
      background: 'white',
      color: '#374151'
    },
    filled: {
      background: '#f9fafb',
      border: '1px solid transparent'
    }
  };

  // Styles en cas d'erreur ou de focus
  const focusStyles = {
    borderColor: error ? '#ef4444' : '#3b82f6',
    boxShadow: `0 0 0 3px ${error ? '#fecaca' : '#dbeafe'}`
  };

  // Styles finaux
  const inputStyles = {
    ...baseStyles,
    ...variants[variant],
    paddingLeft: leftIcon ? '48px' : '16px',
    paddingRight: rightIcon ? '48px' : '16px',
    borderColor: error ? '#ef4444' : '#d1d5db'
  };

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }} className={className}>
      {/* Label */}
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '14px',
          fontWeight: '500',
          color: error ? '#ef4444' : '#374151'
        }}>
          {label}
          {props.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      
      {/* Conteneur avec icônes */}
      <div style={{ position: 'relative' }}>
        {/* Icône gauche */}
        {leftIcon && (
          <div style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: error ? '#ef4444' : '#6b7280',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            {leftIcon}
          </div>
        )}
        
        {/* Input principal */}
        <input
          ref={ref}
          style={inputStyles}
          onFocus={(e) => Object.assign(e.target.style, focusStyles)}
          onBlur={(e) => {
            e.target.style.borderColor = error ? '#ef4444' : '#d1d5db';
            e.target.style.boxShadow = 'none';
          }}
          {...props}
        />
        
        {/* Icône droite */}
        {rightIcon && (
          <div style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: error ? '#ef4444' : '#6b7280',
            pointerEvents: 'none'
          }}>
            {rightIcon}
          </div>
        )}
      </div>
      
      {/* Message d'erreur */}
      {error && (
        <p style={{
          marginTop: '4px',
          marginBottom: '0',
          fontSize: '14px',
          color: '#ef4444'
        }}>
          {error}
        </p>
      )}
      
      {/* Texte d'aide */}
      {helperText && !error && (
        <p style={{
          marginTop: '4px',
          marginBottom: '0',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

/* EXEMPLES D'UTILISATION :

// Input simple
<Input 
  label="Nom du produit"
  placeholder="Entrez le nom..."
  value={productName}
  onChange={(e) => setProductName(e.target.value)}
/>

// Input avec icône
<Input 
  label="Recherche"
  leftIcon={<SearchIcon size={16} />}
  placeholder="Rechercher..."
/>

// Input avec erreur
<Input 
  label="Prix"
  type="number"
  error="Le prix doit être supérieur à 0"
  value={price}
  onChange={(e) => setPrice(e.target.value)}
/>

// Input pleine largeur
<Input 
  label="Description"
  fullWidth
  variant="filled"
  helperText="Décrivez le produit en quelques mots"
/>

*/
