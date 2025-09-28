import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadInventory, saveInventory, addInventoryRecord } from '../services/inventory.service';

// Créer le contexte
const AppContext = createContext();

// Fournisseur de contexte principal SIMPLIFIÉ
export const AppProvider = ({ children }) => {
  // ==================== DONNÉES MULTI-MAGASINS ====================
  const stores = [
    {
      id: 'wend-kuuni',
      name: 'Alimentation Wend-Kuuni',
      code: 'WK001',
      manager: 'Ibrahim Ouedraogo',
      color: '#3b82f6',
      address: 'Secteur 15, Ouagadougou',
      phone: '+226 70 12 34 56'
    },
    {
      id: 'wend-yam',
      name: 'Alimentation Wend-Yam',
      code: 'WY002',
      manager: 'Fatoumata Kone',
      color: '#10b981',
      address: 'Zone du Bois, Ouagadougou',
      phone: '+226 76 54 32 10'
    }
  ];

  // ==================== ÉTATS GLOBAUX ====================
  // Charger l'identifiant du magasin depuis le localStorage si disponible
  const [currentStoreId, setCurrentStoreId] = useState([]);
  const [viewMode, setViewMode] = useState('single');
  
  // Catalogue produit global (hors magasin)
  const [productCatalog, setProductCatalog] = useState([]);

  // Stock par magasin { [storeId]: { [productId]: quantity } }
  const [stockByStore, setStockByStore] = useState([]);

  const setStockForStore = (storeId, stock) => {
    setStockByStore(prev => ({ ...prev, [storeId]: stock }));
    saveInventory(storeId, stock);
  };

  const [globalProducts, setGlobalProducts] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);

  const [customers, setCustomers] = useState([]);

  const [credits, setCredits] = useState([]);

  const [employees, setEmployees] = useState([]);

  const [returnsHistory, setReturnsHistory] = useState([]);

  const [appSettings, setAppSettings] = useState([]);

  // Charger les données localStorage après le rendu côté client
