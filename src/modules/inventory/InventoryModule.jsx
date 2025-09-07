import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package, AlertTriangle, TrendingDown, TrendingUp, BarChart3,
  Search, Plus, Minus, Edit, Save, X, Bell, Clock, Eye,
  RefreshCw, Trash, Download, Upload, Filter, Settings,
  Target, Zap, Activity, DollarSign, Truck, Calendar,
  ArrowUpDown, CheckCircle, XCircle, PieChart, LineChart
} from 'lucide-react';

// ==================== HOOKS PERSONNALISÉS ====================

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const useKeyboardShortcuts = (shortcuts, deps = []) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      shortcuts.forEach(({ key, action }) => {
        if (event.key === key) {
          event.preventDefault();
          action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, deps);
};

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue];
};

const useProductSearch = (products, searchQuery, selectedCategory) => {
  return useMemo(() => {
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
  }, [products, searchQuery, selectedCategory]);
};

const useCategories = (products) => {
  return useMemo(() => {
    const categoryCounts = products.reduce((acc, product) => {
      const category = product.category || 'Divers';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    const categoryList = [
      { id: 'all', name: 'Toutes', count: products.length }
    ];
    
    Object.entries(categoryCounts).forEach(([name, count]) => {
      categoryList.push({
        id: name.toLowerCase(),
        name,
        count
      });
    });
    
    return categoryList;
  }, [products]);
};

// ==================== COMPOSANTS UI AVEC STYLES INLINE ====================

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false, 
  leftIcon,
  style = {},
  ...props 
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '500',
    borderRadius: '8px',
    transition: 'all 0.2s',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontSize: size === 'sm' ? '14px' : size === 'lg' ? '16px' : '14px',
    padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 24px' : '8px 16px',
    ...style
  };

  const variants = {
    primary: {
      backgroundColor: '#3b82f6',
      color: 'white',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    },
    secondary: {
      backgroundColor: '#6b7280',
      color: 'white',
    },
    outline: {
      backgroundColor: 'white',
      color: '#374151',
      border: '1px solid #d1d5db',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    },
    danger: {
      backgroundColor: '#dc2626',
      color: 'white',
    },
    success: {
      backgroundColor: '#059669',
      color: 'white',
    },
    warning: {
      backgroundColor: '#d97706',
      color: 'white',
    }
  };

  const hoverStyles = {
    primary: { backgroundColor: '#2563eb' },
    secondary: { backgroundColor: '#4b5563' },
    outline: { backgroundColor: '#f9fafb' },
    danger: { backgroundColor: '#b91c1c' },
    success: { backgroundColor: '#047857' },
    warning: { backgroundColor: '#b45309' }
  };

  const [isHovered, setIsHovered] = useState(false);

  const finalStyles = {
    ...baseStyles,
    ...variants[variant],
    ...(isHovered && !disabled ? hoverStyles[variant] : {})
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={finalStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span style={{ marginRight: '8px' }}>{leftIcon}</span>}
      {children}
    </button>
  );
};

const Input = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = 'text',
  style = {},
  ...props 
}) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px'
        }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s',
          ...style
        }}
        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        {...props}
      />
    </div>
  );
};

const SearchInput = ({ 
  placeholder, 
  value, 
  onChange, 
  onClear 
}) => {
  return (
    <div style={{ position: 'relative' }}>
      <Search 
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#9ca3af',
          width: '20px',
          height: '20px'
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          paddingLeft: '44px',
          paddingRight: value ? '44px' : '12px',
          paddingTop: '12px',
          paddingBottom: '12px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
      />
      {value && (
        <button
          onClick={onClear}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '0'
          }}
        >
          <X style={{ width: '20px', height: '20px' }} />
        </button>
      )}
    </div>
  );
};

const Card = ({ children, style = {}, hover = false, ...props }) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardStyles = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: isHovered && hover ? '0 10px 25px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    transition: 'all 0.3s ease',
    ...style
  };

  return (
    <div
      style={cardStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </div>
  );
};

