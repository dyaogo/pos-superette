// src/hooks/useLocalStorage.js
import { useState, useEffect } from 'react';

/**
 * Hook pour synchroniser un state avec localStorage
 * @param {string} key - Clé localStorage
 * @param {any} initialValue - Valeur par défaut
 * @returns {Array} [valeur, setValeur] comme useState
 */
export const useLocalStorage = (key, initialValue) => {
  // State pour stocker la valeur
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Récupérer depuis localStorage
      const item = window.localStorage.getItem(key);
      // Parser le JSON ou retourner la valeur initiale
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erreur lecture localStorage clé "${key}":`, error);
      return initialValue;
    }
  });

  // Fonction pour mettre à jour la valeur
  const setValue = (value) => {
    try {
      // Permettre que value soit une fonction comme dans useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Mettre à jour le state
      setStoredValue(valueToStore);
      
      // Sauvegarder dans localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Erreur écriture localStorage clé "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

// USAGE EXEMPLE:
// const [theme, setTheme] = useLocalStorage('pos-theme', 'light');
// const [cartHistory, setCartHistory] = useLocalStorage('cart-history', []);
