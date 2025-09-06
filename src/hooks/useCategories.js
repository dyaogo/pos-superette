// src/hooks/useCategories.js
import { useMemo } from 'react';

/**
 * Hook pour générer automatiquement les catégories avec compteurs
 * @param {Array} products - Liste des produits
 * @returns {Array} Catégories avec icônes et compteurs
 */
export const useCategories = (products) => {
  const categories = useMemo(() => {
    // Compter les produits par catégorie
    const categoryCounts = products.reduce((acc, product) => {
      const category = product.category || 'Divers';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    // Commencer par "Tout"
    const categoryList = [
      { 
        id: 'all', 
        name: 'Tout', 
        icon: '🏪', 
        count: products.length 
      }
    ];
    
    // Icônes prédéfinies par catégorie
    const categoryIcons = {
      'Boissons': '🥤',
      'Alimentaire': '🍞', 
      'Hygiène': '🧼',
      'Snacks': '🍿', 
      'Fruits': '🍎', 
      'Légumes': '🥬',
      'Viande': '🥩', 
      'Poisson': '🐟', 
      'Épicerie': '🛒',
      'Électronique': '📱', 
      'Vêtements': '👕', 
      'Maison': '🏠',
      'Santé': '💊', 
      'Beauté': '💄', 
      'Sport': '⚽',
      'Jouets': '🧸',
      'Livres': '📚',
      'Auto': '🚗',
      'Jardin': '🌱',
      'Divers': '📦'
    };
    
    // Ajouter chaque catégorie trouvée
    Object.entries(categoryCounts).forEach(([name, count]) => {
      categoryList.push({
        id: name.toLowerCase().replace(/\s+/g, '-'), // ID URL-friendly
        name,
        icon: categoryIcons[name] || '📦', // Icône par défaut
        count
      });
    });
    
    // Trier par nombre de produits (décroissant) après "Tout"
    const sortedCategories = [
      categoryList[0], // Garder "Tout" en premier
      ...categoryList.slice(1).sort((a, b) => b.count - a.count)
    ];
    
    return sortedCategories;
  }, [products]);

  return categories;
};

// USAGE EXEMPLE:
// const categories = useCategories(globalProducts);
// categories.forEach(cat => console.log(`${cat.icon} ${cat.name} (${cat.count})`));
