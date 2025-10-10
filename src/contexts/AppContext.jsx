import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [productCatalog, setProductCatalog] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false); // NOUVEAU


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

  const loadData = async () => {
    try {
      // Charger produits
      const productsRes = await fetch('/api/products');
      const productsData = await productsRes.json();
      setProductCatalog(productsData);

      // Charger ventes
      const salesRes = await fetch('/api/sales');
      const salesData = await salesRes.json();
      setSalesHistory(salesData);

      // Charger clients
      const customersRes = await fetch('/api/customers');
      const customersData = await customersRes.json();
      setCustomers(customersData);
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
      await loadData();
      return { success: true };
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

        // Données filtrées par magasin
        productCatalog: currentStoreProducts,
        salesHistory: currentStoreSales,
        customers,

        // Données complètes (pour admin)
        allProducts: productCatalog,
        allSales: salesHistory,

        // Actions
        addProduct,
        updateProduct,
        deleteProduct,
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