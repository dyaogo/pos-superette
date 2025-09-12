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
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Montant de fermeture"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
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
                onClick={() => handleCloseCashSession(parseFloat(closingAmount))}
                style={{...baseStyles.button.primary, background: '#ef4444'}}
                disabled={!closingAmount}
              >
                Fermer Caisse
              </button>
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
            background: isDark ? '#2d3748' : 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: isDark ? '#f7fafc' : '#1a202c',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Paiement
            </h3>

            {/* Total */}
            <div style={{
              background: isDark ? '#374151' : '#f8fafc',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: isDark ? '#a0aec0' : '#64748b',
                marginBottom: '4px'
              }}>
                Total à payer
              </div>
              <div style={{
                fontSize: '24px',
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
                fontSize: '14px',
                fontWeight: '500',
                color: isDark ? '#f7fafc' : '#1a202c',
                marginBottom: '12px'
              }}>
                Mode de paiement
              </label>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px'
              }}>
                {['cash', 'card', 'credit'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    style={{
                      padding: '12px',
                      border: `2px solid ${paymentMethod === method ? '#3b82f6' : (isDark ? '#4a5568' : '#e2e8f0')}`,
                      borderRadius: '8px',
                      background: paymentMethod === method 
                        ? isDark ? '#374151' : '#eff6ff'
                        : isDark ? '#2d3748' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                      {method === 'cash' ? '💵' : method === 'card' ? '💳' : '📋'}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: isDark ? '#f7fafc' : '#1a202c'
                    }}>
                      {method === 'cash' ? 'Espèces' : method === 'card' ? 'Carte' : 'Crédit'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Montant reçu (espèces) */}
            {paymentMethod === 'cash' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isDark ? '#f7fafc' : '#1a202c',
                  marginBottom: '8px'
                }}>
                  Montant reçu
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Montant reçu du client"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDark ? '#4a5568' : '#d1d5db'}`,
                    borderRadius: '8px',
                    background: isDark ? '#374151' : 'white',
                    color: isDark ? '#f7fafc' : '#374151',
                    fontSize: '16px'
                  }}
                  autoFocus
                />
                
                {paymentAmount && parseFloat(paymentAmount) >= cartStats.total && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: isDark ? '#065f46' : '#d1fae5',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#10b981',
                      marginBottom: '4px'
                    }}>
                      Monnaie à rendre
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#10b981'
                    }}>
                      {formatCurrency(parseFloat(paymentAmount) - cartStats.total)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount('');
                }}
                style={{
                  flex: 1,
                  ...baseStyles.button.secondary
                }}
              >
                Annuler
              </button>
              
              <button
                onClick={handlePayment}
                disabled={paymentMethod === 'cash' && (!paymentAmount || parseFloat(paymentAmount) < cartStats.total)}
                style={{
                  flex: 2,
                  ...baseStyles.button.primary,
                  background: (paymentMethod === 'cash' && (!paymentAmount || parseFloat(paymentAmount) < cartStats.total))
                    ? isDark ? '#374151' : '#f1f5f9'
                    : '#10b981',
                  color: (paymentMethod === 'cash' && (!paymentAmount || parseFloat(paymentAmount) < cartStats.total))
                    ? isDark ? '#a0aec0' : '#64748b'
                    : 'white'
                }}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
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

export default TestPOSModule;
