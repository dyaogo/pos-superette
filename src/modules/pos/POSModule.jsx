import React, { useState, useRef, useCallback } from 'react';
import { 
  Search, ShoppingCart, CreditCard, DollarSign, Smartphone, 
  Package, User, X, Check, Scan, Plus, Minus, Trash2, Eye
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useResponsive } from '../../components/ResponsiveComponents';
import toast from 'react-hot-toast';

// Import des hooks personnalisés EXISTANTS
import { 
  useCart, 
  useProductSearch, 
  useCategories, 
  useKeyboardShortcuts 
} from '../../hooks';

const POSModule = () => {
  const { 
    globalProducts, 
    processSale, 
    customers, 
    appSettings 
  } = useApp();
  
  const { isMobile } = useResponsive();
  
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
  
  // États de paiement - CORRECTION: Utiliser useRef pour éviter les re-renders
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const amountReceivedRef = useRef('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [notes, setNotes] = useState('');
  
  // Références
  const searchInputRef = useRef(null);
  const amountInputRef = useRef(null);

  const isDark = appSettings.darkMode;

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
      }
    },
    {
      key: 'Enter',
      action: () => {
        if (searchQuery && filteredProducts.length > 0) {
          addToCart(filteredProducts[0]);
          setSearchQuery('');
        }
      }
    }
  ], [cart.length, searchQuery, showPaymentModal, showScanner, filteredProducts]);

  // ==================== GESTION PAIEMENT ====================
  // CORRECTION: Fonction pour éviter la perte de focus
  const handleAmountChange = useCallback((e) => {
    const value = e.target.value;
    amountReceivedRef.current = value;
    setAmountDisplay(value);
  }, []);

  // CORRECTION: Fonction processSale corrigée
  const handleCheckout = useCallback(() => {
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

    // CORRECTION: Structure de données correcte pour processSale
    const saleData = {
      items: cart.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity
      })),
      total: cartStats.finalTotal,
      tax: cartStats.totalTax,
      paymentMethod,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      notes,
      amountReceived: paymentMethod === 'cash' ? amountReceived : cartStats.finalTotal,
      change: paymentMethod === 'cash' ? Math.max(0, amountReceived - cartStats.finalTotal) : 0,
      date: new Date().toISOString()
    };

    try {
      // CORRECTION: Appel direct de processSale
      processSale(saleData);
      
      // Réinitialiser TOUS les états
      clearCart();
      setShowPaymentModal(false);
      amountReceivedRef.current = '';
      setAmountDisplay('');
      setNotes('');
      setPaymentMethod('cash');
      
      // CORRECTION: Toast qui s'estompe automatiquement
      toast.success(
        `✅ Vente confirmée! Total: ${cartStats.finalTotal.toLocaleString()} ${appSettings.currency}`, 
        { 
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#10b981',
            color: 'white',
            fontWeight: '600'
          }
        }
      );
      
      if (paymentMethod === 'cash' && amountReceived > cartStats.finalTotal) {
        toast.info(
          `💰 Monnaie à rendre: ${(amountReceived - cartStats.finalTotal).toLocaleString()} ${appSettings.currency}`, 
          { 
            duration: 6000,
            position: 'top-center',
            style: {
              background: '#3b82f6',
              color: 'white'
            }
          }
        );
      }
      
    } catch (error) {
      console.error('Erreur lors de la vente:', error);
      toast.error('Erreur lors de la vente: ' + error.message, {
        duration: 5000
      });
    }
  }, [cart, cartStats, paymentMethod, selectedCustomer, notes, processSale, appSettings.currency, clearCart]);

  // ==================== COMPOSANTS UI ====================
  const ProductCard = ({ product }) => (
    <div
      onClick={() => addToCart(product)}
      style={{
        background: isDark ? '#374151' : 'white',
        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
        borderRadius: '12px',
        padding: '16px',
        cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        opacity: product.stock === 0 ? 0.6 : 1
      }}
      onMouseEnter={(e) => {
        if (product.stock > 0) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
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

  // ==================== RENDU PRINCIPAL ====================
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
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
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
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                border: `2px solid ${searchQuery ? '#3b82f6' : (isDark ? '#4a5568' : '#e2e8f0')}`,
                borderRadius: '12px',
                fontSize: '16px',
                background: isDark ? '#374151' : 'white',
                color: isDark ? '#f7fafc' : '#1f2937',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          {/* Catégories */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
              borderRadius: '8px',
              background: isDark ? '#374151' : 'white',
              color: isDark ? '#f7fafc' : '#1f2937',
              fontSize: '14px'
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
        {/* Header Panier */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: isDark ? '#f7fafc' : '#1f2937',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <ShoppingCart size={20} />
            Panier
          </h2>
          <div style={{
            fontSize: '14px',
            color: isDark ? '#a0aec0' : '#6b7280',
            marginTop: '4px',
            textAlign: 'center'
          }}>
            {cartStats.totalItems} article{cartStats.totalItems > 1 ? 's' : ''}
          </div>
        </div>

        {/* Items du panier */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px'
        }}>
          {cart.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: isDark ? '#a0aec0' : '#6b7280'
            }}>
              <ShoppingCart size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p>Panier vide</p>
              <p style={{ fontSize: '12px' }}>Cliquez sur un produit pour l'ajouter</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer Panier */}
        {cart.length > 0 && (
          <div style={{
            padding: '24px',
            borderTop: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
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
              onClick={() => setShowPaymentModal(true)}
              style={{
                width: '100%',
                padding: '16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '8px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#059669'}
              onMouseLeave={(e) => e.target.style.background = '#10b981'}
            >
              <CreditCard size={20} />
              Finaliser la vente (F3)
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

      {/* Modal de paiement */}
      {showPaymentModal && (
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

            {/* Méthodes de paiement */}
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
                  { id: 'card', label: 'Carte', icon: CreditCard },
                  { id: 'mobile', label: 'Mobile', icon: Smartphone }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    style={{
                      padding: '12px',
                      border: `2px solid ${paymentMethod === method.id ? '#3b82f6' : (isDark ? '#4a5568' : '#e2e8f0')}`,
                      borderRadius: '8px',
                      background: paymentMethod === method.id ? '#3b82f6' : 'transparent',
                      color: paymentMethod === method.id ? 'white' : (isDark ? '#f7fafc' : '#1f2937'),
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    <method.icon size={16} />
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CORRECTION: Montant reçu avec ref pour éviter perte de focus */}
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
                <input
                  ref={amountInputRef}
                  type="number"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  placeholder="0"
                  min="0"
                  step="100"
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
                      `✅ Monnaie à rendre: ${Math.max(0, parseFloat(amountDisplay) - cartStats.finalTotal).toLocaleString()} ${appSettings.currency}`
                    ) : (
                      `❌ Manque: ${(cartStats.finalTotal - parseFloat(amountDisplay)).toLocaleString()} ${appSettings.currency}`
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: isDark ? '#f7fafc' : '#374151'
              }}>
                Notes (optionnel)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajouter une note..."
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
              />
            </div>

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

     {/* Affichage des raccourcis en mode développement */}
     {process.env.NODE_ENV === 'development' && !isMobile && (
       <div style={{
         position: 'fixed',
         bottom: '16px',
         left: '20px',
         background: 'rgba(0,0,0,0.8)',
         color: 'white',
         padding: '8px 16px',
         borderRadius: '8px',
         fontSize: '12px',
         display: 'flex',
         gap: '16px',
         pointerEvents: 'none',
         zIndex: 100
       }}>
         <span>F1: Vider</span>
         <span>F2: Recherche</span>
         <span>F3: Payer</span>
         <span>ESC: Annuler</span>
       </div>
     )}
   </div>
 );
};

export default POSModule;
