// src/hooks/useProductSearch.js
import { useMemo } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Hook pour la recherche de produits avec debouncing
 * @param {Array} products - Liste des produits
 * @param {string} searchQuery - Terme de recherche
 * @param {string} selectedCategory - Catégorie sélectionnée
 * @param {number} delay - Délai de debouncing (défaut 300ms)
 * @returns {Array} Produits filtrés
 */
export const useProductSearch = (products, searchQuery, selectedCategory, delay = 300) => {
  // Débouncer la recherche pour éviter trop de calculs
  const debouncedSearchQuery = useDebounce(searchQuery, delay);

  // Filtrer les produits (se recalcule seulement si les dépendances changent)
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Filtre par catégorie
      const matchesCategory = selectedCategory === 'all' || 
        (product.category?.toLowerCase() === selectedCategory);
      
      // Si pas de recherche, retourner juste le filtre catégorie
      if (!debouncedSearchQuery) return matchesCategory;
      
      // Filtre par recherche (nom, SKU, code-barre, description)
      const searchLower = debouncedSearchQuery.toLowerCase();
      const matchesSearch = 
        product.name?.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower) ||
        product.barcode?.includes(debouncedSearchQuery) ||
        product.description?.toLowerCase().includes(searchLower);
      
      return matchesCategory && matchesSearch;
    });
  }, [products, debouncedSearchQuery, selectedCategory]);

  return filteredProducts;
};

// USAGE EXEMPLE:
// const filteredProducts = useProductSearch(globalProducts, searchQuery, selectedCategory);
