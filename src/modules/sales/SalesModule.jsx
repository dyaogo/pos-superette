import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, CreditCard } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useResponsive, ProductGrid, ResponsiveModal } from '../../components/ResponsiveComponents';
const SalesModule = () => {
  const { globalProducts, processSale, customers, appSettings, addCredit } = useApp();
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [quickMode, setQuickMode] = useState(true); // Mode rapide par défaut

  const products = globalProducts;
  const isDark = appSettings.darkMode;

  const { deviceType, isMobile } = useResponsive();

  // Montants fréquents pour les paiements rapides
  const frequentAmounts = [500, 1000, 2000, 5000, 10000, 20000];

  // Calculer le total avec TVA
  useEffect(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * (appSettings.taxRate / 100);
    setTotal(subtotal + tax);
  }, [cart, appSettings.taxRate]);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F1 - Nouveau panier
      if (e.key === 'F1') {
        e.preventDefault();
        setCart([]);
        setSearchQuery('');
      }
      // F2 - Focus recherche
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('product-search')?.focus();
      }
      // F3 - Paiement rapide
      if (e.key === 'F3' && cart.length > 0) {
        e.preventDefault();
        setShowPaymentModal(true);
      }
      // Echap - Annuler
      if (e.key === 'Escape') {
        if (showPaymentModal) {
          setShowPaymentModal(false);
        } else if (cart.length > 0) {
          if (window.confirm('Vider le panier ?')) {
            setCart([]);
          }
        }
      }
      // Entrée - Ajouter le premier produit trouvé
      if (e.key === 'Enter' && searchQuery && !showPaymentModal) {
        e.preventDefault();
        const found = filteredProducts[0];
        if (found) {
          addToCart(found);
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, searchQuery, showPaymentModal]);

  // Styles optimisés
  const styles = {
    container: {
      display: 'grid',
      gridTemplateColumns: isMobile
        ? '1fr'
        : deviceType === 'tablet'
          ? '1fr 300px'
          : quickMode ? '2fr 1fr' : '1fr 400px',
      gap: '20px',
      padding: '20px',
      minHeight: 'calc(100vh - 80px)',
      background: isDark ? '#1a202c' : '#f7fafc'
    },
    productSection: {
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '8px',
      padding: quickMode ? '15px' : '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    quickActions: {
      display: 'flex',
      gap: '10px',
      marginBottom: '15px',
      padding: '10px',
      background: isDark ? '#374151' : '#f8fafc',
      borderRadius: '6px'
    },
    searchBar: {
      width: '100%',
      padding: '12px 40px 12px 15px',
      border: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      borderRadius: '8px',
      fontSize: '16px',
      marginBottom: '15px',
      background: isDark ? '#374151' : 'white',
      color: isDark ? '#f7fafc' : '#2d3748'
    },
    productGrid: {
      display: 'grid',
      gridTemplateColumns: quickMode ? 
        'repeat(auto-fill, minmax(120px, 1fr))' : 
        'repeat(auto-fill, minmax(150px, 1fr))',
      gap: quickMode ? '10px' : '15px'
    },
    productCard: {
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      borderRadius: '8px',
      padding: quickMode ? '10px' : '15px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
      background: isDark ? '#374151' : 'white'
    },
    cartSection: {
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      height: 'fit-content'
    },
    paymentShortcuts: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px',
      marginBottom: '15px'
    }
  };

  // Ajouter au panier (optimisé)
  const addToCart = (product) => {
    if (product.stock === 0) {
      alert('Produit en rupture de stock!');
      return;
    }
    
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert(`Stock insuffisant! Maximum: ${product.stock}`);
        return;
      }
      updateQuantity(product.id, 1);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // Mettre à jour quantité
  const updateQuantity = (id, change) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQuantity = Math.max(0, Math.min(item.quantity + change, product.stock));
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };

  // Calculer monnaie instantanément
  const calculateChange = (received) => {
    return received ? Math.max(0, parseFloat(received) - total) : 0;
  };

  // Finaliser la vente (optimisé)
  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    if (paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < total)) {
      alert('Montant reçu insuffisant!');
      return;
    }
    
    if (paymentMethod === 'credit' && selectedCustomer === 1) {
      alert('Sélectionnez un client pour vendre à crédit');
      return;
    }

    if (paymentMethod === 'credit') {
      // Créer le crédit
      const credit = addCredit(selectedCustomer, total, `Vente du ${new Date().toLocaleDateString('fr-FR')}`);
      alert(`Crédit créé!\\nMontant: ${total.toLocaleString()} ${appSettings.currency}\\nClient: ${customers.find(c => c.id === selectedCustomer)?.name}`);
    } else {
      // Vente normale
      const sale = processSale(
        cart, 
        paymentMethod, 
        paymentMethod === 'cash' ? parseFloat(amountReceived) : total,
        selectedCustomer
      );
      
      const change = paymentMethod === 'cash' ? sale.change : 0;
      alert(`Vente terminée!\\nReçu: ${sale.receiptNumber}${change > 0 ? `\\nMonnaie: ${change.toLocaleString()} ${appSettings.currency}` : ''}`);
    }
    
    // Reset
    setCart([]);
    setAmountReceived('');
    setShowPaymentModal(false);
    setPaymentMethod('cash');
    setSearchQuery('');
    document.getElementById('product-search')?.focus();
  };

  // Filtrer produits
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, quickMode ? 12 : 20); // Limiter l'affichage en mode rapide

  // Actions rapides
  const QuickActions = () => (
    <div style={styles.quickActions}>
      <button
        onClick={() => setQuickMode(!quickMode)}
        style={{
          padding: '6px 12px',
          background: quickMode ? '#3b82f6' : '#64748b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        {quickMode ? 'Mode Détaillé' : 'Mode Rapide'}
      </button>
      
      <button
        onClick={() => setCart([])}
        disabled={cart.length === 0}
        style={{
          padding: '6px 12px',
          background: cart.length > 0 ? '#ef4444' : '#94a3b8',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: cart.length > 0 ? 'pointer' : 'not-allowed'
        }}
      >
        Vider (F1)
      </button>
      
      <span style={{ 
        fontSize: '12px', 
        color: isDark ? '#a0aec0' : '#64748b',
        alignSelf: 'center'
      }}>
        F2: Recherche | F3: Payer | Entrée: Ajouter
      </span>
    </div>
  );

  // Raccourcis de paiement
  const PaymentShortcuts = () => (
    <div style={styles.paymentShortcuts}>
      {frequentAmounts.map(amount => (
        <button
          key={amount}
          onClick={() => setAmountReceived(amount.toString())}
          style={{
            padding: '8px 4px',
            background: amountReceived === amount.toString() ? '#3b82f6' : 'white',
            color: amountReceived === amount.toString() ? 'white' : '#1f2937',
            border: `1px solid ${amountReceived === amount.toString() ? '#3b82f6' : '#e5e7eb'}`,
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {amount.toLocaleString()}
        </button>
      ))}
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Section Produits */}
      <div style={styles.productSection}>
        <QuickActions />
        
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '15px', top: '12px' }} size={20} color="#94a3b8" />
          <input
            id="product-search"
            type="text"
            placeholder="Rechercher... (F2 pour focus, Entrée pour ajouter)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchBar}
            autoFocus
          />
        </div>

        <div style={styles.productGrid}>
          {filteredProducts.map(product => (
            <div
              key={product.id}
              style={styles.productCard}
              onClick={() => addToCart(product)}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: quickMode ? '24px' : '40px', marginBottom: '5px' }}>
                {product.image}
              </div>
              <div style={{ 
                fontSize: quickMode ? '12px' : '14px', 
                fontWeight: '600',
                marginBottom: '3px',
                color: isDark ? '#f7fafc' : '#2d3748'
              }}>
                {quickMode ? product.name.substring(0, 15) + (product.name.length > 15 ? '...' : '') : product.name}
              </div>
              <div style={{ 
                color: '#2563eb', 
                fontWeight: 'bold', 
                fontSize: quickMode ? '14px' : '16px'
              }}>
                {product.price} {appSettings.currency}
              </div>
              {!quickMode && (
                <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#64748b' }}>
                  Stock: {product.stock}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section Panier */}
      <div style={styles.cartSection}>
        <div style={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: isDark ? '#f7fafc' : '#2d3748'
        }}>
          <ShoppingCart size={20} />
          Panier ({cart.reduce((sum, item) => sum + item.quantity, 0)})
        </div>

        {cart.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '30px', 
            color: isDark ? '#a0aec0' : '#94a3b8' 
          }}>
            <ShoppingCart size={40} />
            <p style={{ marginTop: '10px', fontSize: '14px' }}>
              Panier vide<br/>
              <span style={{ fontSize: '12px' }}>F2 pour rechercher</span>
            </p>
          </div>
        ) : (
          <>
            {/* Articles du panier */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '250px', marginBottom: '15px' }}>
              {cart.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px',
                  borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  marginBottom: '8px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: isDark ? '#f7fafc' : '#2d3748' 
                    }}>
                      {item.name}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: isDark ? '#a0aec0' : '#64748b' 
                    }}>
                      {item.price} × {item.quantity} = {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      style={{
                        width: '24px', height: '24px',
                        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                        background: isDark ? '#374151' : 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      -
                    </button>
                    <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '14px' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      style={{
                        width: '24px', height: '24px',
                        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                        background: isDark ? '#374151' : 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => setCart(cart.filter(i => i.id !== item.id))}
                      style={{
                        width: '24px', height: '24px',
                        border: '1px solid #ef4444',
                        background: isDark ? '#374151' : 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#ef4444',
                        fontSize: '12px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ 
              paddingTop: '15px', 
              borderTop: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}` 
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '18px', 
                fontWeight: 'bold', 
                marginBottom: '15px',
                color: isDark ? '#f7fafc' : '#2d3748'
              }}>
                <span>Total:</span>
                <span style={{ color: '#3b82f6' }}>
                  {total.toLocaleString()} {appSettings.currency}
                </span>
              </div>
              
              <button
                onClick={() => setShowPaymentModal(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <CreditCard size={18} />
                Payer (F3)
              </button>
            </div>
          </>
        )}
      </div>

      {/* Sélection du client */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#718096' }}>Client</label>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(parseInt(e.target.value))}
          style={{
            width: '100%',
            padding: '8px',
            border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
            borderRadius: '6px',
            fontSize: '14px',
            background: isDark ? '#374151' : 'white',
            color: isDark ? '#f7fafc' : '#2d3748'
          }}
        >
          {customers.map(customer => (
            <option key={customer.id} value={customer.id}>
              {customer.name} {customer.points > 0 ? `(${customer.points} pts)` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Modal de paiement optimisé */}
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
            background: isDark ? '#2d3748' : 'white',
            padding: '25px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ 
              marginBottom: '20px', 
              color: isDark ? '#f7fafc' : '#2d3748',
              textAlign: 'center'
            }}>
              Paiement
            </h3>
            
            {/* Total affiché */}
            <div style={{ 
              marginBottom: '20px',
              textAlign: 'center',
              padding: '15px',
              background: isDark ? '#374151' : '#f8fafc',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                {total.toLocaleString()} {appSettings.currency}
              </div>
            </div>

            {/* Mode de paiement */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPaymentMethod('cash')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: paymentMethod === 'cash' ? '2px solid #3b82f6' : `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                    borderRadius: '6px',
                    background: paymentMethod === 'cash' ? '#eff6ff' : (isDark ? '#374151' : 'white'),
                    cursor: 'pointer'
                  }}
                >
                  Espèces
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: paymentMethod === 'card' ? '2px solid #3b82f6' : `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                    borderRadius: '6px',
                    background: paymentMethod === 'card' ? '#eff6ff' : (isDark ? '#374151' : 'white'),
                    cursor: 'pointer'
                  }}
                >
                  Carte
                </button>
                <button
                  onClick={() => setPaymentMethod('credit')}
                  disabled={selectedCustomer === 1}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: paymentMethod === 'credit' ? '2px solid #3b82f6' : `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                    borderRadius: '6px',
                    background: paymentMethod === 'credit' ? '#eff6ff' : (isDark ? '#374151' : 'white'),
                    cursor: selectedCustomer !== 1 ? 'pointer' : 'not-allowed',
                    opacity: selectedCustomer === 1 ? 0.5 : 1
                  }}
                >
                  Crédit
                </button>
              </div>
              {selectedCustomer === 1 && paymentMethod === 'credit' && (
                <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '5px' }}>
                  Sélectionnez un client pour vendre à crédit
                </p>
              )}
            </div>

            {/* Paiement en espèces */}
            {paymentMethod === 'cash' && (
              <div style={{ marginBottom: '20px' }}>
                <PaymentShortcuts />
                
                <input
                  type="number"
                  placeholder="Montant reçu"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                    borderRadius: '6px',
                    fontSize: '16px',
                    background: isDark ? '#374151' : 'white',
                    color: isDark ? '#f7fafc' : '#2d3748',
                    textAlign: 'center'
                  }}
                  autoFocus
                />
                
                {/* Calcul de monnaie en temps réel */}
                {amountReceived && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '10px', 
                    background: parseFloat(amountReceived) >= total ? '#f0fdf4' : '#fef2f2',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      color: parseFloat(amountReceived) >= total ? '#166534' : '#dc2626',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}>
                      {parseFloat(amountReceived) >= total ? 
                        `Monnaie: ${calculateChange(amountReceived).toLocaleString()} ${appSettings.currency}` :
                        `Manque: ${(total - parseFloat(amountReceived)).toLocaleString()} ${appSettings.currency}`
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowPaymentModal(false)}
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
                onClick={handleCheckout}
                disabled={
                  paymentMethod === 'cash' && parseFloat(amountReceived) < total ||
                  paymentMethod === 'credit' && selectedCustomer === 1
                }
                style={{
                  flex: 1,
                  padding: '12px',
                  background: (
                    paymentMethod === 'card' || 
                    (paymentMethod === 'cash' && parseFloat(amountReceived) >= total) ||
                    (paymentMethod === 'credit' && selectedCustomer !== 1)
                  ) ? '#10b981' : '#94a3b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (
                    paymentMethod === 'card' || 
                    (paymentMethod === 'cash' && parseFloat(amountReceived) >= total) ||
                    (paymentMethod === 'credit' && selectedCustomer !== 1)
                  ) ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesModule;
