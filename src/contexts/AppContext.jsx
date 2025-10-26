import { createContext, useContext, useState, useEffect } from 'react';
import { useOnline } from './OnlineContext';
import { offlineDB } from '../utils/offlineDB';

const AppContext = createContext();

export function AppProvider({ children }) {
  const { isOnline, cacheData } = useOnline();
  
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [productCatalog, setProductCatalog] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(null);

  // Initialisation au démarrage - AVEC PROTECTION
  useEffect(() => {
    if (!initialized) {
      initializeApp();
      setInitialized(true);
    }
  }, [initialized]);

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

  // ✅ Fonction loadData - OFFLINE FIRST
  const loadData = async () => {
    setLoading(true);
    try {
      // ÉTAPE 1: Toujours charger depuis le cache d'abord
      const cachedProducts = await offlineDB.getProducts();
      const cachedCustomers = await offlineDB.getCustomers();
      const cachedCredits = await offlineDB.getCredits();
      
      // Afficher les données du cache immédiatement si disponibles
      if (cachedProducts.length > 0) {
        setProductCatalog(cachedProducts);
        setCustomers(cachedCustomers);
        setCredits(cachedCredits);
        console.log('✅ Données chargées depuis le cache');
      }
      
      // ÉTAPE 2: Si online, mettre à jour depuis l'API
      if (isOnline) {
        const [productsRes, salesRes, customersRes, creditsRes, storesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/sales'),
          fetch('/api/customers'),
          fetch('/api/credits'),
          fetch('/api/stores')
        ]);

        if (productsRes.ok && salesRes.ok && customersRes.ok) {
          const products = await productsRes.json();
          const sales = await salesRes.json();
          const customers = await customersRes.json();
          const credits = creditsRes.ok ? await creditsRes.json() : [];
          const stores = storesRes.ok ? await storesRes.json() : [];

          setProductCatalog(products);
          setSalesHistory(sales);
          setCustomers(customers);
          setCredits(credits);
          setStores(stores);

          // Sauvegarder dans le cache
          await cacheData({ products, customers, credits });
          console.log('✅ Données mises à jour depuis l\'API et sauvegardées en cache');
        }
      } else {
        console.log('📂 Mode offline - utilisation du cache uniquement');
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      
      // En cas d'erreur, essayer de charger depuis le cache
      try {
        const products = await offlineDB.getProducts();
        const customers = await offlineDB.getCustomers();
        const credits = await offlineDB.getCredits();
        
        if (products.length > 0) {
          setProductCatalog(products);
          setCustomers(customers);
          setCredits(credits);
          console.log('✅ Données chargées depuis le cache de secours');
        }
      } catch (cacheError) {
        console.error('Erreur chargement cache:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Changer de magasin - OFFLINE COMPATIBLE
  const changeStore = async (store) => {
    if (currentStore?.id === store.id) return;
    
    setCurrentStore(store);
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentStoreId', store.id);
    }
    
    // Ne pas recharger si offline - les données filtrées se mettront à jour automatiquement
    if (!isOnline) {
      console.log('📍 Changement de magasin en mode offline - utilisation du cache');
      return;
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

  // Enregistrer une vente
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
        const sale = await res.json();
        await loadData();
        return { success: true, sale };
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
        updateStoreOptimistic,
        addStoreOptimistic,
        deleteStoreOptimistic,

        // Données filtrées par magasin
        productCatalog: currentStoreProducts,
        salesHistory: currentStoreSales,
        customers,
        credits,

        // Données complètes (pour admin)
        allProducts: productCatalog,
        allSales: salesHistory,

        // Actions
        addProduct,
        updateProduct,
        deleteProduct,
        updateProductOptimistic,
        addSaleOptimistic,
        updateProductStockOptimistic,
        updateMultipleProductStocksOptimistic,
        addCreditOptimistic,
        updateCreditOptimistic,
        addCustomer,
        updateCustomer,
        recordSale,

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