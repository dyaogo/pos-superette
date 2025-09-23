// Configuration pour l'API (on utilisera ça plus tard)
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Fonctions pour communiquer avec la base de données
export const dbAPI = {
  // Récupérer tous les produits
  async getProducts(storeId) {
    try {
      // Pour l'instant, on simule avec les données locales
      // Plus tard, on fera : const response = await fetch(`${API_URL}/products?storeId=${storeId}`);
      const products = JSON.parse(localStorage.getItem('pos_products_catalog')) || [];
      return products;
    } catch (error) {
      console.error('Erreur récupération produits:', error);
      return [];
    }
  },

  // Créer une vente
  async createSale(saleData) {
    try {
      // Pour l'instant, stockage local
      // Plus tard : const response = await fetch(`${API_URL}/sales`, { method: 'POST', ... });
      const sales = JSON.parse(localStorage.getItem('pos_sales')) || [];
      sales.push(saleData);
      localStorage.setItem('pos_sales', JSON.stringify(sales));
      return saleData;
    } catch (error) {
      console.error('Erreur création vente:', error);
      return null;
    }
  }
};