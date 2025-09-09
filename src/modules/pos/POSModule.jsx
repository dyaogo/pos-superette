{/* Grille des produits - Adaptable selon le mode */}
        {view// src/modules/pos/POSModule.jsx - Version corrigée pour votre structure existante

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Package, Search, Lock, Unlock, Plus, Minus, Trash2, 
  CreditCard, Banknote, User, Calculator, Receipt,
  ShoppingCart, X, Check, AlertTriangle, Calendar,
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

  // ==================== GESTION CAISSE ====================
  const [cashSession, setCashSession] = useState(null);
  const [cashOperations, setCashOperations] = useState([]);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('50000');
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');

  // Charger la session de caisse
  useEffect(() => {
    const session = getCashSession();
    const operations = getCashOperations();
    setCashSession(session);
    if (operations.length) {
      setCashOperations(operations);
    }
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
  const amountReceivedRef = useRef('');

  // ==================== FONCTIONS CAISSE ====================
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
    
    return {
      totalSales: sessionSales.reduce((sum, s) => sum + s.total, 0),
      cashSales: cashSales.reduce((sum, s) => sum + s.total, 0),
      cardSales: cardSales.reduce((sum, s) => sum + s.total, 0),
      transactionCount: sessionSales.length
    };
  };

  const openRegister = () => {
    const session = {
      id: Date.now(),
      openedAt: new Date().toISOString(),
      openedBy: 'Caissier Principal',
      openingAmount: parseFloat(openingAmount),
      status: 'open'
    };
    
    setCashSession(session);
    // saveCashSession(session); // Décommentez si vous avez le service
    setShowOpenModal(false);
    toast.success('Caisse ouverte avec succès!');
  };

  const closeRegister = () => {
    if (!cashSession) return;

    const totals = getSessionTotals();
    const expectedCash = cashSession.openingAmount + totals.cashSales;
    const actualCash = parseFloat(closingCash) || 0;
    const difference = actualCash - expectedCash;

    const report = {
      sessionId: cashSession.id,
      openedAt: cashSession.openedAt,
      closedAt: new Date().toISOString(),
      openingAmount: cashSession.openingAmount,
      expectedCash,
      actualCash,
      difference,
      ...totals,
      notes
    };

    // addCashReport(report); // Décommentez si vous avez le service
    // clearCashData(); // Décommentez si vous avez le service
    setCashSession(null);
    setCashOperations([]);
    setShowCloseModal(false);
    toast.success('Caisse fermée avec succès!');
  };

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

    return filtered.slice(0, 50);
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

      // Validation pour vente à crédit
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
  }, [cart, cartStats, paymentMethod, selectedCustomer, processSale, appSettings.currency, clearCart, addCreditSale]);

  const handleAddToCart = useCallback((product) => {
    if (!cashSession) {
      toast.error('Veuillez d\'abord ouvrir la caisse pour commencer les ventes');
      return;
    }
    addToCart(product);
    toast.success(`${product.name} ajouté au panier`, { duration: 1500 });
  }, [addToCart, cashSession]);

  // ==================== COMPOSANT CARTE PRODUIT MODERNE ====================
  const ProductCard = ({ product }) => {
    const hasImage = product.image && product.image.trim() !== '';
    const isOutOfStock = product.stock === 0;
    const isLowStock = product.stock > 0 && product.stock <= (product.minStock || 5);

    return (
      <div
        onClick={() => !isOutOfStock && handleAddToCart(product)}
        style={{
          background: isDark ? '#374151' : 'white',
          borderRadius: '16px',
          border: `2px solid ${
            isOutOfStock ? '#ef4444' : 
            isLowStock ? '#f59e0b' : 
            (isDark ? '#4b5563' : '#e5e7eb')
          }`,
          cursor: (!cashSession || isOutOfStock) ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          opacity: (!cashSession || isOutOfStock) ? 0.6 : 1,
          overflow: 'hidden',
          transformOrigin: 'center',
          minHeight: '280px',
          display: 'flex',
          flexDirection: 'column'
        }}
        onMouseEnter={(e) => {
          if (!isOutOfStock && cashSession) {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
            e.currentTarget.style.boxShadow = isDark 
              ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.3)'
              : '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 20px rgba(59, 130, 246, 0.2)';
            e.currentTarget.style.borderColor = '#3b82f6';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = isOutOfStock ? '#ef4444' : 
            isLowStock ? '#f59e0b' : (isDark ? '#4b5563' : '#e5e7eb');
        }}
      >
        {/* Indicateur de statut stock */}
        {(isOutOfStock || isLowStock) && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: isOutOfStock ? '#ef4444' : '#f59e0b',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: '600',
            zIndex: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {isOutOfStock ? 'Rupture' : 'Stock faible'}
          </div>
        )}

        {/* Zone image ou placeholder */}
        <div style={{
          height: '160px',
          background: hasImage ? 'transparent' : (isDark ? '#4b5563' : '#f3f4f6'),
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {hasImage ? (
            <>
              <img
                src={product.image}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              {/* Fallback si image ne charge pas */}
              <div style={{
                display: 'none',
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDark ? '#4b5563' : '#f3f4f6'
              }}>
                <ImageIcon size={32} color={isDark ? '#9ca3af' : '#6b7280'} />
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <Package size={32} color={isDark ? '#9ca3af' : '#6b7280'} />
              <span style={{
                fontSize: '12px',
                color: isDark ? '#9ca3af' : '#6b7280',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                Pas d'image
              </span>
            </div>
          )}

          {/* Overlay gradient pour le texte */}
          {hasImage && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              pointerEvents: 'none'
            }} />
          )}
        </div>

        {/* Informations produit */}
        <div style={{
          padding: '16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          {/* Nom et catégorie */}
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: isDark ? '#f9fafb' : '#111827',
              margin: '0 0 4px 0',
              lineHeight: '1.3',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {product.name}
            </h3>
            
            {product.category && (
              <span style={{
                fontSize: '12px',
                color: isDark ? '#9ca3af' : '#6b7280',
                fontWeight: '500',
                background: isDark ? '#374151' : '#f3f4f6',
                padding: '2px 8px',
                borderRadius: '8px',
                display: 'inline-block'
              }}>
                {product.category}
              </span>
            )}
          </div>

          {/* Prix et stock */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end' 
          }}>
            <div>
              <div style={{
                fontSize: '20px',
                fontWeight: '800',
                color: '#3b82f6',
                lineHeight: '1'
              }}>
                {product.price?.toLocaleString()} {appSettings.currency}
              </div>
              
              <div style={{
                fontSize: '12px',
                color: isDark ? '#9ca3af' : '#6b7280',
                marginTop: '2px'
              }}>
                Stock: {product.stock || 0}
              </div>
            </div>

            {/* Action button */}
            {!isOutOfStock && (
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                +
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==================== BOUTONS CATÉGORIES MODERNES ====================
  const CategoryButtons = () => (
    <div style={{
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      marginBottom: '24px',
      padding: '4px'
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
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '50px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: isActive
                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                : (isDark ? '#374151' : '#f8fafc'),
              color: isActive
                ? 'white'
                : (isDark ? '#d1d5db' : '#374151'),
              boxShadow: isActive
                ? '0 8px 25px rgba(59, 130, 246, 0.3)'
                : '0 2px 8px rgba(0, 0, 0, 0.1)',
              transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.target.style.background = isDark ? '#4b5563' : '#e2e8f0';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.target.style.background = isDark ? '#374151' : '#f8fafc';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>{category.icon}</span>
            <span>{category.name}</span>
            <span style={{
              background: isActive ? 'rgba(255,255,255,0.2)' : (isDark ? '#4b5563' : '#e2e8f0'),
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '700',
              color: isActive ? 'white' : (isDark ? '#9ca3af' : '#6b7280')
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
      gridTemplateColumns: cart.length > 0 ? '1fr 400px' : '1fr',
      height: '100vh',
      background: isDark ? '#111827' : '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Section Produits */}
      <div style={{
        padding: '24px',
        overflowY: 'auto'
      }}>
        {/* Header avec statut caisse */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '20px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
              }}>
                <Package size={28} color="white" />
              </div>
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '32px', 
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Point de Vente
                </h1>
                <p style={{
                  margin: '4px 0 0 0',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  fontSize: '16px',
                  fontWeight: '500'
                }}>
                  Interface moderne de vente
                </p>
              </div>
            </div>

            {/* Statut caisse */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {!cashSession && (
                <button
                  onClick={() => setShowOpenModal(true)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '50px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  Ouvrir la caisse
                </button>
              )}
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                borderRadius: '50px',
                background: cashSession 
                  ? 'linear-gradient(135deg, #10b981, #059669)' 
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                fontWeight: '600',
                boxShadow: cashSession 
                  ? '0 8px 25px rgba(16, 185, 129, 0.3)' 
                  : '0 8px 25px rgba(239, 68, 68, 0.3)',
                cursor: cashSession ? 'pointer' : 'default'
              }}
              onClick={() => cashSession && setShowCloseModal(true)}
              >
                {cashSession ? <Unlock size={20} /> : <Lock size={20} />}
                <span>{cashSession ? 'Caisse Ouverte' : 'Caisse Fermée'}</span>
                {cashSession && <Sparkles size={16} />}
              </div>
            </div>
          </div>

          {/* Barre de recherche moderne */}
          <div style={{
            position: 'relative',
            marginBottom: '24px'
          }}>
            <Search size={20} style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isDark ? '#9ca3af' : '#6b7280'
            }} />
            <input
              type="text"
              placeholder="Rechercher un produit par nom ou code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!cashSession}
              style={{
                width: '100%',
                padding: '16px 16px 16px 48px',
                border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '20px',
                fontSize: '16px',
                background: isDark ? '#374151' : 'white',
                color: isDark ? '#f9fafb' : '#111827',
                outline: 'none',
                transition: 'all 0.3s ease',
                opacity: !cashSession ? 0.6 : 1
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDark ? '#374151' : '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Boutons catégories */}
          <CategoryButtons />
        </div>

        {/* Grille des produits */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Message si aucun produit */}
        {filteredProducts.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: isDark ? '#1f2937' : 'white',
            borderRadius: '20px',
            border: `2px dashed ${isDark ? '#374151' : '#e5e7eb'}`
          }}>
            <Package size={64} color={isDark ? '#6b7280' : '#9ca3af'} style={{ margin: '0 auto 16px' }} />
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: isDark ? '#f9fafb' : '#111827',
              margin: '0 0 8px 0'
            }}>
              Aucun produit trouvé
            </h3>
            <p style={{
              color: isDark ? '#9ca3af' : '#6b7280',
              margin: 0,
              fontSize: '16px'
            }}>
              {searchQuery ? 'Essayez de modifier votre recherche' : 'Sélectionnez une autre catégorie'}
            </p>
          </div>
        )}
      </div>

      {/* Section Panier (si des articles) */}
      {cart.length > 0 && (
        <div style={{
          background: isDark ? '#1f2937' : 'white',
          borderLeft: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}>
          {/* Header Panier */}
          <div style={{
            padding: '24px',
            borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            background: isDark ? '#111827' : '#f8fafc'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: isDark ? '#f9fafb' : '#111827',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <ShoppingCart size={24} />
                Panier ({cart.length})
              </h2>
              
              <button
                onClick={clearCart}
                style={{
                  padding: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                <Trash2 size={20} />
              </button>
            </div>

            {/* Sélection client */}
            <select
              value={selectedCustomer.id}
              onChange={(e) => {
                const customer = customers.find(c => c.id === parseInt(e.target.value));
                setSelectedCustomer(customer || { id: 1, name: 'Client Comptant' });
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '12px',
                background: isDark ? '#374151' : 'white',
                color: isDark ? '#f9fafb' : '#111827',
                fontSize: '14px'
              }}
            >
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  👤 {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Liste des articles */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px'
          }}>
            {cart.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: isDark ? '#374151' : '#f8fafc',
                borderRadius: '12px',
                marginBottom: '12px',
                border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
              }}>
                {/* Image ou placeholder */}
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
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
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <Package size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                  )}
                </div>

                {/* Infos produit */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isDark ? '#f9fafb' : '#111827',
                    margin: '0 0 4px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.name}
                  </h4>
                  <p style={{
                    fontSize: '12px',
                    color: isDark ? '#9ca3af' : '#6b7280',
                    margin: 0
                  }}>
                    {item.price.toLocaleString()} {appSettings.currency} × {item.quantity}
                  </p>
                </div>

                {/* Contrôles quantité */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#ef4444',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    <Minus size={16} />
                  </button>
                  
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: isDark ? '#f9fafb' : '#111827',
                    minWidth: '24px',
                    textAlign: 'center'
                  }}>
                    {item.quantity}
                  </span>
                  
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    disabled={item.quantity >= item.stock}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: 'none',
                      background: item.quantity >= item.stock ? '#9ca3af' : '#10b981',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: item.quantity >= item.stock ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Prix total et suppression */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '4px'
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#3b82f6'
                  }}>
                    {(item.price * item.quantity).toLocaleString()} {appSettings.currency}
                  </span>
                  
                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Résumé et paiement */}
          <div style={{
            padding: '24px',
            background: isDark ? '#111827' : '#f8fafc',
            borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
          }}>
            {/* Totaux */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                  Sous-total:
                </span>
                <span style={{ 
                  fontWeight: '600', 
                  color: isDark ? '#f9fafb' : '#111827' 
                }}>
                  {cartStats.totalAmount.toLocaleString()} {appSettings.currency}
                </span>
              </div>
              
              {cartStats.totalTax > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                    Taxe:
                  </span>
                  <span style={{ 
                    fontWeight: '600', 
                    color: isDark ? '#f9fafb' : '#111827' 
                  }}>
                    {cartStats.totalTax.toLocaleString()} {appSettings.currency}
                  </span>
                </div>
              )}
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px 0',
                borderTop: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                marginTop: '12px'
              }}>
                <span style={{ 
                  fontSize: '20px',
                  fontWeight: '700',
                  color: isDark ? '#f9fafb' : '#111827' 
                }}>
                  Total:
                </span>
                <span style={{ 
                  fontSize: '24px',
                  fontWeight: '800',
                  color: '#3b82f6'
                }}>
                  {cartStats.finalTotal.toLocaleString()} {appSettings.currency}
                </span>
              </div>
            </div>

            {/* Bouton paiement */}
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                border: 'none',
                background: cart.length === 0 ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                fontSize: '18px',
                fontWeight: '700',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                boxShadow: cart.length === 0 ? 'none' : '0 8px 25px rgba(16, 185, 129, 0.3)'
              }}
            >
              <CreditCard size={20} />
              Procéder au paiement
              <Zap size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal d'ouverture de caisse */}
      {showOpenModal && (
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
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: isDark ? '#1f2937' : 'white',
            borderRadius: '20px',
            padding: '32px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: isDark ? '#f9fafb' : '#111827',
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              🔓 Ouvrir la caisse
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#f9fafb' : '#111827',
                marginBottom: '8px'
              }}>
                Montant d'ouverture
              </label>
              <input
                type="number"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f9fafb' : '#111827'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowOpenModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
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
                onClick={openRegister}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
                }}
              >
                Ouvrir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de paiement */}
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
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: isDark ? '#1f2937' : 'white',
            borderRadius: '20px',
            padding: '32px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '24px',
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
                  padding: '8px',
                  borderRadius: '8px',
                  color: isDark ? '#9ca3af' : '#6b7280'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Résumé de la commande */}
            <div style={{
              background: isDark ? '#374151' : '#f8fafc',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: isDark ? '#f9fafb' : '#111827',
                margin: '0 0 12px 0'
              }}>
                Résumé de la commande
              </h4>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{ color: isDark ? '#d1d5db' : '#6b7280' }}>
                  Articles ({cart.length}):
                </span>
                <span style={{ fontWeight: '600', color: isDark ? '#f9fafb' : '#111827' }}>
                  {cartStats.totalAmount.toLocaleString()} {appSettings.currency}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderTop: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                marginTop: '8px'
              }}>
                <span style={{ 
                  fontSize: '18px',
                  fontWeight: '700',
                  color: isDark ? '#f9fafb' : '#111827' 
                }}>
                  Total à payer:
                </span>
                <span style={{ 
                  fontSize: '20px',
                  fontWeight: '800',
                  color: '#3b82f6'
                }}>
                  {cartStats.finalTotal.toLocaleString()} {appSettings.currency}
                </span>
              </div>
            </div>

            {/* Méthodes de paiement */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: isDark ? '#f9fafb' : '#111827',
                margin: '0 0 16px 0'
              }}>
                Méthode de paiement
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px'
              }}>
                {[
                  { id: 'cash', label: 'Espèces', icon: Banknote, color: '#10b981' },
                  { id: 'card', label: 'Carte', icon: CreditCard, color: '#3b82f6' },
                  { id: 'credit', label: 'Crédit', icon: User, color: '#f59e0b' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    style={{
                      padding: '16px 12px',
                      borderRadius: '12px',
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
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <method.icon size={24} />
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Montant reçu (pour espèces) */}
            {paymentMethod === 'cash' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDark ? '#f9fafb' : '#111827',
                  marginBottom: '8px'
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
                    padding: '16px',
                    border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: '600',
                    background: isDark ? '#374151' : 'white',
                    color: isDark ? '#f9fafb' : '#111827',
                    textAlign: 'center'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDark ? '#374151' : '#e5e7eb';
                  }}
                />

                {/* Montant de la monnaie */}
                {amountReceivedRef.current && parseFloat(amountReceivedRef.current) >= cartStats.finalTotal && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: '#10b981',
                      fontWeight: '600' 
                    }}>
                      Monnaie à rendre:
                    </span>
                    <span style={{ 
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#10b981'
                    }}>
                      {(parseFloat(amountReceivedRef.current) - cartStats.finalTotal).toLocaleString()} {appSettings.currency}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Boutons d'action */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '12px',
                  border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  background: 'transparent',
                  color: isDark ? '#d1d5db' : '#6b7280',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              
              <button
                onClick={handleCompleteSale}
                style={{
                  flex: 2,
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Check size={20} />
                Confirmer le paiement
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
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: isDark ? '#1f2937' : 'white',
            borderRadius: '20px',
            padding: '32px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: isDark ? '#f9fafb' : '#111827',
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              🔒 Fermer la caisse
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#f9fafb' : '#111827',
                marginBottom: '8px'
              }}>
                Espèces en caisse
              </label>
              <input
                type="number"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="Montant compté"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f9fafb' : '#111827'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#f9fafb' : '#111827',
                marginBottom: '8px'
              }}>
                Notes (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Remarques sur la journée..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  fontSize: '14px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f9fafb' : '#111827',
                  resize: 'vertical',
                  minHeight: '60px'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowCloseModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
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
                onClick={closeRegister}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)'
                }}
              >
                Fermer la caisse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSModule;
