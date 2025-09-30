import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // États principaux - initialisés vides, chargés depuis l'API
  const [productCatalog, setProductCatalog] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [credits, setCredits] = useState([]);
  const [returnsHistory, setReturnsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Charger toutes les données depuis l'API au démarrage
  useEffect(() => {
    const loadAllData = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        setLoading(true);

        // Charger produits
        const productsRes = await fetch('/api/products');
        if (productsRes.ok) {
          const products = await productsRes.json();
          setProductCatalog(products);
        }

        // Charger ventes
        const salesRes = await fetch('/api/sales');
        if (salesRes.ok) {
          const sales = await salesRes.json();
          setSalesHistory(sales);
        }

        // Charger clients
        const customersRes = await fetch('/api/customers');
        if (customersRes.ok) {
          const customersList = await customersRes.json();
          setCustomers(customersList);
        }

        // Charger paramètres depuis localStorage (temporaire)
        const savedSettings = localStorage.getItem('pos_settings');
        if (savedSettings) {
          setAppSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
        }

      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // === PRODUITS ===
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

  // === VENTES ===
  const recordSale = async (saleData) => {
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const newSale = await response.json();
        setSalesHistory(prev => [newSale, ...prev]);
        return { success: true, sale: newSale };
      }
      return { success: false };
    } catch (error) {
      console.error('Erreur enregistrement vente:', error);
      return { success: false, error: error.message };
    }
  };

  // === CLIENTS ===
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

  // === PARAMÈTRES ===
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
  
  // Protection SSR
  if (typeof window === 'undefined') {
    return {
      productCatalog: [],
      salesHistory: [],
      customers: [],
      credits: [],
      returnsHistory: [],
      appSettings: { currency: 'FCFA', taxRate: 18 },
      loading: false,
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
