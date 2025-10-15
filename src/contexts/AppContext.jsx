import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [productCatalog, setProductCatalog] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [credits, setCredits] = useState([]); // NOUVEAU
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false); // NOUVEAU
  const [lastLoadTime, setLastLoadTime] = useState(null); // ✨ AJOUTEZ CETTE LIGNE


  // Initialisation au démarrage - AVEC PROTECTION
  useEffect(() => {
    if (!initialized) {
      initializeApp();
      setInitialized(true);
    }
  }, [initialized]); // MODIFIÉ

  const initializeApp = async () => {
    setLoading(true);
    try {
      // 1. Charger les magasins
      const storesRes = await fetch('/api/stores');
      const storesData = await storesRes.json();
      setStores(storesData);

      // 2. Définir le magasin actif
      let activeStore = null;
      
      if (typeof window !== 'undefined') {
        const savedStoreId = localStorage.getItem('currentStoreId');
        activeStore = savedStoreId 
          ? storesData.find(s => s.id === savedStoreId) 
          : storesData[0];
      } else {
        activeStore = storesData[0];
      }

      if (activeStore) {
        setCurrentStore(activeStore);
      }

      // 3. Charger les autres données
      await loadData();
    } catch (error) {
      console.error('Erreur initialisation:', error);
    } finally {
      setLoading(false);
    }
  };

const loadData = async (force = false) => {
  // ✨ Cache de 30 secondes - ne recharge pas si récent
  const now = Date.now();
  if (!force && lastLoadTime && (now - lastLoadTime) < 30000) {
    console.log('📦 Données en cache, pas de rechargement');
    return;
  }

  try {
    // Paralléliser tous les appels
    const [storesRes, productsRes, salesRes, customersRes, creditsRes] = await Promise.all([
      fetch('/api/stores'),
      fetch('/api/products'),
      fetch('/api/sales'),
      fetch('/api/customers'),
      fetch('/api/credits')
    ]);
    
    // Traiter les réponses
    const [storesData, productsData, salesData, customersData, creditsData] = await Promise.all([
      storesRes.json(),
      productsRes.json(),
      salesRes.json(),
      customersRes.json(),
      creditsRes.json()
    ]);
    
    // Mettre à jour les états
    setStores(storesData);
    
    // Si currentStore existe, le mettre à jour avec les nouvelles données
    if (currentStore) {
      const updatedCurrentStore = storesData.find(s => s.id === currentStore.id);
      if (updatedCurrentStore) {
        setCurrentStore(updatedCurrentStore);
      }
    }
    
    // Trier les produits
    const sortedProducts = productsData.sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    setProductCatalog(sortedProducts);
    setSalesHistory(salesData);
    setCustomers(customersData);
    setCredits(creditsData);
    
    setLastLoadTime(now); // ✨ AJOUTEZ CETTE LIGNE À LA FIN
  } catch (error) {
    console.error('Erreur chargement données:', error);
  }
};
  // Changer de magasin - OPTIMISÉ
const changeStore = async (store) => {
  if (currentStore?.id === store.id) return; // NOUVEAU - Ne rien faire si c'est le même
  
  setCurrentStore(store);
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentStoreId', store.id);
  }
  await loadData();
};
// ✨ NOUVELLES FONCTIONS DE MISE À JOUR OPTIMISTE

// Mettre à jour un store sans tout recharger
const updateStoreOptimistic = (storeId, updatedData) => {
  setStores(prev => prev.map(s => 
    s.id === storeId ? { ...s, ...updatedData } : s
  ));
  
  // Si c'est le store actif, le mettre à jour aussi
  if (currentStore?.id === storeId) {
    setCurrentStore(prev => ({ ...prev, ...updatedData }));
  }
};

// Ajouter un store sans tout recharger
const addStoreOptimistic = (newStore) => {
  setStores(prev => [...prev, newStore]);
};

// Supprimer un store sans tout recharger
const deleteStoreOptimistic = (storeId) => {
  setStores(prev => prev.filter(s => s.id !== storeId));
};

// Mettre à jour un produit sans tout recharger
const updateProductOptimistic = (productId, updatedData) => {
  setProductCatalog(prev => prev.map(p => 
    p.id === productId ? { ...p, ...updatedData } : p
  ).sort((a, b) => a.name.localeCompare(b.name)));
};

