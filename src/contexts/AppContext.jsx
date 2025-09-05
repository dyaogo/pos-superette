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
  const [currentStoreId, setCurrentStoreId] = useState(() => {
    try {
      return localStorage.getItem('pos_current_store') || null;
    } catch (e) {
      return null;
    }
  });
  const [viewMode, setViewMode] = useState('single');
  
  // Catalogue produit global (hors magasin)
  const [productCatalog, setProductCatalog] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_products_catalog');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Stock par magasin { [storeId]: { [productId]: quantity } }
  const [stockByStore, setStockByStore] = useState({});
  const setStockForStore = (storeId, stock) => {
    setStockByStore(prev => ({ ...prev, [storeId]: stock }));
    saveInventory(storeId, stock);
  };

  const [globalProducts, setGlobalProducts] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [customers, setCustomers] = useState([
    { id: 1, name: 'Client Comptant', phone: '', email: '', totalPurchases: 0, points: 0 }
  ]);
  const [credits, setCredits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [returnsHistory, setReturnsHistory] = useState([]);
  const [appSettings, setAppSettings] = useState(() => {
    try {
      const storeKey = currentStoreId ? `pos_${currentStoreId}_settings` : null;
      if (storeKey) {
        const saved = localStorage.getItem(storeKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            currency: 'FCFA',
            taxRate: 18,
            pointsPerPurchase: 1,
            darkMode: false,
            ...parsed,
            storeName: stores.find(s => s.id === currentStoreId)?.name || parsed.storeName
          };
        }
      }
    } catch (e) {
      console.warn('Erreur de chargement des paramètres:', e);
    }
    return {
      storeName: stores.find(s => s.id === currentStoreId)?.name || 'Alimentation Wend-Kuuni',
      currency: 'FCFA',
      taxRate: 18,
      pointsPerPurchase: 1,
      darkMode: false
    };
  });

  // ==================== FONCTIONS UTILITAIRES ====================
  
  // Obtenir le magasin actuel
  const getCurrentStore = () => {
    if (viewMode === 'consolidated' || !currentStoreId) return null;
    return stores.find(store => store.id === currentStoreId) || null;
  };

  // Changer de magasin
  const switchStore = (newStoreId) => {
    if (newStoreId === currentStoreId) return;
    setCurrentStoreId(newStoreId);
    localStorage.setItem('pos_current_store', newStoreId);
    const storeName = stores.find(store => store.id === newStoreId)?.name;
    setAppSettings(prev => ({ ...prev, storeName }));
    if (!stockByStore[newStoreId]) {
      const loaded = loadInventory(newStoreId);
      setStockForStore(newStoreId, loaded);
    }
  };

  // Recalculer les produits globaux lorsqu'on change de magasin, de catalogue ou de stock
  useEffect(() => {
    const stock = stockByStore[currentStoreId] || {};
    const merged = (productCatalog || []).map(p => ({ ...p, stock: stock[p.id] || 0 }));
    setGlobalProducts(merged);
  }, [productCatalog, stockByStore, currentStoreId]);

  // Sauvegarder le catalogue produits
  useEffect(() => {
    try {
      localStorage.setItem('pos_products_catalog', JSON.stringify(productCatalog));
    } catch (e) {
      console.warn('Erreur de sauvegarde du catalogue:', e);
    }
  }, [productCatalog]);

  // ==================== FONCTIONS MÉTIER ====================

  // Ajouter un produit au catalogue et initialiser son stock pour le magasin courant
  const addProduct = (product, initialStock = 0) => {
    try {
      setProductCatalog(prev => [...prev, product]);
      setStockByStore(prev => {
        const storeStock = { ...(prev[currentStoreId] || {}), [product.id]: initialStock };
        saveInventory(currentStoreId, storeStock);
        return { ...prev, [currentStoreId]: storeStock };
      });
      return true;
    } catch (error) {
      console.error("Erreur lors de l'ajout de produit:", error);
      return false;
    }
  };

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
        receiptNumber: `${getCurrentStore()?.code || ''}${Date.now().toString().slice(-8)}`,
        storeId: currentStoreId
      };

      // Déduire du stock avec protection
      const storeStock = { ...(stockByStore[currentStoreId] || {}) };
      (cart || []).forEach(item => {
        const currentQty = storeStock[item.id] || 0;
        storeStock[item.id] = Math.max(0, currentQty - (item.quantity || 0));
      });
      setStockForStore(currentStoreId, storeStock);

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

      setSalesHistory([sale, ...(salesHistory || [])]);
      setCustomers(updatedCustomers);

      return sale;
    } catch (error) {
      console.error('Erreur lors du traitement de la vente:', error);
      return null;
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
      const product = productCatalog.find(p => p.id === productId);
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

      // Données par défaut (vue magasin)
      let safeSales = salesHistory || [];
      let safeProducts = globalProducts || [];
      let safeCustomers = customers || [];

      // Agrégation multi-magasins si nécessaire
      if (viewMode === 'consolidated') {
        safeSales = [];
        safeProducts = [];
        const customerMap = new Map();

        stores.forEach(store => {
          const storeKey = `pos_${store.id}`;

          const storeSales = localStorage.getItem(`${storeKey}_sales`);
          if (storeSales) {
            try {
              safeSales = safeSales.concat(JSON.parse(storeSales));
            } catch (e) {
              console.warn('Erreur de parsing sales:', e);
            }
          }

          const storeProducts = localStorage.getItem(`${storeKey}_products`);
          if (storeProducts) {
            try {
              safeProducts = safeProducts.concat(JSON.parse(storeProducts));
            } catch (e) {
              console.warn('Erreur de parsing products:', e);
            }
          }

          const storeCustomers = localStorage.getItem(`${storeKey}_customers`);
          if (storeCustomers) {
            try {
              JSON.parse(storeCustomers).forEach(c => customerMap.set(c.id, c));
            } catch (e) {
              console.warn('Erreur de parsing customers:', e);
            }
          }
        });

        safeCustomers = Array.from(customerMap.values());
      }

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

      const savedStock = loadInventory(currentStoreId);
      const savedSales = localStorage.getItem(`${storeKey}_sales`);
      const savedCustomers = localStorage.getItem(`${storeKey}_customers`);
      const savedCredits = localStorage.getItem(`${storeKey}_credits`);
      const savedSettings = localStorage.getItem(`${storeKey}_settings`);
      const savedEmployees = localStorage.getItem(`${storeKey}_employees`);
      const savedReturns = localStorage.getItem(`${storeKey}_returns`);

      setStockForStore(currentStoreId, savedStock);
      
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
      
      const storeName = stores.find(s => s.id === currentStoreId)?.name;
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setAppSettings({ ...parsed, storeName: storeName || parsed.storeName });
        } catch (e) {
          console.warn('Erreur de parsing settings:', e);
          setAppSettings(prev => ({ ...prev, storeName }));
        }
      } else {
        setAppSettings(prev => ({ ...prev, storeName }));
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

  // Chargement des données en mode consolidé
  useEffect(() => {
    if (viewMode !== 'consolidated') return;
    try {
      let allProducts = [];
      let allSales = [];
      let allCustomers = new Map();
      let allCredits = [];
      let allEmployees = [];
      let allReturns = [];

      stores.forEach(store => {
        const storeKey = `pos_${store.id}`;

        const storeStock = loadInventory(store.id);
        const merged = (productCatalog || []).map(p => ({
          ...p,
          stock: (storeStock || {})[p.id] || 0,
          storeId: store.id
        }));
        allProducts = allProducts.concat(merged);

        const savedSales = localStorage.getItem(`${storeKey}_sales`);
        if (savedSales) {
          try {
            const parsed = JSON.parse(savedSales).map(s => ({ ...s, storeId: store.id }));
            allSales = allSales.concat(parsed);
          } catch (e) {
            console.warn('Erreur de parsing sales:', e);
          }
        }

        const savedCustomers = localStorage.getItem(`${storeKey}_customers`);
        if (savedCustomers) {
          try {
            JSON.parse(savedCustomers).forEach(c => allCustomers.set(c.id, c));
          } catch (e) {
            console.warn('Erreur de parsing customers:', e);
          }
        }

        const savedCredits = localStorage.getItem(`${storeKey}_credits`);
        if (savedCredits) {
          try {
            allCredits = allCredits.concat(JSON.parse(savedCredits));
          } catch (e) {
            console.warn('Erreur de parsing credits:', e);
          }
        }

        const savedEmployees = localStorage.getItem(`${storeKey}_employees`);
        if (savedEmployees) {
          try {
            allEmployees = allEmployees.concat(JSON.parse(savedEmployees));
          } catch (e) {
            console.warn('Erreur de parsing employees:', e);
          }
        }

        const savedReturns = localStorage.getItem(`${storeKey}_returns`);
        if (savedReturns) {
          try {
            allReturns = allReturns.concat(JSON.parse(savedReturns));
          } catch (e) {
            console.warn('Erreur de parsing returns:', e);
          }
        }
      });

      setGlobalProducts(allProducts);
      setSalesHistory(allSales);
      setCustomers(Array.from(allCustomers.values()));
      setCredits(allCredits);
      setEmployees(allEmployees);
      setReturnsHistory(allReturns);
    } catch (error) {
      console.error('Erreur lors du chargement consolidé:', error);
    }
  }, [viewMode]);

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