const Badge = ({ 
  children, 
  variant = 'secondary',
  style = {}
}) => {
  const variants = {
    primary: { backgroundColor: '#dbeafe', color: '#1e40af' },
    secondary: { backgroundColor: '#f3f4f6', color: '#374151' },
    success: { backgroundColor: '#d1fae5', color: '#065f46' },
    warning: { backgroundColor: '#fef3c7', color: '#92400e' },
    danger: { backgroundColor: '#fee2e2', color: '#991b1b' }
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: '500',
      ...variants[variant],
      ...style
    }}>
      {children}
    </span>
  );
};

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}) => {
  const sizes = {
    sm: '400px',
    md: '600px',
    lg: '800px',
    xl: '1200px'
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: '0',
      zIndex: '50',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: sizes[size],
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ padding: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: '0'
            }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X style={{ width: '24px', height: '24px' }} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

// Toast simplifié
const Toast = {
  success: (message) => {
    const toast = document.createElement('div');
    toast.innerHTML = `✅ ${message}`;
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 1000;
      background: #059669; color: white; padding: 12px 20px;
      border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      font-weight: 500; animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  },
  error: (message) => {
    const toast = document.createElement('div');
    toast.innerHTML = `❌ ${message}`;
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 1000;
      background: #dc2626; color: white; padding: 12px 20px;
      border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      font-weight: 500;
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  }
};

// ==================== DONNÉES MOCK ====================

const mockProducts = [
  {
    id: 1,
    name: "Coca-Cola 33cl",
    category: "Boissons",
    price: 500,
    costPrice: 300,
    stock: 45,
    minStock: 10,
    maxStock: 100,
    sku: "COC001",
    barcode: "1234567890",
    supplier: "Coca-Cola Company"
  },
  {
    id: 2,
    name: "Pain de mie",
    category: "Alimentaire",
    price: 800,
    costPrice: 600,
    stock: 2,
    minStock: 5,
    maxStock: 20,
    sku: "PDM001",
    supplier: "Boulangerie Martin"
  },
  {
    id: 3,
    name: "Savon Lux",
    category: "Hygiène",
    price: 1200,
    costPrice: 800,
    stock: 0,
    minStock: 8,
    maxStock: 30,
    sku: "SAV001",
    supplier: "Unilever"
  },
  {
    id: 4,
    name: "Biscuits Oreo",
    category: "Snacks",
    price: 600,
    costPrice: 400,
    stock: 25,
    minStock: 15,
    maxStock: 50,
    sku: "BIS001",
    supplier: "Mondelez"
  },
  {
    id: 5,
    name: "Shampoing Head & Shoulders",
    category: "Hygiène",
    price: 2500,
    costPrice: 1800,
    stock: 8,
    minStock: 5,
    maxStock: 25,
    sku: "SHA001",
    supplier: "P&G"
  }
];

const mockSalesHistory = [
  {
    id: 1,
    date: "2024-01-15",
    items: [
      { id: 1, name: "Coca-Cola 33cl", quantity: 5, price: 500 },
      { id: 2, name: "Pain de mie", quantity: 2, price: 800 }
    ]
  },
  {
    id: 2,
    date: "2024-01-14",
    items: [
      { id: 1, name: "Coca-Cola 33cl", quantity: 3, price: 500 },
      { id: 4, name: "Biscuits Oreo", quantity: 4, price: 600 }
    ]
  }
];

const mockAppSettings = {
  currency: 'FCFA',
  darkMode: false,
  taxRate: 18
};

// ==================== COMPOSANT PRINCIPAL ====================

const InventoryModulePro = () => {
  // États
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterBy, setFilterBy] = useLocalStorage('inventory-filters', {
    stockLevel: 'all',
    profitability: 'all'
  });

  // États des modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockingProduct, setRestockingProduct] = useState(null);

  // États pour l'ajout de produit
  const [newProduct, setNewProduct] = useState({
    name: '', category: '', price: '', costPrice: '', stock: '',
    minStock: '', maxStock: '', sku: '', barcode: '', supplier: ''
  });

  // Données
  const [products, setProducts] = useState(mockProducts);
  const salesHistory = mockSalesHistory;
  const appSettings = mockAppSettings;

  // Hooks personnalisés
  const debouncedSearch = useDebounce(searchQuery, 300);
  const categories = useCategories(products);
  const filteredProducts = useProductSearch(products, debouncedSearch, selectedCategory);

  // Raccourcis clavier
  useKeyboardShortcuts([
    { key: 'F1', action: () => setActiveTab('dashboard') },
    { key: 'F2', action: () => setActiveTab('products') },
    { key: 'F3', action: () => setShowAddModal(true) },
    { key: 'Escape', action: () => {
      setShowAddModal(false);
      setShowRestockModal(false);
    }}
  ], []);

  // Analytics
  const analytics = useMemo(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.costPrice || 0)), 0);
    const totalSalesValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);
    const potentialProfit = totalSalesValue - totalValue;
    
    const alerts = {
      outOfStock: products.filter(p => (p.stock || 0) === 0),
      lowStock: products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStock || 5))
    };
    
    const salesAnalysis = salesHistory
      .flatMap(sale => (sale.items || []))
      .reduce((acc, item) => {
        const existing = acc.find(a => a.productId === item.id);
        if (existing) {
          existing.soldQuantity += item.quantity;
          existing.revenue += item.price * item.quantity;
        } else {
          acc.push({
            productId: item.id,
            productName: item.name,
            soldQuantity: item.quantity,
            revenue: item.price * item.quantity
          });
        }
        return acc;
      }, []);

    const topSellers = salesAnalysis.sort((a, b) => b.soldQuantity - a.soldQuantity).slice(0, 5);
    const topRevenue = salesAnalysis.sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return {
      totals: { totalProducts, totalValue, totalSalesValue, potentialProfit },
      alerts,
      topSellers,
      topRevenue
    };
  }, [products, salesHistory]);

  // Fonctions
  const handleAddProduct = useCallback(async () => {
    if (!newProduct.name || !newProduct.price) {
      Toast.error('Nom et prix sont obligatoires');
      return;
    }

    const productData = {
      ...newProduct,
      id: Date.now(),
      price: parseFloat(newProduct.price) || 0,
      costPrice: parseFloat(newProduct.costPrice) || 0,
      stock: parseInt(newProduct.stock) || 0,
      minStock: parseInt(newProduct.minStock) || 5,
      maxStock: parseInt(newProduct.maxStock) || 100
    };

    setProducts(prev => [...prev, productData]);
    setNewProduct({
      name: '', category: '', price: '', costPrice: '', stock: '',
      minStock: '', maxStock: '', sku: '', barcode: '', supplier: ''
    });
    setShowAddModal(false);
    Toast.success('Produit ajouté avec succès!');
  }, [newProduct]);

  const handleRestock = useCallback(async (productId, quantity) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, stock: (product.stock || 0) + parseInt(quantity) }
        : product
    ));
    
    setRestockingProduct(null);
    setShowRestockModal(false);
    Toast.success(`Stock mis à jour: +${quantity} unités`);
  }, []);

  // Styles communs
  const containerStyle = {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: '#f9fafb',
    minHeight: '100vh'
  };

  const headerStyle = {
    marginBottom: '32px'
  };

  const titleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px'
  };

  const tabsStyle = {
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '24px'
  };

  const tabNavStyle = {
    display: 'flex',
    gap: '32px',
    marginBottom: '-1px'
  };

  const kpisGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  };

  const productsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px'
  };

  // Rendu du Dashboard ULTRA-MODERNE
