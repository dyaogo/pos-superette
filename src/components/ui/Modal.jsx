// src/components/ui/Modal.jsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Composant modal responsive et accessible
 * @param {boolean} isOpen - Modal ouverte ou fermée
 * @param {function} onClose - Fonction de fermeture
 * @param {string} title - Titre de la modal
 * @param {ReactNode} children - Contenu de la modal
 * @param {string} size - Taille: 'small', 'medium', 'large', 'fullScreen'
 * @param {boolean} showCloseButton - Afficher le bouton X
 * @param {boolean} closeOnOverlayClick - Fermer en cliquant sur l'overlay
 * @param {boolean} closeOnEscape - Fermer avec la touche Escape
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = ''
}) => {
  // Gestion des événements clavier et scroll
  useEffect(() => {
    if (isOpen) {
      // Bloquer le scroll de la page
      document.body.style.overflow = 'hidden';
      
      // Gestionnaire Escape
      const handleEscape = (e) => {
        if (closeOnEscape && e.key === 'Escape') {
          onClose();
        }
      };
      
      if (closeOnEscape) {
        window.addEventListener('keydown', handleEscape);
      }
      
      // Nettoyage
      return () => {
        document.body.style.overflow = 'unset';
        if (closeOnEscape) {
          window.removeEventListener('keydown', handleEscape);
        }
      };
    }
  }, [isOpen, onClose, closeOnEscape]);

  // Ne pas rendre si fermée
  if (!isOpen) return null;

  // Tailles prédéfinies
  const sizes = {
    small: { 
      maxWidth: '400px',
      width: '90vw'
    },
    medium: { 
      maxWidth: '600px',
      width: '90vw'
    },
    large: { 
      maxWidth: '900px',
      width: '95vw'
    },
    fullScreen: { 
      width: '100vw', 
      height: '100vh', 
      maxWidth: 'none', 
      borderRadius: 0,
      margin: 0
    }
  };

  // Gestionnaire de clic sur l'overlay
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: size === 'fullScreen' ? 'stretch' : 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: size === 'fullScreen' ? '0' : '20px'
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          background: 'white',
          borderRadius: size === 'fullScreen' ? '0' : '16px',
          padding: '0',
          maxHeight: size === 'fullScreen' ? '100vh' : '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          ...sizes[size]
        }}
        className={className}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec titre et bouton fermer */}
        {(title || showCloseButton) && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px 24px 0 24px',
            flexShrink: 0
          }}>
            {title && (
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: '#111827'
              }}>
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  marginLeft: title ? '16px' : '0'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#6b7280';
                }}
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Contenu principal */}
        <div style={{ 
          padding: '24px',
          flex: 1,
          overflow: 'auto'
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

/* EXEMPLES D'UTILISATION :

// Modal simple
<Modal 
  isOpen={showModal} 
  onClose={() => setShowModal(false)}
  title="Confirmer l'action"
>
  <p>Êtes-vous sûr de vouloir continuer ?</p>
  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
    <Button onClick={() => setShowModal(false)}>Annuler</Button>
    <Button variant="danger" onClick={handleConfirm}>Confirmer</Button>
  </div>
</Modal>

// Modal de paiement
<Modal 
  isOpen={showPayment} 
  onClose={() => setShowPayment(false)}
  title="Finaliser la vente"
  size="medium"
>
  <PaymentForm onSubmit={handlePayment} />
</Modal>

// Modal plein écran
<Modal 
  isOpen={showFullscreen} 
  onClose={() => setShowFullscreen(false)}
  size="fullScreen"
  title="Mode Plein Écran"
>
  <FullScreenContent />
</Modal>

*/
