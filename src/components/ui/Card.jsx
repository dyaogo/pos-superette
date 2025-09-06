// src/components/ui/Card.jsx
import React from 'react';

/**
 * Composant carte réutilisable avec effets
 * @param {ReactNode} children - Contenu de la carte
 * @param {string} padding - Espacement: 'none', 'small', 'medium', 'large'
 * @param {string} shadow - Ombre: 'none', 'small', 'medium', 'large'
 * @param {boolean} hover - Effet au survol
 * @param {boolean} clickable - Curseur pointer
 * @param {function} onClick - Fonction de clic
 */
const Card = ({ 
  children, 
  padding = 'medium',
  shadow = 'medium',
  hover = false,
  clickable = false,
  onClick,
  className = '',
  ...props 
}) => {
  // Espacement intérieur
  const paddings = {
    none: '0',
    small: '12px',
    medium: '16px',
    large: '24px'
  };

  // Ombres
  const shadows = {
    none: 'none',
    small: '0 1px 3px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px rgba(0, 0, 0, 0.1)'
  };

  // Styles de base
  const baseStyles = {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #f3f4f6',
    padding: paddings[padding],
    boxShadow: shadows[shadow],
    transition: 'all 0.2s ease',
    cursor: clickable || onClick ? 'pointer' : 'default'
  };

  // Effet hover
  const hoverStyles = {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
  };

  // Gestionnaires d'événements
  const handleMouseEnter = (e) => {
    if (hover || clickable || onClick) {
      Object.assign(e.target.style, hoverStyles);
    }
  };

  const handleMouseLeave = (e) => {
    if (hover || clickable || onClick) {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = shadows[shadow];
    }
  };

  const handleClick = (e) => {
    if (onClick) {
      // Effet de clic
      e.target.style.transform = 'scale(0.98)';
      setTimeout(() => {
        e.target.style.transform = 'translateY(0)';
      }, 100);
      
      onClick(e);
    }
  };

  return (
    <div
      style={baseStyles}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

/* EXEMPLES D'UTILISATION :

// Carte simple
<Card>
  <h3>Titre</h3>
  <p>Contenu de la carte</p>
</Card>

// Carte cliquable avec hover
<Card 
  hover 
  clickable 
  onClick={() => console.log('Carte cliquée')}
>
  <p>Cliquez sur cette carte</p>
</Card>

// Carte produit
<Card 
  padding="large" 
  shadow="large" 
  hover
  onClick={() => addToCart(product)}
>
  <img src={product.image} alt={product.name} />
  <h4>{product.name}</h4>
  <p>{product.price} FCFA</p>
</Card>

*/
