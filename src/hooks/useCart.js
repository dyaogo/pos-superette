// src/hooks/useCart.js
import { useState, useMemo, useCallback } from 'react';

/**
 * Hook pour gérer le panier de manière optimisée
 * @param {Array} products - Liste des produits disponibles
 * @param {Object} appSettings - Paramètres de l'app (taxe, devise)
 * @returns {Object} État et fonctions du panier
 */
export const useCart = (products, appSettings) => {
  const [cart, setCart] = useState([]);

  // Calculs automatiques du panier (se recalculent seulement si cart change)
  const cartStats = useMemo(() => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalTax = totalAmount * (appSettings.taxRate || 0) / 100;
    const finalTotal = totalAmount + totalTax;
    
    return { 
      totalItems, 
      totalAmount, 
      totalTax, 
      finalTotal 
    };
  }, [cart, appSettings.taxRate]);

  // Fonction pour ajouter un produit (optimisée avec useCallback)
  const addToCart = useCallback((product) => {
    if (product.stock === 0) {
      alert(`${product.name} est en rupture de stock!`);
      return false;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        // Si le produit existe déjà, augmenter la quantité
        if (existingItem.quantity >= product.stock) {
          alert(`Stock insuffisant! Maximum: ${product.stock}`);
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Nouveau produit dans le panier
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    
    return true;
  }, []);

  // Fonction pour modifier la quantité
  const updateQuantity = useCallback((id, change) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === id) {
          const product = products.find(p => p.id === id);
          const newQuantity = Math.max(0, Math.min(item.quantity + change, product.stock));
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean) // Supprime les items null
    );
  }, [products]);

  // Fonction pour supprimer un item
  const removeFromCart = useCallback((id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  }, []);

  // Fonction pour vider le panier
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  return {
    cart,
    cartStats,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  };
};

// USAGE EXEMPLE:
// const { cart, cartStats, addToCart } = useCart(globalProducts, appSettings);
// console.log(cartStats.finalTotal); // Total automatiquement calculé
