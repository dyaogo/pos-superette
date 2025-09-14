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
 * Module POS Principal - Système avec correction de la monnaie à rendre
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

  // Styles de base
  const styles = {
    container: {
      display: 'grid',
      gridTemplateColumns: '1fr 400px',
      gap: '20px',
      padding: '20px',
      minHeight: '100vh',
      background: isDark ? '#111827' : '#f8fafc',
      color: isDark ? '#f7fafc' : '#1a202c'
    },
    card: {
      background: isDark ? '#1f2937' : 'white',
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    button: {
      primary: {
        padding: '12px 20px',
        background: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      },
      secondary: {
        padding: '12px 20px',
        background: 'transparent',
        color: isDark ? '#d1d5db' : '#6b7280',
        border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer'
      }
    }
  };

  // Fonction pour calculer si le paiement peut être validé
  const canSubmitPayment = useCallback(() => {
    switch (paymentMethod) {
      case 'cash':
        return paymentAmount && parseFloat(paymentAmount) >= cartStats.total;
      case 'card':
      case 'mobile':
        return true;
      case 'credit':
        return selectedCustomer && selectedCustomer.id !== 1;
      default:
        return false;
    }
  }, [paymentMethod, paymentAmount, cartStats.total, selectedCustomer]);

  // Produits filtrés
  const filteredProducts = useMemo(() => {
    let products = globalProducts || [];
    
    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      products = products.filter(p => p.category === selectedCategory);
    }
    
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }
    
    return products;
  }, [globalProducts, selectedCategory, searchQuery]);

  // Catégories pour les filtres
  const categories = useMemo(() => {
    const categoryList = [{ name: 'all', label: 'Toutes', count: globalProducts?.length || 0 }];
    const categoryMap = new Map();
    
    globalProducts?.forEach(product => {
      const category = product.category || 'Sans catégorie';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    categoryMap.forEach((count, category) => {
      categoryList.push({ name: category, label: category, count });
    });
    
    return categoryList;
  }, [globalProducts]);

  // Gestionnaire de paiement
  const handlePayment = async () => {
    if (!canSubmitPayment()) {
      toast.error('Paiement incomplet');
      return;
    }

    const paymentData = {
      paymentMethod,
      amountReceived: paymentMethod === 'cash' ? parseFloat(paymentAmount) : cartStats.total,
      change: paymentMethod === 'cash' ? Math.max(0, parseFloat(paymentAmount) - cartStats.total) : 0,
      customer: selectedCustomer
    };
    
    try {
      const result = await handleProcessSale(paymentData);
      
      if (result.success) {
        setPaymentAmount('');
        setShowPaymentModal(false);
        toast.success('Vente enregistrée avec succès');
      }
    } catch (error) {
      toast.error('Erreur lors du traitement de la vente');
      console.error('Erreur paiement:', error);
    }
  };

  // Interface principale
  return (
    <div style={styles.container}>
      {/* Section principale - Liste des produits */}
      <div style={styles.card}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: isDark ? '#f7fafc' : '#1a202c',
            margin: 0
          }}>
            Point de Vente
          </h1>
          
          {/* Statut caisse */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '20px',
            background: isCashSessionActive 
              ? isDark ? '#065f46' : '#d1fae5'
              : isDark ? '#7c2d12' : '#fef2f2'
          }}>
            {isCashSessionActive ? (
              <CheckCircle size={16} color="#10b981" />
            ) : (
              <AlertCircle size={16} color="#ef4444" />
            )}
            <span style={{
              fontSize: '12px',
              fontWeight: '500',
              color: isCashSessionActive ? '#10b981' : '#ef4444'
            }}>
              {isCashSessionActive ? 'Caisse ouverte' : 'Caisse fermée'}
            </span>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isDark ? '#9ca3af' : '#6b7280'
              }} />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: `1px solid ${isDark ? '#4a5568' : '#d1d5db'}`,
                  borderRadius: '8px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f7fafc' : '#374151',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '12px',
              border: `1px solid ${isDark ? '#4a5568' : '#d1d5db'}`,
              borderRadius: '8px',
              background: isDark ? '#374151' : 'white',
              color: isDark ? '#f7fafc' : '#374151',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.label} ({cat.count})
              </option>
            ))}
          </select>
        </div>

        {/* Grille des produits */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          {filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => handleAddToCart(product)}
              style={{
                padding: '16px',
                border: `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: isDark ? '#374151' : 'white'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDark ? '#f7fafc' : '#1a202c',
                  margin: 0
                }}>
                  {product.name}
                </h3>
                <span style={{
                  fontSize: '12px',
                  color: isDark ? '#9ca3af' : '#6b7280'
                }}>
                  Stock: {product.stock || 0}
                </span>
              </div>
              
              <p style={{
                fontSize: '12px',
                color: isDark ? '#d1d5db' : '#6b7280',
                margin: '4px 0'
              }}>
                {product.category} • {product.sku}
              </p>
              
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#10b981'
              }}>
                {formatCurrency(product.price)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section droite - Panier et caisse */}
      <div style={styles.card}>
        {/* Informations session */}
        <div style={{
          background: isDark ? '#374151' : '#f8fafc',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: isDark ? '#d1d5db' : '#6b7280'
          }}>
            <span>Session: #{cashSession?.id || 'N/A'}</span>
            <span>Articles: {cart.length}</span>
          </div>
        </div>

        {/* Sélection client */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: isDark ? '#e5e7eb' : '#374151'
          }}>
            <User size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Client
          </label>
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const customer = customers.find(c => c.id === parseInt(e.target.value));
              setSelectedCustomer(customer);
            }}
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${isDark ? '#4a5568' : '#d1d5db'}`,
              borderRadius: '8px',
              background: isDark ? '#374151' : 'white',
              color: isDark ? '#f7fafc' : '#374151',
              fontSize: '14px'
            }}
          >
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        {/* Articles du panier */}
        <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          marginBottom: '16px'
        }}>
          {cart.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: isDark ? '#9ca3af' : '#6b7280'
            }}>
              <ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p>Panier vide</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                }}
              >
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
                    color: isDark ? '#9ca3af' : '#6b7280'
                  }}>
                    {formatCurrency(item.price)} × {item.quantity}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                    style={{
                      padding: '4px',
                      background: isDark ? '#4a5568' : '#e5e7eb',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Minus size={12} />
                  </button>
                  
                  <span style={{
                    minWidth: '20px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {item.quantity}
                  </span>
                  
                  <button
                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                    style={{
                      padding: '4px',
                      background: isDark ? '#4a5568' : '#e5e7eb',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={12} />
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
                      marginLeft: '4px'
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Résumé du panier */}
        {cart.length > 0 && (
          <>
            <div style={{
              background: isDark ? '#374151' : '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px'
              }}>
                <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>
                  Sous-total
                </span>
                <span style={{ color: isDark ? '#f7fafc' : '#1a202c' }}>
                  {formatCurrency(cartStats.subtotal)}
                </span>
              </div>
              
              {cartStats.taxAmount > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}>
                  <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>
                    TVA ({appSettings.taxRate || 0}%)
                  </span>
                  <span style={{ color: isDark ? '#f7fafc' : '#1a202c' }}>
                    {formatCurrency(cartStats.taxAmount)}
                  </span>
                </div>
              )}
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: '700',
                borderTop: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                paddingTop: '8px',
                marginTop: '8px'
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
              disabled={!canProcessSale || !isCashSessionActive}
              style={{
                ...styles.button.primary,
                width: '100%',
                background: (canProcessSale && isCashSessionActive) 
                  ? '#10b981' 
                  : isDark ? '#374151' : '#f1f5f9',
                color: (canProcessSale && isCashSessionActive) 
                  ? 'white' 
                  : isDark ? '#a0aec0' : '#64748b',
                cursor: (canProcessSale && isCashSessionActive) 
                  ? 'pointer' 
                  : 'not-allowed'
              }}
            >
              <CreditCard size={16} />
              {!isCashSessionActive ? 'Caisse fermée' : 'Paiement'}
            </button>
          </>
        )}
      </div>

      {/* Modal de paiement avec correction de la monnaie */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
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
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: isDark ? '#f7fafc' : '#1a202c',
                margin: 0
              }}>
                💳 Paiement
              </h3>
              
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Résumé de la commande */}
            <div style={{
              background: isDark ? '#374151' : '#f8fafc',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                <span style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                  Total à payer
                </span>
                <span style={{ color: '#3b82f6' }}>
                  {formatCurrency(cartStats.total)}
                </span>
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
                      transition: 'all 0.2s',
                      fontSize: '12px'
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

            {/* SECTION MONTANT REÇU POUR ESPÈCES AVEC CORRECTION MONNAIE */}
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
                </label>
                <input
                  type="number"
                  placeholder="Saisir le montant reçu..."
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDark ? '#4a5568' : '#d1d5db'}`,
                    borderRadius: '8px',
                    background: isDark ? '#374151' : 'white',
                    color: isDark ? '#f7fafc' : '#374151',
                    fontSize: '16px',
                    textAlign: 'center'
                  }}
                  autoFocus
                />

                {/* SECTION MONNAIE CORRIGÉE - S'affiche dès qu'un montant est saisi */}
                {paymentAmount && parseFloat(paymentAmount) > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    
                    {/* Résumé des montants */}
                    <div style={{
                      padding: '12px',
                      background: isDark ? '#374151' : '#f8fafc',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <span style={{ 
                          color: isDark ? '#d1d5db' : '#374151', 
                          fontSize: '14px' 
                        }}>
                          Total à payer
                        </span>
                        <span style={{ 
                          color: '#3b82f6', 
                          fontSize: '16px', 
                          fontWeight: '600' 
                        }}>
                          {formatCurrency(cartStats.total)}
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ 
                          color: isDark ? '#d1d5db' : '#374151', 
                          fontSize: '14px' 
                        }}>
                          Montant reçu
                        </span>
                        <span style={{ 
                          color: isDark ? '#f7fafc' : '#1a202c', 
                          fontSize: '16px', 
                          fontWeight: '600' 
                        }}>
                          {formatCurrency(parseFloat(paymentAmount))}
                        </span>
                      </div>
                    </div>
                    
                    {/* Affichage conditionnel de la monnaie ou du manquant */}
                    {parseFloat(paymentAmount) >= cartStats.total ? (
                      // MONNAIE À RENDRE
                      <div style={{
                        padding: '16px',
                        background: isDark ? '#065f46' : '#d1fae5',
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: '2px solid #10b981'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#10b981',
                          marginBottom: '8px',
                          fontWeight: '500'
                        }}>
                          💰 Monnaie à rendre
                        </div>
                        <div style={{
                          fontSize: '28px',
                          fontWeight: '700',
                          color: '#10b981'
                        }}>
                          {formatCurrency(parseFloat(paymentAmount) - cartStats.total)}
                        </div>
                      </div>
                    ) : (
                      // MONTANT INSUFFISANT
                      <div style={{
                        padding: '16px',
                        background: isDark ? '#7c2d12' : '#fef2f2',
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: '2px solid #ef4444'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#ef4444',
                          marginBottom: '8px',
                          fontWeight: '500'
                        }}>
                          ⚠️ Montant insuffisant
                        </div>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: '700',
                          color: '#ef4444'
                        }}>
                          Manque: {formatCurrency(cartStats.total - parseFloat(paymentAmount))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Montants suggérés */}
                <div style={{
                  marginTop: '16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px'
                }}>
                  {[1000, 5000, 10000, 20000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setPaymentAmount(amount.toString())}
                      style={{
                        padding: '8px 4px',
                        border: `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}`,
                        borderRadius: '6px',
                        background: isDark ? '#374151' : 'white',
                        color: isDark ? '#f7fafc' : '#374151',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>

                {/* Bouton montant exact */}
                <button
                  onClick={() => setPaymentAmount(cartStats.total.toString())}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '10px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  💯 Montant exact
                </button>
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
                <span style={{ 
                  color: isDark ? '#fbbf24' : '#92400e', 
                  fontSize: '14px' 
                }}>
                  Cette vente sera enregistrée comme crédit pour {selectedCustomer?.name || 'le client'}
                </span>
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
                onClick={handlePayment}
                disabled={!canSubmitPayment()}
                style={{
                  flex: 2,
                  padding: '16px',
                  background: canSubmitPayment() ? '#10b981' : isDark ? '#374151' : '#f1f5f9',
                  color: canSubmitPayment() ? 'white' : isDark ? '#a0aec0' : '#64748b',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: canSubmitPayment() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle size={16} />
                {canSubmitPayment() ? 'Confirmer Paiement' : 'Paiement incomplet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raccourcis clavier - Info */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 999
      }}>
        <button
          onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
          style={{
            padding: '12px',
            background: isDark ? '#1f2937' : 'white',
            color: isDark ? '#f7fafc' : '#1a202c',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <Keyboard size={20} />
        </button>
        
        {showShortcutsHelp && (
          <div style={{
            position: 'absolute',
            bottom: '60px',
            right: '0',
            background: isDark ? '#1f2937' : 'white',
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            minWidth: '200px'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '12px',
              color: isDark ? '#f7fafc' : '#1a202c'
            }}>
              Raccourcis clavier
            </h4>
            <div style={{
              fontSize: '12px',
              color: isDark ? '#d1d5db' : '#6b7280',
              lineHeight: '1.5'
            }}>
              <div><strong>F1</strong> : Vider panier</div>
              <div><strong>F3</strong> : Paiement</div>
              <div><strong>Esc</strong> : Fermer modal</div>
              <div><strong>Enter</strong> : Confirmer</div>
            </div>
          </div>
        )}
      </div>

      {/* Gestion des raccourcis clavier */}
      {typeof window !== 'undefined' && (
        <div style={{ display: 'none' }}>
          {window.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
              e.preventDefault();
              if (window.confirm('Vider le panier ?')) {
                clearCart();
              }
            } else if (e.key === 'F3') {
              e.preventDefault();
              if (canProcessSale && isCashSessionActive) {
                setShowPaymentModal(true);
              }
            } else if (e.key === 'Escape') {
              e.preventDefault();
              if (showPaymentModal) {
                setShowPaymentModal(false);
                setPaymentAmount('');
              }
            } else if (e.key === 'Enter' && showPaymentModal) {
              e.preventDefault();
              if (canSubmitPayment()) {
                handlePayment();
              }
            }
          })}
        </div>
      )}
    </div>
  );
};

export default POSModule;