const renderDashboard = () => {
  // Données pour les graphiques
  const stockDistribution = [
    { 
      label: 'Stock optimal', 
      value: products.filter(p => {
        const stock = p.stock || 0;
        const minStock = p.minStock || 5;
        const maxStock = p.maxStock || 50;
        return stock > minStock && stock <= maxStock;
      }).length, 
      color: '#059669' 
    },
    { label: 'Stock faible', value: analytics.alerts.lowStock.length, color: '#d97706' },
    { label: 'Rupture', value: analytics.alerts.outOfStock.length, color: '#dc2626' },
    { label: 'Surstock', value: products.filter(p => (p.stock || 0) > (p.maxStock || 50)).length, color: '#3b82f6' }
  ];

  // Données de vente simulées pour le graphique de tendance
  const salesTrend = [12, 19, 15, 22, 18, 25, 20, 28, 24, 30, 26, 32];

  return (
    <div>
      {/* CSS pour les animations */}
      <style>
        {`
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
          }
          @keyframes slideInUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .slide-in-up {
            animation: slideInUp 0.6s ease-out;
          }
        `}
      </style>

      {/* En-tête avec statistiques rapides */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            margin: '0 0 8px 0'
          }}>
            🎯 Dashboard Inventaire Pro
          </h2>
          <p style={{
            fontSize: '16px',
            opacity: 0.9,
            margin: '0 0 24px 0'
          }}>
            Vue d'ensemble en temps réel de votre stock
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>
                {analytics.totals.totalProducts}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>📦 Produits actifs</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>
                {Math.round(analytics.totals.totalValue / 1000)}K
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>💰 Valeur stock</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>
                {((analytics.totals.potentialProfit / analytics.totals.totalValue) * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>📈 Marge moyenne</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>
                {analytics.alerts.outOfStock.length + analytics.alerts.lowStock.length}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>🚨 Alertes actives</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Principaux avec design moderne */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <Card style={{ 
          padding: '24px', 
          background: 'linear-gradient(135deg, #05966915 0%, #05966905 100%)',
          border: '1px solid #05966920',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle, #05966910 0%, transparent 70%)',
            animation: 'pulse 4s ease-in-out infinite'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  margin: '0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  💰 Valeur Totale Stock
                </p>
              </div>
              <div style={{
                padding: '12px',
                backgroundColor: '#05966915',
                borderRadius: '12px'
              }}>
                <DollarSign style={{ width: '24px', height: '24px', color: '#059669' }} />
              </div>
            </div>

            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '8px'
            }}>
              {analytics.totals.totalValue.toLocaleString()} FCFA
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <TrendingUp style={{ width: '16px', height: '16px', color: '#059669' }} />
              <span style={{
                fontSize: '14px',
                color: '#059669',
                fontWeight: '500'
              }}>
                +12.5% vs mois dernier
              </span>
            </div>
          </div>
        </Card>

        <Card style={{ 
          padding: '24px', 
          background: 'linear-gradient(135deg, #7c3aed15 0%, #7c3aed05 100%)',
          border: '1px solid #7c3aed20',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle, #7c3aed10 0%, transparent 70%)',
            animation: 'pulse 4s ease-in-out infinite'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  margin: '0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  🎯 Profit Potentiel
                </p>
              </div>
              <div style={{
                padding: '12px',
                backgroundColor: '#7c3aed15',
                borderRadius: '12px'
              }}>
                <TrendingUp style={{ width: '24px', height: '24px', color: '#7c3aed' }} />
              </div>
            </div>

            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '8px'
            }}>
              {analytics.totals.potentialProfit.toLocaleString()} FCFA
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <TrendingUp style={{ width: '16px', height: '16px', color: '#7c3aed' }} />
              <span style={{
                fontSize: '14px',
                color: '#7c3aed',
                fontWeight: '500'
              }}>
                +8.2% vs mois dernier
              </span>
            </div>
          </div>
        </Card>

        <Card style={{ 
          padding: '24px', 
          background: 'linear-gradient(135deg, #3b82f615 0%, #3b82f605 100%)',
          border: '1px solid #3b82f620',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  margin: '0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  📦 Produits Total
                </p>
              </div>
              <div style={{
                padding: '12px',
                backgroundColor: '#3b82f615',
                borderRadius: '12px'
              }}>
                <Package style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
              </div>
            </div>

            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '8px'
            }}>
              {analytics.totals.totalProducts}
            </div>
          </div>
        </Card>

        <Card style={{ 
          padding: '24px', 
          background: 'linear-gradient(135deg, #dc262615 0%, #dc262605 100%)',
          border: '1px solid #dc262620',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  margin: '0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  🚨 Alertes
                </p>
              </div>
              <div style={{
                padding: '12px',
                backgroundColor: '#dc262615',
                borderRadius: '12px'
              }}>
                <AlertTriangle style={{ width: '24px', height: '24px', color: '#dc2626' }} />
              </div>
            </div>

            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#dc2626',
              marginBottom: '8px'
            }}>
              {analytics.alerts.outOfStock.length + analytics.alerts.lowStock.length}
            </div>
          </div>
        </Card>
      </div>

      {/* Alertes Stock Critiques - Version Moderne */}
      {(analytics.alerts.outOfStock.length > 0 || analytics.alerts.lowStock.length > 0) && (
        <Card style={{
          padding: '0',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fff 100%)',
          border: '1px solid #fecaca',
          overflow: 'hidden',
          marginBottom: '32px'
        }}>
          <div style={{
            padding: '20px 24px',
            background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
            color: 'white'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                padding: '8px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '8px'
              }}>
                <Bell style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  🚨 Alertes Stock Critiques
                </h3>
                <p style={{
                  fontSize: '14px',
                  margin: '0',
                  opacity: 0.9
                }}>
                  {analytics.alerts.outOfStock.length + analytics.alerts.lowStock.length} produit{(analytics.alerts.outOfStock.length + analytics.alerts.lowStock.length) > 1 ? 's' : ''} nécessite{(analytics.alerts.outOfStock.length + analytics.alerts.lowStock.length) > 1 ? 'nt' : ''} votre attention
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...analytics.alerts.outOfStock, ...analytics.alerts.lowStock].slice(0, 3).map((product, index) => (
                <div
                  key={product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #fecaca',
                    transform: `translateX(${index * 2}px)`,
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: product.stock === 0 ? '#dc2626' : '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {product.stock === 0 ? 
                        <X style={{ width: '20px', height: '20px', color: 'white' }} /> :
                        <AlertTriangle style={{ width: '20px', height: '20px', color: 'white' }} />
                      }
                    </div>
                    <div>
                      <p style={{ fontWeight: '600', color: '#111827', margin: '0 0 2px 0' }}>
                        {product.name}
                      </p>
                      <p style={{ fontSize: '14px', color: '#dc2626', margin: '0' }}>
                        {product.stock === 0 ? 'Rupture de stock' : `Stock faible (${product.stock} restant${product.stock > 1 ? 's' : ''})`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setRestockingProduct(product);
                      setShowRestockModal(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                      border: 'none',
                      boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                    }}
                  >
                    🔄 Réapprovisionner
                  </Button>
                </div>
              ))}
              
              {(analytics.alerts.outOfStock.length + analytics.alerts.lowStock.length) > 3 && (
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  +{(analytics.alerts.outOfStock.length + analytics.alerts.lowStock.length) - 3} autre{(analytics.alerts.outOfStock.length + analytics.alerts.lowStock.length) - 3 > 1 ? 's' : ''} alerte{(analytics.alerts.outOfStock.length + analytics.alerts.lowStock.length) - 3 > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Section Analytics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth > 1024 ? '2fr 1fr' : '1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Graphique de tendance simulé */}
        <Card style={{ padding: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 4px 0'
              }}>
                📈 Tendance des Ventes
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '0'
              }}>
                Évolution sur les 12 derniers mois
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px'
            }}>
              <TrendingUp style={{ width: '16px', height: '16px', color: '#059669' }} />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#059669' }}>
                +18.5%
              </span>
            </div>
          </div>
          
          {/* Graphique simulé avec barres */}
          <div style={{ 
            height: '160px', 
            display: 'flex', 
            alignItems: 'end', 
            gap: '8px',
            padding: '20px 0'
          }}>
            {salesTrend.map((value, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: `${(value / Math.max(...salesTrend)) * 100}%`,
                  backgroundColor: index === salesTrend.length - 1 ? '#3b82f6' : '#e5e7eb',
                  borderRadius: '4px 4px 0 0',
                  minHeight: '4px',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>
                {salesTrend[salesTrend.length - 1]}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Ce mois</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
                {Math.round(salesTrend.reduce((a, b) => a + b) / salesTrend.length)}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Moyenne</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#7c3aed' }}>
                {Math.max(...salesTrend)}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Record</div>
            </div>
          </div>
        </Card>

        {/* Distribution des stocks */}
        <Card style={{ padding: '24px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            📊 Distribution des Stocks
          </h3>
          
          {/* Graphique circulaire simulé */}
          <div style={{
            width: '140px',
            height: '140px',
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: `conic-gradient(
              #059669 0deg ${(stockDistribution[0].value / analytics.totals.totalProducts) * 360}deg,
              #d97706 ${(stockDistribution[0].value / analytics.totals.totalProducts) * 360}deg ${((stockDistribution[0].value + stockDistribution[1].value) / analytics.totals.totalProducts) * 360}deg,
              #dc2626 ${((stockDistribution[0].value + stockDistribution[1].value) / analytics.totals.totalProducts) * 360}deg ${((stockDistribution[0].value + stockDistribution[1].value + stockDistribution[2].value) / analytics.totals.totalProducts) * 360}deg,
              #3b82f6 ${((stockDistribution[0].value + stockDistribution[1].value + stockDistribution[2].value) / analytics.totals.totalProducts) * 360}deg 360deg
            )`,
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60px',
              height: '60px',
              backgroundColor: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                {analytics.totals.totalProducts}
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>
                Total
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stockDistribution.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    backgroundColor: item.color
                  }} />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    {item.label}
                  </span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
 // Rendu des Produits
 const renderProducts = () => (
   <div>
     {/* Barre d'actions */}
     <div style={{
       display: 'flex',
       flexDirection: window.innerWidth < 768 ? 'column' : 'row',
       gap: '16px',
       alignItems: window.innerWidth < 768 ? 'stretch' : 'center',
       justifyContent: 'space-between',
       marginBottom: '24px'
     }}>
       <div style={{ flex: '1', maxWidth: '400px' }}>
         <SearchInput
           placeholder="Rechercher par nom, SKU, code-barre..."
           value={searchQuery}
           onChange={setSearchQuery}
           onClear={() => setSearchQuery('')}
         />
       </div>
       
       <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
         <Button
           variant="outline"
           onClick={() => setShowFilters(!showFilters)}
           leftIcon={<Filter style={{ width: '16px', height: '16px' }} />}
         >
           Filtres
         </Button>
         <Button
           variant="outline"
           leftIcon={<Upload style={{ width: '16px', height: '16px' }} />}
         >
           Importer
         </Button>
         <Button
           variant="primary"
           onClick={() => setShowAddModal(true)}
           leftIcon={<Plus style={{ width: '16px', height: '16px' }} />}
         >
           Ajouter Produit
         </Button>
       </div>
     </div>

     {/* Filtres avancés */}
     {showFilters && (
       <Card style={{ padding: '16px', marginBottom: '24px' }}>
         <div style={{
           display: 'grid',
           gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
           gap: '16px'
         }}>
           <div>
             <label style={{
               display: 'block',
               fontSize: '14px',
               fontWeight: '500',
               marginBottom: '8px'
             }}>
               Niveau de Stock
             </label>
             <select 
               value={filterBy.stockLevel}
               onChange={(e) => setFilterBy(prev => ({ ...prev, stockLevel: e.target.value }))}
               style={{
                 width: '100%',
                 padding: '8px',
                 border: '1px solid #d1d5db',
                 borderRadius: '6px',
                 backgroundColor: 'white'
               }}
             >
               <option value="all">Tous</option>
               <option value="out">Rupture</option>
               <option value="low">Stock faible</option>
               <option value="good">Stock optimal</option>
               <option value="over">Surstock</option>
             </select>
           </div>
           
           <div>
             <label style={{
               display: 'block',
               fontSize: '14px',
               fontWeight: '500',
               marginBottom: '8px'
             }}>
               Catégorie
             </label>
             <select 
               value={selectedCategory}
               onChange={(e) => setSelectedCategory(e.target.value)}
               style={{
                 width: '100%',
                 padding: '8px',
                 border: '1px solid #d1d5db',
                 borderRadius: '6px',
                 backgroundColor: 'white'
               }}
             >
               {categories.map(category => (
                 <option key={category.id} value={category.id}>
                   {category.name} ({category.count})
                 </option>
               ))}
             </select>
           </div>
         </div>
       </Card>
     )}

     {/* Grille des produits */}
     <div style={productsGridStyle}>
       {filteredProducts.map(product => {
         const stock = product.stock || 0;
         const minStock = product.minStock || 5;
         const stockStatus = stock === 0 ? 'out' : stock <= minStock ? 'low' : 'good';
         const margin = product.price && product.costPrice 
           ? ((product.price - product.costPrice) / product.price) * 100 
           : 0;

         return (
           <Card key={product.id} style={{ padding: '16px' }} hover>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {/* En-tête produit */}
               <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                 <div style={{ flex: '1' }}>
                   <h4 style={{
                     fontWeight: '600',
                     color: '#111827',
                     margin: '0 0 4px 0',
                     fontSize: '16px',
                     lineHeight: '1.4'
                   }}>
                     {product.name}
                   </h4>
                   <p style={{
                     fontSize: '14px',
                     color: '#6b7280',
                     margin: '0'
                   }}>
                     {product.category || 'Sans catégorie'}
                   </p>
                 </div>
                 <Badge 
                   variant={
                     stockStatus === 'out' ? 'danger' : 
                     stockStatus === 'low' ? 'warning' : 'success'
                   }
                 >
                   {stock} en stock
                 </Badge>
               </div>

               {/* Prix et marge */}
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <div>
                   <p style={{
                     fontSize: '18px',
                     fontWeight: 'bold',
                     color: '#111827',
                     margin: '0'
                   }}>
                     {product.price?.toLocaleString()} {appSettings.currency}
                   </p>
                   {product.costPrice && (
                     <p style={{
                       fontSize: '14px',
                       color: '#6b7280',
                       margin: '0'
                     }}>
                       Marge: {margin.toFixed(1)}%
                     </p>
                   )}
                 </div>
                 
                 <div style={{ display: 'flex', gap: '4px' }}>
                   <Button
                     variant="outline"
                     size="sm"
                     style={{ padding: '6px' }}
                   >
                     <Edit style={{ width: '16px', height: '16px' }} />
                   </Button>
                   <Button
                     variant="primary"
                     size="sm"
                     style={{ padding: '6px' }}
                     onClick={() => {
                       setRestockingProduct(product);
                       setShowRestockModal(true);
                     }}
                   >
                     <Plus style={{ width: '16px', height: '16px' }} />
                   </Button>
                 </div>
               </div>

               {/* Barre de progression du stock */}
               <div>
                 <div style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   fontSize: '12px',
                   color: '#6b7280',
                   marginBottom: '4px'
                 }}>
                   <span>Stock</span>
                   <span>{stock}/{product.maxStock || '∞'}</span>
                 </div>
                 <div style={{
                   width: '100%',
                   backgroundColor: '#e5e7eb',
                   borderRadius: '4px',
                   height: '8px',
                   overflow: 'hidden'
                 }}>
                   <div 
                     style={{
                       height: '8px',
                       borderRadius: '4px',
                       transition: 'all 0.3s',
                       backgroundColor: 
                         stockStatus === 'out' ? '#dc2626' :
                         stockStatus === 'low' ? '#d97706' : '#059669',
                       width: `${Math.min((stock / (product.maxStock || stock + 10)) * 100, 100)}%`
                     }}
                   />
                 </div>
               </div>
             </div>
           </Card>
         );
       })}
     </div>

     {filteredProducts.length === 0 && (
       <div style={{
         textAlign: 'center',
         padding: '48px 0',
         color: '#6b7280'
       }}>
         <Package style={{
           width: '48px',
           height: '48px',
           color: '#9ca3af',
           margin: '0 auto 16px'
         }} />
         <h3 style={{
           fontSize: '18px',
           fontWeight: '500',
           color: '#111827',
           marginBottom: '8px'
         }}>
           Aucun produit trouvé
         </h3>
         <p style={{ color: '#6b7280' }}>
           Essayez de modifier vos filtres ou d'ajouter des produits
         </p>
       </div>
     )}
   </div>
 );

 // Modal d'ajout de produit
 const renderAddProductModal = () => (
   <Modal
     isOpen={showAddModal}
     onClose={() => setShowAddModal(false)}
     title="Ajouter un Nouveau Produit"
     size="lg"
   >
     <div>
       <div style={{
         display: 'grid',
         gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
         gap: '16px'
       }}>
         <Input
           label="Nom du produit *"
           value={newProduct.name}
           onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
           placeholder="Ex: Coca-Cola 33cl"
         />
         
         <Input
           label="Catégorie"
           value={newProduct.category}
           onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
           placeholder="Ex: Boissons"
         />
       </div>

       <div style={{
         display: 'grid',
         gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr 1fr',
         gap: '16px'
       }}>
         <Input
           label="Prix de vente *"
           type="number"
           value={newProduct.price}
           onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
           placeholder="0"
           min="0"
           step="0.01"
         />
         
         <Input
           label="Prix d'achat"
           type="number"
           value={newProduct.costPrice}
           onChange={(e) => setNewProduct({...newProduct, costPrice: e.target.value})}
           placeholder="0"
           min="0"
           step="0.01"
         />
         
         <Input
           label="Stock initial"
           type="number"
           value={newProduct.stock}
           onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
           placeholder="0"
           min="0"
         />
       </div>

       <div style={{
         display: 'grid',
         gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
         gap: '16px'
       }}>
         <Input
           label="Stock minimum"
           type="number"
           value={newProduct.minStock}
           onChange={(e) => setNewProduct({...newProduct, minStock: e.target.value})}
           placeholder="5"
           min="0"
         />
         
         <Input
           label="Stock maximum"
           type="number"
           value={newProduct.maxStock}
           onChange={(e) => setNewProduct({...newProduct, maxStock: e.target.value})}
           placeholder="100"
           min="0"
         />
       </div>

       <div style={{
         display: 'grid',
         gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
         gap: '16px'
       }}>
         <Input
           label="SKU"
           value={newProduct.sku}
           onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
           placeholder="Généré automatiquement"
         />
         
         <Input
           label="Code-barre"
           value={newProduct.barcode}
           onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
           placeholder="Optionnel"
         />
       </div>

       <Input
         label="Fournisseur"
         value={newProduct.supplier}
         onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})}
         placeholder="Nom du fournisseur"
       />

       <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
         <Button
           variant="outline"
           onClick={() => setShowAddModal(false)}
           style={{ flex: '1' }}
         >
           Annuler
         </Button>
         <Button
           variant="primary"
           onClick={handleAddProduct}
           disabled={!newProduct.name || !newProduct.price}
           style={{ flex: '1' }}
         >
           Ajouter le Produit
         </Button>
       </div>
     </div>
   </Modal>
 );

 // Modal de réapprovisionnement
 const renderRestockModal = () => {
   const [quantity, setQuantity] = useState('');
   const [reason, setReason] = useState('Réapprovisionnement manuel');

   return (
     <Modal
       isOpen={showRestockModal}
       onClose={() => setShowRestockModal(false)}
       title={`Réapprovisionner: ${restockingProduct?.name}`}
     >
       <div>
         <div style={{
           padding: '16px',
           backgroundColor: '#f9fafb',
           borderRadius: '8px',
           marginBottom: '16px'
         }}>
           <div style={{
             display: 'grid',
             gridTemplateColumns: '1fr 1fr',
             gap: '16px'
           }}>
             <div>
               <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Stock actuel</p>
               <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>
                 {restockingProduct?.stock || 0}
               </p>
             </div>
             <div>
               <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Stock minimum</p>
               <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', margin: '0' }}>
                 {restockingProduct?.minStock || 5}
               </p>
             </div>
           </div>
         </div>

         <Input
           label="Quantité à ajouter"
           type="number"
           value={quantity}
           onChange={(e) => setQuantity(e.target.value)}
           placeholder="0"
           min="1"
         />

         <div style={{ marginBottom: '16px' }}>
           <label style={{
             display: 'block',
             fontSize: '14px',
             fontWeight: '500',
             marginBottom: '8px'
           }}>
             Motif
           </label>
           <select 
             value={reason}
             onChange={(e) => setReason(e.target.value)}
             style={{
               width: '100%',
               padding: '12px',
               border: '1px solid #d1d5db',
               borderRadius: '8px',
               backgroundColor: 'white'
             }}
           >
             <option value="Réapprovisionnement manuel">Réapprovisionnement manuel</option>
             <option value="Livraison fournisseur">Livraison fournisseur</option>
             <option value="Transfert magasin">Transfert magasin</option>
             <option value="Correction inventaire">Correction inventaire</option>
             <option value="Retour client">Retour client</option>
           </select>
         </div>

         {quantity && (
           <div style={{
             padding: '12px',
             backgroundColor: '#f0fdf4',
             borderRadius: '8px',
             marginBottom: '16px'
           }}>
             <p style={{ fontSize: '14px', color: '#059669', margin: '0' }}>
               Nouveau stock: {(parseInt(restockingProduct?.stock || 0) + parseInt(quantity)).toLocaleString()} unités
             </p>
           </div>
         )}

         <div style={{ display: 'flex', gap: '12px' }}>
           <Button
             variant="outline"
             onClick={() => setShowRestockModal(false)}
             style={{ flex: '1' }}
           >
             Annuler
           </Button>
           <Button
             variant="primary"
             onClick={() => handleRestock(restockingProduct?.id, quantity)}
             disabled={!quantity || parseInt(quantity) <= 0}
             style={{ flex: '1' }}
           >
             Confirmer Réapprovisionnement
           </Button>
         </div>
       </div>
     </Modal>
   );
 };

 return (
   <div style={containerStyle}>
     {/* En-tête */}
     <div style={headerStyle}>
       <div style={titleStyle}>
         <Package style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
         <h1 style={{
           fontSize: '32px',
           fontWeight: 'bold',
           color: '#111827',
           margin: '0'
         }}>
           Gestion Inventaire Pro
         </h1>
       </div>
       <p style={{
         color: '#6b7280',
         fontSize: '16px',
         margin: '0'
       }}>
         Interface professionnelle avec analytics, prédictions IA et automatisations
       </p>
     </div>

     {/* Navigation par onglets */}
     <div style={tabsStyle}>
       <nav style={tabNavStyle}>
         {[
           { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
           { id: 'products', name: 'Produits', icon: Package },
           { id: 'movements', name: 'Mouvements', icon: Activity },
           { id: 'analytics', name: 'Analytics', icon: PieChart },
           { id: 'automation', name: 'Automatisation', icon: Zap }
         ].map((tab) => {
           const Icon = tab.icon;
           const isActive = activeTab === tab.id;
           
           return (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '8px',
                 padding: '16px 4px',
                 borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                 fontWeight: '500',
                 fontSize: '14px',
                 color: isActive ? '#3b82f6' : '#6b7280',
                 background: 'none',
                 border: 'none',
                 cursor: 'pointer',
                 transition: 'color 0.2s'
               }}
               onMouseEnter={(e) => {
                 if (!isActive) e.target.style.color = '#374151';
               }}
               onMouseLeave={(e) => {
                 if (!isActive) e.target.style.color = '#6b7280';
               }}
             >
               <Icon style={{ width: '20px', height: '20px' }} />
               {tab.name}
             </button>
           );
         })}
       </nav>
     </div>

     {/* Contenu des onglets */}
     <div style={{ minHeight: '600px' }}>
       {activeTab === 'dashboard' && renderDashboard()}
       {activeTab === 'products' && renderProducts()}
       {activeTab === 'movements' && (
         <Card style={{ padding: '24px', textAlign: 'center' }}>
           <Activity style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 16px' }} />
           <h3>Mouvements de Stock</h3>
           <p style={{ color: '#6b7280' }}>Fonctionnalité en développement</p>
         </Card>
       )}
       {activeTab === 'analytics' && (
         <Card style={{ padding: '24px', textAlign: 'center' }}>
           <PieChart style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 16px' }} />
           <h3>Analytics Avancés</h3>
           <p style={{ color: '#6b7280' }}>Fonctionnalité en développement</p>
         </Card>
       )}
       {activeTab === 'automation' && (
         <Card style={{ padding: '24px', textAlign: 'center' }}>
           <Zap style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 16px' }} />
           <h3>Automatisation</h3>
           <p style={{ color: '#6b7280' }}>Fonctionnalité en développement</p>
         </Card>
       )}
     </div>

     {/* Modals */}
     {showAddModal && renderAddProductModal()}
     {showRestockModal && renderRestockModal()}
   </div>
 );
};

export default InventoryModulePro;
