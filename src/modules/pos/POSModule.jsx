import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, 
  DollarSign, Smartphone, Hash, X, Settings, User, 
  Scan, ArrowLeft, Check, Calculator, Package
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useResponsive } from '../../components/ResponsiveComponents';
import BarcodeScanner from './BarcodeScanner';

const OptimizedPOSModule = () => {
  // Context et hooks
  const { 
    globalProducts, 
    processSale, 
    customers, 
    appSettings, 
    addCredit 
  } = useApp();
  
  const { deviceType, isMobile } = useResponsive();
  
  // États principaux
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]);
  
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
  
  // Configuration
  const isDark = appSettings.darkMode;
  const products = globalProducts || [];
  
  // Catégories dynamiques avec compteurs
  const categories = useMemo(() => {
    const categoryCounts = products.reduce((acc, product) => {
      const category = product.category || 'Divers';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    const categoryList = [
      { id: 'all', name: 'Tout', icon: '🏪', count: products.length }
    ];
    
    Object.entries(categoryCounts).forEach(([name, count]) => {
      const icons = {
        'Boissons': '🥤', 'Alimentaire': '🍞', 'Hygiène': '🧼',
        'Snacks': '🍿', 'Fruits': '🍎', 'Légumes': '🥬',
        'Viande': '🥩', 'Poisson': '🐟', 'Épicerie': '🛒'
      };
      categoryList.push({
        id: name.toLowerCase(),
        name,
        icon: icons[name] || '📦',
        count
      });
    });
    
    return categoryList;
  }, [products]);
  
  // Produits filtrés avec optimisation
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || 
        (product.category?.toLowerCase() === selectedCategory);
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        product.name?.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower) ||
        product.barcode?.includes(searchQuery);
      
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);
  
  // Calculs du panier
  const cartStats = useMemo(() => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalTax = totalAmount * (appSettings.taxRate || 0) / 100;
    const finalTotal = totalAmount + totalTax;
    
    return { totalItems, totalAmount, totalTax, finalTotal };
  }, [cart, appSettings.taxRate]);
  
  // Raccourcis clavier professionnels
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Éviter les conflits avec les inputs
      if (e.target.matches('input, textarea, select')) return;
      
      // Prévenir les actions par défaut pour les touches fonction
      if (['F1', 'F2', 'F3', 'F4'].includes(e.key)) {
        e.preventDefault();
      }

      switch(e.key) {
        case 'F1': // Vider panier
          if (cart.length > 0) {
            if (window.confirm('Vider le panier ?')) {
              setCart([]);
              setSearchQuery('');
            }
          }
          break;
          
        case 'F2': // Focus recherche
          searchInputRef.current?.focus();
          break;
          
        case 'F3': // Ouvrir paiement
          if (cart.length > 0) {
            setShowPaymentModal(true);
          } else {
            alert('Panier vide');
          }
          break;
          
        case 'F4': // Scanner
          setShowScanner(true);
          break;
          
        case 'Escape': // Annuler
          if (showPaymentModal) setShowPaymentModal(false);
          else if (showScanner) setShowScanner(false);
          else if (showCustomerModal) setShowCustomerModal(false);
          break;
          
        case 'Enter': // Ajouter produit trouvé
          if (searchQuery && filteredProducts.length > 0) {
            e.preventDefault();
            addToCart(filteredProducts[0]);
            setSearchQuery('');
          }
          break;
          
        // Raccourcis numériques pour catégories
        case '1': case '2': case '3': case '4': case '5':
        case '6': case '7': case '8': case '9':
          const categoryIndex = parseInt(e.key) - 1;
          if (categories[categoryIndex]) {
            setSelectedCategory(categories[categoryIndex].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart, searchQuery, showPaymentModal, showScanner, showCustomerModal, filteredProducts, categories]);
  
  // Fonctions du panier
  const addToCart = (product) => {
    if (product.stock === 0) {
      alert(`${product.name} est en rupture de stock!`);
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

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };
  
  // Gestion du paiement
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
      setCart([]);
      setShowPaymentModal(false);
      setAmountReceived('');
      setNotes('');
      
      alert('Vente effectuée avec succès!');
    } catch (error) {
      alert('Erreur lors de la vente: ' + error.message);
    }
  };
  
  // Gestion du scanner
  const handleBarcodeDetected = (barcode) => {
    const product = products.find(p => 
      p.barcode === barcode || p.sku === barcode
    );
    
    if (product) {
      addToCart(product);
      setShowScanner(false);
    } else {
      alert('Produit non trouvé');
    }
  };

  // Styles modernes inspirés de Loyverse
  const styles = {
    container: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '70% 30%',
      height: '100vh',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      gap: 0
    },
    
    // Section produits
    productsSection: {
      display: 'flex',
      flexDirection: 'column',
      background: 'white',
      borderRight: '1px solid #e2e8f0',
      overflow: 'hidden'
    },
    
    // Header avec recherche
    header: {
      padding: '16px 20px',
      borderBottom: '1px solid #e2e8f0',
      background: 'white',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    
    searchContainer: {
      position: 'relative',
      marginBottom: '16px'
    },
    
    searchInput: {
      width: '100%',
      padding: '14px 16px 14px 48px',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      fontSize: '16px',
      background: '#f8fafc',
      transition: 'all 0.2s ease',
      outline: 'none'
    },
    
    searchIcon: {
      position: 'absolute',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#64748b'
    },
    
    // Catégories horizontales
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
      background: '#f1f5f9',
      color: '#475569',
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
    
    // Grille de produits
    productsGrid: {
      flex: 1,
      padding: '20px',
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '150px' : '180px'}, 1fr))`,
      gap: '16px',
      overflowY: 'auto',
      alignContent: 'start'
    },
    
    productCard: {
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      position: 'relative',
      minHeight: isMobile ? '120px' : '140px'
    },
    
    // Section panier
    cartSection: {
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: isMobile ? '100%' : '380px'
    },
    
    cartHeader: {
      padding: '20px',
      background: 'white',
      borderBottom: '1px solid #e2e8f0',
      textAlign: 'center'
    },
    
    cartItems: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px'
    },
    
    cartItem: {
      background: 'white',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      border: '1px solid #e2e8f0'
    },
    
    cartFooter: {
      background: 'white',
      padding: '20px',
      borderTop: '1px solid #e2e8f0'
    },
    
    // Boutons
    primaryButton: {
      width: '100%',
      padding: '16px',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    
    secondaryButton: {
      width: '100%',
      padding: '12px',
      background: 'transparent',
      color: '#64748b',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer',
      marginTop: '8px',
      transition: 'all 0.2s ease'
    }
  };

  // Composants
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
      <span style={{ 
        background: selectedCategory === category.id ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
        color: selectedCategory === category.id ? 'white' : '#64748b',
        padding: '2px 6px',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: '600'
      }}>
        {category.count}
      </span>
    </button>
  );

  const ProductCard = ({ product }) => {
    const isInCart = cart.some(item => item.id === product.id);
    
    return (
      <div
        onClick={() => addToCart(product)}
        style={{
          ...styles.productCard,
          borderColor: isInCart ? '#3b82f6' : '#e2e8f0',
          transform: isInCart ? 'scale(0.98)' : 'scale(1)',
          boxShadow: isInCart ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={(e) => {
          if (!isInCart) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isInCart ? 'scale(0.98)' : 'scale(1)';
          e.currentTarget.style.boxShadow = isInCart ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0,0,0,0.1)';
        }}
      >
        {/* Badge stock */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: product.stock > 10 ? '#10b981' : product.stock > 0 ? '#f59e0b' : '#ef4444',
          color: 'white',
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '8px',
          fontWeight: '600'
        }}>
          {product.stock}
        </div>
        
        {/* Image/emoji produit */}
        <div style={{ fontSize: isMobile ? '28px' : '32px', marginBottom: '8px' }}>
          {product.image || '📦'}
        </div>
        
        {/* Nom produit */}
        <div style={{
          fontSize: isMobile ? '12px' : '14px',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '4px',
          lineHeight: '1.3',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {product.name}
        </div>
        
        {/* Prix */}
        <div style={{
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: '700',
          color: '#3b82f6',
          marginTop: 'auto'
        }}>
          {product.price?.toLocaleString()} {appSettings.currency}
        </div>
      </div>
    );
  };

  const CartItem = ({ item }) => (
    <div style={styles.cartItem}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1e293b',
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
      
      {/* Contrôles quantité */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={() => updateQuantity(item.id, -1)}
          style={{
            width: '32px',
            height: '32px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: 'white',
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <Minus size={16} />
        </button>
        
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1e293b',
          minWidth: '24px',
          textAlign: 'center'
        }}>
          {item.quantity}
        </div>
        
        <button
          onClick={() => updateQuantity(item.id, 1)}
          style={{
            width: '32px',
            height: '32px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: 'white',
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <Plus size={16} />
        </button>
        
        <button
          onClick={() => removeFromCart(item.id)}
          style={{
            width: '32px',
            height: '32px',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            background: '#fef2f2',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 'auto'
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  const PaymentModal = () => (
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
            Finaliser la vente
          </h2>
          <button 
            onClick={() => setShowPaymentModal(false)}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '24px', 
              cursor: 'pointer',
              color: '#64748b',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Récapitulatif */}
        <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Sous-total:</span>
            <span>{cartStats.totalAmount.toLocaleString()} {appSettings.currency}</span>
          </div>
          {cartStats.totalTax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>TVA ({appSettings.taxRate}%):</span>
              <span>{cartStats.totalTax.toLocaleString()} {appSettings.currency}</span>
            </div>
          )}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '20px', 
            fontWeight: '700',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '8px'
          }}>
            <span>Total:</span>
            <span style={{ color: '#3b82f6' }}>
              {cartStats.finalTotal.toLocaleString()} {appSettings.currency}
            </span>
          </div>
        </div>

        {/* Client */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Client
          </label>
          <button
            onClick={() => setShowCustomerModal(true)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <User size={16} />
            {selectedCustomer.name}
          </button>
        </div>

        {/* Méthode de paiement */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Méthode de paiement
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { id: 'cash', icon: DollarSign, label: 'Espèces' },
              { id: 'card', icon: CreditCard, label: 'Carte' },
              { id: 'mobile', icon: Smartphone, label: 'Mobile' }
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                style={{
                  padding: '12px',
                  border: paymentMethod === method.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: paymentMethod === method.id ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                <method.icon size={20} />
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {/* Montant reçu pour espèces */}
        {paymentMethod === 'cash' && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Montant reçu
            </label>
            <input
              type="number"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              placeholder="Entrez le montant"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
            />
            {amountReceived && (
              <div style={{ 
                marginTop: '8px', 
                fontSize: '14px', 
                color: parseFloat(amountReceived) >= cartStats.finalTotal ? '#10b981' : '#ef4444'
              }}>
                Monnaie à rendre: {Math.max(0, parseFloat(amountReceived) - cartStats.finalTotal).toLocaleString()} {appSettings.currency}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ajouter une note..."
            rows={2}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
              outline: 'none'
            }}
          />
        </div>

        {/* Bouton de confirmation */}
        <button
          onClick={handleCheckout}
          disabled={paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < cartStats.finalTotal)}
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
            opacity: (paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < cartStats.finalTotal)) ? 0.5 : 1
          }}
        >
          <Check size={20} />
          Confirmer la vente
        </button>
      </div>
    </div>
  );

  const EmptyCartState = () => (
    <div style={{ 
      textAlign: 'center', 
      color: '#64748b', 
      fontSize: '14px',
      padding: '40px 20px'
    }}>
      <ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
      <div style={{ fontWeight: '600', marginBottom: '8px' }}>Votre panier est vide</div>
      <div style={{ fontSize: '12px' }}>
        Cliquez sur un produit pour l'ajouter
      </div>
      <div style={{ fontSize: '12px', marginTop: '16px', color: '#94a3b8' }}>
        Raccourcis: F2=Recherche, F4=Scanner
      </div>
    </div>
  );

  // Rendu principal
  return (
    <div style={styles.container}>
      {/* Section Produits */}
      <div style={styles.productsSection}>
        {/* Header avec recherche */}
        <div style={styles.header}>
          <div style={styles.searchContainer}>
            <Search size={20} style={styles.searchIcon} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher un produit ou scanner code-barre... (F2)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                ...styles.searchInput,
                borderColor: searchQuery ? '#3b82f6' : '#e2e8f0',
                background: searchQuery ? 'white' : '#f8fafc'
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
              color: '#64748b',
              padding: '40px'
            }}>
              <Package size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <div>Aucun produit trouvé</div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>
                {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Cette catégorie est vide'}
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
            color: '#1e293b',
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
            color: '#64748b',
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
              <span>Total:</span>
              <span style={{ color: '#3b82f6' }}>
                {cartStats.finalTotal.toLocaleString()} {appSettings.currency}
              </span>
            </div>
            
            <button
              onClick={() => setShowPaymentModal(true)}
              style={{
                ...styles.primaryButton,
                background: '#3b82f6'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#2563eb';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#3b82f6';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <CreditCard size={20} />
              Payer (F3)
            </button>
            
            <button
              onClick={() => {
                if (window.confirm('Vider le panier ?')) {
                  setCart([]);
                }
              }}
              style={styles.secondaryButton}
            >
              Vider le panier (F1)
            </button>
          </div>
        )}
      </div>

      {/* Raccourcis clavier (optionnel - à masquer en prod) */}
      {!isMobile && (
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

export default OptimizedPOSModule;
