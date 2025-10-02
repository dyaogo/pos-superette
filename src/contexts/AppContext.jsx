import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // États existants
  const [productCatalog, setProductCatalog] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [credits, setCredits] = useState([]);
  const [returnsHistory, setReturnsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NOUVEAUX ÉTATS OFFLINE
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  
  const [appSettings, setAppSettings] = useState({
    currency: 'FCFA',
    darkMode: false,
    taxRate: 18,
    companyName: 'Mon Superette',
    receiptFooter: 'Merci de votre visite !',
    autoBackup: true,
    lowStockAlert: true,
    printerEnabled: false
  });

  // Détecter le statut de connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // État initial
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Charger la queue offline depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedQueue = localStorage.getItem('offline_queue');
      if (savedQueue) {
        setOfflineQueue(JSON.parse(savedQueue));
      }
      
      const savedLastSync = localStorage.getItem('last_sync');
      if (savedLastSync) {
        setLastSync(new Date(savedLastSync));
      }
    }
  }, []);

  // Sauvegarder la queue offline
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('offline_queue', JSON.stringify(offlineQueue));
    }
  }, [offlineQueue]);

  // Synchroniser la queue offline
  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;

    console.log(`Synchronisation de ${offlineQueue.length} opérations...`);

    const successfulSyncs = [];
    const failedSyncs = [];

    for (const operation of offlineQueue) {
      try {
        if (operation.type === 'sale') {
          const response = await fetch('/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(operation.data)
          });

          if (response.ok) {
            successfulSyncs.push(operation.id);
          } else {
            failedSyncs.push(operation);
          }
        }
        // Ajouter d'autres types d'opérations ici
      } catch (error) {
        console.error('Erreur sync:', error);
        failedSyncs.push(operation);
      }
    }

    // Retirer les opérations réussies de la queue
    setOfflineQueue(failedSyncs);
    setLastSync(new Date());
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_sync', new Date().toISOString());
    }

    if (successfulSyncs.length > 0) {
      // Recharger les données après sync
      loadAllData();
    }
  };

  // Charger toutes les données depuis l'API
  const loadAllData = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      setLoading(true);

      const [productsRes, salesRes, customersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/sales'),
        fetch('/api/customers')
      ]);

      if (productsRes.ok) {
        const products = await productsRes.json();
        setProductCatalog(products);
        // Cache local pour offline
        localStorage.setItem('cached_products', JSON.stringify(products));
      }

      if (salesRes.ok) {
        const sales = await salesRes.json();
        setSalesHistory(sales);
      }

      if (customersRes.ok) {
        const customersList = await customersRes.json();
        setCustomers(customersList);
        localStorage.setItem('cached_customers', JSON.stringify(customersList));
      }

      const savedSettings = localStorage.getItem('pos_settings');
      if (savedSettings) {
        setAppSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      }

    } catch (error) {
      console.error('Erreur chargement données:', error);
      
      // Charger depuis le cache si offline
      if (!navigator.onLine) {
        const cachedProducts = localStorage.getItem('cached_products');
        const cachedCustomers = localStorage.getItem('cached_customers');
        
        if (cachedProducts) setProductCatalog(JSON.parse(cachedProducts));
        if (cachedCustomers) setCustomers(JSON.parse(cachedCustomers));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // VENTE AVEC SUPPORT OFFLINE
  const recordSale = async (saleData) => {
    try {
      const enrichedItems = saleData.items.map(item => {
        const product = productCatalog.find(p => p.id === item.productId);
        return {
          ...item,
          name: product?.name || 'Produit inconnu'
        };
      });

      const salePayload = {
        ...saleData,
        items: enrichedItems
      };

      if (isOnline) {
        // Mode online - envoi direct
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(salePayload)
        });

        if (response.ok) {
          const newSale = await response.json();
          setSalesHistory(prev => [newSale, ...prev]);
          return { success: true, sale: newSale, synced: true };
        }
        
        // Si l'API échoue, ajouter à la queue
        throw new Error('API failed');
      } else {
        // Mode offline - ajouter à la queue
        const offlineSale = {
          id: `offline_${Date.now()}`,
          type: 'sale',
          data: salePayload,
          timestamp: new Date().toISOString(),
          status: 'pending'
        };

        setOfflineQueue(prev => [...prev, offlineSale]);
        
        // Ajouter à l'historique local avec indicateur offline
        const localSale = {
          id: offlineSale.id,
          ...salePayload,
          createdAt: offlineSale.timestamp,
          offline: true
        };
        
        setSalesHistory(prev => [localSale, ...prev]);
        
        return { 
          success: true, 
          sale: localSale, 
          synced: false,
          offline: true 
        };
      }
    } catch (error) {
      // En cas d'erreur, sauvegarder offline
      const offlineSale = {
        id: `offline_${Date.now()}`,
        type: 'sale',
        data: salePayload,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      setOfflineQueue(prev => [...prev, offlineSale]);
      
      return { 
        success: true, 
        sale: offlineSale, 
        synced: false,
        offline: true,
        message: 'Vente sauvegardée en mode offline'
      };
    }
  };

  // Reste des fonctions existantes...
  const addProduct = async (productData) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        const newProduct = await response.json();
        setProductCatalog(prev => [...prev, newProduct]);
        return { success: true, product: newProduct };
      }
      return { success: false, error: 'Erreur API' };
    } catch (error) {
      console.error('Erreur ajout produit:', error);
      return { success: false, error: error.message };
    }
  };

  const updateProduct = async (productId, updates) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        setProductCatalog(prev => 
          prev.map(p => p.id === productId ? updatedProduct : p)
        );
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Erreur mise à jour produit:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProductCatalog(prev => prev.filter(p => p.id !== productId));
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Erreur suppression produit:', error);
      return { success: false, error: error.message };
    }
  };

  const addCustomer = async (customerData) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });

      if (response.ok) {
        const newCustomer = await response.json();
        setCustomers(prev => [...prev, newCustomer]);
        return { success: true, customer: newCustomer };
      }
      return { success: false };
    } catch (error) {
      console.error('Erreur ajout client:', error);
      return { success: false, error: error.message };
    }
  };

  const updateCustomer = async (customerId, updates) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedCustomer = await response.json();
        setCustomers(prev => 
          prev.map(c => c.id === customerId ? updatedCustomer : c)
        );
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Erreur mise à jour client:', error);
      return { success: false, error: error.message };
    }
  };

  const updateAppSettings = (newSettings) => {
    const updated = { ...appSettings, ...newSettings };
    setAppSettings(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_settings', JSON.stringify(updated));
    }
  };

  const value = {
    // Données
    productCatalog,
    salesHistory,
    customers,
    credits,
    returnsHistory,
    appSettings,
    loading,

    // État offline
    isOnline,
    offlineQueue,
    lastSync,
    syncOfflineQueue,

    // Actions produits
    addProduct,
    updateProduct,
    deleteProduct,

    // Actions ventes
    recordSale,

    // Actions clients
    addCustomer,
    updateCustomer,

    // Actions paramètres
    updateAppSettings
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  
  if (typeof window === 'undefined') {
    return {
      productCatalog: [],
      salesHistory: [],
      customers: [],
      credits: [],
      returnsHistory: [],
      appSettings: { currency: 'FCFA', taxRate: 18 },
      loading: false,
      isOnline: true,
      offlineQueue: [],
      lastSync: null,
      syncOfflineQueue: () => {},
      addProduct: () => Promise.resolve({ success: false }),
      updateProduct: () => Promise.resolve({ success: false }),
      deleteProduct: () => Promise.resolve({ success: false }),
      recordSale: () => Promise.resolve({ success: false }),
      addCustomer: () => Promise.resolve({ success: false }),
      updateCustomer: () => Promise.resolve({ success: false }),
      updateAppSettings: () => {}
    };
  }
  
  if (!context) {
    throw new Error('useApp doit être utilisé dans un AppProvider');
  }
  
  return context;
};