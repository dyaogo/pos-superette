// src/modules/pos/POSModule.jsx - Version ultra compacte avec gestion caisse unifiée

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Package, Search, Lock, Unlock, Plus, Minus, Trash2, 
  CreditCard, User, ShoppingCart, X, Check, AlertTriangle,
  Zap, Sparkles, ImageIcon
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useCart } from '../../hooks/useCart';
import { useCategories } from '../../hooks/useCategories';
import { 
  getCashSession, 
  saveCashSession, 
  getCashOperations, 
  saveCashOperations, 
  addCashReport, 
  clearCashData 
} from '../../services/cash.service';
import toast from 'react-hot-toast';

const POSModule = ({ onNavigate }) => {
  const { 
    globalProducts = [], 
    appSettings = {}, 
    currentStoreId,
    customers = [],
    processSale,
    credits,
    setCredits,
    salesHistory = []
  } = useApp();

  const isDark = appSettings.darkMode || false;

  // ==================== GESTION CAISSE SYNCHRONISÉE ====================
  const [cashSession, setCashSession] = useState(null);
  const [cashOperations, setCashOperations] = useState([]);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('50000');
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');

  // ✅ Surveillance continue de l'état de la caisse (synchronisation)
  useEffect(() => {
    const checkCashSession = () => {
      const session = getCashSession();
      const operations = getCashOperations();
      setCashSession(session);
      if (operations.length) {
        setCashOperations(operations);
      }
    };

    // Vérification initiale
    checkCashSession();

    // Vérification périodique toutes les 2 secondes
    const interval = setInterval(checkCashSession, 2000);

    return () => clearInterval(interval);
  }, []);

  // ==================== HOOKS PERSONNALISÉS ====================
  const { 
    cart, 
    cartStats, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart(globalProducts, appSettings);
  
  const categories = useCategories(globalProducts);

  // ==================== ÉTATS LOCAUX ====================
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(customers?.[0] || { id: 1, name: 'Client Comptant' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const amountReceivedRef = useRef('');

  // ==================== FONCTIONS CAISSE IDENTIQUES AU MODULE CAISSE ====================
  const getSessionSales = () => {
    if (!cashSession) return [];
    return salesHistory.filter(sale => 
      new Date(sale.date) >= new Date(cashSession.openedAt)
    );
  };

  const getSessionTotals = () => {
  const sessionSales = getSessionSales();
  const cashSales = sessionSales.filter(s => s.paymentMethod === 'cash');
  const cardSales = sessionSales.filter(s => s.paymentMethod === 'card');
  
  // ✅ NOUVEAU : Calculer les opérations de caisse (entrées/sorties)
  const cashOperationsTotal = cashOperations.reduce((total, op) => {
    if (op.type === 'in') {
      return total + op.amount;
    } else if (op.type === 'out') {
      return total - op.amount;
    }
    return total; // Ignorer les opérations d'ouverture/fermeture
  }, 0);

  return {
    totalSales: sessionSales.reduce((sum, s) => sum + s.total, 0),
    cashSales: cashSales.reduce((sum, s) => sum + s.total, 0),
    cardSales: cardSales.reduce((sum, s) => sum + s.total, 0),
    transactionCount: sessionSales.length,
    cashTransactions: cashSales.length,
    cardTransactions: cardSales.length,
    cashOperationsTotal // ✅ NOUVEAU : Total des opérations de caisse
  };
};

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
    
    toast.success(`✅ Caisse ouverte! Fond initial: ${parseFloat(openingAmount).toLocaleString()} ${appSettings.currency}`);
  }, [openingAmount, appSettings.currency]);

  const closeRegister = useCallback(() => {
    if (!cashSession) return;
    
    const totals = getSessionTotals();
    const expectedCash = cashSession.openingAmount + totals.cashSales;
    const actualCash = parseFloat(closingCash) || 0;
    const difference = actualCash - expectedCash;
    
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
    
    addCashReport(closingReport);
    
    // ✅ FERMETURE GLOBALE - Vide le panier aussi
    setCashSession(null);
    setCashOperations([]);
    clearCashData();
    clearCart(); // Vider le panier à la fermeture
    
    setShowCloseModal(false);
    setClosingCash('');
    setNotes('');
    
    toast.success(`✅ Caisse fermée! Écart: ${difference.toLocaleString()} ${appSettings.currency}`);
  }, [cashSession, closingCash, notes, cashOperations, appSettings.currency, getSessionTotals, clearCart]);

  // ==================== FILTRAGE PRODUITS ====================
  const filteredProducts = useMemo(() => {
    let filtered = globalProducts.filter(product => {
      const matchesSearch = !searchQuery || 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    return filtered.slice(0, 100); // Plus de produits visibles
  }, [globalProducts, searchQuery, selectedCategory]);

  // ==================== GESTION PAIEMENT ====================
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

  const handleCompleteSale = useCallback(async () => {
    try {
      if (cart.length === 0) {
        toast.error('Le panier est vide');
        return;
      }

      // ✅ VÉRIFICATION CRITIQUE: Caisse doit être ouverte
      if (!cashSession) {
        toast.error('🔒 Caisse fermée ! Impossible de finaliser la vente.');
        setShowPaymentModal(false);
        return;
      }

      if (paymentMethod === 'credit' && selectedCustomer.id === 1) {
        toast.error('Veuillez sélectionner un client spécifique pour une vente à crédit');
        return;
      }

      const amountReceived = parseFloat(amountReceivedRef.current) || 0;
      
      if (paymentMethod === 'cash' && amountReceived < cartStats.finalTotal) {
        toast.error('Montant insuffisant');
        return;
      }

      if (paymentMethod === 'credit') {
        const result = addCreditSale();
        
        if (result) {
          clearCart();
          setShowPaymentModal(false);
          toast.success('Vente à crédit enregistrée!');
        }
      } else {
        const result = await processSale(
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
          
          toast.success(`✅ Vente confirmée! Reçu: ${result.receiptNumber}`);
          
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
  }, [cart, cartStats, paymentMethod, selectedCustomer, processSale, appSettings.currency, clearCart, addCreditSale, cashSession]);

  const handleAddToCart = useCallback((product) => {
    if (!cashSession) {
      toast.error('🔒 Caisse fermée! Impossible d\'ajouter des produits.');
      return;
    }
    addToCart(product);
    toast.success(`${product.name} ajouté`, { duration: 1000 });
  }, [addToCart, cashSession]);

  // ==================== COMPOSANT CARTE PRODUIT MINI ====================
  const ProductCard = ({ product, isListMode = false }) => {
    const hasImage = product.image && product.image.trim() !== '';
    const isOutOfStock = product.stock === 0;
    const isLowStock = product.stock > 0 && product.stock <= (product.minStock || 5);
    const isDisabled = !cashSession || isOutOfStock;

    if (isListMode) {
      return (
        <div
          onClick={() => !isDisabled && handleAddToCart(product)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            background: isDark ? '#374151' : 'white',
            borderRadius: '4px',
            border: `1px solid ${
              isOutOfStock ? '#ef4444' : 
              isLowStock ? '#f59e0b' : 
              (isDark ? '#4b5563' : '#e5e7eb')
            }`,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.5 : 1,
            marginBottom: '3px',
            minHeight: '32px' // Ultra compact
          }}
        >
          {/* Mini image */}
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '3px',
            background: hasImage ? 'transparent' : (isDark ? '#4b5563' : '#f3f4f6'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {hasImage ? (
              <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Package size={10} color={isDark ? '#9ca3af' : '#6b7280'} />
            )}
          </div>

          {/* Nom ultra compact */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: isDark ? '#f9fafb' : '#111827',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {product.name}
            </div>
          </div>

          {/* Prix mini */}
          <div style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#3b82f6'
          }}>
            {product.price?.toLocaleString()}
          </div>

          {/* Bouton + mini */}
          {!isDisabled && (
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              +
            </div>
          )}
        </div>
      );
    }

    // Mode grille mini
    return (
      <div
        onClick={() => !isDisabled && handleAddToCart(product)}
        style={{
          background: isDark ? '#374151' : 'white',
          borderRadius: '6px',
          border: `1px solid ${
            isOutOfStock ? '#ef4444' : 
            isLowStock ? '#f59e0b' : 
            (isDark ? '#4b5563' : '#e5e7eb')
          }`,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
          opacity: isDisabled ? 0.5 : 1,
          overflow: 'hidden',
          minHeight: '100px', // Ultra mini: 100px
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Statut mini */}
        {(isOutOfStock || isLowStock) && (
          <div style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: isOutOfStock ? '#ef4444' : '#f59e0b',
            color: 'white',
            padding: '1px 3px',
            borderRadius: '3px',
            fontSize: '7px',
            fontWeight: '600',
            zIndex: 10
          }}>
            {isOutOfStock ? 'OUT' : 'LOW'}
          </div>
        )}

        {/* Image mini */}
        <div style={{
          height: '50px', // Ultra petit
          background: hasImage ? 'transparent' : (isDark ? '#4b5563' : '#f3f4f6'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {hasImage ? (
            <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Package size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
          )}
        </div>

        {/* Infos mini */}
        <div style={{
          padding: '4px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: '600',
            color: isDark ? '#f9fafb' : '#111827',
            lineHeight: '1.2',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            marginBottom: '2px'
          }}>
            {product.name}
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#3b82f6'
            }}>
              {product.price?.toLocaleString()}
            </div>

            {!isDisabled && (
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                +
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==================== BOUTONS CATÉGORIES MINI ====================
  const CategoryButtons = () => (
    <div style={{
      display: 'flex',
      gap: '4px',
      flexWrap: 'wrap',
      marginBottom: '12px'
    }}>
      {categories.map(category => {
        const isActive = selectedCategory === category.id || 
          (selectedCategory === 'all' && category.id === 'all');
        
        return (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id === 'all' ? 'all' : category.name)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              background: isActive ? '#3b82f6' : (isDark ? '#374151' : '#f8fafc'),
              color: isActive ? 'white' : (isDark ? '#d1d5db' : '#374151')
            }}
          >
            <span style={{ fontSize: '12px' }}>{category.icon}</span>
            <span>{category.name}</span>
            <span style={{
              background: isActive ? 'rgba(255,255,255,0.2)' : (isDark ? '#4b5563' : '#e2e8f0'),
              padding: '1px 4px',
              borderRadius: '6px',
              fontSize: '8px'
            }}>
              {category.count}
            </span>
          </button>
        );
      })}
    </div>
  );

  // ==================== RENDU PRINCIPAL ====================
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: cart.length > 0 ? '1fr 300px' : '1fr', // Panier encore plus petit
      height: '100vh',
      background: isDark ? '#111827' : '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Section Produits */}
      <div style={{
        padding: '12px', // Padding réduit
        overflowY: 'auto'
      }}>
        {/* Header compact */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '12px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', // Plus petit
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Package size={20} color="white" />
              </div>
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '20px', // Réduit
                  fontWeight: '700',
                  color: isDark ? '#f9fafb' : '#111827'
                }}>
                  Point de Vente
                </h1>
              </div>
            </div>

            {/* Statut caisse compact */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!cashSession && (
                <button
                  onClick={() => setShowOpenModal(true)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Ouvrir caisse
                </button>
              )}
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: cashSession 
                  ? 'linear-gradient(135deg, #10b981, #059669)' 
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                fontSize: '11px',
                fontWeight: '600',
                cursor: cashSession ? 'pointer' : 'default'
              }}
              onClick={() => cashSession && setShowCloseModal(true)}
              >
                {cashSession ? <Unlock size={12} /> : <Lock size={12} />}
                <span>{cashSession ? 'Ouverte' : 'Fermée'}</span>
              </div>
            </div>
          </div>

          {/* Recherche + Toggle mini */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isDark ? '#9ca3af' : '#6b7280'
              }} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={!cashSession}
                style={{
                  width: '100%',
                  padding: '8px 8px 8px 28px',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  fontSize: '12px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f9fafb' : '#111827',
                  outline: 'none',
                  opacity: !cashSession ? 0.5 : 1
                }}
              />
            </div>

            {/* Toggle mini */}
            <div style={{
              display: 'flex',
              background: isDark ? '#374151' : '#f8fafc',
              borderRadius: '8px',
              padding: '2px'
            }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'grid' ? '#3b82f6' : 'transparent',
                  color: viewMode === 'grid' ? 'white' : (isDark ? '#d1d5db' : '#6b7280'),
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: '600'
                }}
              >
                Grille
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'list' ? '#3b82f6' : 'transparent',
                  color: viewMode === 'list' ? 'white' : (isDark ? '#d1d5db' : '#6b7280'),
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: '600'
                }}
              >
                Liste
              </button>
            </div>
          </div>

          <CategoryButtons />
        </div>

        {/* Affichage produits ultra compact */}
        {viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', // Ultra compact
            gap: '8px',
            marginBottom: '16px'
          }}>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} isListMode={false} />
            ))}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            marginBottom: '16px'
          }}>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} isListMode={true} />
            ))}
          </div>
        )}

        {/* Message si aucun produit */}
        {filteredProducts.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: isDark ? '#1f2937' : 'white',
            borderRadius: '12px',
            border: `1px dashed ${isDark ? '#374151' : '#e5e7eb'}`
          }}>
            <Package size={40} color={isDark ? '#6b7280' : '#9ca3af'} style={{ margin: '0 auto 8px' }} />
            <p style={{
              color: isDark ? '#9ca3af' : '#6b7280',
              margin: 0,
              fontSize: '14px'
            }}>
              {searchQuery ? 'Aucun produit trouvé' : 'Sélectionnez une catégorie'}
            </p>
          </div>
        )}
      </div>

      {/* Section Panier mini (si des articles) */}
      {cart.length > 0 && (
        <div style={{
          background: isDark ? '#1f2937' : 'white',
          borderLeft: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}>
          {/* Header Panier mini */}
          <div style={{
            padding: '12px',
            borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            background: isDark ? '#111827' : '#f8fafc'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: isDark ? '#f9fafb' : '#111827',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ShoppingCart size={16} />
                Panier ({cart.length})
              </h2>
              
              <button
                onClick={clearCart}
                style={{
                  padding: '4px',
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Sélection client mini */}
            <select
              value={selectedCustomer.id}
              onChange={(e) => {
                const customer = customers.find(c => c.id === parseInt(e.target.value));
                setSelectedCustomer(customer || { id: 1, name: 'Client Comptant' });
              }}
              style={{
                width: '100%',
                padding: '6px',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '6px',
                background: isDark ? '#374151' : 'white',
                color: isDark ? '#f9fafb' : '#111827',
                fontSize: '11px'
              }}
            >
             {customers.map(customer => (
               <option key={customer.id} value={customer.id}>
                 👤 {customer.name}
               </option>
             ))}
           </select>
         </div>

         {/* Liste des articles mini */}
         <div style={{
           flex: 1,
           overflowY: 'auto',
           padding: '8px'
         }}>
           {cart.map(item => (
             <div key={item.id} style={{
               display: 'flex',
               alignItems: 'center',
               gap: '6px',
               padding: '6px',
               background: isDark ? '#374151' : '#f8fafc',
               borderRadius: '6px',
               marginBottom: '4px',
               border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
             }}>
               {/* Image mini */}
               <div style={{
                 width: '24px',
                 height: '24px',
                 borderRadius: '4px',
                 background: isDark ? '#4b5563' : '#e5e7eb',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 overflow: 'hidden',
                 flexShrink: 0
               }}>
                 {item.image ? (
                   <img 
                     src={item.image} 
                     alt={item.name}
                     style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                   />
                 ) : (
                   <Package size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
                 )}
               </div>

               {/* Infos produit mini */}
               <div style={{ flex: 1, minWidth: 0 }}>
                 <div style={{
                   fontSize: '10px',
                   fontWeight: '600',
                   color: isDark ? '#f9fafb' : '#111827',
                   overflow: 'hidden',
                   textOverflow: 'ellipsis',
                   whiteSpace: 'nowrap'
                 }}>
                   {item.name}
                 </div>
                 <div style={{
                   fontSize: '9px',
                   color: isDark ? '#9ca3af' : '#6b7280'
                 }}>
                   {item.price.toLocaleString()} × {item.quantity}
                 </div>
               </div>

               {/* Contrôles quantité mini */}
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '4px'
               }}>
                 <button
                   onClick={() => updateQuantity(item.id, -1)}
                   style={{
                     width: '16px',
                     height: '16px',
                     borderRadius: '4px',
                     border: 'none',
                     background: '#ef4444',
                     color: 'white',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     cursor: 'pointer',
                     fontSize: '10px'
                   }}
                 >
                   <Minus size={8} />
                 </button>
                 
                 <span style={{
                   fontSize: '10px',
                   fontWeight: '600',
                   color: isDark ? '#f9fafb' : '#111827',
                   minWidth: '12px',
                   textAlign: 'center'
                 }}>
                   {item.quantity}
                 </span>
                 
                 <button
                   onClick={() => updateQuantity(item.id, 1)}
                   disabled={item.quantity >= item.stock}
                   style={{
                     width: '16px',
                     height: '16px',
                     borderRadius: '4px',
                     border: 'none',
                     background: item.quantity >= item.stock ? '#9ca3af' : '#10b981',
                     color: 'white',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     cursor: item.quantity >= item.stock ? 'not-allowed' : 'pointer',
                     fontSize: '10px'
                   }}
                 >
                   <Plus size={8} />
                 </button>
               </div>

               {/* Prix total mini */}
               <div style={{
                 fontSize: '10px',
                 fontWeight: '700',
                 color: '#3b82f6',
                 minWidth: '30px',
                 textAlign: 'right'
               }}>
                 {(item.price * item.quantity).toLocaleString()}
               </div>

               {/* Suppression */}
               <button
                 onClick={() => removeFromCart(item.id)}
                 style={{
                   background: 'none',
                   border: 'none',
                   color: '#ef4444',
                   cursor: 'pointer',
                   padding: '2px'
                 }}
               >
                 <X size={10} />
               </button>
             </div>
           ))}
         </div>

         {/* Résumé et paiement mini */}
         <div style={{
           padding: '12px',
           background: isDark ? '#111827' : '#f8fafc',
           borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
         }}>
           {/* Total compact */}
           <div style={{
             display: 'flex',
             justifyContent: 'space-between',
             padding: '8px 0',
             borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
           }}>
             <span style={{ 
               fontSize: '14px',
               fontWeight: '700',
               color: isDark ? '#f9fafb' : '#111827' 
             }}>
               Total:
             </span>
             <span style={{ 
               fontSize: '16px',
               fontWeight: '800',
               color: '#3b82f6'
             }}>
               {cartStats.finalTotal.toLocaleString()} {appSettings.currency}
             </span>
           </div>

           {/* Bouton paiement mini */}
           <button
             onClick={() => setShowPaymentModal(true)}
             disabled={cart.length === 0 || !cashSession}
             style={{
               width: '100%',
               padding: '8px',
               borderRadius: '8px',
               border: 'none',
               background: (cart.length === 0 || !cashSession) ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
               color: 'white',
               fontSize: '12px',
               fontWeight: '600',
               cursor: (cart.length === 0 || !cashSession) ? 'not-allowed' : 'pointer',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '4px'
             }}
           >
             <CreditCard size={12} />
             {!cashSession ? 'Caisse fermée' : 'Payer'}
           </button>
         </div>
       </div>
     )}

     {/* ✅ MODAL D'OUVERTURE IDENTIQUE AU MODULE CAISSE */}
     {showOpenModal && (
       <div style={{
         position: 'fixed',
         top: 0,
         left: 0,
         right: 0,
         bottom: 0,
         background: 'rgba(0,0,0,0.5)',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         zIndex: 1000
       }}>
         <div style={{
           background: isDark ? '#2d3748' : 'white',
           padding: '30px',
           borderRadius: '12px',
           width: '90%',
           maxWidth: '400px'
         }}>
           <h3 style={{ 
             marginBottom: '20px',
             color: isDark ? '#f7fafc' : '#2d3748'
           }}>
             Ouverture de Caisse
           </h3>
           
           <div style={{ marginBottom: '20px' }}>
             <label style={{
               display: 'block',
               fontSize: '14px',
               fontWeight: '500',
               marginBottom: '8px',
               color: isDark ? '#a0aec0' : '#64748b'
             }}>
               Fond de caisse initial
             </label>
             <input
               type="number"
               value={openingAmount}
               onChange={(e) => setOpeningAmount(e.target.value)}
               style={{
                 width: '100%',
                 padding: '12px',
                 border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                 borderRadius: '6px',
                 fontSize: '16px',
                 background: isDark ? '#374151' : 'white',
                 color: isDark ? '#f7fafc' : '#2d3748'
               }}
               autoFocus
             />
           </div>
           
           <div style={{ display: 'flex', gap: '10px' }}>
             <button
               onClick={() => setShowOpenModal(false)}
               style={{
                 flex: 1,
                 padding: '12px',
                 background: '#64748b',
                 color: 'white',
                 border: 'none',
                 borderRadius: '6px',
                 cursor: 'pointer'
               }}
             >
               Annuler
             </button>
             <button
               onClick={openRegister}
               style={{
                 flex: 1,
                 padding: '12px',
                 background: '#10b981',
                 color: 'white',
                 border: 'none',
                 borderRadius: '6px',
                 cursor: 'pointer',
                 fontWeight: '600'
               }}
             >
               Ouvrir
             </button>
           </div>
         </div>
       </div>
     )}

     {/* ✅ MODAL DE FERMETURE IDENTIQUE AU MODULE CAISSE */}
     {showCloseModal && (
       <div style={{
         position: 'fixed',
         top: 0,
         left: 0,
         right: 0,
         bottom: 0,
         background: 'rgba(0,0,0,0.5)',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         zIndex: 1000
       }}>
         <div style={{
           background: isDark ? '#2d3748' : 'white',
           padding: '30px',
           borderRadius: '12px',
           width: '90%',
           maxWidth: '500px'
         }}>
           <h3 style={{ 
             marginBottom: '20px',
             color: isDark ? '#f7fafc' : '#2d3748'
           }}>
             Fermeture de Caisse
           </h3>
           
           {/* ✅ RÉCAPITULATIF COMPLET COMME MODULE CAISSE */}
           <div style={{ 
             marginBottom: '20px',
             padding: '15px',
             background: isDark ? '#374151' : '#f8fafc',
             borderRadius: '8px'
           }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
               <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>Fond initial:</span>
               <span style={{ fontWeight: '600', color: isDark ? '#f7fafc' : '#2d3748' }}>
                 {cashSession?.openingAmount?.toLocaleString()} {appSettings.currency}
               </span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
               <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>Ventes espèces:</span>
               <span style={{ fontWeight: '600', color: isDark ? '#f7fafc' : '#2d3748' }}>
                 {getSessionTotals().cashSales?.toLocaleString()} {appSettings.currency}
               </span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
               <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>Attendu:</span>
               <span style={{ fontWeight: '600', color: isDark ? '#f7fafc' : '#2d3748' }}>
                 {((cashSession?.openingAmount || 0) + getSessionTotals().cashSales).toLocaleString()} {appSettings.currency}
               </span>
             </div>
           </div>

           <div style={{ marginBottom: '20px' }}>
             <label style={{
               display: 'block',
               fontSize: '14px',
               fontWeight: '500',
               marginBottom: '8px',
               color: isDark ? '#a0aec0' : '#64748b'
             }}>
               Espèces comptées
             </label>
             <input
               type="number"
               value={closingCash}
               onChange={(e) => setClosingCash(e.target.value)}
               placeholder="Montant réellement compté"
               style={{
                 width: '100%',
                 padding: '12px',
                 border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                 borderRadius: '6px',
                 fontSize: '16px',
                 background: isDark ? '#374151' : 'white',
                 color: isDark ? '#f7fafc' : '#2d3748'
               }}
               autoFocus
             />
           </div>

           <div style={{ marginBottom: '20px' }}>
             <label style={{
               display: 'block',
               fontSize: '14px',
               fontWeight: '500',
               marginBottom: '8px',
               color: isDark ? '#a0aec0' : '#64748b'
             }}>
               Notes (optionnel)
             </label>
             <textarea
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               placeholder="Remarques de fin de journée..."
               style={{
                 width: '100%',
                 padding: '12px',
                 border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                 borderRadius: '6px',
                 fontSize: '14px',
                 background: isDark ? '#374151' : 'white',
                 color: isDark ? '#f7fafc' : '#2d3748',
                 resize: 'vertical',
                 minHeight: '60px'
               }}
             />
           </div>

           <div style={{ display: 'flex', gap: '10px' }}>
             <button
               onClick={() => setShowCloseModal(false)}
               style={{
                 flex: 1,
                 padding: '12px',
                 background: '#64748b',
                 color: 'white',
                 border: 'none',
                 borderRadius: '6px',
                 cursor: 'pointer'
               }}
             >
               Annuler
             </button>
             <button
               onClick={closeRegister}
               disabled={!closingCash}
               style={{
                 flex: 1,
                 padding: '12px',
                 background: closingCash ? '#ef4444' : '#94a3b8',
                 color: 'white',
                 border: 'none',
                 borderRadius: '6px',
                 cursor: closingCash ? 'pointer' : 'not-allowed',
                 fontWeight: '600'
               }}
             >
               Fermer Caisse
             </button>
           </div>
         </div>
       </div>
     )}

     {/* Modal de paiement (simplifié) */}
     {showPaymentModal && (
       <div style={{
         position: 'fixed',
         top: 0,
         left: 0,
         right: 0,
         bottom: 0,
         background: 'rgba(0, 0, 0, 0.5)',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         zIndex: 1000
       }}>
         <div style={{
           background: isDark ? '#1f2937' : 'white',
           borderRadius: '16px',
           padding: '24px',
           width: '90%',
           maxWidth: '400px',
           maxHeight: '90vh',
           overflow: 'auto'
         }}>
           <div style={{
             display: 'flex',
             justifyContent: 'space-between',
             alignItems: 'center',
             marginBottom: '16px'
           }}>
             <h3 style={{
               fontSize: '18px',
               fontWeight: '700',
               color: isDark ? '#f9fafb' : '#111827',
               margin: 0
             }}>
               💳 Paiement
             </h3>
             
             <button
               onClick={() => setShowPaymentModal(false)}
               style={{
                 background: 'none',
                 border: 'none',
                 cursor: 'pointer',
                 padding: '4px'
               }}
             >
               <X size={20} />
             </button>
           </div>

           {/* Total compact */}
           <div style={{
             background: isDark ? '#374151' : '#f8fafc',
             borderRadius: '8px',
             padding: '12px',
             marginBottom: '16px'
           }}>
             <div style={{
               display: 'flex',
               justifyContent: 'space-between'
             }}>
               <span style={{ 
                 fontSize: '16px',
                 fontWeight: '700',
                 color: isDark ? '#f9fafb' : '#111827' 
               }}>
                 Total:
               </span>
               <span style={{ 
                 fontSize: '18px',
                 fontWeight: '800',
                 color: '#3b82f6'
               }}>
                 {cartStats.finalTotal.toLocaleString()} {appSettings.currency}
               </span>
             </div>
           </div>

           {/* Méthodes de paiement compactes */}
           <div style={{ marginBottom: '16px' }}>
             <div style={{
               display: 'grid',
               gridTemplateColumns: '1fr 1fr 1fr',
               gap: '8px'
             }}>
               {[
                 { id: 'cash', label: 'Espèces', icon: '💵', color: '#10b981' },
                 { id: 'card', label: 'Carte', icon: '💳', color: '#3b82f6' },
                 { id: 'credit', label: 'Crédit', icon: '👤', color: '#f59e0b' }
               ].map(method => (
                 <button
                   key={method.id}
                   onClick={() => setPaymentMethod(method.id)}
                   style={{
                     padding: '12px 8px',
                     borderRadius: '8px',
                     border: `2px solid ${paymentMethod === method.id ? method.color : (isDark ? '#374151' : '#e5e7eb')}`,
                     background: paymentMethod === method.id 
                       ? `${method.color}15` 
                       : (isDark ? '#374151' : 'white'),
                     color: paymentMethod === method.id 
                       ? method.color 
                       : (isDark ? '#d1d5db' : '#6b7280'),
                     cursor: 'pointer',
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     gap: '4px',
                     fontSize: '12px',
                     fontWeight: '600'
                   }}
                 >
                   <span style={{ fontSize: '16px' }}>{method.icon}</span>
                   {method.label}
                 </button>
               ))}
             </div>
           </div>

           {/* Montant reçu pour espèces */}
           {paymentMethod === 'cash' && (
             <div style={{ marginBottom: '16px' }}>
               <label style={{
                 display: 'block',
                 fontSize: '12px',
                 fontWeight: '600',
                 color: isDark ? '#f9fafb' : '#111827',
                 marginBottom: '6px'
               }}>
                 Montant reçu
               </label>
               
               <input
                 type="number"
                 placeholder="0"
                 value={amountDisplay}
                 onChange={(e) => {
                   setAmountDisplay(e.target.value);
                   amountReceivedRef.current = e.target.value;
                 }}
                 style={{
                   width: '100%',
                   padding: '12px',
                   border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                   borderRadius: '8px',
                   fontSize: '16px',
                   fontWeight: '600',
                   background: isDark ? '#374151' : 'white',
                   color: isDark ? '#f9fafb' : '#111827',
                   textAlign: 'center'
                 }}
               />

               {/* Suggestions compactes */}
               <div style={{
                 display: 'grid',
                 gridTemplateColumns: 'repeat(4, 1fr)',
                 gap: '6px',
                 marginTop: '8px'
               }}>
                 {[
                   cartStats.finalTotal,
                   Math.ceil(cartStats.finalTotal / 1000) * 1000,
                   Math.ceil(cartStats.finalTotal / 5000) * 5000,
                   Math.ceil(cartStats.finalTotal / 10000) * 10000
                 ].filter((amount, index, arr) => arr.indexOf(amount) === index)
                  .sort((a, b) => a - b)
                  .slice(0, 4)
                  .map((amount, index) => (
                   <button
                     key={index}
                     onClick={() => {
                       setAmountDisplay(amount.toString());
                       amountReceivedRef.current = amount.toString();
                     }}
                     style={{
                       padding: '6px',
                       borderRadius: '6px',
                       border: `1px solid ${
                         parseFloat(amountReceivedRef.current) === amount 
                           ? '#3b82f6' 
                           : (isDark ? '#374151' : '#e5e7eb')
                       }`,
                       background: parseFloat(amountReceivedRef.current) === amount 
                         ? '#3b82f615' 
                         : (isDark ? '#374151' : 'white'),
                       color: parseFloat(amountReceivedRef.current) === amount 
                         ? '#3b82f6' 
                         : (isDark ? '#d1d5db' : '#6b7280'),
                       cursor: 'pointer',
                       fontSize: '10px',
                       fontWeight: '600'
                     }}
                   >
                     {amount === cartStats.finalTotal ? 'Exact' : `${amount.toLocaleString()}`}
                   </button>
                 ))}
               </div>

               {/* Monnaie */}
               {amountReceivedRef.current && parseFloat(amountReceivedRef.current) >= cartStats.finalTotal && (
                 <div style={{
                   marginTop: '8px',
                   padding: '8px',
                   background: 'rgba(16, 185, 129, 0.1)',
                   borderRadius: '6px',
                   display: 'flex',
                   justifyContent: 'space-between',
                   alignItems: 'center'
                 }}>
                   <span style={{ 
                     color: '#10b981',
                     fontWeight: '600',
                     fontSize: '12px'
                   }}>
                     Monnaie:
                   </span>
                   <span style={{ 
                     fontSize: '14px',
                     fontWeight: '700',
                     color: '#10b981'
                   }}>
                     {(parseFloat(amountReceivedRef.current) - cartStats.finalTotal).toLocaleString()} {appSettings.currency}
                   </span>
                 </div>
               )}
             </div>
           )}

           {/* Validation crédit */}
           {paymentMethod === 'credit' && selectedCustomer.id === 1 && (
             <div style={{
               marginBottom: '16px',
               padding: '8px',
               background: 'rgba(239, 68, 68, 0.1)',
               border: '1px solid #ef4444',
               borderRadius: '6px',
               display: 'flex',
               alignItems: 'center',
               gap: '6px'
             }}>
               <AlertTriangle size={12} color="#ef4444" />
               <span style={{
                 fontSize: '11px',
                 color: '#ef4444',
                 fontWeight: '500'
               }}>
                 Sélectionner un client spécifique
               </span>
             </div>
           )}

           {/* Boutons d'action */}
           <div style={{
             display: 'flex',
             gap: '8px'
           }}>
             <button
               onClick={() => setShowPaymentModal(false)}
               style={{
                 flex: 1,
                 padding: '12px',
                 borderRadius: '8px',
                 border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                 background: 'transparent',
                 color: isDark ? '#d1d5db' : '#6b7280',
                 fontSize: '14px',
                 fontWeight: '600',
                 cursor: 'pointer'
               }}
             >
               Annuler
             </button>
             
             <button
               onClick={handleCompleteSale}
               disabled={
                 (paymentMethod === 'cash' && parseFloat(amountReceivedRef.current) < cartStats.finalTotal) ||
                 (paymentMethod === 'credit' && selectedCustomer.id === 1) ||
                 !cashSession
               }
               style={{
                 flex: 2,
                 padding: '12px',
                 borderRadius: '8px',
                 border: 'none',
                 background: (
                   (paymentMethod === 'cash' && parseFloat(amountReceivedRef.current) < cartStats.finalTotal) ||
                   (paymentMethod === 'credit' && selectedCustomer.id === 1) ||
                   !cashSession
                 ) ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
                 color: 'white',
                 fontSize: '14px',
                 fontWeight: '700',
                 cursor: (
                   (paymentMethod === 'cash' && parseFloat(amountReceivedRef.current) < cartStats.finalTotal) ||
                   (paymentMethod === 'credit' && selectedCustomer.id === 1) ||
                   !cashSession
                 ) ? 'not-allowed' : 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 gap: '6px',
                 opacity: (
                   (paymentMethod === 'cash' && parseFloat(amountReceivedRef.current) < cartStats.finalTotal) ||
                   (paymentMethod === 'credit' && selectedCustomer.id === 1) ||
                   !cashSession
                 ) ? 0.6 : 1
               }}
             >
               <Check size={16} />
               {!cashSession ? 'Caisse fermée' : 
                paymentMethod === 'credit' && selectedCustomer.id === 1 ? 'Sélectionner client' : 
                'Confirmer'}
             </button>
           </div>
         </div>
       </div>
     )}
   </div>
 );
};

export default POSModule;
