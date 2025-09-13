// src/modules/pos/POSModule.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, 
  AlertCircle, 
  CheckCircle, 
  User, 
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  X,
  DollarSign,
  Clock,
  Package,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Keyboard
} from 'lucide-react';
import { usePOSIntegration } from '../../hooks/usePOSIntegration';
import { useApp } from '../../contexts/AppContext';
import { toast } from 'react-hot-toast';

/**
 * Module POS Principal - Nouveau Système avec Zustand
 * Remplace complètement l'ancien système
 */
const POSModule = ({ onNavigate }) => {
  const { globalProducts, customers, appSettings, salesHistory } = useApp();
  const {
    // État
    cart,
    cartStats,
    isCashSessionActive,
    canProcessSale,
    selectedCustomer,
    paymentMethod,
    showPaymentModal,
    cashSession,
    sessionStats,
    
    // Actions
    handleAddToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    handleProcessSale,
    handleOpenCashSession,
    handleCloseCashSession,
    setSelectedCustomer,
    setPaymentMethod,
    setShowPaymentModal,
    
    // Utilitaires
    formatCurrency
  } = usePOSIntegration();

  // États locaux
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [openingAmount, setOpeningAmount] = useState('25000');
  const [closingAmount, setClosingAmount] = useState('');
  const [showClosingPanel, setShowClosingPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [useNumpad, setUseNumpad] = useState(false);

  const isDark = appSettings?.darkMode || false;

  // Montants rapides pour paiement
  const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000, 50000];

  // Catégories de produits
  const categories = useMemo(() => {
    const cats = new Set(['all']);
    globalProducts?.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [globalProducts]);

  // Produits filtrés
  const filteredProducts = useMemo(() => {
    let products = globalProducts || [];
    
    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      products = products.filter(p => p.category === selectedCategory);
    }
    
    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.barcode?.includes(query)
      );
    }
    
    return products.slice(0, 50); // Limiter pour performance
  }, [globalProducts, searchQuery, selectedCategory]);

  // Calculs de session
  const expectedAmount = useMemo(() => {
    if (!cashSession) return 0;
    
    const sessionSales = (salesHistory || []).filter(sale => {
      const saleDate = new Date(sale.createdAt || sale.date);
      const sessionDate = new Date(cashSession.openedAt);
      return saleDate >= sessionDate;
    });
    
    const cashSales = sessionSales
      .filter(s => s && s.paymentMethod === 'cash' && s.total > 0)
      .reduce((sum, s) => sum + s.total, 0);
    
    return (cashSession.initialAmount || 0) + 
           cashSales + 
           (sessionStats?.cashOperationsTotal || 0);
  }, [cashSession, salesHistory, sessionStats]);

  // ==================== RACCOURCIS CLAVIER ====================
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ne pas interférer avec les inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // Sauf pour ESC
        if (e.key === 'Escape') {
          e.target.blur();
          setShowPaymentModal(false);
        }
        return;
      }

      // F1 - Aide raccourcis
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcutsHelp(!showShortcutsHelp);
      }
      
      // F2 - Recherche produit
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('product-search')?.focus();
      }
      
      // F4 - Paiement
      if (e.key === 'F4' && canProcessSale) {
        e.preventDefault();
        setShowPaymentModal(true);
      }
      
      // F6 - Sélection client
      if (e.key === 'F6') {
        e.preventDefault();
        document.getElementById('customer-select')?.focus();
      }
      
      // F9 - Nouvelle vente (vider panier)
      if (e.key === 'F9' && cart.length > 0) {
        e.preventDefault();
        if (window.confirm('Vider le panier ?')) {
          clearCart();
          toast.success('Nouveau panier');
        }
      }
      
      // ESC - Fermer modals
      if (e.key === 'Escape') {
        setShowPaymentModal(false);
        setShowClosingPanel(false);
        setShowShortcutsHelp(false);
      }
      
      // + - Augmenter quantité dernier article
      if (e.key === '+' && cart.length > 0) {
        e.preventDefault();
        const lastItem = cart[cart.length - 1];
        updateCartItemQuantity(lastItem.id, lastItem.quantity + 1);
      }
      
      // - - Diminuer quantité dernier article  
      if (e.key === '-' && cart.length > 0) {
        e.preventDefault();
        const lastItem = cart[cart.length - 1];
        if (lastItem.quantity > 1) {
          updateCartItemQuantity(lastItem.id, lastItem.quantity - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [canProcessSale, cart, clearCart, updateCartItemQuantity, showShortcutsHelp]);

  // ==================== GESTIONNAIRES ====================
  const handlePayment = async () => {
    const paymentData = {
      method: paymentMethod,
      amountReceived: paymentAmount ? parseFloat(paymentAmount) : cartStats.total
    };
    
    const result = await handleProcessSale(paymentData);
    
    if (result.success) {
      setPaymentAmount('');
      setShowPaymentModal(false);
      
      // Navigation vers historique si défini
      if (onNavigate) {
        setTimeout(() => {
          if (window.confirm('Voir le ticket dans l\'historique ?')) {
            onNavigate('sales-history');
          }
        }, 1000);
      }
    }
  };

  const handleCloseSession = async () => {
    if (!closingAmount) {
      toast.error('Veuillez entrer le montant en caisse');
      return;
    }
    
    const result = await handleCloseCashSession(parseFloat(closingAmount));
    if (result.success) {
      setClosingAmount('');
      setShowClosingPanel(false);
    }
  };

  // ==================== STYLES ====================
  const styles = {
    container: {
      background: isDark ? '#1a202c' : '#f8fafc',
      minHeight: '100vh',
      padding: '20px'
    },
    card: {
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '12px',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    button: {
      primary: {
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s',
        ':hover': {
          background: '#2563eb'
        }
      },
      secondary: {
        background: 'transparent',
        color: isDark ? '#cbd5e0' : '#64748b',
        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
        borderRadius: '8px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s'
      },
      danger: {
        background: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500'
      }
    },
    input: {
      padding: '10px 14px',
      border: `1px solid ${isDark ? '#4a5568' : '#d1d5db'}`,
      borderRadius: '8px',
      background: isDark ? '#374151' : 'white',
      color: isDark ? '#f7fafc' : '#374151',
      fontSize: '14px',
      width: '100%'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: '12px'
    }
  };

  // ==================== RENDU ====================
  return (
    <div style={styles.container}>
      {/* Aide raccourcis clavier */}
      {showShortcutsHelp && (
        <div style={{
          ...styles.card,
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          maxWidth: '400px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>⌨️ Raccourcis Clavier</h3>
            <button onClick={() => setShowShortcutsHelp(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
            <div><kbd>F1</kbd> - Afficher cette aide</div>
            <div><kbd>F2</kbd> - Rechercher produit</div>
            <div><kbd>F4</kbd> - Paiement</div>
            <div><kbd>F6</kbd> - Sélectionner client</div>
            <div><kbd>F9</kbd> - Nouvelle vente</div>
            <div><kbd>+</kbd> - Augmenter quantité</div>
            <div><kbd>-</kbd> - Diminuer quantité</div>
            <div><kbd>ESC</kbd> - Fermer fenêtres</div>
          </div>
        </div>
      )}

      {/* Header avec statut caisse */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: isDark ? '#f7fafc' : '#1a202c',
            margin: 0
          }}>
            🛒 Point de Vente
          </h1>
          
          <button
            onClick={() => setShowShortcutsHelp(true)}
            style={{
              ...styles.button.secondary,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Keyboard size={16} />
            Raccourcis (F1)
          </button>
        </div>
        
        {/* Statut de la caisse */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderRadius: '8px',
          background: isCashSessionActive 
            ? isDark ? '#065f46' : '#d1fae5'
            : isDark ? '#7c2d12' : '#fef2f2'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isCashSessionActive ? (
              <>
                <CheckCircle size={20} color="#10b981" />
                <div>
                  <div style={{ color: '#10b981', fontWeight: '500' }}>
                    Caisse ouverte - Session #{cashSession?.id}
                  </div>
                  {sessionStats && (
                    <div style={{ fontSize: '12px', color: isDark ? '#a7f3d0' : '#065f46', marginTop: '4px' }}>
                      {sessionStats.salesCount} ventes | Total: {formatCurrency(sessionStats.totalAmount)}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <AlertCircle size={20} color="#ef4444" />
                <span style={{ color: '#ef4444', fontWeight: '500' }}>
                  Caisse fermée - Ouvrir pour commencer
                </span>
              </>
            )}
          </div>
          
          {/* Actions caisse */}
          {!isCashSessionActive ? (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Montant initial"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                style={{ ...styles.input, width: '150px' }}
              />
              <button
                onClick={() => handleOpenCashSession(openingAmount)}
                style={styles.button.primary}
              >
                Ouvrir Caisse
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClosingPanel(!showClosingPanel)}
              style={{
                ...styles.button.secondary,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {showClosingPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Fermer Caisse
            </button>
          )}
        </div>
        
        {/* Panneau de fermeture de caisse */}
        {showClosingPanel && isCashSessionActive && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            borderRadius: '8px',
            background: isDark ? '#374151' : '#f9fafb',
            border: `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}`
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>📊 Fermeture de Caisse</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '4px' }}>
                  Montant attendu
                </div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#10b981' }}>
                  {formatCurrency(expectedAmount)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '4px' }}>
                  Montant réel en caisse
                </div>
                <input
                  type="number"
                  placeholder="Comptage réel"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
            
            {closingAmount && (
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                background: Math.abs(parseFloat(closingAmount) - expectedAmount) < 1 
                  ? isDark ? '#065f46' : '#d1fae5'
                  : isDark ? '#7c2d12' : '#fef2f2',
                marginBottom: '12px'
              }}>
                Écart: {formatCurrency(parseFloat(closingAmount) - expectedAmount)}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleCloseSession} style={styles.button.danger}>
                Confirmer Fermeture
              </button>
              <button onClick={() => setShowClosingPanel(false)} style={styles.button.secondary}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Zone principale */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
        {/* Produits */}
        <div style={styles.card}>
          {/* Barre de recherche et filtres */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={20} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: isDark ? '#9ca3af' : '#6b7280'
                }} />
                <input
                  id="product-search"
                  type="text"
                  placeholder="Rechercher produit... (F2)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    ...styles.input,
                    paddingLeft: '40px'
                  }}
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ ...styles.input, width: '200px' }}
              >
                <option value="all">Toutes catégories</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grille de produits */}
          <div style={styles.grid}>
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => handleAddToCart(product)}
                disabled={!isCashSessionActive}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  background: isDark ? '#374151' : 'white',
                  cursor: isCashSessionActive ? 'pointer' : 'not-allowed',
                  opacity: isCashSessionActive ? 1 : 0.5,
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (isCashSessionActive) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: isDark ? '#f7fafc' : '#1f2937' }}>
                  {product.name}
                </div>
                <div style={{ fontSize: '12px', color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '8px' }}>
                  {product.sku} {product.stock !== undefined && `• Stock: ${product.stock}`}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#3b82f6' }}>
                  {formatCurrency(product.price)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Panier */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: isDark ? '#f7fafc' : '#1f2937' }}>
              <ShoppingCart size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Panier ({cart.length})
            </h2>
            
            {/* Sélection client */}
            <select
              id="customer-select"
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const customer = customers?.find(c => c.id === parseInt(e.target.value));
                setSelectedCustomer(customer);
              }}
              style={{ ...styles.input, width: '180px' }}
            >
              <option value="">Client Comptant (F6)</option>
              {customers?.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Articles du panier */}
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
            {cart.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: isDark ? '#9ca3af' : '#6b7280'
              }}>
                Panier vide
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{
                  padding: '12px',
                  borderBottom: `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px', color: isDark ? '#f7fafc' : '#1f2937' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '12px', color: isDark ? '#9ca3af' : '#6b7280' }}>
                      {formatCurrency(item.price)} × {item.quantity}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                      style={{
                        padding: '4px',
                        background: isDark ? '#4a5568' : '#f3f4f6',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Minus size={16} />
                    </button>
                    
                    <span style={{ minWidth: '30px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                      style={{
                        padding: '4px',
                        background: isDark ? '#4a5568' : '#f3f4f6',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={16} />
                    </button>
                    
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        padding: '4px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginLeft: '8px'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totaux */}
          <div style={{
            padding: '16px',
            background: isDark ? '#374151' : '#f9fafb',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Sous-total</span>
              <span>{formatCurrency(cartStats.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>TVA (18%)</span>
              <span>{formatCurrency(cartStats.taxAmount)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '20px',
              fontWeight: '600',
              paddingTop: '8px',
              borderTop: `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}`
            }}>
              <span>Total</span>
              <span style={{ color: '#3b82f6' }}>{formatCurrency(cartStats.total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={!canProcessSale}
              style={{
                ...styles.button.primary,
                flex: 1,
                opacity: canProcessSale ? 1 : 0.5,
                cursor: canProcessSale ? 'pointer' : 'not-allowed'
              }}
            >
              <CreditCard size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Paiement (F4)
            </button>
            
            <button
              onClick={() => {
                if (window.confirm('Vider le panier ?')) {
                  clearCart();
                }
              }}
              disabled={cart.length === 0}
              style={{
                ...styles.button.secondary,
                opacity: cart.length > 0 ? 1 : 0.5,
                cursor: cart.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              Vider (F9)
            </button>
          </div>
        </div>
      </div>

      {/* Modal de paiement */}
      {showPaymentModal && (
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
            ...styles.card,
            width: '500px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0 }}>💳 Paiement</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              </button>
            </div>

            {/* Résumé */}
            <div style={{
              padding: '16px',
              background: isDark ? '#374151' : '#f9fafb',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Client</span>
                <span style={{ fontWeight: '600' }}>
                  {selectedCustomer?.name || 'Comptant'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Articles</span>
                <span>{cart.length}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '20px',
                fontWeight: '600',
                paddingTop: '8px',
                borderTop: `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}`
              }}>
                <span>Total à payer</span>
                <span style={{ color: '#3b82f6' }}>{formatCurrency(cartStats.total)}</span>
              </div>
            </div>

            {/* Mode de paiement */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: isDark ? '#e5e7eb' : '#374151'
              }}>
                Mode de paiement
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['cash', 'card', 'mobile', 'credit'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: `2px solid ${paymentMethod === method ? '#3b82f6' : isDark ? '#4a5568' : '#e5e7eb'}`,
                      background: paymentMethod === method 
                        ? '#3b82f6' 
                        : isDark ? '#374151' : 'white',
                      color: paymentMethod === method 
                        ? 'white' 
                        : isDark ? '#e5e7eb' : '#374151',
                      cursor: 'pointer',
                      fontWeight: paymentMethod === method ? '600' : '400',
                      transition: 'all 0.2s'
                    }}
                  >
                    {method === 'cash' && '💵 Espèces'}
                    {method === 'card' && '💳 Carte'}
                    {method === 'mobile' && '📱 Mobile'}
                    {method === 'credit' && '📝 Crédit'}
                  </button>
                ))}
              </div>
            </div>

            {/* Montant reçu pour espèces avec pavé numérique */}
            {paymentMethod === 'cash' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isDark ? '#e5e7eb' : '#374151'
                }}>
                  Montant reçu
                  <button
                    onClick={() => setUseNumpad(!useNumpad)}
                    style={{
                      marginLeft: '12px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      background: useNumpad ? '#3b82f6' : 'transparent',
                      color: useNumpad ? 'white' : isDark ? '#9ca3af' : '#6b7280',
                      border: `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}`,
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {useNumpad ? '🔢 Pavé actif' : '⌨️ Clavier'}
                  </button>
                </label>
                
                {/* Montants rapides intelligents avec mise en évidence du montant exact */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: '12px'
                }}>
                  {quickAmounts.map((amount, index) => {
                    const isExactAmount = index === 0 && amount === cartStats.total;
                    return (
                      <button
                        key={`${amount}-${index}`}
                        onClick={() => setPaymentAmount(amount.toString())}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: isExactAmount 
                            ? '2px solid #10b981'
                            : `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                          background: paymentAmount === amount.toString() 
                            ? '#3b82f6' 
                            : isExactAmount
                              ? isDark ? '#065f46' : '#d1fae5'
                              : isDark ? '#374151' : 'white',
                          color: paymentAmount === amount.toString() 
                            ? 'white' 
                            : isExactAmount
                              ? '#10b981'
                              : isDark ? '#e5e7eb' : '#64748b',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: isExactAmount ? '700' : '400',
                          transition: 'all 0.2s',
                          position: 'relative',
                          transform: isExactAmount ? 'scale(1.05)' : 'scale(1)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isExactAmount) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isExactAmount) {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                      >
                        {formatCurrency(amount)}
                        {isExactAmount && (
                          <span style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: '#10b981',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}>
                            ✓
                          </span>
                        )}
                        {isExactAmount && (
                          <span style={{
                            position: 'absolute',
                            bottom: '-20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '10px',
                            color: '#10b981',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}>
                            EXACT
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                <input
                  type="number"
                  placeholder="Ou entrez le montant..."
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  readOnly={useNumpad}
                  style={{
                    ...styles.input,
                    fontSize: '18px',
                    padding: '12px',
                    fontWeight: '600',
                    cursor: useNumpad ? 'not-allowed' : 'text'
                  }}
                />
                
                {/* Pavé numérique */}
                {useNumpad && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: isDark ? '#2d3748' : '#f9fafb',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}`
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px'
                    }}>
                      {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', 'C'].map(key => (
                        <button
                          key={key}
                          onClick={() => {
                            if (key === 'C') {
                              setPaymentAmount('');
                            } else {
                              setPaymentAmount(prev => prev + key);
                            }
                          }}
                          style={{
                            padding: '12px',
                            fontSize: '16px',
                            fontWeight: '600',
                            background: key === 'C' 
                              ? '#ef4444' 
                              : isDark ? '#374151' : 'white',
                            color: key === 'C' 
                              ? 'white' 
                              : isDark ? '#f7fafc' : '#1a202c',
                            border: `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          {key === 'C' ? '🗑️' : key}
                        </button>
                      ))}
                    </div>
                    
                    {/* Bouton effacer dernier caractère */}
                    <button
                      onClick={() => setPaymentAmount(prev => prev.slice(0, -1))}
                      style={{
                        width: '100%',
                        marginTop: '8px',
                        padding: '10px',
                        background: isDark ? '#4a5568' : '#e5e7eb',
                        color: isDark ? '#f7fafc' : '#374151',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      ⌫ Effacer dernier chiffre
                    </button>
                  </div>
                )}
                
                {/* Monnaie à rendre */}
                {paymentAmount && parseFloat(paymentAmount) >= cartStats.total && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: isDark ? '#065f46' : '#d1fae5',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#065f46', fontWeight: '500' }}>
                      Monnaie à rendre
                    </span>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#065f46'
                    }}>
                      {formatCurrency(parseFloat(paymentAmount) - cartStats.total)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Note pour crédit */}
            {paymentMethod === 'credit' && (
              <div style={{
                padding: '12px',
                background: isDark ? '#7c2d12' : '#fef3c7',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={20} color="#f59e0b" />
                <span style={{ color: isDark ? '#fbbf24' : '#92400e', fontSize: '14px' }}>
                  Cette vente sera enregistrée comme crédit pour {selectedCustomer?.name || 'le client'}
                </span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handlePayment}
                disabled={paymentMethod === 'cash' && paymentAmount && parseFloat(paymentAmount) < cartStats.total}
                style={{
                  ...styles.button.primary,
                  flex: 1,
                  opacity: (paymentMethod === 'cash' && paymentAmount && parseFloat(paymentAmount) < cartStats.total) ? 0.5 : 1,
                  cursor: (paymentMethod === 'cash' && paymentAmount && parseFloat(paymentAmount) < cartStats.total) ? 'not-allowed' : 'pointer'
                }}
              >
                <CheckCircle size={16} style={{ display: 'inline', marginRight: '8px' }} />
                Confirmer Paiement
              </button>
              
              <button
                onClick={() => setShowPaymentModal(false)}
                style={styles.button.secondary}
              >
                Annuler (ESC)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSModule;
