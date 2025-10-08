import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [productCatalog, setProductCatalog] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null); // NOUVEAU
  const [loading, setLoading] = useState(true);

  // Charger les données au démarrage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les magasins d'abord
      const storesRes = await fetch('/api/stores');
      const storesData = await storesRes.json();
      setStores(storesData);

      // Définir le magasin actif (soit depuis localStorage, soit le premier)
      const savedStoreId = localStorage.getItem('currentStoreId');
      const activeStore = savedStoreId 
        ? storesData.find(s => s.id === savedStoreId) 
        : storesData[0];
      
      if (activeStore) {
        setCurrentStore(activeStore);
      }

      // Charger les produits
      const productsRes = await fetch('/api/products');
      const productsData = await productsRes.json();
      setProductCatalog(productsData);

      // Charger les ventes
      const salesRes = await fetch('/api/sales');
      const salesData = await salesRes.json();
      setSalesHistory(salesData);

      // Charger les clients
      const customersRes = await fetch('/api/customers');
      const customersData = await customersRes.json();
      setCustomers(customersData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour changer de magasin
  const changeStore = (store) => {
    setCurrentStore(store);
    localStorage.setItem('currentStoreId', store.id);
    // Recharger les données pour le nouveau magasin
    loadData();
  };

  // Filtrer les produits par magasin actif
  const currentStoreProducts = productCatalog.filter(
    p => !currentStore || p.storeId === currentStore.id
  );

  // Filtrer les ventes par magasin actif
  const currentStoreSales = salesHistory.filter(
    s => !currentStore || s.storeId === currentStore.id
  );

  const addProduct = async (productData) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productData,
          storeId: currentStore?.id // Utiliser le magasin actif
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
      console.error('Erreur modification produit:', error);
      return { success: false };
    }
  };

  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await loadData();
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Erreur suppression produit:', error);
      return { success: false };
    }
  };

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

  return (
    <AppContext.Provider
      value={{
        // Données filtrées par magasin
        productCatalog: currentStoreProducts,
        salesHistory: currentStoreSales,
        customers,
        
        // Données complètes (non filtrées)
        allProducts: productCatalog,
        allSales: salesHistory,
        
        // Magasins
        stores,
        currentStore,
        changeStore,
        
        // Actions
        addProduct,
        updateProduct,
        deleteProduct,
        addCustomer,
        updateCustomer,
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