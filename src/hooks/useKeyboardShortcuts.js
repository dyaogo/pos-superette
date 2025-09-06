// src/hooks/useKeyboardShortcuts.js
import { useEffect } from 'react';

/**
 * Hook pour gérer les raccourcis clavier
 * @param {Array} shortcuts - Tableau des raccourcis { key, action, description }
 * @param {Array} dependencies - Dépendances pour re-créer les listeners
 */
export const useKeyboardShortcuts = (shortcuts, dependencies = []) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Éviter les conflits avec les champs de saisie
      if (e.target.matches('input, textarea, select, [contenteditable]')) {
        return;
      }
      
      // Chercher le raccourci correspondant
      const shortcut = shortcuts.find(s => {
        // Support pour touches simples et combinaisons
        if (typeof s.key === 'string') {
          return s.key === e.key;
        } else if (s.key.ctrlKey !== undefined) {
          return s.key.ctrlKey === e.ctrlKey && 
                 s.key.key === e.key;
        }
        return false;
      });
      
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    // Ajouter le listener
    window.addEventListener('keydown', handleKeyPress);
    
    // Nettoyer à la suppression du composant
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, dependencies);
};

// USAGE EXEMPLE:
// const shortcuts = [
//   { key: 'F1', action: () => clearCart(), description: 'Vider le panier' },
//   { key: 'F2', action: () => focusSearch(), description: 'Focus recherche' },
//   { key: 'F3', action: () => openPayment(), description: 'Ouvrir paiement' },
//   { key: { ctrlKey: true, key: 's' }, action: () => save(), description: 'Sauvegarder' }
// ];
// useKeyboardShortcuts(shortcuts, [cart, showPaymentModal]);
