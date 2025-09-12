// src/hooks/usePOSIntegration.js
import { useCallback, useEffect, useMemo } from 'react';
import { usePOSStore } from '../stores/posStore';
import { useApp } from '../contexts/AppContext';
import { toast } from 'react-hot-toast';

/**
 * Hook d'intégration POS - Fait le pont entre le store Zustand et votre AppContext existant
 * Permet une migration progressive sans casser l'existant
 */
export const usePOSIntegration = () => {
  const { 
    salesHistory: appSalesHistory, 
    processSale: appProcessSale,
    customers,
    appSettings 
  } = useApp();
  
  const {
    // État du store
    cashSession,
    cashOperations,
    cart,
    salesHistory: storeSalesHistory,
    selectedCustomer,
    paymentMethod,
    showPaymentModal,
    
    // Actions caisse
    openCashSession,
    closeCashSession,
    addCashOperation,
    syncFromLocalStorage,
    
    // Actions panier
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    
    // Actions ventes
    processSale: storeProcessSale,
    refundSale,
    setSalesHistory,
    
    // Getters
    getCartStats,
    getSessionSales,
    getSessionStats,
    
    // Actions UI
    setSelectedCustomer,
    setPaymentMethod,
    setShowPaymentModal,
  } = usePOSStore();

  // ==================== SYNCHRONISATION ====================

  /**
   * Synchroniser l'historique des ventes entre AppContext et Store
   */
  useEffect(() => {
    if (appSalesHistory && Array.isArray(appSalesHistory)) {
      setSalesHistory(appSalesHistory);
    }
  }, [appSalesHistory, setSalesHistory]);

  /**
   * Synchroniser la session de caisse depuis localStorage au démarrage
   */
  useEffect(() => {
    syncFromLocalStorage();
  }, [syncFromLocalStorage]);

  /**
   * Synchronisation périodique avec localStorage pour compatibilité
   * avec votre ModernCashRegister existant
   */
  useEffect(() => {
    const interval = setInterval(() => {
      // Vérifier si la session a changé dans localStorage
      try {
        const session = localStorage.getItem('cash_session_v2');
        const currentSession = cashSession;
        
        if (session && !currentSession) {
          // Session ouverte ailleurs
          syncFromLocalStorage();
        } else if (!session && currentSession) {
          // Session fermée ailleurs - nettoyer le store
          usePOSStore.setState({ cashSession: null, cashOperations: [] });
        }
      } catch (error) {
        console.warn('Erreur sync session:', error);
      }
    }, 2000); // Vérification toutes les 2 secondes

    return () => clearInterval(interval);
  }, [cashSession, syncFromLocalStorage]);

  // ==================== COMPUTED VALUES ====================
  
  const cartStats = useMemo(() => getCartStats(), [cart, getCartStats]);
  const sessionSales = useMemo(() => getSessionSales(), [cashSession, storeSalesHistory, getSessionSales]);
  const sessionStats = useMemo(() => getSessionStats(), [sessionSales, getSessionStats]);
  
  const isCashSessionActive = useMemo(() => 
    cashSession && cashSession.status === 'open',
    [cashSession]
  );
  
  const canProcessSale = useMemo(() => 
    isCashSessionActive && cart.length > 0,
    [isCashSessionActive, cart.length]
  );

  // ==================== VALIDATION ====================
  
  const validateSale = useCallback((paymentData) => {
    const errors = [];
    
    if (!isCashSessionActive) {
      errors.push('Aucune session de caisse active');
    }
    
    if (cart.length === 0) {
      errors.push('Panier vide');
    }
    
    if (paymentData.method === 'cash') {
      if (!paymentData.amountReceived || paymentData.amountReceived < cartStats.total) {
        errors.push('Montant insuffisant');
      }
    }
    
    if (paymentData.method === 'credit') {
      if (!selectedCustomer || selectedCustomer.id === 1) {
        errors.push('Veuillez sélectionner un client pour le crédit');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [isCashSessionActive, cart, cartStats.total, selectedCustomer]);

  // ==================== ACTIONS MÉTIER ====================
  
  /**
   * Ouvrir une session de caisse
   */
  const handleOpenCashSession = useCallback(async (initialAmount, operator = 'Caissier') => {
    try {
      await openCashSession(initialAmount, operator);
      toast.success('💰 Caisse ouverte avec succès !');
      return { success: true };
    } catch (error) {
      console.error('Erreur ouverture caisse:', error);
      toast.error(`Erreur: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, [openCashSession]);
  
  /**
   * Fermer la session de caisse
   */
  const handleCloseCashSession = useCallback(async (actualCash, notes = '', operator = 'Caissier') => {
    try {
      await closeCashSession(actualCash, notes, operator);
      toast.success('🔒 Caisse fermée avec succès !');
      return { success: true };
    } catch (error) {
      console.error('Erreur fermeture caisse:', error);
      toast.error(`Erreur: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, [closeCashSession]);
  
  /**
   * Ajouter un produit au panier avec validation
   */
  const handleAddToCart = useCallback((product, quantity = 1) => {
    try {
      // Validation du stock si disponible
      if (product.stock !== undefined && product.stock < quantity) {
        toast.error(`Stock insuffisant pour ${product.name}`);
        return { success: false, error: 'Stock insuffisant' };
      }
      
      addToCart(product, quantity);
      toast.success(`${product.name} ajouté au panier`);
      return { success: true };
    } catch (error) {
      console.error('Erreur ajout panier:', error);
      toast.error(`Erreur: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, [addToCart]);
  
  /**
   * Traiter une vente - Utilise les deux systèmes pour compatibilité
   */
  const handleProcessSale = useCallback(async (paymentData) => {
    try {
      // Validation
      const validation = validateSale(paymentData);
      if (!validation.isValid) {
        validation.errors.forEach(error => toast.error(error));
        return { success: false, errors: validation.errors };
      }
      
      // Préparation des données de vente
      const saleData = {
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        items: cart,
        subtotal: cartStats.subtotal,
        taxAmount: cartStats.taxAmount,
        total: cartStats.total,
        paymentMethod: paymentData.method,
        amountReceived: paymentData.amountReceived || cartStats.total,
        changeAmount: paymentData.method === 'cash' 
          ? Math.max(0, (paymentData.amountReceived || 0) - cartStats.total)
          : 0
      };
      
      // Traitement via le store (nouveau système)
      const storeSale = await storeProcessSale(saleData);
      
      // Traitement via AppContext (système existant) pour compatibilité
      if (appProcessSale) {
        try {
          // Format attendu par AppContext: processSale(items, customer, paymentMethod, paymentAmount)
          const appResult = appProcessSale(
            cart.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity
            })),
            selectedCustomer || { id: 1, name: 'Client Comptant' },
            paymentData.method,
            paymentData.amountReceived || cartStats.total
          );
          
          console.log('✅ Vente synchronisée avec AppContext:', appResult);
        } catch (error) {
          console.error('❌ Erreur sync AppContext:', error);
          // Ne pas échouer si AppContext échoue, mais informer
          toast.error('Vente enregistrée mais sync AppContext échouée');
        }
      }
      
      toast.success(`🎉 Vente terminée ! Ticket: ${storeSale.receiptNumber}`);
      return { success: true, sale: storeSale };
      
    } catch (error) {
      console.error('Erreur traitement vente:', error);
      toast.error(`Erreur lors de la vente: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, [validateSale, selectedCustomer, cart, cartStats, storeProcessSale, appProcessSale]);
  
  /**
   * Gérer les opérations de caisse
   */
  const handleCashOperation = useCallback(async (type, amount, description) => {
    try {
      if (!isCashSessionActive) {
        throw new Error('Aucune session de caisse active');
      }
      
      await addCashOperation(type, amount, description);
      const actionText = type === 'in' ? 'Entrée' : 'Sortie';
      toast.success(`💰 ${actionText} de caisse enregistrée`);
      return { success: true };
    } catch (error) {
      console.error('Erreur opération caisse:', error);
      toast.error(`Erreur: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, [isCashSessionActive, addCashOperation]);

  /**
   * Remboursement
   */
  const handleRefund = useCallback(async (saleId, reason = '') => {
    try {
      await refundSale(saleId, reason);
      toast.success('💸 Remboursement effectué');
      return { success: true };
    } catch (error) {
      console.error('Erreur remboursement:', error);
      toast.error(`Erreur: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, [refundSale]);

  // ==================== UTILITAIRES ====================
  
  const formatCurrency = useCallback((amount, currency) => {
    const curr = currency || appSettings?.currency || 'FCFA';
    return `${amount.toLocaleString()} ${curr}`;
  }, [appSettings]);
  
  const formatReceiptNumber = useCallback((saleId) => {
    return `REC${saleId.toString().slice(-6)}`;
  }, []);

  // ==================== ANALYTICS ====================
  
  const getAnalytics = useCallback(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Utiliser l'historique du store s'il est disponible, sinon AppContext
    const salesData = storeSalesHistory.length > 0 ? storeSalesHistory : appSalesHistory || [];
    
    const todaySales = salesData.filter(sale => {
      const saleDate = new Date(sale.createdAt || sale.date);
      return saleDate >= todayStart;
    });
    
    const thisWeekSales = salesData.filter(sale => {
      const saleDate = new Date(sale.createdAt || sale.date);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return saleDate >= weekStart;
    });
    
    return {
      today: {
        sales: todaySales.reduce((sum, s) => sum + (s.total || 0), 0),
        transactions: todaySales.length,
        averageTicket: todaySales.length > 0 ? todaySales.reduce((sum, s) => sum + (s.total || 0), 0) / todaySales.length : 0
      },
      week: {
        sales: thisWeekSales.reduce((sum, s) => sum + (s.total || 0), 0),
        transactions: thisWeekSales.length,
        averageTicket: thisWeekSales.length > 0 ? thisWeekSales.reduce((sum, s) => sum + (s.total || 0), 0) / thisWeekSales.length : 0
      },
      session: sessionStats
    };
  }, [storeSalesHistory, appSalesHistory, sessionStats]);

  // ==================== RACCOURCIS CLAVIER ====================
  
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Désactiver si un champ input est focus
      if (document.activeElement?.tagName === 'INPUT') return;
      
      // Raccourcis avec Ctrl/Cmd
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'p':
            event.preventDefault();
            if (canProcessSale) {
              setShowPaymentModal(true);
            }
            break;
          case 'c':
            event.preventDefault();
            clearCart();
            break;
          default:
            break;
        }
      }
      
      // Touches F pour actions rapides
      switch (event.key) {
        case 'F1':
          event.preventDefault();
          setPaymentMethod('cash');
          break;
        case 'F2':
          event.preventDefault();
          setPaymentMethod('card');
          break;
        case 'F3':
          event.preventDefault();
          setPaymentMethod('credit');
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [canProcessSale, clearCart, setShowPaymentModal, setPaymentMethod]);

  // ==================== API PUBLIQUE ====================
  
  return {
    // État
    cashSession,
    cashOperations,
    cart,
    salesHistory: storeSalesHistory.length > 0 ? storeSalesHistory : appSalesHistory,
    selectedCustomer,
    paymentMethod,
    showPaymentModal,
    
    // Computed
    cartStats,
    sessionSales,
    sessionStats,
    isCashSessionActive,
    canProcessSale,
    
    // Actions Caisse
    handleOpenCashSession,
    handleCloseCashSession,
    handleCashOperation,
    
    // Actions Panier
    handleAddToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    
    // Actions Ventes
    handleProcessSale,
    handleRefund,
    
    // Actions UI
    setSelectedCustomer,
    setPaymentMethod,
    setShowPaymentModal,
    
    // Utilitaires
    formatCurrency,
    formatReceiptNumber,
    getAnalytics,
    
    // Validation
    validateSale,
    
    // Données contextuelles
    customers: customers || [],
    appSettings: appSettings || {}
  };
};
