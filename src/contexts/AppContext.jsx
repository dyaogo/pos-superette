import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useOnline } from './OnlineContext';
import { useAuth } from './AuthContext';
import { offlineDB } from '../utils/offlineDB';

const AppContext = createContext();

export function AppProvider({ children }) {
  const { isOnline, cacheData } = useOnline();
  const { currentUser, loading: authLoading } = useAuth();

  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [productCatalog, setProductCatalog] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [credits, setCredits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [returnsHistory, setReturnsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(null);
  const [viewMode, setViewMode] = useState('single'); // 'single' ou 'consolidated'
  const [appSettings, setAppSettings] = useState({
    darkMode: false,
    currency: 'FCFA',
    language: 'fr'
  });

  const initializedForUserRef = useRef(null);

  // Initialisation — attend que l'auth soit confirmée
  useEffect(() => {
    // Attendre que AuthContext finisse de charger depuis localStorage
    if (authLoading) return;

    // Non connecté - arrêter le loading, ne pas appeler l'API (évite le 401)
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Déjà initialisé pour cet utilisateur
    if (initializedForUserRef.current === currentUser.id) return;

    // Initialiser pour cet utilisateur
    initializedForUserRef.current = currentUser.id;
    initializeApp();
  }, [currentUser, authLoading]);

  // ✅ FIX: Forcer le bon magasin pour les caissiers
  useEffect(() => {
    if (!currentUser || !stores.length) return;

    // Si l'utilisateur est un caissier (a un storeId assigné)
    if (currentUser.storeId) {
      const assignedStore = stores.find(s => s.id === currentUser.storeId);

      // Si le magasin assigné existe et n'est pas déjà sélectionné
      if (assignedStore && currentStore?.id !== assignedStore.id) {
        console.log('🔒 Forçage du magasin assigné pour le caissier:', assignedStore.name);
        setCurrentStore(assignedStore);
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentStoreId', assignedStore.id);
        }
      }
    }
  }, [currentUser, stores, currentStore]);

  const initializeApp = async () => {
    setLoading(true);
    try {
      // 1. Charger les retours depuis localStorage
      if (typeof window !== 'undefined') {
        try {
          const savedReturns = localStorage.getItem('returns_history');
          if (savedReturns) {
            setReturnsHistory(JSON.parse(savedReturns));
          }
        } catch (e) {
          console.warn('Erreur chargement returns localStorage:', e);
        }
      }

      // 2. Charger les magasins
      const storesRes = await fetch('/api/stores');
      // Vérifier que la réponse est OK (évite le crash sur 401)
      if (!storesRes.ok) {
        console.warn('⚠️ Chargement magasins échoué (status:', storesRes.status, ')');
        if (storesRes.status === 401) {
          // Session localStorage sans cookie → expirée ou pre-Phase1
          // Effacer la session stale et forcer une reconnexion propre
          console.warn('🔒 Session invalide détectée. Redirection vers /login...');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('currentStoreId');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return;
      }
      const storesData = await storesRes.json();
      setStores(storesData);

      // 3. Définir le magasin actif
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

      // 4. Charger les autres données
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

      // Normaliser les crédits du cache
      const normalizedCachedCredits = cachedCredits.map(credit => ({
        ...credit,
        payments: credit.payments || [],
        originalAmount: credit.originalAmount || credit.amount,
        remainingAmount: credit.remainingAmount || credit.amount,
      }));

      // Afficher les données du cache immédiatement si disponibles
      if (cachedProducts.length > 0) {
        setProductCatalog(cachedProducts);
        setCustomers(cachedCustomers);
        setCredits(normalizedCachedCredits);
        console.log('✅ Données chargées depuis le cache');
      }

      // ÉTAPE 2: Si online, mettre à jour depuis l'API
      if (isOnline) {
        const [productsRes, salesRes, customersRes, creditsRes, storesRes] = await Promise.all([
          fetch('/api/products?limit=1000'), // 🔥 PAGINATION: Charger tous les produits (max 1000)
          fetch('/api/sales?limit=500'),     // 🔥 PAGINATION: Charger 500 dernières ventes
          fetch('/api/customers?limit=1000'), // 🔥 PAGINATION: Charger tous les clients
          fetch('/api/credits'),
          fetch('/api/stores')
        ]);

        if (productsRes.ok && salesRes.ok && customersRes.ok) {
          // 🔥 PAGINATION: Extraire les données de la nouvelle structure
          const productsData = await productsRes.json();
          const salesData = await salesRes.json();
          const customersData = await customersRes.json();
          const creditsData = creditsRes.ok ? await creditsRes.json() : [];
          const storesData = storesRes.ok ? await storesRes.json() : [];

          // Extraire le tableau .data si présent, sinon utiliser la réponse complète
          const products = productsData.data || productsData;
          const sales = salesData.data || salesData;
          const customers = customersData.data || customersData;
          const creditsRaw = creditsData.data || creditsData;
          const stores = storesData.data || storesData;

          // Normaliser les crédits de l'API pour ajouter les champs manquants
          const credits = creditsRaw.map(credit => ({
            ...credit,
            payments: credit.payments || [],
            originalAmount: credit.originalAmount || credit.amount,
            remainingAmount: credit.remainingAmount || credit.amount,
          }));

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
        const creditsRaw = await offlineDB.getCredits();

        // Normaliser les crédits du cache de secours
        const credits = creditsRaw.map(credit => ({
          ...credit,
          payments: credit.payments || [],
          originalAmount: credit.originalAmount || credit.amount,
          remainingAmount: credit.remainingAmount || credit.amount,
        }));

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

  // ✅ Changer de magasin - OFFLINE COMPATIBLE + PERMISSIONS
  const changeStore = async (store) => {
    if (currentStore?.id === store.id) return;

    // ✅ FIX: Vérifier les permissions avant de changer de magasin
    if (currentUser?.storeId && currentUser.storeId !== store.id) {
      console.warn('🚫 Permission refusée: Caissier ne peut pas changer de magasin');
      return;
    }

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
    // stockUpdates = [{productId, quantitySold}, ...] OU [{id, quantity}, ...]
    setProductCatalog(prev => {
      const updated = prev.map(p => {
        const update = stockUpdates.find(u => (u.productId || u.id) === p.id);
        if (update) {
          const quantityToDeduct = update.quantitySold || update.quantity;
          return { ...p, stock: Math.max(0, p.stock - quantityToDeduct) };
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

  // ✅ FIX: Filtrer les retours par magasin actif
  const currentStoreReturns = returnsHistory.filter(
    r => !currentStore || r.storeId === currentStore.id
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
      // Propager le message d'erreur de l'API (ex. code-barres en doublon)
      try {
        const data = await res.json();
        return { success: false, error: data.error || 'Erreur lors de la création' };
      } catch {
        return { success: false, error: 'Erreur lors de la création' };
      }
    } catch (error) {
      console.error('Erreur ajout produit:', error);
      return { success: false, error: error.message };
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
      // Propager le message d'erreur de l'API (ex. code-barres en doublon)
      try {
        const data = await res.json();
        return { success: false, error: data.error || 'Erreur lors de la modification' };
      } catch {
        return { success: false, error: 'Erreur lors de la modification' };
      }
    } catch (error) {
      return { success: false, error: error.message };
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

  // Traiter un retour de produit
  const processReturn = async (productId, quantity, reason = '') => {
    try {
      // Trouver le produit
      const product = productCatalog.find(p => p.id === productId);
      if (!product) {
        console.error('Produit non trouvé');
        return { success: false };
      }

      // Créer l'entrée de retour
      const returnEntry = {
        id: `return-${Date.now()}`,
        productId,
        productName: product.name,
        quantity,
        reason,
        createdAt: new Date().toISOString(),
        storeId: currentStore?.id,
        amount: product.costPrice * quantity // Montant estimé du retour
      };

      // Augmenter le stock (mise à jour optimiste)
      setProductCatalog(prev => prev.map(p =>
        p.id === productId
          ? { ...p, stock: p.stock + quantity }
          : p
      ).sort((a, b) => a.name.localeCompare(b.name)));

      // Ajouter à l'historique des retours (optimiste)
      const newReturns = [returnEntry, ...returnsHistory];
      setReturnsHistory(newReturns);

      // Sauvegarder dans localStorage pour persistance
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('returns_history', JSON.stringify(newReturns));
        } catch (e) {
          console.warn('Erreur sauvegarde localStorage:', e);
        }
      }

      // Enregistrer dans la DB via API
      try {
        const returnData = {
          storeId: currentStore?.id, // ✅ FIX: Ajouter le storeId
          saleId: 'DIRECT_RETURN', // ID spécial pour les retours directs (sans vente)
          reason: reason || 'Retour de marchandise',
          refundMethod: 'stock', // Remis en stock
          items: [{
            productId,
            productName: product.name,
            quantity,
            unitPrice: product.costPrice,
            total: product.costPrice * quantity
          }]
        };

        const res = await fetch('/api/returns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(returnData)
        });

        if (res.ok) {
          const savedReturn = await res.json();
          console.log('✅ Retour enregistré dans la DB:', savedReturn);
        } else {
          console.warn('⚠️ Retour sauvegardé localement uniquement');
        }
      } catch (apiError) {
        console.warn('⚠️ Erreur API retour, sauvegardé localement:', apiError);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur traitement retour:', error);
      return { success: false };
    }
  };

  // Ajouter du stock à un produit
  const addStock = async (productId, quantity) => {
    try {
      // Trouver le produit actuel
      const product = productCatalog.find(p => p.id === productId);
      if (!product) {
        console.error('Produit non trouvé:', productId);
        return { success: false };
      }

      // Calculer le nouveau stock
      const newStock = (product.stock || 0) + quantity;

      // Mettre à jour le produit via l'API
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });

      if (res.ok) {
        // Mise à jour optimiste du stock local
        updateProductOptimistic(productId, { stock: newStock });
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Erreur ajout stock:', error);
      return { success: false };
    }
  };

  // Retirer du stock (pour les transferts, pertes, etc.)
  const removeStock = async (productId, quantity, reason = '') => {
    try {
      // Mise à jour optimiste
      setProductCatalog(prev => prev.map(p =>
        p.id === productId
          ? { ...p, stock: Math.max(0, p.stock - quantity) }
          : p
      ));

      // TODO: API pour enregistrer la sortie de stock
      console.log('Stock retiré:', { productId, quantity, reason });

      return { success: true };
    } catch (error) {
      console.error('Erreur retrait stock:', error);
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

  // Helper pour changer de magasin par ID (pour compatibilité avec StoreSelector)
  const setCurrentStoreId = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    if (store) {
      changeStore(store);
    }
  };

  // Helper pour obtenir le store actif
  const getCurrentStore = () => currentStore;

  // Calculer currentStoreId pour compatibilité
  const currentStoreId = currentStore?.id;

  // Calculer stockByStore - regrouper les produits par magasin
  const stockByStore = productCatalog.reduce((acc, product) => {
    if (!acc[product.storeId]) {
      acc[product.storeId] = [];
    }
    acc[product.storeId].push(product);
    return acc;
  }, {});

  // Fonction pour transférer du stock entre magasins
  const transferStock = async (fromStoreId, toStoreId, productId, quantity) => {
    try {
      // TODO: Appeler l'API de transfert si elle existe
      console.log('Transfert:', { fromStoreId, toStoreId, productId, quantity });

      // Mise à jour optimiste - retirer du stock source et ajouter au stock destination
      setProductCatalog(prev => prev.map(p => {
        if (p.id === productId) {
          if (p.storeId === fromStoreId) {
            return { ...p, stock: Math.max(0, p.stock - quantity) };
          } else if (p.storeId === toStoreId) {
            return { ...p, stock: p.stock + quantity };
          }
        }
        return p;
      }));

      return { success: true };
    } catch (error) {
      console.error('Erreur transfert stock:', error);
      return { success: false };
    }
  };

  // Fonction pour traiter une vente (alias de recordSale pour compatibilité)
  const processSale = async (saleData) => {
    return await recordSale(saleData);
  };

  // Fonction pour ajouter un crédit (alias de addCreditOptimistic)
  const addCredit = (creditData) => {
    const newCredit = {
      ...creditData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    addCreditOptimistic(newCredit);
    return { success: true, credit: newCredit };
  };

  // Fonction pour supprimer une vente
  const deleteSale = async (saleId) => {
    try {
      // Essayer de supprimer via l'API
      const res = await fetch(`/api/sales/${saleId}`, { method: 'DELETE' });

      if (res.ok) {
        // API a réussi - supprimer de la liste locale
        setSalesHistory(prev => prev.filter(s =>
          (s.id || s._id || s.receiptNumber) !== saleId
        ));
        return { success: true };
      } else if (res.status === 404) {
        // API n'existe pas - supprimer quand même de la liste locale (UI only)
        console.warn('API de suppression non disponible, suppression locale uniquement');
        setSalesHistory(prev => prev.filter(s =>
          (s.id || s._id || s.receiptNumber) !== saleId
        ));
        return { success: true, localOnly: true };
      }

      return { success: false };
    } catch (error) {
      console.error('Erreur suppression vente:', error);

      // En cas d'erreur réseau, tenter la suppression locale
      setSalesHistory(prev => prev.filter(s =>
        (s.id || s._id || s.receiptNumber) !== saleId
      ));
      return { success: true, localOnly: true };
    }
  };

  // Fonction pour définir le stock d'un magasin (inventaire physique)
  const setStockForStore = (storeId, newStockData) => {
    try {
      // newStockData est un objet { productId: newStock, ... }
      setProductCatalog(prev => prev.map(p => {
        if (p.storeId === storeId && newStockData[p.id] !== undefined) {
          return { ...p, stock: newStockData[p.id] };
        }
        return p;
      }));

      console.log('Stock mis à jour pour le magasin:', storeId, newStockData);
      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour stock magasin:', error);
      return { success: false };
    }
  };

  return (
    <AppContext.Provider
      value={{
        // Magasins
        stores,
        currentStore,
        currentStoreId,
        setCurrentStoreId,
        getCurrentStore,
        changeStore,
        updateCurrentStore,
        updateStoreOptimistic,
        addStoreOptimistic,
        deleteStoreOptimistic,

        // Mode de vue
        viewMode,
        setViewMode,

        // Données filtrées par magasin
        productCatalog: currentStoreProducts,
        salesHistory: currentStoreSales,
        customers,
        credits,
        employees,
        returnsHistory: currentStoreReturns, // ✅ FIX: Filtrés par magasin

        // Données complètes (pour admin)
        allProducts: productCatalog,
        globalProducts: productCatalog, // Alias pour compatibilité
        allSales: salesHistory,
        stockByStore,

        // Paramètres
        appSettings,
        setAppSettings,

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
        processSale,
        deleteSale,
        processReturn,
        addStock,
        removeStock,
        transferStock,
        addCredit,
        setStockForStore,

        // Setters directs pour compatibilité
        setCustomers,
        setCredits,
        setEmployees,
        setReturnsHistory,
        setProductCatalog,
        setSalesHistory,

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
