// src/modules/pos/POSModule.jsx - Version ultra compacte avec gestion caisse unifiée

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Package, Search, Lock, Unlock, Plus, Minus, Trash2, 
  CreditCard, User, ShoppingCart, X, Check, AlertTriangle,
  Zap, Sparkles, ImageIcon
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useCart } from '../../hooks/useCart';
import { 
  getCashSession, 
  saveCashSession, 
  getCashOperations, 
  saveCashOperations, 
  addCashReport, 
  clearCashData 
} from '../../services/cash.service';
import toast from 'react-hot-toast';

// ✅ Hook useCategories local pour éviter les conflits
const useLocalCategories = (products) => {
  return useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return [{ id: 'all', name: 'Tout', icon: '🏪', count: 0 }];
    }

    // Compter les produits par catégorie
    const categoryCounts = products.reduce((acc, product) => {
      const category = product?.category || 'Divers';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    // Commencer par "Tout"
    const categoryList = [
      { 
        id: 'all', 
        name: 'Tout', 
        icon: '🏪', 
        count: products.length 
      }
    ];
    
    // Icônes prédéfinies par catégorie
    const categoryIcons = {
      'Boissons': '🥤',
      'Alimentaire': '🍞', 
      'Hygiène': '🧼',
      'Snacks': '🍿', 
      'Fruits': '🍎', 
      'Légumes': '🥬',
      'Viande': '🥩', 
      'Poisson': '🐟', 
      'Épicerie': '🛒',
      'Électronique': '📱', 
      'Vêtements': '👕', 
      'Maison': '🏠',
      'Santé': '💊', 
      'Beauté': '💄', 
      'Sport': '⚽',
      'Jouets': '🧸',
      'Livres': '📚',
      'Auto': '🚗',
      'Jardin': '🌱',
      'Divers': '📦'
    };
    
    // Ajouter chaque catégorie trouvée
    Object.entries(categoryCounts).forEach(([name, count]) => {
      if (name !== 'undefined' && name.trim()) {
        categoryList.push({
          id: name.toLowerCase().replace(/\s+/g, '-'), // ID URL-friendly
          name,
          icon: categoryIcons[name] || '📦', // Icône par défaut
          count
        });
      }
    });
    
    // Trier par nombre de produits (décroissant) après "Tout"
    const sortedCategories = [
      categoryList[0], // Garder "Tout" en premier
      ...categoryList.slice(1).sort((a, b) => b.count - a.count)
    ];
    
    return sortedCategories;
  }, [products]);
};

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

  // ==================== HOOKS PERSONNALISÉS ====================
  const { 
    cart, 
    cartStats, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart(globalProducts, appSettings);

  // ✅ Utilisation du hook local pour éviter les conflits
  const categories = useLocalCategories(globalProducts);

  // ==================== ÉTATS LOCAUX ====================
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(customers?.[0] || { id: 1, name: 'Client Comptant' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const amountReceivedRef = useRef('');

  // ==================== GESTION CAISSE SYNCHRONISÉE AVEC MODERNCASHREGISTER ====================
  const [cashSession, setCashSession] = useState(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('25000');
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');

  // ✅ SYNCHRONISATION avec ModernCashRegister (même clés)
  useEffect(() => {
    const checkCashSession = () => {
      const session = localStorage.getItem('cash_session_v2');
      if (session) {
        try {
          setCashSession(JSON.parse(session));
        } catch (e) {
          console.error('Erreur session:', e);
          setCashSession(null);
        }
      } else {
        setCashSession(null);
      }
    };

    // Vérification initiale
    checkCashSession();

    // Vérification périodique pour synchronisation
    const interval = setInterval(checkCashSession, 1000);

    return () => clearInterval(interval);
  }, []);

  // ✅ FONCTION D'OUVERTURE (synchronisée)
  const openRegister = useCallback(() => {
    const newSession = {
      id: Date.now(),
      openedAt: new Date().toISOString(),
      openedBy: 'Caissier',
      initialAmount: parseFloat(openingAmount),
      status: 'open'
    };

    const openOperation = {
      id: Date.now(),
      type: 'opening',
      amount: parseFloat(openingAmount),
      timestamp: new Date().toISOString(),
      description: 'Ouverture de caisse',
      operator: 'Caissier'
    };

    // Sauvegarder avec les mêmes clés que ModernCashRegister
    localStorage.setItem('cash_session_v2', JSON.stringify(newSession));
    localStorage.setItem('cash_operations_v2', JSON.stringify([openOperation]));
    
    setCashSession(newSession);
    setShowOpenModal(false);
    setOpeningAmount('25000');
    
    toast.success('Caisse ouverte !');
  }, [openingAmount]);

  // ✅ FONCTION DE FERMETURE (synchronisée)
  const closeRegister = useCallback(() => {
    if (!cashSession) return;

    const sessionSales = salesHistory.filter(sale => 
      new Date(sale.date) >= new Date(cashSession.openedAt)
    );

    const cashSalesTotal = sessionSales
      .filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + s.total, 0);

    const expectedCash = cashSession.initialAmount + cashSalesTotal;
    const difference = parseFloat(closingCash) - expectedCash;

    const report = {
      sessionId: cashSession.id,
      openedAt: cashSession.openedAt,
      closedAt: new Date().toISOString(),
      initialAmount: cashSession.initialAmount,
      expectedCash,
      actualCash: parseFloat(closingCash),
      difference,
      salesCount: sessionSales.length,
      totalSales: sessionSales.reduce((sum, s) => sum + s.total, 0),
      notes,
      closedBy: 'Caissier'
    };

    // Ajouter le rapport et nettoyer
    addCashReport(report);
    localStorage.removeItem('cash_session_v2');
    localStorage.removeItem('cash_operations_v2');
    
    setCashSession(null);
    setShowCloseModal(false);
    setClosingCash('');
    setNotes('');
    
    toast.success('Caisse fermée !');
  }, [cashSession, salesHistory, closingCash, notes]);

  // ==================== GESTION DES PRODUITS ====================
  const filteredProducts = useMemo(() => {
    let filtered = globalProducts;
    
    if (selectedCategory !== 'all') {
      // Trouver le nom de la catégorie à partir de l'ID
      const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
      const categoryName = selectedCategoryData?.name;
      
      if (categoryName && categoryName !== 'Tout') {
        filtered = filtered.filter(p => p.category === categoryName);
      }
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.barcode?.includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }
    
    return filtered.slice(0, 50);
  }, [globalProducts, selectedCategory, searchQuery, categories]);

  // ==================== GESTION DU PAIEMENT ====================
  const handleCompleteSale = useCallback(async () => {
    if (!cashSession) {
      toast.error('Caisse fermée');
      return;
    }

    try {
      const saleData = {
        items: cart,
        customer: selectedCustomer,
        paymentMethod,
        amountReceived: paymentMethod === 'cash' ? parseFloat(amountReceivedRef.current) : cartStats.finalTotal,
        change: paymentMethod === 'cash' ? parseFloat(amountReceivedRef.current) - cartStats.finalTotal : 0,
        timestamp: new Date().toISOString()
      };

      if (paymentMethod === 'credit') {
        const newCredit = {
          id: Date.now(),
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          amount: cartStats.finalTotal,
          date: new Date().toISOString(),
          status: 'pending',
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        };
        setCredits(prev => [...prev, newCredit]);
      }

      await processSale(saleData);
      
      clearCart();
      setShowPaymentModal(false);
      setPaymentMethod('cash');
      amountReceivedRef.current = '';
      setAmountDisplay('');
      
      toast.success('Vente terminée !');
      
    } catch (error) {
      console.error('Erreur vente:', error);
      toast.error('Erreur lors de la vente');
    }
  }, [
    cashSession, cart, selectedCustomer, paymentMethod, cartStats.finalTotal,
    processSale, clearCart, setCredits
  ]);

  // ==================== CALCULATRICE PAIEMENT ====================
  const updateAmountReceived = useCallback((value) => {
    if (value === 'clear') {
      amountReceivedRef.current = '';
      setAmountDisplay('');
    } else if (value === 'backspace') {
      amountReceivedRef.current = amountReceivedRef.current.slice(0, -1);
      setAmountDisplay(amountReceivedRef.current);
    } else if (value === 'exact') {
      amountReceivedRef.current = cartStats.finalTotal.toString();
      setAmountDisplay(cartStats.finalTotal.toString());
    } else {
      amountReceivedRef.current += value;
      setAmountDisplay(amountReceivedRef.current);
    }
  }, [cartStats.finalTotal]);

  // ==================== RENDU AVEC GESTION D'ERREUR ====================
  
  // ✅ Vérification des données critiques
  if (!Array.isArray(globalProducts)) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: isDark ? '#111827' : '#f9fafb'
      }}>
        <div style={{
          textAlign: 'center',
          color: isDark ? '#9ca3af' : '#6b7280'
        }}>
          <AlertTriangle size={48} style={{ marginBottom: '16px', color: '#ef4444' }} />
          <p>Erreur: Données produits invalides</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  if (globalProducts.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: isDark ? '#111827' : '#f9fafb'
      }}>
        <div style={{
          textAlign: 'center',
          color: isDark ? '#9ca3af' : '#6b7280'
        }}>
          <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>Aucun produit disponible</p>
          <button
            onClick={() => onNavigate?.('stocks')}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Ajouter des produits
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      background: isDark ? '#111827' : '#f9fafb',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* ==================== HEADER COMPACT ==================== */}
      <div style={{
        background: isDark ? '#1f2937' : 'white',
        borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        padding: '12px 16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white'
            }}>
              <ShoppingCart size={16} />
            </div>
            <h1 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: isDark ? '#f9fafb' : '#111827'
            }}>
              Point de Vente
            </h1>
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
        </div>

        {/* Filtres catégories - ✅ SÉCURISÉ */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Array.isArray(categories) && categories.map(category => {
            // ✅ Vérification supplémentaire pour éviter l'erreur React #31
            if (!category || typeof category !== 'object' || !category.id) {
              console.warn('Catégorie invalide détectée:', category);
              return null;
            }

            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                disabled={!cashSession}
                style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: cashSession ? 'pointer' : 'not-allowed',
                  background: selectedCategory === category.id
                    ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                    : isDark ? '#374151' : '#f3f4f6',
                  color: selectedCategory === category.id
                    ? 'white'
                    : isDark ? '#d1d5db' : '#6b7280',
                  opacity: !cashSession ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <span style={{ fontSize: '8px' }}>{category.icon || '📦'}</span>
                <span>{category.name || 'Sans nom'}</span>
                <span style={{ 
                  fontSize: '8px', 
                  opacity: 0.7,
                  marginLeft: '2px'
                }}>
                  ({category.count || 0})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== CONTENU PRINCIPAL ==================== */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        
        {/* ==================== GRILLE PRODUITS ==================== */}
        <div style={{
          flex: 1,
          padding: '12px',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '8px'
          }}>
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => cashSession && addToCart(product)}
                style={{
                  background: isDark ? '#1f2937' : 'white',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: cashSession ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  opacity: (!cashSession || product.stock <= 0) ? 0.5 : 1,
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  if (cashSession && product.stock > 0) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = isDark 
                      ? '0 4px 12px rgba(0,0,0,0.3)' 
                      : '0 4px 12px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 6px',
                  color: 'white'
                }}>
                  <Package size={16} />
                </div>
                
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: isDark ? '#f9fafb' : '#111827',
                  marginBottom: '2px',
                  lineHeight: '1.2'
                }}>
                  {product.name}
                </div>
                
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#10b981',
                  marginBottom: '2px'
                }}>
                  {product.price?.toLocaleString()} {appSettings.currency}
                </div>
                
                <div style={{
                  fontSize: '9px',
                  color: product.stock <= 5 ? '#ef4444' : (isDark ? '#9ca3af' : '#6b7280')
                }}>
                  Stock: {product.stock}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ==================== PANIER LATÉRAL ==================== */}
        <div style={{
          width: '280px',
          background: isDark ? '#1f2937' : 'white',
          borderLeft: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* Header panier */}
          <div style={{
            padding: '12px',
            borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            background: isDark ? '#111827' : '#f8fafc'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '700',
                color: isDark ? '#f9fafb' : '#111827'
              }}>
                Panier ({cart.length})
              </h3>
              
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  style={{
                    padding: '4px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Items du panier */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px'
          }}>
            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: isDark ? '#9ca3af' : '#6b7280',
                padding: '20px'
              }}>
                <ShoppingCart size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p style={{ fontSize: '12px', margin: 0 }}>Panier vide</p>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.id}
                  style={{
                    background: isDark ? '#374151' : '#f8fafc',
                    border: `1px solid ${isDark ? '#4b5563' : '#e2e8f0'}`,
                    borderRadius: '6px',
                    padding: '8px',
                    marginBottom: '6px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '4px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: isDark ? '#f9fafb' : '#111827',
                        lineHeight: '1.2'
                      }}>
                        {item.name}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: isDark ? '#9ca3af' : '#6b7280'
                      }}>
                        {item.price?.toLocaleString()} {appSettings.currency}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        padding: '2px',
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: 'none',
                          background: item.quantity <= 1 ? '#9ca3af' : '#ef4444',
                          color: 'white',
                          cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Minus size={10} />
                      </button>
                      
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: isDark ? '#f9fafb' : '#111827',
                        minWidth: '20px',
                        textAlign: 'center'
                      }}>
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: 'none',
                          background: item.quantity >= item.stock ? '#9ca3af' : '#10b981',
                          color: 'white',
                          cursor: item.quantity >= item.stock ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    <div style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#10b981'
                    }}>
                      {(item.price * item.quantity).toLocaleString()} {appSettings.currency}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer panier avec totaux */}
          {cart.length > 0 && (
            <div style={{
              padding: '12px',
              borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              background: isDark ? '#111827' : '#f8fafc'
            }}>
              <div style={{
                marginBottom: '8px',
                fontSize: '11px',
                color: isDark ? '#9ca3af' : '#6b7280'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '2px'
                }}>
                  <span>Sous-total:</span>
                  <span>{cartStats.totalAmount?.toLocaleString()} {appSettings.currency}</span>
                </div>
                
                {cartStats.totalTax > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '2px'
                  }}>
                    <span>TVA ({appSettings.taxRate}%):</span>
                    <span>{cartStats.totalTax?.toLocaleString()} {appSettings.currency}</span>
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                paddingTop: '8px',
                borderTop: `1px solid ${isDark ? '#4b5563' : '#e2e8f0'}`
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
                  fontWeight: '700',
                  color: '#10b981'
                }}>
                  {cartStats.finalTotal?.toLocaleString()} {appSettings.currency}
                </span>
              </div>

              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={!cashSession}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: !cashSession 
                    ? '#9ca3af' 
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: !cashSession ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <CreditCard size={16} />
                {!cashSession ? 'Caisse fermée' : 'Payer'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODALS ==================== */}
      
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
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
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
                  {cashSession?.initialAmount?.toLocaleString()} {appSettings.currency}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>Ventes espèces:</span>
                <span style={{ fontWeight: '600', color: '#10b981' }}>
                  {salesHistory
                    .filter(sale => new Date(sale.date) >= new Date(cashSession?.openedAt || 0))
                    .filter(sale => sale.paymentMethod === 'cash')
                    .reduce((sum, sale) => sum + sale.total, 0)
                    .toLocaleString()} {appSettings.currency}
                </span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                paddingTop: '8px',
                borderTop: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                fontWeight: '700'
              }}>
                <span style={{ color: isDark ? '#f7fafc' : '#2d3748' }}>Espèces attendues:</span>
                <span style={{ color: '#3b82f6' }}>
                  {(
                    (cashSession?.initialAmount || 0) +
                    salesHistory
                      .filter(sale => new Date(sale.date) >= new Date(cashSession?.openedAt || 0))
                      .filter(sale => sale.paymentMethod === 'cash')
                      .reduce((sum, sale) => sum + sale.total, 0)
                  ).toLocaleString()} {appSettings.currency}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                Espèces comptées
              </label>
              <input
                type="number"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
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
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                Notes (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Commentaires sur la session..."
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
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL DE PAIEMENT ==================== */}
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
            background: isDark ? '#1f2937' : 'white',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* Header modal */}
            <div style={{
              padding: '16px',
              borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              background: isDark ? '#111827' : '#f8fafc'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '700',
                  color: isDark ? '#f9fafb' : '#111827'
                }}>
                  Paiement
                </h3>
                
                <button
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    padding: '4px',
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? '#9ca3af' : '#6b7280',
                    cursor: 'pointer'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Contenu modal */}
            <div style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto'
            }}>
              
              {/* Résumé commande */}
              <div style={{
                background: isDark ? '#374151' : '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: isDark ? '#d1d5db' : '#6b7280'
                  }}>
                    Articles ({cart.length})
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isDark ? '#f9fafb' : '#111827'
                  }}>
                    {cartStats.totalAmount?.toLocaleString()} {appSettings.currency}
                  </span>
                </div>
                
                {cartStats.totalTax > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      color: isDark ? '#d1d5db' : '#6b7280'
                    }}>
                      TVA ({appSettings.taxRate}%)
                    </span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: isDark ? '#f9fafb' : '#111827'
                    }}>
                      {cartStats.totalTax?.toLocaleString()} {appSettings.currency}
                    </span>
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: `1px solid ${isDark ? '#4b5563' : '#e2e8f0'}`
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: isDark ? '#f9fafb' : '#111827'
                  }}>
                    Total
                  </span>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#10b981'
                  }}>
                    {cartStats.finalTotal?.toLocaleString()} {appSettings.currency}
                  </span>
                </div>
              </div>

              {/* Sélection client */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDark ? '#d1d5db' : '#374151'
                }}>
                  Client
                </label>
                <select
                  value={selectedCustomer.id}
                  onChange={(e) => {
                    const customer = customers.find(c => c.id == e.target.value);
                    setSelectedCustomer(customer);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: isDark ? '#374151' : 'white',
                    color: isDark ? '#f7fafc' : '#2d3748'
                  }}
                >
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.points > 0 ? ` (${customer.points} pts)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Méthodes de paiement */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDark ? '#d1d5db' : '#374151'
                }}>
                  Méthode de paiement
                </label>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px'
                }}>
                  {[
                    { key: 'cash', label: 'Espèces', icon: '💵' },
                    { key: 'card', label: 'Carte', icon: '💳' },
                    { key: 'credit', label: 'Crédit', icon: '📝' }
                  ].map(method => (
                    <button
                      key={method.key}
                      onClick={() => setPaymentMethod(method.key)}
                      disabled={method.key === 'credit' && selectedCustomer.id === 1}
                      style={{
                        padding: '12px 8px',
                        border: `2px solid ${
                          paymentMethod === method.key 
                            ? '#3b82f6' 
                            : isDark ? '#4b5563' : '#e5e7eb'
                        }`,
                        borderRadius: '8px',
                        background: paymentMethod === method.key
                          ? isDark ? '#1e3a8a' : '#dbeafe'
                          : isDark ? '#374151' : 'white',
                        color: isDark ? '#f9fafb' : '#111827',
                        cursor: (method.key === 'credit' && selectedCustomer.id === 1) 
                          ? 'not-allowed' 
                          : 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        textAlign: 'center',
                        opacity: (method.key === 'credit' && selectedCustomer.id === 1) ? 0.5 : 1
                      }}
                    >
                      <div style={{ marginBottom: '4px', fontSize: '16px' }}>
                        {method.icon}
                      </div>
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interface paiement espèces */}
              {paymentMethod === 'cash' && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    background: isDark ? '#374151' : '#f8fafc',
                    padding: '12px',
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
                        fontSize: '14px',
                        fontWeight: '600',
                        color: isDark ? '#d1d5db' : '#374151'
                      }}>
                        Montant reçu:
                      </span>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#3b82f6'
                      }}>
                        {amountDisplay || '0'} {appSettings.currency}
                      </span>
                    </div>
                    
                    {parseFloat(amountDisplay) > cartStats.finalTotal && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '8px',
                        borderTop: `1px solid ${isDark ? '#4b5563' : '#e2e8f0'}`
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: isDark ? '#d1d5db' : '#374151'
                        }}>
                          Rendu:
                        </span>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#10b981'
                        }}>
                          {(parseFloat(amountDisplay) - cartStats.finalTotal).toLocaleString()} {appSettings.currency}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Calculatrice */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'exact', '0', 'clear'].map(btn => (
                      <button
                        key={btn}
                        onClick={() => updateAmountReceived(btn === 'exact' ? 'exact' : btn === 'clear' ? 'clear' : btn)}
                        style={{
                          padding: '12px',
                          border: 'none',
                          borderRadius: '6px',
                          background: btn === 'exact' 
                            ? 'linear-gradient(135deg, #10b981, #059669)'
                            : btn === 'clear'
                            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                            : isDark ? '#4b5563' : '#f3f4f6',
                          color: (btn === 'exact' || btn === 'clear') ? 'white' : (isDark ? '#f9fafb' : '#111827'),
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {btn === 'exact' ? 'Exact' : btn === 'clear' ? 'Effacer' : btn}
                      </button>
                    ))}
                  </div>

                  {/* Montants suggérés */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '6px'
                  }}>
                    {[5000, 10000, 20000, 50000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => updateAmountReceived(amount.toString())}
                        style={{
                          padding: '8px 4px',
                          border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                          borderRadius: '4px',
                          background: isDark ? '#374151' : 'white',
                          color: isDark ? '#d1d5db' : '#6b7280',
                          fontSize: '10px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        +{amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message crédit */}
              {paymentMethod === 'credit' && selectedCustomer.id === 1 && (
                <div style={{
                  background: '#fef3cd',
                  border: '1px solid #f59e0b',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#92400e'
                  }}>
                    <AlertTriangle size={16} />
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                      Veuillez sélectionner un client pour le paiement à crédit
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer modal */}
            <div style={{
              padding: '16px',
              borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              background: isDark ? '#111827' : '#f8fafc'
            }}>
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
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
        </div>
      )}
    </div>
  );
};

export default POSModule;
