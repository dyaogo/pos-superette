// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Hook pour débouncer une valeur (évite les appels trop fréquents)
 * @param {any} value - La valeur à débouncer
 * @param {number} delay - Délai en millisecondes (300ms recommandé)
 * @returns {any} La valeur débouncée
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur après le délai
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer précédent si la valeur change
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// USAGE EXEMPLE:
// const debouncedSearchQuery = useDebounce(searchQuery, 300);
// La recherche ne se déclenchera qu'après 300ms d'inactivité
