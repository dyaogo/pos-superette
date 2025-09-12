// src/modules/pos/TestPOSModule.jsx
import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  AlertCircle, 
  CheckCircle, 
  User, 
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard
} from 'lucide-react';
import { usePOSIntegration } from '../../hooks/usePOSIntegration';
import { useApp } from '../../contexts/AppContext';

/**
 * Module POS de Test - Version simplifiée pour tester le nouveau système
 * Peut coexister avec l'ancien POSModule pendant la phase de test
 */
const TestPOSModule = () => {
  const { globalProducts, customers, appSettings } = useApp();
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

  // États locaux pour le test
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [openingAmount, setOpeningAmount] = useState('25000');
  const [closingAmount, setClosingAmount] = useState('');

  const isDark = appSettings?.darkMode || false;

  // Produits filtrés pour la recherche
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return (globalProducts || []).slice(0, 20);
    
    const query = searchQuery.toLowerCase();
    return (globalProducts || [])
      .filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.barcode?.includes(query)
      )
      .slice(0, 20);
  }, [globalProducts, searchQuery]);

  // Styles de base
  const baseStyles = {
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
      marginBottom: '20px'
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
        fontWeight: '500'
      },
      secondary: {
        background: 'transparent',
        color: isDark ? '#f7fafc' : '#374151',
        border: `1px solid ${isDark ? '#4a5568' : '#d1d5db'}`,
        borderRadius: '8px',
        padding: '12px 24px',
        cursor: 'pointer',
        fontSize: '14px'
      }
    }
  };

  const handlePayment = async () => {
    const paymentData = {
      method: paymentMethod,
      amountReceived: paymentMethod === 'cash' ? parseFloat(paymentAmount) : cartStats.total
    };
    
    const result = await handleProcessSale(paymentData);
    
    if (result.success) {
      setPaymentAmount('');
      setShowPaymentModal(false);
    }
  };

  return (
    <div style={baseStyles.container}>
      {/* Header */}
      <div style={baseStyles.card}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: isDark ? '#f7fafc' : '#1a202c',
          margin: '0 0 16px 0'
        }}>
          🧪 POS Test Module (Nouveau Système)
        </h1>
        
        {/* Statut de la caisse */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          borderRadius: '8px',
          background: isCashSessionActive 
            ? isDark ? '#065f46' : '#d1fae5'
            : isDark ? '#7c2d12' : '#fef2f2'
        }}>
          {isCashSessionActive ? (
            <>
              <CheckCircle size={20} color="#10b981" />
              <span style={{ color: '#10b981', fontWeight: '500' }}>
                Caisse ouverte - Session #{cashSession?.id}
              </span>
            </>
          ) : (
            <>
              <AlertCircle size={20} color="#ef4444" />
              <span style={{ color: '#ef4444', fontWeight: '500' }}>
                Caisse fermée
              </span>
            </>
          )}
        </div>
        
        {/* Actions caisse */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
          {!isCashSessionActive ? (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Montant d'ouverture"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${isDark ? '#4a5568' : '#d1d5db'}`,
                  borderRadius: '6px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f7fafc' : '#374151',
                  width: '150px'
                }}
              />
              <button
                onClick={() => handleOpenCashSession(openingAmount)}
                style={baseStyles.button.primary}
              >
                Ouvrir Caisse
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
              {/* Informations de session */}
              <div style={{
                background: isDark ? '#374151' : '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                minWidth: '300px'
              }}>
                <h4 style={{
                  margin: '0 0 12px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDark ? '#f7fafc' : '#1a202c'
                }}>
                  📊 Résumé de session
                </h4>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>Ouverture:</span>
                    <div style={{ fontWeight: '600', color: isDark ? '#f7fafc' : '#1a202c' }}>
                      {formatCurrency(cashSession?.initialAmount || 0)}
                    </div>
                  </div>
                  
                  <div>
                    <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>Ventes espèces:</span>
                    <div style={{ fontWeight: '600', color: '#10b981' }}>
                      {formatCurrency(sessionStats?.cashSales || 0)}
                    </div>
                  </div>
                  
                  <div>
                    <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>Ventes mobiles:</span>
                    <div style={{ fontWeight: '600', color: '#3b82f6' }}>
                      {formatCurrency(sessionStats?.cardSales || 0)}
                    </div>
                  </div>
                  
                  <div>
                    <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>Crédits:</span>
                    <div style={{ fontWeight: '600', color: '#f59e0b' }}>
                      {formatCurrency(sessionStats?.creditSales || 0)}
                    </div>
                  </div>
                </div>
                
                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isDark ? '#f7fafc' : '#1a202c'
                  }}>
                    💰 Montant attendu:
                  </span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#10b981'
                  }}>
                    {formatCurrency((cashSession?.initialAmount || 0) + (sessionStats?.cashSales || 0))}
                  </span>
                </div>
              </div>
              
              {/* Champs de fermeture */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: isDark ? '#f7fafc' : '#1a202c',
                    marginBottom: '4px'
                  }}>
                    Montant réel en caisse
                  </label>
                  <input
                    type="number"
                    placeholder={`Attendu: ${formatCurrency((cashSession?.initialAmount || 0) + (sessionStats?.cashSales || 0))}`}
                    value={closingAmount}
                    onChange={(e) => setClosingAmount(e.target.value)}
                    style={{
                      padding: '12px',
                      border: `2px solid ${
                        closingAmount && Math.abs(parseFloat(closingAmount) - ((cashSession?.initialAmount || 0) + (sessionStats?.cashSales || 0))) > 100
                          ? '#ef4444' // Rouge si écart important
                          : isDark ? '#4a5568' : '#d1d5db'
                      }`,
                      borderRadius: '8px',
                      background: isDark ? '#374151' : 'white',
                      color: isDark ? '#f7fafc' : '#374151',
                      width: '180px',
                      fontSize: '14px'
                    }}
                  />
                  
                  {/* Indicateur d'écart */}
                  {closingAmount && (
                    <div style={{
                      marginTop: '4px',
                      fontSize: '12px',
                      color: Math.abs(parseFloat(closingAmount) - ((cashSession?.initialAmount || 0) + (sessionStats?.cashSales || 0))) > 100 
                        ? '#ef4444' 
                        : '#10b981'
                    }}>
                      Écart: {formatCurrency(parseFloat(closingAmount) - ((cashSession?.initialAmount || 0) + (sessionStats?.cashSales || 0)))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleCloseCashSession(parseFloat(closingAmount))}
                  style={{
                    ...baseStyles.button.primary,
                    background: '#ef4444',
                    opacity: closingAmount ? 1 : 0.5,
                    cursor: closingAmount ? 'pointer' : 'not-allowed'
                  }}
                  disabled={!closingAmount}
                >
                  🔒 Fermer Caisse
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interface principale */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
        {/* Panneau produits */}
        <div style={baseStyles.card}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: isDark ? '#f7fafc' : '#1a202c',
            marginBottom: '16px'
          }}>
            Produits
          </h2>
          
          {/* Recherche */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${isDark ? '#4a5568' : '#d1d5db'}`,
                borderRadius: '8px',
                background: isDark ? '#374151' : 'white',
                color: isDark ? '#f7fafc' : '#374151'
              }}
            />
          </div>
          
          {/* Grille de produits */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => isCashSessionActive && handleAddToCart(product)}
                style={{
                  padding: '16px',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  background: isDark ? '#374151' : '#f9fafb',
                  cursor: isCashSessionActive ? 'pointer' : 'not-allowed',
                  opacity: isCashSessionActive ? 1 : 0.5,
                  textAlign: 'center',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (isCashSessionActive) {
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDark ? '#f7fafc' : '#1a202c',
                  marginBottom: '8px'
                }}>
                  {product.name}
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#3b82f6'
                }}>
                  {formatCurrency(product.price)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panneau panier */}
        <div style={baseStyles.card}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: isDark ? '#f7fafc' : '#1a202c',
              margin: 0
            }}>
              Panier ({cartStats.itemCount})
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                style={{...baseStyles.button.secondary, padding: '8px 12px'}}
              >
                Vider
              </button>
            )}
          </div>

          {/* Sélection client */}
          <div style={{ marginBottom: '16px' }}>
            <select
              value={selectedCustomer?.id || 1}
              onChange={(e) => {
                const customer = customers?.find(c => c.id === parseInt(e.target.value));
                setSelectedCustomer(customer);
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${isDark ? '#4a5568' : '#d1d5db'}`,
                borderRadius: '8px',
                background: isDark ? '#374151' : 'white',
                color: isDark ? '#f7fafc' : '#374151'
              }}
            >
              {customers?.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Articles du panier */}
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            marginBottom: '16px'
          }}>
            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: isDark ? '#a0aec0' : '#64748b',
                padding: '40px 0'
              }}>
                <ShoppingCart size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p>Panier vide</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: isDark ? '#f7fafc' : '#1a202c'
                    }}>
                      {item.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: isDark ? '#a0aec0' : '#64748b'
                    }}>
                      {formatCurrency(item.price)} × {item.quantity}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <button
                      onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                      style={{
                        background: isDark ? '#374151' : '#f1f5f9',
                        border: 'none',
                        borderRadius: '4px',
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
                      minWidth: '30px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: isDark ? '#f7fafc' : '#1a202c'
                    }}>
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                      style={{
                        background: isDark ? '#374151' : '#f1f5f9',
                        border: 'none',
                        borderRadius: '4px',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={12} />
                    </button>
                    
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Résumé */}
          {cart.length > 0 && (
            <>
              <div style={{
                padding: '16px 0',
                borderTop: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>
                    Sous-total
                  </span>
                  <span style={{ color: isDark ? '#f7fafc' : '#1a202c' }}>
                    {formatCurrency(cartStats.subtotal)}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>
                    TVA (18%)
                  </span>
                  <span style={{ color: isDark ? '#f7fafc' : '#1a202c' }}>
                    {formatCurrency(cartStats.taxAmount)}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  <span style={{ color: isDark ? '#f7fafc' : '#1a202c' }}>
                    Total
                  </span>
                  <span style={{ color: '#10b981' }}>
                    {formatCurrency(cartStats.total)}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={!canProcessSale}
                style={{
                  ...baseStyles.button.primary,
                  width: '100%',
                  background: canProcessSale ? '#10b981' : isDark ? '#374151' : '#f1f5f9',
                  color: canProcessSale ? 'white' : isDark ? '#a0aec0' : '#64748b',
                  cursor: canProcessSale ? 'pointer' : 'not-allowed'
                }}
              >
                <CreditCard size={16} style={{ marginRight: '8px' }} />
                Paiement
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal de paiement */}
      {/* Modal de paiement intelligente */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentAmount('');
          }}
          cartStats={cartStats}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          onSubmit={handlePayment}
          isDark={isDark}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Debug Info */}
      <div style={{
        ...baseStyles.card,
        marginTop: '20px',
        fontSize: '12px',
        color: isDark ? '#a0aec0' : '#64748b'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: isDark ? '#f7fafc' : '#1a202c',
          marginBottom: '12px'
        }}>
          Debug Info (Mode Test)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <strong>Caisse:</strong> {isCashSessionActive ? 'Ouverte' : 'Fermée'}
          </div>
          <div>
            <strong>Articles panier:</strong> {cart.length}
          </div>
          <div>
            <strong>Client sélectionné:</strong> {selectedCustomer?.name || 'Aucun'}
          </div>
          <div>
            <strong>Mode paiement:</strong> {paymentMethod}
          </div>
          <div>
            <strong>Peut vendre:</strong> {canProcessSale ? 'Oui' : 'Non'}
          </div>
          <div>
            <strong>Produits disponibles:</strong> {globalProducts?.length || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPOSANT MODAL DE PAIEMENT INTELLIGENTE ====================

const PaymentModal = ({
  isOpen,
  onClose,
  cartStats,
  paymentMethod,
  setPaymentMethod,
  paymentAmount,
  setPaymentAmount,
  onSubmit,
  isDark,
  formatCurrency
}) => {
  if (!isOpen) return null;

  const change = paymentMethod === 'cash' && paymentAmount 
    ? Math.max(0, parseFloat(paymentAmount) - cartStats.total)
    : 0;

  const canSubmit = 
    paymentMethod === 'cash' 
      ? paymentAmount && parseFloat(paymentAmount) >= cartStats.total
      : true;

  // Suggestions intelligentes de montants
  const smartSuggestions = useMemo(() => {
    const total = cartStats.total;
    const suggestions = [];
    
    // Montant exact
    suggestions.push({ label: 'Exact', amount: total });
    
    // Arrondir à la dizaine supérieure
    const nextTen = Math.ceil(total / 10) * 10;
    if (nextTen > total) {
      suggestions.push({ label: `${nextTen} FCFA`, amount: nextTen });
    }
    
    // Suggestions fixes populaires
    const popularAmounts = [1000, 2000, 5000, 10000, 20000];
    popularAmounts.forEach(amount => {
      if (amount > total && !suggestions.find(s => s.amount === amount)) {
        suggestions.push({ label: `${amount.toLocaleString()} FCFA`, amount });
      }
    });
    
    return suggestions.slice(0, 4); // Limiter à 4 suggestions
  }, [cartStats.total]);

  // Pavé numérique
  const handleNumberPad = (digit) => {
    if (digit === 'clear') {
      setPaymentAmount('');
    } else if (digit === 'backspace') {
      setPaymentAmount(prev => prev.slice(0, -1));
    } else {
      setPaymentAmount(prev => prev + digit);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: isDark ? '#2d3748' : 'white',
        borderRadius: '16px',
        padding: '32px',
        width: '550px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: isDark ? '#f7fafc' : '#1a202c',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          💳 Paiement
        </h2>

        {/* Total à payer */}
        <div style={{
          background: isDark ? '#374151' : '#f8fafc',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '14px',
            color: isDark ? '#a0aec0' : '#64748b',
            marginBottom: '8px'
          }}>
            Total à payer
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#10b981'
          }}>
            {formatCurrency(cartStats.total)}
          </div>
        </div>

        {/* Mode de paiement */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '16px',
            fontWeight: '600',
            color: isDark ? '#f7fafc' : '#1a202c',
            marginBottom: '12px'
          }}>
            Mode de paiement
          </label>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px'
          }}>
            {[
              { method: 'cash', icon: '💵', label: 'Espèces' },
              { method: 'card', icon: '📱', label: 'Mobile' },
              { method: 'credit', icon: '📋', label: 'Crédit' }
            ].map(({ method, icon, label }) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                style={{
                  padding: '16px 12px',
                  border: `2px solid ${paymentMethod === method ? '#3b82f6' : (isDark ? '#4a5568' : '#e2e8f0')}`,
                  borderRadius: '12px',
                  background: paymentMethod === method 
                    ? isDark ? '#374151' : '#eff6ff'
                    : isDark ? '#2d3748' : 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  {icon}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDark ? '#f7fafc' : '#1a202c'
                }}>
                  {label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section espèces avec suggestions et pavé */}
        {paymentMethod === 'cash' && (
          <div style={{ marginBottom: '24px' }}>
            {/* Suggestions intelligentes */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#f7fafc' : '#1a202c',
                marginBottom: '8px'
              }}>
                💡 Suggestions rapides
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}>
                {smartSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setPaymentAmount(suggestion.amount.toString())}
                    style={{
                      padding: '12px',
                      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      background: isDark ? '#374151' : '#f9fafb',
                      color: isDark ? '#f7fafc' : '#1a202c',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = isDark ? '#4a5568' : '#e2e8f0';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = isDark ? '#374151' : '#f9fafb';
                    }}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Champ montant et pavé numérique */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 200px',
              gap: '16px'
            }}>
              {/* Champ montant */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDark ? '#f7fafc' : '#1a202c',
                  marginBottom: '8px'
                }}>
                  Montant reçu
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: `2px solid ${
                      paymentAmount && parseFloat(paymentAmount) >= cartStats.total 
                        ? '#10b981' 
                        : isDark ? '#4a5568' : '#d1d5db'
                    }`,
                    borderRadius: '12px',
                    background: isDark ? '#374151' : 'white',
                    color: isDark ? '#f7fafc' : '#1a202c',
                    fontSize: '18px',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}
                  autoFocus
                />
              </div>

              {/* Pavé numérique compact */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDark ? '#f7fafc' : '#1a202c',
                  marginBottom: '8px'
                }}>
                  🔢 Pavé
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '4px'
                }}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '⌫', 'C'].map((digit) => (
                    <button
                      key={digit}
                      onClick={() => handleNumberPad(
                        digit === '⌫' ? 'backspace' : digit === 'C' ? 'clear' : digit
                      )}
                      style={{
                        padding: '8px',
                        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                        borderRadius: '6px',
                        background: isDark ? '#374151' : 'white',
                        color: isDark ? '#f7fafc' : '#1a202c',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        minHeight: '32px'
                      }}
                    >
                      {digit}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Monnaie à rendre */}
            {change > 0 && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                background: isDark ? '#065f46' : '#d1fae5',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#10b981',
                  marginBottom: '4px'
                }}>
                  💰 Monnaie à rendre
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#10b981'
                }}>
                  {formatCurrency(change)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              onClose();
              setPaymentAmount('');
            }}
            style={{
              flex: 1,
              padding: '16px',
              background: 'transparent',
              border: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
              borderRadius: '12px',
              color: isDark ? '#f7fafc' : '#1a202c',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ❌ Annuler
          </button>
          
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            style={{
              flex: 2,
              padding: '16px',
              background: canSubmit ? '#10b981' : isDark ? '#374151' : '#f1f5f9',
              color: canSubmit ? 'white' : isDark ? '#a0aec0' : '#64748b',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            ✅ Valider la vente
          </button>
        </div>
      </div>
    </div>
  );
};
export default TestPOSModule;