useEffect(() => {
  if (typeof window !== 'undefined') {
    try {
      // Charger produits
      const savedProducts = localStorage.getItem('pos_products_catalog');
      if (savedProducts) {
        setProductsCatalog(JSON.parse(savedProducts));
      }

      // Charger ventes
      const savedSales = localStorage.getItem('pos_sales');
      if (savedSales) {
        setSalesHistory(JSON.parse(savedSales));
      }

      // Charger clients
      const savedCustomers = localStorage.getItem('pos_customers');
      if (savedCustomers) {
        setCustomers(JSON.parse(savedCustomers));
      } else {
        setCustomers([{ id: 1, name: 'Client Comptant', phone: '', email: '', totalPurchases: 0, points: 0 }]);
      }

      // Charger paramètres
      const savedSettings = localStorage.getItem('pos_settings');
      if (savedSettings) {
        setAppSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      }

    } catch (error) {
      console.error('Erreur chargement localStorage:', error);
    }
  }
}, []); // Exécuter une seule fois au montage

  // ==================== FONCTIONS DE GESTION ====================

  // Fonction pour changer de magasin
  const switchStore = (storeId) => {
    setCurrentStoreId(storeId);
    try {
      localStorage.setItem('pos_current_store', storeId);
    } catch (error) {
      console.warn('Erreur sauvegarde currentStoreId:', error);
    }
  };

  // Obtenir le magasin actuel
  const getCurrentStore = () => {
    return stores.find(store => store.id === currentStoreId) || stores[0];
  };

  // Mettre à jour globalProducts quand productCatalog ou stockByStore change
  useEffect(() => {
    const currentStoreStock = stockByStore[currentStoreId] || {};
    
    const productsWithStock = (productCatalog || []).map(product => ({
      ...product,
      stock: currentStoreStock[product.id] || 0
    }));
    
    setGlobalProducts(productsWithStock);
  }, [productCatalog, stockByStore, currentStoreId]);

  // Sauvegarde automatique des données
  useEffect(() => {
    if (Array.isArray(productCatalog) && productCatalog.length >= 0) {
      try {
        localStorage.setItem('pos_products_catalog', JSON.stringify(productCatalog));
      } catch (error) {
        console.warn('Erreur de sauvegarde catalogue:', error);
      }
    }
  }, [productCatalog]);

  useEffect(() => {
    if (Array.isArray(salesHistory) && salesHistory.length >= 0) {
      try {
        localStorage.setItem(`pos_${currentStoreId}_sales`, JSON.stringify(salesHistory));
      } catch (error) {
        console.warn('Erreur de sauvegarde ventes:', error);
      }
    }
  }, [salesHistory, currentStoreId]);

  useEffect(() => {
    if (Array.isArray(customers) && customers.length >= 0) {
      try {
        localStorage.setItem(`pos_${currentStoreId}_customers`, JSON.stringify(customers));
      } catch (error) {
        console.warn('Erreur de sauvegarde clients:', error);
      }
    }
  }, [customers, currentStoreId]);

  useEffect(() => {
    if (Array.isArray(credits) && credits.length >= 0) {
      try {
        localStorage.setItem(`pos_${currentStoreId}_credits`, JSON.stringify(credits));
      } catch (error) {
        console.warn('Erreur de sauvegarde credits:', error);
      }
    }
  }, [credits, currentStoreId]);

  useEffect(() => {
    if (Array.isArray(employees) && employees.length >= 0) {
      try {
        localStorage.setItem(`pos_${currentStoreId}_employees`, JSON.stringify(employees));
      } catch (error) {
        console.warn('Erreur de sauvegarde employees:', error);
      }
    }
  }, [employees, currentStoreId]);

  useEffect(() => {
    if (Array.isArray(returnsHistory) && returnsHistory.length >= 0) {
      try {
        localStorage.setItem(`pos_${currentStoreId}_returns`, JSON.stringify(returnsHistory));
      } catch (error) {
        console.warn('Erreur de sauvegarde returns:', error);
      }
    }
  }, [returnsHistory, currentStoreId]);

  useEffect(() => {
    if (appSettings && typeof appSettings === 'object') {
      try {
        localStorage.setItem(`pos_${currentStoreId}_settings`, JSON.stringify(appSettings));
      } catch (error) {
        console.warn('Erreur de sauvegarde settings:', error);
      }
    }
  }, [appSettings, currentStoreId]);

  // ==================== FONCTIONS MÉTIER ====================

  // Traiter une vente
  const processSale = (items, customer, paymentMethod, paymentAmount) => {
    try {
      if (!items || items.length === 0) return null;

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * ((appSettings.taxRate || 0) / 100);
      const total = subtotal + tax;
      const change = paymentAmount - total;

      const sale = {
        id: Date.now(),
        receiptNumber: `${getCurrentStore().code}-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        })),
        subtotal,
        tax,
        total,
        customerId: customer?.id || 1,
        customerName: customer?.name || 'Client Comptant',
        paymentMethod,
        paymentAmount,
        change: change > 0 ? change : 0,
        storeId: currentStoreId
      };

      // Déduire du stock
      const currentStock = { ...(stockByStore[currentStoreId] || {}) };
      items.forEach(item => {
        currentStock[item.id] = Math.max(0, (currentStock[item.id] || 0) - item.quantity);
      });
      setStockForStore(currentStoreId, currentStock);

      // Ajouter des points de fidélité
      const pointsEarned = Math.floor(total / 1000);
      if (customer && customer.id !== 1) {
        const updatedCustomers = customers.map(c => 
          c.id === customer.id 
            ? { ...c, totalPurchases: (c.totalPurchases || 0) + total, points: (c.points || 0) + pointsEarned }
            : c
        );
        setCustomers(updatedCustomers);
      }

      setSalesHistory([sale, ...(salesHistory || [])]);

      return sale;
    } catch (error) {
      console.error('Erreur lors du traitement de la vente:', error);
      return null;
    }
  };

  // Ajouter un produit au catalogue
  const addProduct = (product, initialStock = 0) => {
    try {
      if (!product || !product.name) return false;

      const newProduct = {
        id: product.id || Date.now(),
        name: product.name,
        category: product.category || 'Divers',
        price: parseFloat(product.price) || 0,
        costPrice: parseFloat(product.costPrice) || 0,
        minStock: parseInt(product.minStock) || 5,
        maxStock: parseInt(product.maxStock) || 100,
        sku: product.sku || `SKU${Date.now()}`,
        barcode: product.barcode || `${Date.now()}`,
        supplier: product.supplier || '',
        image: product.image || '',
        createdAt: new Date().toISOString()
      };

      // Ajouter au catalogue
      setProductCatalog(prev => [...(prev || []), newProduct]);

      // Ajouter le stock initial au magasin actuel
      if (initialStock > 0) {
        const currentStock = { ...(stockByStore[currentStoreId] || {}) };
        currentStock[newProduct.id] = initialStock;
        setStockForStore(currentStoreId, currentStock);

        // Enregistrer dans l'historique
        const record = {
          id: Date.now(),
          date: new Date().toISOString(),
          storeId: currentStoreId,
          productId: newProduct.id,
          productName: newProduct.name,
          product: newProduct,
          quantity: initialStock,
          reason: 'Stock initial'
        };
        addInventoryRecord(record);
      }

      return newProduct;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de produit:', error);
      return false;
    }
  };

  // ✅ NOUVELLE FONCTION : Mettre à jour un produit
  const updateProduct = (productId, updatedData) => {
    try {
      if (!productId || !updatedData) return false;

      // Mettre à jour dans le catalogue global
      setProductCatalog(prev => 
        prev.map(product => 
          product.id === productId 
            ? { 
                ...product, 
                ...updatedData,
                updatedAt: new Date().toISOString()
              }
            : product
        )
      );

      // Enregistrer dans l'historique si nécessaire
      const record = {
        id: Date.now(),
        date: new Date().toISOString(),
        storeId: currentStoreId,
        productId: productId,
        productName: updatedData.name || 'Produit modifié',
        quantity: 0,
        reason: 'Modification produit'
      };
      addInventoryRecord(record);

      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      return false;
    }
  };

  // Supprimer un produit
  const removeProduct = (productId) => {
    try {
      if (!productId) return false;

      // Supprimer du catalogue
      setProductCatalog(prev => (prev || []).filter(p => p.id !== productId));

      // Supprimer du stock de tous les magasins
      const updatedStockByStore = { ...stockByStore };
      Object.keys(updatedStockByStore).forEach(storeId => {
        if (updatedStockByStore[storeId][productId]) {
          delete updatedStockByStore[storeId][productId];
          saveInventory(storeId, updatedStockByStore[storeId]);
        }
      });
      setStockByStore(updatedStockByStore);

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }
  };

  // Ajouter du stock à un magasin spécifique
  const addStock = (storeId, productId, quantity, reason = 'Réapprovisionnement') => {
    try {
      if (!storeId || !productId || !quantity || quantity <= 0) return false;

      const storeStock = { ...(stockByStore[storeId] || {}) };
      storeStock[productId] = (storeStock[productId] || 0) + quantity;
      setStockForStore(storeId, storeStock);

      const product = (productCatalog || []).find(p => p.id === productId);
      const record = {
        id: Date.now(),
        date: new Date().toISOString(),
        storeId,
        productId,
        productName: product?.name || '',
        product,
        quantity,
        reason
      };
      addInventoryRecord(record);

      return record;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de stock:', error);
      return false;
    }
  };

  // Transférer du stock entre magasins
  const transferStock = (fromStoreId, toStoreId, productId, quantity) => {
    try {
      if (!fromStoreId || !toStoreId || !productId || quantity <= 0) return false;
      
      const fromStock = { ...(stockByStore[fromStoreId] || {}) };
      const toStock = { ...(stockByStore[toStoreId] || {}) };
      
      if ((fromStock[productId] || 0) < quantity) return false;
      
      fromStock[productId] = (fromStock[productId] || 0) - quantity;
      toStock[productId] = (toStock[productId] || 0) + quantity;
      
      setStockForStore(fromStoreId, fromStock);
      setStockForStore(toStoreId, toStock);

      const product = (productCatalog || []).find(p => p.id === productId);
      const date = new Date().toISOString();
      
      addInventoryRecord({
        id: Date.now(),
        storeId: fromStoreId,
        productId,
        productName: product?.name || '',
        product,
        quantity: -quantity,
        reason: `Transfert vers ${toStoreId}`,
        date
      });
      
      addInventoryRecord({
        id: Date.now() + 1,
        storeId: toStoreId,
        productId,
        productName: product?.name || '',
        product,
        quantity,
        reason: `Transfert de ${fromStoreId}`,
        date
      });

      return true;
    } catch (error) {
      console.error('Erreur lors du transfert de stock:', error);
      return false;
    }
  };

  // Traiter un retour produit
  const processReturn = (productId, quantity, reason = 'Retour client') => {
    try {
      const product = (productCatalog || []).find(p => p.id === productId);
      if (!product || !quantity || quantity <= 0) return false;

      const returnEntry = {
        id: Date.now(),
        productId,
        productName: product.name,
        quantity,
        reason,
        date: new Date().toISOString()
      };

      addStock(currentStoreId, productId, quantity, reason);
      setReturnsHistory([returnEntry, ...(returnsHistory || [])]);
      return true;
    } catch (error) {
      console.error('Erreur lors du traitement du retour:', error);
      return false;
    }
  };

  // Ajouter un crédit
  const addCredit = (customerId, amount, description) => {
    try {
      const credit = {
        id: Date.now(),
        customerId: customerId || 1,
        amount: parseFloat(amount) || 0,
        description: description || '',
        date: new Date().toISOString(),
        status: 'pending',
        storeId: currentStoreId
      };

      setCredits([credit, ...(credits || [])]);
      return credit;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de crédit:', error);
      return false;
    }
  };

  // Obtenir des statistiques
  const getStats = () => {
    try {
      const currentStoreStock = stockByStore[currentStoreId] || {};
      const productsWithStock = (productCatalog || []).map(product => ({
        ...product,
        stock: currentStoreStock[product.id] || 0
      }));

      const totalProducts = productsWithStock.length;
      const totalRevenue = (salesHistory || []).reduce((sum, sale) => sum + (sale.total || 0), 0);
      const totalTransactions = (salesHistory || []).length;
      const totalCustomers = (customers || []).length;
      const lowStockProducts = productsWithStock.filter(p => (p.stock || 0) <= (p.minStock || 5));
      const outOfStockProducts = productsWithStock.filter(p => (p.stock || 0) === 0);

      return {
        totalProducts,
        totalRevenue,
        totalTransactions,
        totalCustomers,
        lowStockProducts: lowStockProducts.length,
        outOfStockProducts: outOfStockProducts.length,
        averageBasket: totalTransactions > 0 ? totalRevenue / totalTransactions : 0
      };
    } catch (error) {
      console.error('Erreur lors du calcul des stats:', error);
      return {
        totalProducts: 0,
        totalRevenue: 0,
        totalTransactions: 0,
        totalCustomers: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        averageBasket: 0
      };
    }
  };

  // Nettoyer toutes les données
  const clearAllData = () => {
    try {
      setProductCatalog([]);
      setStockByStore({});
      setGlobalProducts([]);
      setSalesHistory([]);
      setCustomers([{ id: 1, name: 'Client Comptant', phone: '', email: '', totalPurchases: 0, points: 0 }]);
      setCredits([]);
      setEmployees([]);
      setReturnsHistory([]);
      
      // Nettoyer le localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('pos_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      return false;
    }
  };

  // ==================== VALEUR DU CONTEXTE ====================
  const value = {
    // États existants
    productCatalog: productCatalog || [],
    stockByStore,
    globalProducts: globalProducts || [],
    salesHistory: salesHistory || [],
    setSalesHistory,
    customers: customers || [],
    setCustomers,
    appSettings: appSettings || {},
    setAppSettings,
    credits: credits || [],
    setCredits,
    employees: employees || [],
    setEmployees,
    returnsHistory: returnsHistory || [],
    setReturnsHistory,

    // Fonctions sécurisées
    processSale,
    addProduct,
    updateProduct,  // ✅ NOUVELLE FONCTION AJOUTÉE
    removeProduct,
    setStockForStore,
    addStock,
    transferStock,
    processReturn,
    getStats,
    clearAllData,
    addCredit,

    // Multi-magasins
    stores,
    currentStoreId,
    setCurrentStoreId: switchStore,
    viewMode,
    setViewMode,
    getCurrentStore
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp doit être utilisé dans un AppProvider');
  }
  return context;
};
