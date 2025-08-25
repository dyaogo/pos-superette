import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [currentStoreId, setCurrentStoreId] = useState('wend-kuuni');
  const [viewMode, setViewMode] = useState('single');
  
  // États existants avec initialisation sécurisée
  const [globalProducts, setGlobalProducts] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [customers, setCustomers] = useState([
    { id: 1, name: 'Client Comptant', phone: '', email: '', totalPurchases: 0, points: 0 }
  ]);
  const [credits, setCredits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [returnsHistory, setReturnsHistory] = useState([]);
  const [appSettings, setAppSettings] = useState({
    storeName: 'Alimentation Wend-Kuuni',
    currency: 'FCFA',
    taxRate: 18,
    pointsPerPurchase: 1,
    darkMode: false
  });

  // ==================== FONCTIONS UTILITAIRES ====================
  
  // Obtenir le magasin actuel
  const getCurrentStore = () => {
    return stores.find(store => store.id === currentStoreId) || stores[0];
  };

  // Changer de magasin
  const switchStore = (newStoreId) => {
    if (newStoreId === currentStoreId) return;
    setCurrentStoreId(newStoreId);
    localStorage.setItem('pos_current_store', newStoreId);
  };

  // ==================== FONCTIONS MÉTIER ====================

  // Traiter une vente
  const processSale = (cart, paymentMethod, amountReceived, customerId = 1) => {
    try {
      const sale = {
        id: Date.now(),
        date: new Date().toISOString(),
        items: cart || [],
        total: (cart || []).reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0),
        paymentMethod: paymentMethod || 'cash',
        amountReceived: amountReceived || 0,
        change: paymentMethod === 'cash' ? Math.max(0, (amountReceived || 0) - (cart || []).reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0)) : 0,
        customerId: customerId || 1,
        receiptNumber: `${getCurrentStore().code}${Date.now().toString().slice(-8)}`,
        storeId: currentStoreId
      };

      // Déduire du stock avec protection
      const updatedProducts = (globalProducts || []).map(product => {
        const cartItem = (cart || []).find(item => item.id === product.id);
        if (cartItem) {
          return {
            ...product,
            stock: Math.max(0, (product.stock || 0) - (cartItem.quantity || 0))
          };
        }
        return product;
      });

      // Mettre à jour les points du client
      let updatedCustomers = customers || [];
      if (customerId !== 1) {
        const pointsEarned = Math.floor((sale.total || 0) / 1000);
        updatedCustomers = (customers || []).map(c => 
          c.id === customerId 
            ? { ...c, totalPurchases: (c.totalPurchases || 0) + (sale.total || 0), points: (c.points || 0) + pointsEarned }
            : c
        );
      }

      setGlobalProducts(updatedProducts);
      setSalesHistory([sale, ...(salesHistory || [])]);
      setCustomers(updatedCustomers);

      return sale;
    } catch (error) {
      console.error('Erreur lors du traitement de la vente:', error);
      return null;
    }
  };

  // Ajouter du stock
  const addStock = (productId, quantity, reason = 'Réapprovisionnement') => {
    try {
      if (!productId || !quantity || quantity <= 0) return false;

      const updatedProducts = (globalProducts || []).map(product =>
        product.id === productId
          ? { ...product, stock: (product.stock || 0) + quantity }
          : product
      );

      setGlobalProducts(updatedProducts);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de stock:', error);
      return false;
    }
  };

  // Traiter un retour produit
  const processReturn = (productId, quantity, reason = 'Retour client') => {
    try {
      const product = (globalProducts || []).find(p => p.id === productId);
      if (!product || !quantity || quantity <= 0) return false;

      const returnEntry = {
        id: Date.now(),
        productId,
        productName: product.name,
        quantity,
        reason,
        date: new Date().toISOString()
      };

      addStock(productId, quantity, reason);
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
        amount: amount || 0,
        originalAmount: amount || 0,
        description: description || 'Vente à crédit',
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        payments: [],
        remainingAmount: amount || 0,
        storeId: currentStoreId
      };
      
      setCredits([...(credits || []), credit]);
      return credit;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de crédit:', error);
      return null;
    }
  };

  // Calculer les statistiques
  const getStats = () => {
    try {
      const today = new Date().toDateString();
      const safeSales = salesHistory || [];
      const safeProducts = globalProducts || [];
      const safeCustomers = customers || [];
      
      const todaySales = safeSales.filter(sale => 
        new Date(sale.date).toDateString() === today
      );
      
      const thisMonth = new Date().getMonth();
      const monthSales = safeSales.filter(sale => 
        new Date(sale.date).getMonth() === thisMonth
      );

      return {
        todayRevenue: todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0),
        todayTransactions: todaySales.length,
        monthRevenue: monthSales.reduce((sum, sale) => sum + (sale.total || 0), 0),
        monthTransactions: monthSales.length,
        totalProducts: safeProducts.length,
        lowStockCount: safeProducts.filter(p => (p.stock || 0) <= (p.minStock || 5) && (p.stock || 0) > 0).length,
        outOfStockCount: safeProducts.filter(p => (p.stock || 0) === 0).length,
        totalCustomers: Math.max(0, safeCustomers.length - 1),
        inventoryValue: safeProducts.reduce((sum, p) => sum + ((p.stock || 0) * (p.costPrice || 0)), 0)
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return {
        todayRevenue: 0, todayTransactions: 0, monthRevenue: 0, monthTransactions: 0,
        totalProducts: 0, lowStockCount: 0, outOfStockCount: 0, totalCustomers: 0, inventoryValue: 0
      };
    }
  };

  // Effacer toutes les données
  const clearAllData = () => {
    if (window.confirm('⚠️ ATTENTION: Ceci effacera TOUTES les données. Êtes-vous sûr?')) {
      try {
        localStorage.clear();
        window.location.reload();
      } catch (error) {
        console.error('Erreur lors de l\'effacement des données:', error);
      }
    }
  };

  // ==================== EFFETS AVEC PROTECTION ====================
  
  // Chargement initial
  useEffect(() => {
    try {
      const storeKey = `pos_${currentStoreId}`;
      
      const savedProducts = localStorage.getItem(`${storeKey}_products`);
      const savedSales = localStorage.getItem(`${storeKey}_sales`);
      const savedCustomers = localStorage.getItem(`${storeKey}_customers`);
      const savedCredits = localStorage.getItem(`${storeKey}_credits`);
      const savedSettings = localStorage.getItem(`${storeKey}_settings`);
      const savedEmployees = localStorage.getItem(`${storeKey}_employees`);
      const savedReturns = localStorage.getItem(`${storeKey}_returns`);
      
      if (savedProducts) {
        try {
          setGlobalProducts(JSON.parse(savedProducts));
        } catch (e) {
          console.warn('Erreur de parsing products:', e);
        }
      }
      
      if (savedSales) {
        try {
          setSalesHistory(JSON.parse(savedSales));
        } catch (e) {
          console.warn('Erreur de parsing sales:', e);
        }
      }
      
      if (savedCustomers) {
        try {
          setCustomers(JSON.parse(savedCustomers));
        } catch (e) {
          console.warn('Erreur de parsing customers:', e);
        }
      }
      
      if (savedCredits) {
        try {
          setCredits(JSON.parse(savedCredits));
        } catch (e) {
          console.warn('Erreur de parsing credits:', e);
        }
      }
      
      if (savedSettings) {
        try {
          setAppSettings(JSON.parse(savedSettings));
        } catch (e) {
          console.warn('Erreur de parsing settings:', e);
        }
      }

      if (savedEmployees) {
        try {
          setEmployees(JSON.parse(savedEmployees));
        } catch (e) {
          console.warn('Erreur de parsing employees:', e);
        }
      }

      if (savedReturns) {
        try {
          setReturnsHistory(JSON.parse(savedReturns));
        } catch (e) {
          console.warn('Erreur de parsing returns:', e);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement initial:', error);
    }
  }, [currentStoreId]);

  // Sauvegarde automatique avec protection
  useEffect(() => {
    if (Array.isArray(globalProducts) && globalProducts.length > 0) {
      try {
        localStorage.setItem(`pos_${currentStoreId}_products`, JSON.stringify(globalProducts));
      } catch (error) {
        console.warn('Erreur de sauvegarde products:', error);
      }
    }
  }, [globalProducts, currentStoreId]);

  useEffect(() => {
    if (Array.isArray(salesHistory) && salesHistory.length > 0) {
      try {
        localStorage.setItem(`pos_${currentStoreId}_sales`, JSON.stringify(salesHistory));
      } catch (error) {
        console.warn('Erreur de sauvegarde sales:', error);
      }
    }
  }, [salesHistory, currentStoreId]);

  useEffect(() => {
    if (Array.isArray(customers) && customers.length > 0) {
      try {
        localStorage.setItem(`pos_${currentStoreId}_customers`, JSON.stringify(customers));
      } catch (error) {
        console.warn('Erreur de sauvegarde customers:', error);
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

  // ==================== VALEUR DU CONTEXTE ====================
  const value = {
    // États existants
    globalProducts: globalProducts || [],
    setGlobalProducts,
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
    addStock,
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