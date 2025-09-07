import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { 
  Search, ShoppingCart, CreditCard, DollarSign, Smartphone, 
  Package, User, X, Check, Scan, Plus, Minus, Trash2, Eye,
  AlertTriangle, Lock, Unlock, Users
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useResponsive } from '../../components/ResponsiveComponents';
import { 
  getCashSession, 
  saveCashSession, 
  getCashOperations, 
  saveCashOperations, 
  addCashReport, 
  clearCashData 
} from '../../services/cash.service';
import toast from 'react-hot-toast';

import { 
  useCart, 
  useProductSearch, 
  useCategories, 
  useKeyboardShortcuts 
} from '../../hooks';

const POSModule = ({ onNavigate }) => {
  const { 
    globalProducts, 
    processSale, 
    customers, 
    appSettings,
    credits,
    setCredits,
    salesHistory
  } = useApp();
  
  const { isMobile } = useResponsive();
  
  // ==================== VÉRIFICATION CAISSE ====================
  const [cashSession, setCashSession] = useState(null);
  const [cashOperations, setCashOperations] = useState([]);
  
  // États pour modals d'ouverture/fermeture
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('50000');
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  
  useEffect(() => {
    const session = getCashSession();
    const operations = getCashOperations();
    setCashSession(session);
    if (operations.length) {
      setCashOperations(operations);
    }
  }, []);

  // ==================== FONCTIONS CAISSE ====================
  // Calculer les ventes de la session actuelle
  const getSessionSales = () => {
    if (!cashSession) return [];
    
    return salesHistory.filter(sale => 
      new Date(sale.date) >= new Date(cashSession.openedAt)
    );
  };

  // Calculer les totaux de la session
  const getSessionTotals = () => {
    const sessionSales = getSessionSales();
    const cashSales = sessionSales.filter(s => s.paymentMethod === 'cash');
    const cardSales = sessionSales.filter(s => s.paymentMethod === 'card');
    
    return {
      totalSales: sessionSales.reduce((sum, s) => sum + s.total, 0),
      cashSales: cashSales.reduce((sum, s) => sum + s.total, 0),
      cardSales: cardSales.reduce((sum, s) => sum + s.total, 0),
      transactionCount: sessionSales.length,
      cashTransactions: cashSales.length,
      cardTransactions: cardSales.length
    };
  };

  // ✅ FONCTION D'OUVERTURE DIRECTE
  const openRegister = useCallback(() => {
    const session = {
      id: Date.now(),
      openedAt: new Date().toISOString(),
      openedBy: 'Caissier Principal',
      openingAmount: parseFloat(openingAmount),
      status: 'open'
    };
    
    setCashSession(session);
    saveCashSession(session);
    
    // Ajouter l'opération d'ouverture
    const operation = {
      id: Date.now(),
      type: 'opening',
      amount: parseFloat(openingAmount),
      timestamp: new Date().toISOString(),
      description: 'Ouverture de caisse',
      user: 'Caissier Principal'
    };
    
    const newOperations = [operation];
    setCashOperations(newOperations);
    saveCashOperations(newOperations);
    
    setShowOpenModal(false);
    setOpeningAmount('50000');
    
    toast.success(
      `✅ Caisse ouverte! Fond initial: ${parseFloat(openingAmount).toLocaleString()} ${appSettings.currency}`,
      { 
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#10b981',
          color: 'white'
        }
      }
    );
  }, [openingAmount, appSettings.currency]);

  // ✅ FONCTION DE FERMETURE DIRECTE
  const closeRegister = useCallback(() => {
    if (!cashSession || !closingCash) return;
    
    const totals = getSessionTotals();
    const expectedCash = cashSession.openingAmount + totals.cashSales;
    const actualCash = parseFloat(closingCash);
    const difference = actualCash - expectedCash;
    
    // Créer le rapport de clôture
    const closingReport = {
      sessionId: cashSession.id,
      closedAt: new Date().toISOString(),
      closedBy: 'Caissier Principal',
      openingAmount: cashSession.openingAmount,
      expectedCash,
      actualCash,
      difference,
      totals,
      notes,
      operations: cashOperations
    };
    
    // Sauvegarder le rapport
    addCashReport(closingReport);
    
    // Fermer la session
    setCashSession(null);
    setCashOperations([]);
    clearCashData();
    
    setShowCloseModal(false);
    setClosingCash('');
    setNotes('');
    
    // Toast de confirmation
    toast.success(
      `✅ Caisse fermée! Écart: ${difference.toLocaleString()} ${appSettings.currency}`,
      { 
        duration: 5000,
        position: 'top-center',
        style: {
          background: difference === 0 ? '#10b981' : difference > 0 ? '#f59e0b' : '#ef4444',
          color: 'white'
        }
      }
    );
    
    toast.info(
      `📊 ${difference === 0 ? 'Parfait!' : difference > 0 ? 'Surplus détecté' : 'Manque détecté'}`,
      { 
        duration: 3000,
        position: 'top-center'
      }
    );
  }, [cashSession, closingCash, notes, cashOperations, appSettings.currency, getSessionTotals]);

  // ==================== HOOKS PERSONNALISÉS ====================
  const { 
    cart, 
    cartStats, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart(globalProducts || [], appSettings);
  
  const categories = useCategories(globalProducts || []);
  
  // ==================== ÉTATS LOCAUX ====================
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(customers?.[0] || { id: 1, name: 'Client Comptant' });
  
  // États modaux
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // États de paiement
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const amountReceivedRef = useRef('');
  const [amountDisplay, setAmountDisplay] = useState('');
  
  // Références
  const searchInputRef = useRef(null);
  const amountInputRef = useRef(null);

  const isDark = appSettings.darkMode;

  // ==================== SUGGESTIONS DE MONTANTS CFA ====================
  const suggestedAmounts = useMemo(() => {
    if (!cartStats.finalTotal) return [];
    
    const total = cartStats.finalTotal;
    const bills = [500, 1000, 2000, 5000, 10000];
    const suggestions = new Set();
    
    suggestions.add(total);
    
    for (const bill of bills) {
      if (bill >= total) {
        suggestions.add(bill);
        break;
      }
    }
    
    const findMinimalChange = (target) => {
      let minChange = Infinity;
      let bestAmount = target;
      
      for (let i = 0; i < bills.length; i++) {
        for (let j = i; j < bills.length; j++) {
          const amount = bills[i] + bills[j];
          if (amount >= target) {
            const change = amount - target;
            if (change < minChange) {
              minChange = change;
              bestAmount = amount;
            }
          }
        }
      }
      return bestAmount;
    };
    
    suggestions.add(findMinimalChange(total));
    
    const roundedUp = Math.ceil(total / 1000) * 1000;
    if (roundedUp > total) {
      suggestions.add(roundedUp);
    }
    
    return Array.from(suggestions)
      .filter(amount => amount >= total)
      .sort((a, b) => a - b)
      .slice(0, 4);
  }, [cartStats.finalTotal]);

  // ==================== RECHERCHE AVEC HOOKS ====================
  const filteredProducts = useProductSearch(
    globalProducts || [], 
    searchQuery, 
    selectedCategory
  );
  
  // ==================== RACCOURCIS CLAVIER ====================
  useKeyboardShortcuts([
    { 
      key: 'F1', 
      action: () => {
        if (cart.length > 0 && window.confirm('Vider le panier ?')) {
          clearCart();
        }
      }
    },
    { 
      key: 'F2', 
      action: () => searchInputRef.current?.focus()
    },
    { 
      key: 'F3', 
      action: () => {
        if (!cashSession) {
          toast.error('Veuillez d\'abord ouvrir la caisse');
          return;
        }
        if (cart.length > 0) {
          setShowPaymentModal(true);
        } else {
          toast.error('Panier vide');
        }
      }
    },
    {
      key: 'Escape',
      action: () => {
        if (showPaymentModal) setShowPaymentModal(false);
        else if (showScanner) setShowScanner(false);
        else if (showCustomerModal) setShowCustomerModal(false);
        else if (showOpenModal) setShowOpenModal(false);
        else if (showCloseModal) setShowCloseModal(false);
      }
    },
    {
      key: 'Enter',
      action: () => {
        if (searchQuery && filteredProducts.length > 0) {
          if (!cashSession) {
            toast.error('Veuillez d\'abord ouvrir la caisse');
            return;
          }
          addToCart(filteredProducts[0]);
          setSearchQuery('');
        }
      }
    }
  ], [cart.length, searchQuery, showPaymentModal, showScanner, filteredProducts, cashSession, showOpenModal, showCloseModal]);

  // ==================== GESTION PAIEMENT ====================
  const handleAmountChange = useCallback((e) => {
    const value = e.target.value;
    amountReceivedRef.current = value;
    setAmountDisplay(value);
  }, []);

  const addCreditSale = useCallback(() => {
    const credit = {
      id: Date.now(),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      amount: cartStats.finalTotal,
      originalAmount: cartStats.finalTotal,
      description: `Vente à crédit du ${new Date().toLocaleDateString('fr-FR')}`,
      createdAt: new Date().toISOString(),
      dueDate: (() => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString();
      })(),
      status: 'pending',
      payments: [],
      remainingAmount: cartStats.finalTotal,
      items: cart.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      }))
    };

    setCredits(prevCredits => [...prevCredits, credit]);
    return credit;
  }, [cartStats.finalTotal, selectedCustomer, cart, setCredits]);

  const handleCheckout = useCallback(() => {
    if (!cashSession) {
      toast.error('Caisse fermée ! Impossible de finaliser la vente.');
      return;
    }

    if (cart.length === 0) {
      toast.error('Panier vide!');
      return;
    }

    const amountReceived = parseFloat(amountReceivedRef.current) || 0;

    if (paymentMethod === 'cash' && amountReceived < cartStats.finalTotal) {
      toast.error('Montant reçu insuffisant!');
      amountInputRef.current?.focus();
      return;
    }

    if (paymentMethod === 'credit' && selectedCustomer.id === 1) {
      toast.error('Sélectionnez un client pour la vente à crédit');
      return;
    }

    try {
      if (paymentMethod === 'credit') {
        const credit = addCreditSale();
        
        const result = processSale(
          cart,
          'credit',
          0,
          selectedCustomer.id
        );

        if (result && credit) {
          clearCart();
          setShowPaymentModal(false);
          amountReceivedRef.current = '';
          setAmountDisplay('');
          setPaymentMethod('cash');
          setSelectedCustomer(customers?.[0] || { id: 1, name: 'Client Comptant' });
          
          toast.success(
            `✅ Vente à crédit confirmée! Client: ${selectedCustomer.name}`, 
            { 
              duration: 4000,
              style: {
                background: '#8b5cf6',
                color: 'white'
              }
            }
          );
          
          toast.info(
            `📋 Crédit ajouté: ${cartStats.finalTotal.toLocaleString()} ${appSettings.currency}`, 
            { 
              duration: 5000,
              style: {
                background: '#3b82f6',
                color: 'white'
              }
            }
          );
        }
      } else {
        const result = processSale(
          cart,
          paymentMethod,
          paymentMethod === 'cash' ? amountReceived : cartStats.finalTotal,
          selectedCustomer.id
        );

        if (result) {
          clearCart();
          setShowPaymentModal(false);
          amountReceivedRef.current = '';
          setAmountDisplay('');
          setPaymentMethod('cash');
          setSelectedCustomer(customers?.[0] || { id: 1, name: 'Client Comptant' });
          
          toast.success(
            `✅ Vente confirmée! Reçu: ${result.receiptNumber}`, 
            { duration: 4000 }
          );
          
          if (paymentMethod === 'cash' && amountReceived > cartStats.finalTotal) {
            toast.info(
              `💰 Monnaie: ${(amountReceived - cartStats.finalTotal).toLocaleString()} ${appSettings.currency}`, 
              { duration: 6000 }
            );
          }
        }
      }
        
    } catch (error) {
      console.error('❌ Erreur lors de la vente:', error);
      toast.error('Erreur lors de la vente: ' + error.message);
    }
  }, [cart, cartStats, paymentMethod, selectedCustomer, processSale, appSettings.currency, clearCart, cashSession, customers, addCreditSale]);

  const handleAddToCart = useCallback((product) => {
    if (!cashSession) {
      toast.error('Veuillez d\'abord ouvrir la caisse pour commencer les ventes');
      return;
    }
    addToCart(product);
  }, [addToCart, cashSession]);

  // ==================== COMPOSANTS UI ====================
  const ProductCard = ({ product }) => (
    <div
      onClick={() => handleAddToCart(product)}
      style={{
        background: isDark ? '#374151' : 'white',
        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
        borderRadius: '12px',
        padding: '16px',
        cursor: (!cashSession || product.stock === 0) ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        opacity: (!cashSession || product.stock === 0) ? 0.6 : 1
      }}
      onMouseEnter={(e) => {
        if (cashSession && product.stock > 0) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {!cashSession && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: '#ef4444',
          color: 'white',
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '4px',
          fontWeight: '600'
        }}>
          <Lock size={10} style={{ marginRight: '2px' }} />
          CAISSE FERMÉE
        </div>
      )}
      
      {product.stock === 0 && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: '#ef4444',
          color: 'white',
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '4px',
          fontWeight: '600'
        }}>
          RUPTURE
        </div>
      )}
      
      <h4 style={{
        fontSize: '14px',
        fontWeight: '600',
        margin: '0 0 8px 0',
        color: isDark ? '#f7fafc' : '#1f2937'
      }}>
        {product.name}
      </h4>
      
      <p style={{
        fontSize: '12px',
        color: isDark ? '#a0aec0' : '#6b7280',
        margin: '0 0 8px 0'
      }}>
        Stock: {product.stock} • SKU: {product.sku}
      </p>
      
      <p style={{
        fontSize: '16px',
        fontWeight: '700',
        color: '#3b82f6',
        margin: 0
      }}>
        {product.price.toLocaleString()} {appSettings.currency}
      </p>
    </div>
  );

  const CartItem = ({ item }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: isDark ? '#374151' : '#f8fafc',
      borderRadius: '8px',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
    }}>
      <div style={{ flex: 1 }}>
        <h5 style={{
          fontSize: '14px',
          fontWeight: '600',
          margin: '0 0 4px 0',
          color: isDark ? '#f7fafc' : '#1f2937'
        }}>
          {item.name}
        </h5>
        <p style={{
          fontSize: '12px',
          color: isDark ? '#a0aec0' : '#6b7280',
          margin: 0
        }}>
          {item.price.toLocaleString()} {appSettings.currency} × {item.quantity}
        </p>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => updateQuantity(item.id, -1)}
          style={{
            background: '#ef4444',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Minus size={12} />
        </button>
        
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          minWidth: '20px',
          textAlign: 'center',
          color: isDark ? '#f7fafc' : '#1f2937'
        }}>
          {item.quantity}
        </span>
        
        <button
          onClick={() => updateQuantity(item.id, 1)}
          disabled={item.quantity >= item.stock}
          style={{
            background: item.quantity >= item.stock ? '#6b7280' : '#10b981',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: item.quantity >= item.stock ? 'not-allowed' : 'pointer'
          }}
        >
          <Plus size={12} />
        </button>
        
        <button
          onClick={() => removeFromCart(item.id)}
          style={{
            background: '#6b7280',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginLeft: '4px'
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>
      
      <div style={{
        fontSize: '14px',
        fontWeight: '700',
        color: '#3b82f6',
        minWidth: '80px',
        textAlign: 'right'
      }}>
        {(item.price * item.quantity).toLocaleString()} {appSettings.currency}
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '70% 30%',
      height: '100vh',
      background: isDark ? '#1a202c' : '#f7fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Section Produits */}
      <div style={{
        padding: '24px',
        overflowY: 'auto'
      }}>
        {/* Header avec statut caisse */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Package size={28} color="#3b82f6" />
              <h1 style={{ 
                margin: 0, 
                fontSize: '24px', 
                fontWeight: '700',
                color: isDark ? '#f7fafc' : '#1f2937'
              }}>
                Point de Vente
              </h1>
            </div>

            {/* Statut caisse + actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* ✅ CORRECTION: Statut caisse cliquable pour fermeture directe */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: cashSession ? '#10b98115' : '#ef444415',
                color: cashSession ? '#10b981' : '#ef4444',
                fontSize: '14px',
                fontWeight: '500',
                cursor: cashSession ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}
              onClick={() => {
                if (cashSession) {
                  setShowCloseModal(true); // ✅ Ouvre directement le modal de fermeture
                }
              }}
              onMouseEnter={(e) => {
                if (cashSession) {
                  e.target.style.background = '#10b98125';
                }
              }}
              onMouseLeave={(e) => {
                if (cashSession) {
                  e.target.style.background = '#10b98115';
                }
              }}
              >
                {cashSession ? <Unlock size={16} /> : <Lock size={16} />}
                {cashSession ? 'Caisse Ouverte • Cliquer pour fermer' : 'Caisse Fermée'}
              </div>

              {/* ✅ CORRECTION: Bouton ouverture directe */}
              {!cashSession && (
                <button
                  onClick={() => setShowOpenModal(true)} // ✅ Ouvre directement le modal d'ouverture
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Unlock size={16} />
                  Ouvrir Caisse
                </button>
              )}
            </div>
          </div>

          {!cashSession && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={20} color="#ef4444" />
              <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: '500' }}>
                La caisse doit être ouverte avant de pouvoir effectuer des ventes.
              </span>
            </div>
          )}
          
          {/* Recherche */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={20} style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isDark ? '#a0aec0' : '#6b7280'
            }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher un produit... (F2)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!cashSession}
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                border: `2px solid ${searchQuery ? '#3b82f6' : (isDark ? '#4a5568' : '#e2e8f0')}`,
                borderRadius: '12px',
                fontSize: '16px',
                background: (!cashSession || isDark) ? '#374151' : 'white',
                color: isDark ? '#f7fafc' : '#1f2937',
                outline: 'none',
                transition: 'border-color 0.2s',
                opacity: !cashSession ? 0.6 : 1
              }}
            />
          </div>

          {/* Catégories */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={!cashSession}
            style={{
              padding: '8px 12px',
              border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
              borderRadius: '8px',
              background: isDark ? '#374151' : 'white',
              color: isDark ? '#f7fafc' : '#1f2937',
              fontSize: '14px',
              opacity: !cashSession ? 0.6 : 1
            }}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.count})
              </option>
            ))}
          </select>
        </div>

        {/* Grille des produits */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: isDark ? '#a0aec0' : '#6b7280'
          }}>
            {searchQuery ? `Aucun produit trouvé pour "${searchQuery}"` : 'Aucun produit disponible'}
          </div>
        )}
      </div>

      {/* Section Panier */}
      <div style={{
        background: isDark ? '#2d3748' : 'white',
        borderLeft: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}>
        {/* Header Panier avec sélection client */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
          flexShrink: 0
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: isDark ? '#f7fafc' : '#1f2937',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <ShoppingCart size={20} />
            Panier
          </h2>
          
          {/* Sélection du client */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '500',
              color: isDark ? '#a0aec0' : '#6b7280',
              marginBottom: '6px'
            }}>
              Client
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <select
                value={selectedCustomer.id}
                onChange={(e) => {
                  const customer = customers.find(c => c.id == e.target.value);
                  setSelectedCustomer(customer || customers[0]);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f7fafc' : '#1f2937',
                  fontSize: '12px'
                }}
              >
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowCustomerModal(true)}
                style={{
                  padding: '8px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Users size={14} />
              </button>
            </div>
          </div>

          <div style={{
            fontSize: '14px',
            color: isDark ? '#a0aec0' : '#6b7280',
            textAlign: 'center'
          }}>
            {cartStats.totalItems} article{cartStats.totalItems > 1 ? 's' : ''}
          </div>
        </div>

        {/* Items du panier - zone scrollable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          minHeight: 0
        }}>
          {cart.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: isDark ? '#a0aec0' : '#6b7280'
            }}>
              <ShoppingCart size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p>Panier vide</p>
              <p style={{ fontSize: '12px' }}>
                {!cashSession ? 'Ouvrez la caisse pour commencer' : 'Cliquez sur un produit pour l\'ajouter'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer Panier FIXÉ */}
        {cart.length > 0 && (
          <div style={{
            padding: '24px',
            borderTop: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
            background: isDark ? '#2d3748' : 'white',
            flexShrink: 0
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              fontSize: '20px',
              fontWeight: '700'
            }}>
              <span style={{ color: isDark ? '#f7fafc' : '#1f2937' }}>Total:</span>
              <span style={{ color: '#3b82f6' }}>
                {cartStats.finalTotal.toLocaleString()} {appSettings.currency}
              </span>
            </div>
            
            <button
              onClick={() => {
                if (!cashSession) {
                  toast.error('Veuillez d\'abord ouvrir la caisse');
                  return;
                }
                setShowPaymentModal(true);
              }}
              disabled={!cashSession}
              style={{
                width: '100%',
                padding: '16px',
                background: !cashSession ? '#6b7280' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: !cashSession ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '8px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                if (cashSession) e.target.style.background = '#059669';
              }}
              onMouseLeave={(e) => {
                if (cashSession) e.target.style.background = '#10b981';
              }}
            >
              <CreditCard size={20} />
              {!cashSession ? 'Caisse Fermée' : 'Finaliser la vente (F3)'}
            </button>
            
            <button
              onClick={() => {
                if (window.confirm('Vider le panier ?')) {
                  clearCart();
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: isDark ? '#a0aec0' : '#6b7280',
                border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Vider le panier (F1)
            </button>
          </div>
        )}
      </div>

      {/* ===== MODALS ===== */}
      
      {/* Modal d'ouverture de caisse */}
      {showOpenModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: isDark ? '#2d3748' : 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: isDark ? '#f7fafc' : '#1f2937',
              margin: '0 0 24px 0',
              textAlign: 'center'
            }}>
              Ouverture de Caisse
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: isDark ? '#f7fafc' : '#374151'
              }}>
                Fond de caisse initial
              </label>
              <input
                type="number"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="50000"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f7fafc' : '#1f2937',
                  outline: 'none'
                }}
                autoFocus
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowOpenModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'transparent',
                  color: isDark ? '#a0aec0' : '#6b7280',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={openRegister}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Ouvrir Caisse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de fermeture de caisse */}
      {showCloseModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: isDark ? '#2d3748' : 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: isDark ? '#f7fafc' : '#1f2937',
              margin: '0 0 24px 0',
              textAlign: 'center'
            }}>
              Fermeture de Caisse
            </h3>
            
            {/* Récapitulatif de session */}
            <div style={{
              background: isDark ? '#374151' : '#f8fafc',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: '0 0 12px 0',
                color: isDark ? '#f7fafc' : '#1f2937'
              }}>
                Récapitulatif de session
              </h4>
              {(() => {
                const totals = getSessionTotals();
                const expectedCash = cashSession ? cashSession.openingAmount + totals.cashSales : 0;
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Fond initial:</span>
                      <span>{cashSession ? cashSession.openingAmount.toLocaleString() : '0'} {appSettings.currency}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Ventes espèces:</span>
                      <span>{totals.cashSales.toLocaleString()} {appSettings.currency}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Espèces attendues:</span>
                      <span style={{ fontWeight: '600' }}>{expectedCash.toLocaleString()} {appSettings.currency}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Comptage physique */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: isDark ? '#f7fafc' : '#374151'
              }}>
                Montant en caisse (comptage physique)
              </label>
              <input
                type="number"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="Comptez l'argent en caisse"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f7fafc' : '#1f2937',
                  outline: 'none'
                }}
                autoFocus
              />
              {closingCash && (() => {
                const totals = getSessionTotals();
                const expectedCash = cashSession ? cashSession.openingAmount + totals.cashSales : 0;
                const difference = parseFloat(closingCash) - expectedCash;
                return (
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '14px', 
                    color: difference === 0 ? '#10b981' : difference > 0 ? '#f59e0b' : '#ef4444',
                    fontWeight: '500'
                  }}>
                    Écart: {difference.toLocaleString()} {appSettings.currency} 
                    {difference === 0 ? ' (Parfait!)' : difference > 0 ? ' (Surplus)' : ' (Manque)'}
                  </div>
                );
              })()}
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: isDark ? '#f7fafc' : '#374151'
              }}>
                Notes de clôture (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Commentaires sur la session..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f7fafc' : '#1f2937',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Boutons d'action */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowCloseModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'transparent',
                  color: isDark ? '#a0aec0' : '#6b7280',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={closeRegister}
                disabled={!closingCash}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: !closingCash ? '#6b7280' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: !closingCash ? 'not-allowed' : 'pointer'
                }}
              >
                Fermer Caisse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de paiement - code existant inchangé */}
      {showPaymentModal && cashSession && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: isDark ? '#2d3748' : 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: isDark ? '#f7fafc' : '#1f2937',
              margin: '0 0 24px 0',
              textAlign: 'center'
            }}>
              Finaliser la vente
            </h3>

            {/* Client sélectionné */}
            <div style={{
              background: isDark ? '#374151' : '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <User size={16} color="#3b82f6" />
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: isDark ? '#f7fafc' : '#1f2937'
              }}>
                Client: {selectedCustomer.name}
              </span>
            </div>

            {/* Récapitulatif */}
            <div style={{
              background: isDark ? '#374151' : '#f8fafc',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span>Sous-total:</span>
                <span>{cartStats.totalAmount.toLocaleString()} {appSettings.currency}</span>
              </div>
              {cartStats.totalTax > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span>TVA ({appSettings.taxRate}%):</span>
                  <span>{cartStats.totalTax.toLocaleString()} {appSettings.currency}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: '700',
                borderTop: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                paddingTop: '8px'
              }}>
                <span>Total:</span>
                <span style={{ color: '#3b82f6' }}>
                  {cartStats.finalTotal.toLocaleString()} {appSettings.currency}
                </span>
              </div>
            </div>

            {/* Modes de paiement */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '12px',
                color: isDark ? '#f7fafc' : '#374151'
              }}>
                Méthode de paiement
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'cash', label: 'Espèces', icon: DollarSign },
                  { id: 'mobile', label: 'Mobile', icon: Smartphone },
                  { 
                    id: 'credit', 
                    label: 'Crédit', 
                    icon: CreditCard,
                    disabled: selectedCustomer.id === 1
                  }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => {
                      if (!method.disabled) {
                        setPaymentMethod(method.id);
                      }
                    }}
                    disabled={method.disabled}
                    style={{
                      padding: '12px',
                      border: `2px solid ${
                        method.disabled 
                          ? '#6b7280' 
                          : paymentMethod === method.id 
                            ? (method.id === 'credit' ? '#8b5cf6' : '#3b82f6')
                            : (isDark ? '#4a5568' : '#e2e8f0')
                      }`,
                      borderRadius: '8px',
                      background: method.disabled 
                        ? '#f3f4f6' 
                        : paymentMethod === method.id 
                          ? (method.id === 'credit' ? '#8b5cf6' : '#3b82f6')
                          : 'transparent',
                      color: method.disabled 
                        ? '#9ca3af' 
                        : paymentMethod === method.id 
                          ? 'white' 
                          : (isDark ? '#f7fafc' : '#1f2937'),
                      cursor: method.disabled ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      opacity: method.disabled ? 0.5 : 1
                    }}
                  >
                    <method.icon size={16} />
                    {method.label}
                    {method.disabled && (
                      <span style={{ fontSize: '10px', marginTop: '2px' }}>
                        (Sélectionnez un client)
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {selectedCustomer.id === 1 && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px',
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertTriangle size={14} />
                  Sélectionnez un client spécifique pour activer le paiement à crédit
                </div>
              )}
              
              {paymentMethod === 'credit' && selectedCustomer.id !== 1 && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px',
                  background: '#f3e8ff',
                  border: '1px solid #8b5cf6',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#6b46c1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Check size={14} />
                  Vente à crédit pour {selectedCustomer.name} • Échéance: 30 jours
                </div>
              )}
            </div>

            {/* Montant reçu seulement pour espèces */}
            {paymentMethod === 'cash' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: isDark ? '#f7fafc' : '#374151'
                }}>
                  Montant reçu
                </label>
                
                {suggestedAmounts.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    {suggestedAmounts.map(amount => (
                      <button
                        key={amount}
                        onClick={() => {
                          amountReceivedRef.current = amount.toString();
                          setAmountDisplay(amount.toString());
                        }}
                        style={{
                          padding: '8px 4px',
                          border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                          borderRadius: '6px',
                          background: parseInt(amountDisplay) === amount ? '#3b82f6' : (isDark ? '#374151' : 'white'),
                          color: parseInt(amountDisplay) === amount ? 'white' : (isDark ? '#f7fafc' : '#1f2937'),
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                )}
                
                <input
                  ref={amountInputRef}
                  type="number"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  placeholder="0"
                  min="0"
                  step="500"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `2px solid ${parseFloat(amountDisplay) >= cartStats.finalTotal ? '#10b981' : (isDark ? '#4a5568' : '#e2e8f0')}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: isDark ? '#374151' : 'white',
                    color: isDark ? '#f7fafc' : '#1f2937',
                    outline: 'none'
                  }}
                  autoFocus
                />
                {amountDisplay && (
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '14px', 
                    color: parseFloat(amountDisplay) >= cartStats.finalTotal ? '#10b981' : '#ef4444',
                    fontWeight: '500'
                  }}>
                    {parseFloat(amountDisplay) >= cartStats.finalTotal ? (
                      `Monnaie à rendre: ${Math.max(0, parseFloat(amountDisplay) - cartStats.finalTotal).toLocaleString()} ${appSettings.currency}`
                    ) : (
                      `Manque: ${(cartStats.finalTotal - parseFloat(amountDisplay)).toLocaleString()} ${appSettings.currency}`
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Boutons d'action */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'transparent',
                  color: isDark ? '#a0aec0' : '#6b7280',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleCheckout}
                disabled={paymentMethod === 'cash' && (!amountDisplay || parseFloat(amountDisplay) < cartStats.finalTotal)}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: (paymentMethod === 'cash' && (!amountDisplay || parseFloat(amountDisplay) < cartStats.finalTotal)) ? '#6b7280' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: (paymentMethod === 'cash' && (!amountDisplay || parseFloat(amountDisplay) < cartStats.finalTotal)) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.2s'
                }}
              >
                <Check size={16} />
                Confirmer la vente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sélection client */}
      {showCustomerModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: isDark ? '#2d3748' : 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            maxHeight: '70vh',
            overflowY: 'auto'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: isDark ? '#f7fafc' : '#1f2937',
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              Sélectionner un client
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {customers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerModal(false);
                  }}
                  style={{
                    padding: '12px',
                    border: `1px solid ${selectedCustomer.id === customer.id ? '#3b82f6' : (isDark ? '#4a5568' : '#e2e8f0')}`,
                    borderRadius: '8px',
                    background: selectedCustomer.id === customer.id ? '#3b82f615' : 'transparent',
                    color: isDark ? '#f7fafc' : '#1f2937',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>{customer.name}</div>
                  {customer.phone && (
                    <div style={{
                      fontSize: '12px',
                      color: isDark ? '#a0aec0' : '#6b7280',
                      marginTop: '2px'
                    }}>
                      {customer.phone}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCustomerModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: isDark ? '#a0aec0' : '#6b7280',
                border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSModule;
