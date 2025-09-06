// src/modules/pos/POSModule.jsx - VERSION RÉÉCRITE COMPLÈTE
import React, { useState, useRef } from 'react';
import { 
  Search, ShoppingCart, CreditCard, DollarSign, Smartphone, 
  Package, User, X, Check, Scan, Plus, Minus, Trash2
} from 'lucide-react';

// Import des contextes
import { useApp } from '../../contexts/AppContext';
import { useResponsive } from '../../components/ResponsiveComponents';

// Import des hooks personnalisés
import { 
  useCart, 
  useProductSearch, 
  useCategories, 
  useKeyboardShortcuts 
} from '../../hooks';

// Import des composants UI
import { 
  Button, 
  Input, 
  Modal, 
  Card, 
  Badge 
} from '../../components/ui';

// Import des composants spécialisés
import BarcodeScanner from './BarcodeScanner';

const POSModule = () => {
  // ==================== CONTEXTES ET HOOKS ====================
  const { 
    globalProducts, 
    processSale, 
    customers, 
    appSettings,
    addCredit 
  } = useApp();
  
  const { deviceType, isMobile } = useResponsive();
  
  // ==================== HOOKS PERSONNALISÉS ====================
  // Hook pour le panier (remplace toute la logique complexe)
  const { 
    cart, 
    cartStats, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart(globalProducts || [], appSettings);
  
  // Hook pour les catégories (génération automatique)
  const categories = useCategories(globalProducts || []);
  
  // ==================== ÉTATS LOCAUX ====================
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0] || { id: 1, name: 'Client Comptant' });
  
  // États modaux
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // États de paiement
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [notes, setNotes] = useState('');
  
  // Références
  const searchInputRef = useRef(null);
  
  // ==================== HOOKS DE RECHERCHE ET RACCOURCIS ====================
  // Hook pour la recherche optimisée avec debouncing
  const filteredProducts = useProductSearch(
    globalProducts || [], 
    searchQuery, 
    selectedCategory
  );
  
  // Hook pour les raccourcis clavier professionnels
  useKeyboardShortcuts([
    { 
      key: 'F1', 
      action: () => {
        if (cart.length > 0 && window.confirm('Vider le panier ?')) {
          clearCart();
          setSearchQuery('');
        }
      },
      description: 'Vider le panier'
    },
    { 
      key: 'F2', 
      action: () => searchInputRef.current?.focus(),
      description: 'Focus recherche'
    },
    { 
      key: 'F3', 
      action: () => {
        if (cart.length > 0) {
          setShowPaymentModal(true);
        } else {
          alert('Panier vide');
        }
      },
      description: 'Ouvrir paiement'
    },
    { 
      key: 'F4', 
      action: () => setShowScanner(true),
      description: 'Scanner code-barre'
    },
    {
      key: 'Escape',
      action: () => {
        if (showPaymentModal) setShowPaymentModal(false);
        else if (showScanner) setShowScanner(false);
        else if (showCustomerModal) setShowCustomerModal(false);
      },
      description: 'Annuler'
    },
    {
      key: 'Enter',
      action: () => {
        if (searchQuery && filteredProducts.length > 0) {
          addToCart(filteredProducts[0]);
          setSearchQuery('');
        }
      },
      description: 'Ajouter premier produit trouvé'
    }
  ], [cart.length, searchQuery, showPaymentModal, showScanner, showCustomerModal, filteredProducts]);
  
  // ==================== GESTIONNAIRES D'ÉVÉNEMENTS ====================
  const handleBarcodeDetected = (barcode) => {
    const product = (globalProducts || []).find(p => 
      p.barcode === barcode || p.sku === barcode
    );
    
    if (product) {
      addToCart(product);
      setShowScanner(false);
    } else {
      alert('Produit non trouvé');
    }
  };
  
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const saleData = {
      items: cart,
      total: cartStats.finalTotal,
      tax: cartStats.totalTax,
      paymentMethod,
      customerId: selectedCustomer.id,
      notes,
      amountReceived: paymentMethod === 'cash' ? parseFloat(amountReceived) : cartStats.finalTotal,
      change: paymentMethod === 'cash' ? Math.max(0, parseFloat(amountReceived) - cartStats.finalTotal) : 0
    };

    if (paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < cartStats.finalTotal)) {
      alert('Montant reçu insuffisant!');
      return;
    }

    try {
      processSale(saleData);
      
      // Réinitialiser
      clearCart();
      setShowPaymentModal(false);
      setAmountReceived('');
      setNotes('');
      
      alert('Vente effectuée avec succès!');
    } catch (error) {
      alert('Erreur lors de la vente: ' + error.message);
    }
  };
  
  // ==================== CONFIGURATION DU THÈME ====================
  const isDark = appSettings.darkMode;
  
  // ==================== STYLES MODERNES ====================
  const styles = {
    container: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '70% 30%',
      height: '100vh',
      background: isDark ? '#1a202c' : '#f8fafc',
      gap: 0
    },
    
    productsSection: {
      display: 'flex',
      flexDirection: 'column',
      background: isDark ? '#2d3748' : 'white',
      borderRight: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      overflow: 'hidden'
    },
    
    header: {
      padding: '20px',
      borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      background: isDark ? '#2d3748' : 'white',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    
    categoriesBar: {
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      paddingBottom: '8px',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    },
    
    categoryButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 16px',
      border: 'none',
      borderRadius: '8px',
      background: isDark ? '#4a5568' : '#f1f5f9',
      color: isDark ? '#cbd5e0' : '#475569',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
      fontSize: '14px',
      fontWeight: '500'
    },
    
    categoryButtonActive: {
      background: '#3b82f6',
      color: 'white',
      transform: 'scale(1.02)'
    },
    
    productsGrid: {
      flex: 1,
      padding: '20px',
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '150px' : '180px'}, 1fr))`,
      gap: '16px',
      overflowY: 'auto',
      alignContent: 'start'
    },
    
    cartSection: {
      background: isDark ? '#1a202c' : '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    },
    
    cartHeader: {
      padding: '20px',
      background: isDark ? '#2d3748' : 'white',
      borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      textAlign: 'center'
    },
    
    cartItems: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px'
    },
    
    cartFooter: {
      background: isDark ? '#2d3748' : 'white',
      padding: '20px',
      borderTop: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
    }
  };
  
  // ==================== COMPOSANTS INTERNES ====================
  const CategoryButton = ({ category }) => (
    <button
      onClick={() => setSelectedCategory(category.id)}
      style={{
        ...styles.categoryButton,
        ...(selectedCategory === category.id ? styles.categoryButtonActive : {})
      }}
    >
      <span>{category.icon}</span>
      <span>{category.name}</span>
      <Badge 
        variant={selectedCategory === category.id ? 'default' : 'info'}
        size="small"
        style={{
          background: selectedCategory === category.id ? 'rgba(255,255,255,0.2)' : undefined,
          color: selectedCategory === category.id ? 'white' : undefined
        }}
      >
        {category.count}
      </Badge>
    </button>
  );

  const ProductCard = ({ product }) => {
    const isInCart = cart.some(item => item.id === product.id);
    
    return (
      <Card
        hover
        clickable
        onClick={() => addToCart(product)}
        style={{
          position: 'relative',
          minHeight: isMobile ? '120px' : '140px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          borderColor: isInCart ? '#3b82f6' : undefined,
          transform: isInCart ? 'scale(0.98)' : 'scale(1)',
          boxShadow: isInCart ? '0 4px 12px rgba(59, 130, 246, 0.15)' : undefined,
          background: isDark ? '#374151' : 'white'
        }}
      >
        {/* Badge de stock */}
        <Badge 
          variant={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger'}
          size="small"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px'
          }}
        >
          {product.stock}
        </Badge>
        
        {/* Image produit */}
        <div style={{ 
          fontSize: isMobile ? '28px' : '32px', 
          marginBottom: '8px',
          marginTop: '8px'
        }}>
          {product.image || '📦'}
        </div>
        
        {/* Nom produit */}
        <h4 style={{
          margin: '0 0 8px 0',
          fontSize: isMobile ? '12px' : '14px',
          fontWeight: '600',
          color: isDark ? '#f7fafc' : '#1f2937',
          lineHeight: '1.3',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {product.name}
        </h4>
        
        {/* Prix */}
        <div style={{
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: '700',
          color: '#3b82f6',
          marginTop: 'auto'
        }}>
          {product.price?.toLocaleString()} {appSettings.currency}
        </div>
      </Card>
    );
  };

  const CartItem = ({ item }) => (
    <Card style={{ marginBottom: '12px', background: isDark ? '#374151' : 'white' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: isDark ? '#f7fafc' : '#1f2937',
          flex: 1,
          marginRight: '8px'
        }}>
          {item.name}
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: '700',
          color: '#3b82f6'
        }}>
          {(item.price * item.quantity).toLocaleString()} {appSettings.currency}
        </div>
      </div>
      
      {/* Contrôles de quantité avec les nouveaux composants */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Button
          variant="ghost"
          size="small"
          onClick={() => updateQuantity(item.id, -1)}
          icon={<Minus size={16} />}
        />
        
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: isDark ? '#f7fafc' : '#1f2937',
          minWidth: '24px',
          textAlign: 'center'
        }}>
          {item.quantity}
        </div>
        
        <Button
          variant="ghost"
          size="small"
          onClick={() => updateQuantity(item.id, 1)}
          icon={<Plus size={16} />}
        />
        
        <Button
          variant="danger"
          size="small"
          onClick={() => removeFromCart(item.id)}
          icon={<Trash2 size={16} />}
          style={{ marginLeft: 'auto' }}
        />
      </div>
    </Card>
  );

  const EmptyCartState = () => (
    <div style={{ 
      textAlign: 'center', 
      color: isDark ? '#a0aec0' : '#6b7280', 
      fontSize: '14px',
      padding: '40px 20px'
    }}>
      <ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
      <div style={{ fontWeight: '600', marginBottom: '8px' }}>
        Votre panier est vide
      </div>
      <div style={{ fontSize: '12px' }}>
        Cliquez sur un produit pour l'ajouter
      </div>
      <div style={{ fontSize: '12px', marginTop: '16px', color: isDark ? '#718096' : '#94a3b8' }}>
        Raccourcis: F2=Recherche, F4=Scanner
      </div>
    </div>
  );

  const PaymentModal = () => (
    <Modal
      isOpen={showPaymentModal}
      onClose={() => setShowPaymentModal(false)}
      title="Finaliser la vente"
      size="medium"
    >
      {/* Récapitulatif */}
      <Card style={{ marginBottom: '24px', background: isDark ? '#374151' : '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: isDark ? '#cbd5e0' : '#374151' }}>Sous-total:</span>
          <span style={{ color: isDark ? '#f7fafc' : '#374151' }}>
            {cartStats.totalAmount.toLocaleString()} {appSettings.currency}
          </span>
        </div>
        {cartStats.totalTax > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: isDark ? '#cbd5e0' : '#374151' }}>
              TVA ({appSettings.taxRate}%):
            </span>
            <span style={{ color: isDark ? '#f7fafc' : '#374151' }}>
              {cartStats.totalTax.toLocaleString()} {appSettings.currency}
            </span>
          </div>
        )}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '20px', 
          fontWeight: '700',
          borderTop: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
          paddingTop: '8px'
        }}>
          <span style={{ color: isDark ? '#f7fafc' : '#374151' }}>Total:</span>
          <span style={{ color: '#3b82f6' }}>
            {cartStats.finalTotal.toLocaleString()} {appSettings.currency}
          </span>
        </div>
      </Card>

      {/* Client */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => setShowCustomerModal(true)}
          icon={<User size={16} />}
          style={{ justifyContent: 'flex-start' }}
        >
          {selectedCustomer.name}
        </Button>
      </div>

      {/* Méthode de paiement */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: '600',
          fontSize: '14px',
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
            <Button
              key={method.id}
              variant={paymentMethod === method.id ? 'primary' : 'secondary'}
              onClick={() => setPaymentMethod(method.id)}
              icon={<method.icon size={16} />}
              style={{ flexDirection: 'column', gap: '4px' }}
            >
              {method.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Montant reçu pour espèces */}
      {paymentMethod === 'cash' && (
        <div style={{ marginBottom: '24px' }}>
          <Input
            label="Montant reçu"
            type="number"
            value={amountReceived}
            onChange={(e) => setAmountReceived(e.target.value)}
            placeholder="0"
            fullWidth
            leftIcon={<DollarSign size={16} />}
          />
          {amountReceived && (
            <div style={{ 
              marginTop: '8px', 
              fontSize: '14px', 
              color: parseFloat(amountReceived) >= cartStats.finalTotal ? '#10b981' : '#ef4444',
              fontWeight: '500'
            }}>
              Monnaie à rendre: {Math.max(0, parseFloat(amountReceived || 0) - cartStats.finalTotal).toLocaleString()} {appSettings.currency}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div style={{ marginBottom: '24px' }}>
        <Input
          label="Notes (optionnel)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ajouter une note..."
          fullWidth
        />
      </div>

      {/* Boutons d'action */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button
          variant="secondary"
          onClick={() => setShowPaymentModal(false)}
          fullWidth
        >
          Annuler
        </Button>
        <Button
          variant="success"
          onClick={handleCheckout}
          disabled={paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < cartStats.finalTotal)}
          fullWidth
          icon={<Check size={16} />}
        >
          Confirmer
        </Button>
      </div>
    </Modal>
  );

  // ==================== RENDU PRINCIPAL ====================
  return (
    <div style={styles.container}>
      {/* Section Produits */}
      <div style={styles.productsSection}>
        {/* Header avec recherche */}
        <div style={styles.header}>
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
          
          {/* Recherche moderne */}
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
              placeholder="Rechercher un produit ou scanner code-barre... (F2)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                border: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '12px',
                fontSize: '16px',
                background: searchQuery ? (isDark ? '#2d3748' : 'white') : (isDark ? '#374151' : '#f8fafc'),
                borderColor: searchQuery ? '#3b82f6' : (isDark ? '#4a5568' : '#e2e8f0'),
                color: isDark ? '#f7fafc' : '#1f2937',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            />
          </div>

          {/* Barre de catégories */}
          <div style={styles.categoriesBar}>
            {categories.map(category => (
              <CategoryButton key={category.id} category={category} />
            ))}
          </div>
        </div>

        {/* Grille de produits */}
        <div style={styles.productsGrid}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              color: isDark ? '#a0aec0' : '#6b7280',
              padding: '60px 20px'
            }}>
              <Package size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                Aucun produit trouvé
              </div>
              <div style={{ fontSize: '14px' }}>
                {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Aucun produit disponible'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section Panier */}
      <div style={styles.cartSection}>
        <div style={styles.cartHeader}>
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
            marginTop: '4px'
          }}>
            {cartStats.totalItems} article{cartStats.totalItems > 1 ? 's' : ''}
          </div>
        </div>

        <div style={styles.cartItems}>
          {cart.length === 0 ? (
            <EmptyCartState />
          ) : (
            cart.map(item => (
              <CartItem key={item.id} item={item} />
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div style={styles.cartFooter}>
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
            
            <Button
              variant="success"
              fullWidth
              icon={<CreditCard size={20} />}
              onClick={() => setShowPaymentModal(true)}
              size="large"
            >
              Finaliser la vente (F3)
            </Button>
            
            <Button
              variant="ghost"
              fullWidth
              onClick={() => {
                if (window.confirm('Vider le panier ?')) {
                  clearCart();
                }
              }}
              style={{ marginTop: '8px' }}
            >
              Vider le panier (F1)
            </Button>
          </div>
        )}
      </div>

      {/* Raccourcis clavier (optionnel en développement) */}
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
          pointerEvents: 'none'
        }}>
          <span>F1: Vider</span>
          <span>F2: Recherche</span>
          <span>F3: Payer</span>
          <span>F4: Scanner</span>
          <span>ESC: Annuler</span>
        </div>
      )}

      {/* Modals */}
      {showPaymentModal && <PaymentModal />}
      
      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default POSModule;