// Ajouter une vente sans tout recharger
const addSaleOptimistic = (newSale) => {
  setSalesHistory(prev => [newSale, ...prev]);
};

// Mettre à jour le stock d'un produit après vente
const updateProductStockOptimistic = (productId, quantitySold) => {
  setProductCatalog(prev => prev.map(p => 
    p.id === productId 
      ? { ...p, stock: Math.max(0, p.stock - quantitySold) }
      : p
  ).sort((a, b) => a.name.localeCompare(b.name)));
};

// Mettre à jour plusieurs stocks en une fois
const updateMultipleProductStocksOptimistic = (stockUpdates) => {
  // stockUpdates = [{productId, quantitySold}, ...]
  setProductCatalog(prev => {
    const updated = prev.map(p => {
      const update = stockUpdates.find(u => u.productId === p.id);
      if (update) {
        return { ...p, stock: Math.max(0, p.stock - update.quantitySold) };
      }
      return p;
    });
    return updated.sort((a, b) => a.name.localeCompare(b.name));
  });
};

// Ajouter un crédit sans tout recharger
const addCreditOptimistic = (newCredit) => {
  setCredits(prev => [newCredit, ...prev]);
};

// Mettre à jour un crédit sans tout recharger
const updateCreditOptimistic = (creditId, updatedData) => {
  setCredits(prev => prev.map(c => 
    c.id === creditId ? { ...c, ...updatedData } : c
  ));
};
  // Filtrer par magasin actif
  const currentStoreProducts = productCatalog.filter(
    p => !currentStore || p.storeId === currentStore.id
  );

  const currentStoreSales = salesHistory.filter(
    s => !currentStore || s.storeId === currentStore.id
  );

  // Actions produits
  const addProduct = async (productData) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productData,
          storeId: currentStore?.id
        })
      });

      if (res.ok) {
        await loadData();
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Erreur ajout produit:', error);
      return { success: false };
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (res.ok) {
        await loadData();
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  };

  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  };

  // Actions clients
  const addCustomer = async (customerData) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });

      if (res.ok) {
        await loadData();
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  };

  const updateCustomer = async (id, customerData) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });

      if (res.ok) {
        await loadData();
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  };

// NOUVEAU : Enregistrer une vente
const recordSale = async (saleData) => {
  try {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...saleData,
        storeId: currentStore?.id
      })
    });

    if (res.ok) {
      const sale = await res.json(); // RÉCUPÉRER LA VENTE CRÉÉE
      await loadData();
      return { success: true, sale }; // RETOURNER LA VENTE
    }
    return { success: false };
  } catch (error) {
    console.error('Erreur enregistrement vente:', error);
    return { success: false };
  }
};

  // Mettre à jour le magasin actif
  const updateCurrentStore = async (storeData) => {
    if (!currentStore) return { success: false };

    try {
      const res = await fetch(`/api/stores/${currentStore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData)
      });

      if (res.ok) {
        const updatedStore = await res.json();
        setCurrentStore(updatedStore);
        
        // Mettre à jour aussi dans la liste
        setStores(prev => prev.map(s => 
          s.id === updatedStore.id ? updatedStore : s
        ));
        
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  };

  return (
    <AppContext.Provider
      value={{
        // Magasins
        stores,
        currentStore,
        changeStore,
        updateCurrentStore,
        updateStoreOptimistic,      // ✨ NOUVEAU
      addStoreOptimistic,         // ✨ NOUVEAU
      deleteStoreOptimistic,      // ✨ NOUVEAU

        // Données filtrées par magasin
        productCatalog: currentStoreProducts,
        salesHistory: currentStoreSales,
        customers,
        credits, // NOUVEAU


        // Données complètes (pour admin)
        allProducts: productCatalog,
        allSales: salesHistory,

        // Actions
        addProduct,
        updateProduct,
        deleteProduct,
        updateProductOptimistic,    // ✨ NOUVEAU
      addSaleOptimistic,          // ✨ NOUVEAU
      updateProductStockOptimistic,   // ✨ NOUVEAU
      updateMultipleProductStocksOptimistic, // ✨ NOUVEAU
      addCreditOptimistic,            // ✨ NOUVEAU
      updateCreditOptimistic,         // ✨ NOUVEAU
      addCustomer,
        addCustomer,
        updateCustomer,
        recordSale,  // AJOUTEZ CETTE LIGNE


        // État
        loading,
        reloadData: loadData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}