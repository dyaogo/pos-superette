import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package, AlertTriangle, TrendingDown, TrendingUp, BarChart3,
  Search, Plus, Minus, Edit, Save, X, Bell, Clock, Eye,
  RefreshCw, Trash, Download, Upload, Filter, Settings,
  Target, Zap, Activity, DollarSign, Truck, Calendar,
  ArrowUpDown, CheckCircle, XCircle, PieChart, LineChart
} from 'lucide-react';

// ==================== HOOKS PERSONNALISÉS ====================

// Hook pour le debouncing
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

// Hook pour les raccourcis clavier
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

// Hook pour le localStorage
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

// Hook pour la recherche de produits
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

// Hook pour les catégories
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

// ==================== COMPOSANTS UI ====================

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false, 
  leftIcon,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500",
    outline: "border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-blue-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
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
  className = '',
  ...props 
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        {...props}
      />
    </div>
  );
};

const NumberInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  min,
  step = "1",
  className = '',
  ...props 
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        {...props}
      />
    </div>
  );
};

const SearchInput = ({ 
  placeholder, 
  value, 
  onChange, 
  onClear,
  className = '' 
}) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const Badge = ({ 
  children, 
  variant = 'secondary',
  className = '' 
}) => {
  const variants = {
    primary: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
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
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizes[size]} sm:w-full`}>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant Toast pour les notifications
const Toast = {
  success: (message) => {
    console.log('✅ Success:', message);
    alert(`✅ ${message}`);
  },
  error: (message) => {
    console.log('❌ Error:', message);
    alert(`❌ ${message}`);
  },
  info: (message) => {
    console.log('ℹ️ Info:', message);
    alert(`ℹ️ ${message}`);
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
    supplier: "Coca-Cola Company",
    createdAt: "2024-01-01"
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
    supplier: "Boulangerie Martin",
    createdAt: "2024-01-02"
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
    supplier: "Unilever",
    createdAt: "2024-01-03"
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
    supplier: "Mondelez",
    createdAt: "2024-01-04"
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
    supplier: "P&G",
    createdAt: "2024-01-05"
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
  // États avec hooks optimisés
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterBy, setFilterBy] = useLocalStorage('inventory-filters', {
    stockLevel: 'all',
    profitability: 'all',
    movement: 'all'
  });

  // États des modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showPredictionsModal, setShowPredictionsModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [restockingProduct, setRestockingProduct] = useState(null);

  // États pour l'ajout de produit
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    costPrice: '',
    stock: '',
    minStock: '',
    maxStock: '',
    sku: '',
    barcode: '',
    supplier: '',
    description: ''
  });

  // Données (remplacent les imports du contexte)
  const [products, setProducts] = useState(mockProducts);
  const salesHistory = mockSalesHistory;
  const appSettings = mockAppSettings;
  const currentStoreId = 'store-1';

  // Hooks personnalisés optimisés
  const debouncedSearch = useDebounce(searchQuery, 300);
  const categories = useCategories(products);
  const filteredProducts = useProductSearch(products, debouncedSearch, selectedCategory);

  // Raccourcis clavier professionnels
  useKeyboardShortcuts([
    { key: 'F1', action: () => setActiveTab('dashboard') },
    { key: 'F2', action: () => setActiveTab('products') },
    { key: 'F3', action: () => setShowAddModal(true) },
    { key: 'F4', action: () => console.log('Import modal would open') },
    { key: 'Escape', action: () => closeAllModals() }
  ], []);

  // Analytics et statistiques avancées
  const analytics = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    // Calculs de base
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.costPrice || 0)), 0);
    const totalSalesValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);
    const potentialProfit = totalSalesValue - totalValue;
    
    // Alertes de stock intelligentes
    const alerts = {
      outOfStock: products.filter(p => (p.stock || 0) === 0),
      lowStock: products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStock || 5)),
      overStock: products.filter(p => (p.maxStock || 0) > 0 && (p.stock || 0) > (p.maxStock || 50)),
      expiring: products.filter(p => p.expiryDate && new Date(p.expiryDate) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))
    };
    
    // Analyse des ventes pour prédictions
    const salesAnalysis = salesHistory
      .filter(sale => new Date(sale.date) >= oneMonthAgo)
      .flatMap(sale => (sale.items || []))
      .reduce((acc, item) => {
        const existing = acc.find(a => a.productId === item.id);
        if (existing) {
          existing.soldQuantity += item.quantity;
          existing.revenue += item.price * item.quantity;
          existing.salesCount += 1;
        } else {
          acc.push({
            productId: item.id,
            productName: item.name,
            soldQuantity: item.quantity,
            revenue: item.price * item.quantity,
            salesCount: 1
          });
        }
        return acc;
      }, []);

    // Top performers
    const topSellers = salesAnalysis
      .sort((a, b) => b.soldQuantity - a.soldQuantity)
      .slice(0, 5);
      
    const topRevenue = salesAnalysis
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Prédictions de réapprovisionnement
    const predictions = products.map(product => {
      const sales = salesAnalysis.find(s => s.productId === product.id);
      const avgDailySales = sales ? sales.soldQuantity / 30 : 0;
      const daysUntilEmpty = avgDailySales > 0 ? (product.stock || 0) / avgDailySales : Infinity;
      
      return {
        ...product,
        avgDailySales,
        daysUntilEmpty,
        suggestedReorder: Math.ceil(avgDailySales * 14),
        urgency: daysUntilEmpty <= 7 ? 'high' : daysUntilEmpty <= 14 ? 'medium' : 'low'
      };
    }).filter(p => p.urgency !== 'low' && p.avgDailySales > 0)
      .sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty);

    return {
      totals: { totalProducts, totalValue, totalSalesValue, potentialProfit },
      alerts,
      salesAnalysis,
      topSellers,
      topRevenue,
      predictions
    };
  }, [products, salesHistory]);

  // Fermer toutes les modals
  const closeAllModals = useCallback(() => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowRestockModal(false);
    setShowPredictionsModal(false);
    setEditingProduct(null);
    setRestockingProduct(null);
  }, []);

  // Gestion de l'ajout de produit
  const handleAddProduct = useCallback(async () => {
    if (!newProduct.name || !newProduct.price) {
      alert('Nom et prix sont obligatoires');
      return;
    }

    try {
      const productData = {
        ...newProduct,
        id: Date.now(),
        price: parseFloat(newProduct.price) || 0,
        costPrice: parseFloat(newProduct.costPrice) || 0,
        stock: parseInt(newProduct.stock) || 0,
        minStock: parseInt(newProduct.minStock) || 5,
        maxStock: parseInt(newProduct.maxStock) || 100,
        createdAt: new Date().toISOString(),
        storeId: currentStoreId
      };

      setProducts(prev => [...prev, productData]);
      setNewProduct({
        name: '', category: '', price: '', costPrice: '', stock: '',
        minStock: '', maxStock: '', sku: '', barcode: '', supplier: '', description: ''
      });
      setShowAddModal(false);
      
      Toast.success('Produit ajouté avec succès!');
    } catch (error) {
      Toast.error('Erreur lors de l\'ajout du produit');
    }
  }, [newProduct, currentStoreId]);

  // Gestion du réapprovisionnement
  const handleRestock = useCallback(async (productId, quantity, reason = 'Réapprovisionnement') => {
    try {
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, stock: (product.stock || 0) + parseInt(quantity) }
          : product
      ));
      
      setRestockingProduct(null);
      setShowRestockModal(false);
      Toast.success(`Stock mis à jour: +${quantity} unités`);
    } catch (error) {
      Toast.error('Erreur lors du réapprovisionnement');
    }
  }, []);
  // Filtrage avancé des produits
  const advancedFilteredProducts = useMemo(() => {
    return filteredProducts.filter(product => {
      // Filtre niveau de stock
      if (filterBy.stockLevel !== 'all') {
        const stock = product.stock || 0;
        const minStock = product.minStock || 5;
        const maxStock = product.maxStock || 50;
        
        switch (filterBy.stockLevel) {
          case 'out': if (stock !== 0) return false; break;
          case 'low': if (stock === 0 || stock > minStock) return false; break;
          case 'good': if (stock <= minStock || stock > maxStock) return false; break;
          case 'over': if (stock <= maxStock) return false; break;
        }
      }

      // Filtre rentabilité
      if (filterBy.profitability !== 'all') {
        const margin = product.price && product.costPrice 
          ? ((product.price - product.costPrice) / product.price) * 100
          : 0;
        
        switch (filterBy.profitability) {
          case 'high': if (margin < 30) return false; break;
          case 'medium': if (margin < 15 || margin >= 30) return false; break;
          case 'low': if (margin >= 15) return false; break;
        }
      }

      return true;
    });
  }, [filteredProducts, filterBy]);

  // Rendu du Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Produits Total
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totals.totalProducts}
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Valeur Stock
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totals.totalValue.toLocaleString()} {appSettings.currency}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Profit Potentiel
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totals.potentialProfit.toLocaleString()} {appSettings.currency}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Alertes
              </p>
              <p className="text-2xl font-bold text-red-600">
                {analytics.alerts.outOfStock.length + analytics.alerts.lowStock.length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Alertes Intelligentes */}
      {(analytics.alerts.outOfStock.length > 0 || analytics.alerts.lowStock.length > 0) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-red-500" />
            Alertes Stock Critiques
          </h3>
          <div className="space-y-3">
            {[...analytics.alerts.outOfStock, ...analytics.alerts.lowStock].map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-800">{product.name}</p>
                    <p className="text-sm text-red-600">
                      {product.stock === 0 ? 'Rupture de stock' : 'Stock faible'}
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
                >
                  Réapprovisionner
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Prédictions IA */}
      {analytics.predictions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Prédictions de Réapprovisionnement
          </h3>
          <div className="space-y-3">
            {analytics.predictions.slice(0, 5).map(prediction => (
              <div key={prediction.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className={`h-5 w-5 ${
                    prediction.urgency === 'high' ? 'text-red-500' :
                    prediction.urgency === 'medium' ? 'text-yellow-500' : 'text-green-500'
                  }`} />
                  <div>
                    <p className="font-medium">{prediction.name}</p>
                    <p className="text-sm text-gray-600">
                      Épuisement estimé: {Math.ceil(prediction.daysUntilEmpty)} jours
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{prediction.suggestedReorder} unités</p>
                  <p className="text-sm text-gray-600">Recommandé</p>
                </div>
              </div>
            ))}
          </div>
          <Button 
            variant="outline" 
            className="mt-4 w-full"
            onClick={() => setShowPredictionsModal(true)}
          >
            Voir toutes les prédictions
          </Button>
        </Card>
      )}

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Ventes (Quantité)</h3>
          <div className="space-y-3">
            {analytics.topSellers.map((item, index) => (
              <div key={item.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={index === 0 ? 'success' : 'secondary'}>
                    #{index + 1}
                  </Badge>
                  <span className="font-medium">{item.productName}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {item.soldQuantity} vendues
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Revenus</h3>
          <div className="space-y-3">
            {analytics.topRevenue.map((item, index) => (
              <div key={item.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={index === 0 ? 'success' : 'secondary'}>
                    #{index + 1}
                  </Badge>
                  <span className="font-medium">{item.productName}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {item.revenue.toLocaleString()} {appSettings.currency}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  // Rendu de la liste des produits
  const renderProducts = () => (
    <div className="space-y-6">
      {/* Barre d'actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <SearchInput
            placeholder="Rechercher par nom, SKU, code-barre..."
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filtres
          </Button>
          <Button
            variant="outline"
            onClick={() => console.log('Import modal would open')}
            leftIcon={<Upload className="h-4 w-4" />}
          >
            Importer
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Ajouter Produit
          </Button>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Niveau de Stock</label>
              <select 
                value={filterBy.stockLevel}
                onChange={(e) => setFilterBy(prev => ({ ...prev, stockLevel: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="all">Tous</option>
                <option value="out">Rupture</option>
                <option value="low">Stock faible</option>
                <option value="good">Stock optimal</option>
                <option value="over">Surstock</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Rentabilité</label>
              <select 
                value={filterBy.profitability}
                onChange={(e) => setFilterBy(prev => ({ ...prev, profitability: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="all">Toutes</option>
                <option value="high">Élevée (30%+)</option>
                <option value="medium">Moyenne (15-30%)</option>
                <option value="low">Faible (-15%)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Catégorie</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {advancedFilteredProducts.map(product => {
          const stock = product.stock || 0;
          const minStock = product.minStock || 5;
          const stockStatus = stock === 0 ? 'out' : stock <= minStock ? 'low' : 'good';
          const margin = product.price && product.costPrice 
            ? ((product.price - product.costPrice) / product.price) * 100 
            : 0;

          return (
            <Card key={product.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                {/* En-tête produit */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 line-clamp-2">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-500">
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {product.price?.toLocaleString()} {appSettings.currency}
                    </p>
                    {product.costPrice && (
                      <p className="text-sm text-gray-500">
                        Marge: {margin.toFixed(1)}%
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingProduct(product);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setRestockingProduct(product);
                        setShowRestockModal(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Barre de progression du stock */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Stock</span>
                    <span>{stock}/{product.maxStock || '∞'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        stockStatus === 'out' ? 'bg-red-500' :
                        stockStatus === 'low' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ 
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

      {advancedFilteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun produit trouvé
          </h3>
          <p className="text-gray-500">
            Essayez de modifier vos filtres ou d'ajouter des produits
          </p>
        </div>
      )}
    </div>
  );

  // Rendu Analytics avancés
  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique de distribution des stocks */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribution des Stocks</h3>
          <div className="space-y-4">
            {[
              { label: 'Rupture', count: analytics.alerts.outOfStock.length, color: 'bg-red-500' },
              { label: 'Stock faible', count: analytics.alerts.lowStock.length, color: 'bg-yellow-500' },
              { label: 'Stock optimal', count: products.filter(p => (p.stock || 0) > (p.minStock || 5) && (p.stock || 0) <= (p.maxStock || 50)).length, color: 'bg-green-500' },
              { label: 'Surstock', count: analytics.alerts.overStock.length, color: 'bg-blue-500' }
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Analyse de rentabilité */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Analyse de Rentabilité</h3>
          <div className="space-y-4">
            {products.filter(p => p.price && p.costPrice).slice(0, 5).map(product => {
              const margin = ((product.price - product.costPrice) / product.price) * 100;
              const revenue = (product.stock || 0) * product.price;
              return (
                <div key={product.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">Marge: {margin.toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{revenue.toLocaleString()} {appSettings.currency}</p>
                      <p className="text-sm text-gray-500">Valeur stock</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Tendances et prévisions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tendances et Prévisions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {analytics.salesAnalysis.reduce((sum, item) => sum + item.soldQuantity, 0)}
            </div>
            <p className="text-sm text-gray-600">Unités vendues (30j)</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {analytics.predictions.length}
            </div>
            <p className="text-sm text-gray-600">Prédictions actives</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {Math.round(analytics.salesAnalysis.reduce((sum, item) => sum + item.revenue, 0))}
            </div>
            <p className="text-sm text-gray-600">CA généré (30j)</p>
          </div>
        </div>
      </Card>
    </div>
  );

  // Rendu Automatisation
  const renderAutomation = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Règles d'Automatisation
        </h3>
        
        <div className="space-y-4">
          {/* Réapprovisionnement automatique */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Réapprovisionnement Automatique</h4>
              <Badge variant="success">Actif</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Crée automatiquement des commandes quand le stock atteint le minimum
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Configurer</Button>
              <Button variant="outline" size="sm">Historique</Button>
            </div>
          </div>

          {/* Alertes email */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Alertes Email</h4>
              <Badge variant="warning">En attente</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Envoie des notifications par email pour les stocks critiques
            </p>
            <div className="flex gap-2">
              <Button variant="primary" size="sm">Activer</Button>
              <Button variant="outline" size="sm">Configuration</Button>
            </div>
          </div>

          {/* Ajustements prix dynamiques */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Prix Dynamiques</h4>
              <Badge variant="secondary">Désactivé</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Ajuste automatiquement les prix selon la demande et le stock
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Configurer</Button>
              <Button variant="outline" size="sm">En savoir plus</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Recommandations IA */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recommandations IA</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Target className="h-5 w-5 text-blue-500 mt-1" />
            <div>
              <p className="font-medium text-blue-800">
                Optimiser les niveaux de stock
              </p>
              <p className="text-sm text-blue-600">
                Ajustez les seuils minimum pour réduire les ruptures de 23%
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-500 mt-1" />
            <div>
              <p className="font-medium text-green-800">
                Augmenter la marge
              </p>
              <p className="text-sm text-green-600">
                5 produits peuvent supporter une hausse de prix de 10-15%
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
            <Package className="h-5 w-5 text-purple-500 mt-1" />
            <div>
              <p className="font-medium text-purple-800">
                Nouveaux produits suggérés
              </p>
              <p className="text-sm text-purple-600">
                Basé sur les tendances de vente et les demandes clients
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  // Rendu des mouvements de stock
  const renderMovements = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Mouvements de Stock</h3>
      <div className="space-y-3">
        {salesHistory.flatMap(sale => 
          sale.items.map(item => ({
            date: sale.date,
            productName: item.name,
            quantity: -item.quantity,
            type: 'Vente',
            reference: `V-${sale.id}`
          }))
        ).map((movement, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${movement.quantity > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="font-medium">{movement.productName}</p>
                <p className="text-sm text-gray-500">{movement.type} - {movement.reference}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {movement.quantity > 0 ? '+' : ''}{movement.quantity}
              </p>
              <p className="text-sm text-gray-500">{movement.date}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  // Modal d'ajout de produit
  const renderAddProductModal = () => (
    <Modal
      isOpen={showAddModal}
      onClose={() => setShowAddModal(false)}
      title="Ajouter un Nouveau Produit"
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumberInput
            label="Prix de vente *"
            value={newProduct.price}
            onChange={(value) => setNewProduct({...newProduct, price: value})}
            placeholder="0"
            min="0"
            step="0.01"
          />
          
          <NumberInput
            label="Prix d'achat"
            value={newProduct.costPrice}
            onChange={(value) => setNewProduct({...newProduct, costPrice: value})}
            placeholder="0"
            min="0"
            step="0.01"
          />
          
          <NumberInput
            label="Stock initial"
            value={newProduct.stock}
            onChange={(value) => setNewProduct({...newProduct, stock: value})}
            placeholder="0"
            min="0"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberInput
            label="Stock minimum"
            value={newProduct.minStock}
            onChange={(value) => setNewProduct({...newProduct, minStock: value})}
            placeholder="5"
            min="0"
          />
          
          <NumberInput
            label="Stock maximum"
            value={newProduct.maxStock}
            onChange={(value) => setNewProduct({...newProduct, maxStock: value})}
            placeholder="100"
            min="0"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={newProduct.description}
            onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
            placeholder="Description détaillée du produit..."
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          variant="outline"
          onClick={() => setShowAddModal(false)}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={handleAddProduct}
          disabled={!newProduct.name || !newProduct.price}
          className="flex-1"
        >
          Ajouter le Produit
        </Button>
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
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Stock actuel</p>
                <p className="text-2xl font-bold">{restockingProduct?.stock || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stock minimum</p>
                <p className="text-2xl font-bold text-red-600">{restockingProduct?.minStock || 5}</p>
              </div>
            </div>
          </div>

          <NumberInput
            label="Quantité à ajouter"
            value={quantity}
            onChange={setQuantity}
            placeholder="0"
            min="1"
          />

          <div>
            <label className="block text-sm font-medium mb-2">Motif</label>
            <select 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white"
            >
              <option value="Réapprovisionnement manuel">Réapprovisionnement manuel</option>
              <option value="Livraison fournisseur">Livraison fournisseur</option>
              <option value="Transfert magasin">Transfert magasin</option>
              <option value="Correction inventaire">Correction inventaire</option>
              <option value="Retour client">Retour client</option>
            </select>
          </div>

          {quantity && (
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">
                Nouveau stock: {(parseInt(restockingProduct?.stock || 0) + parseInt(quantity)).toLocaleString()} unités
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setShowRestockModal(false)}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={() => handleRestock(restockingProduct?.id, quantity, reason)}
            disabled={!quantity || parseInt(quantity) <= 0}
            className="flex-1"
          >
            Confirmer Réapprovisionnement
          </Button>
        </div>
      </Modal>
    );
  };

  // Modal d'édition (simplifié)
  const renderEditProductModal = () => (
    <Modal
      isOpen={showEditModal}
      onClose={() => setShowEditModal(false)}
      title={`Modifier: ${editingProduct?.name}`}
    >
      <div className="text-center py-8">
        <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Fonctionnalité en Développement</h3>
        <p className="text-gray-600 mb-6">
          L'édition complète des produits sera disponible dans la prochaine version
        </p>
        <Button variant="outline" onClick={() => setShowEditModal(false)}>
          Fermer
        </Button>
      </div>
    </Modal>
  );

  // Modal des prédictions complètes
  const renderPredictionsModal = () => (
    <Modal
      isOpen={showPredictionsModal}
      onClose={() => setShowPredictionsModal(false)}
      title="Prédictions de Réapprovisionnement"
      size="xl"
    >
      <div className="space-y-4">
        {analytics.predictions.map(prediction => (
          <div key={prediction.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium">{prediction.name}</h4>
                <p className="text-sm text-gray-600">
                  Stock actuel: {prediction.stock} | Ventes/jour: {prediction.avgDailySales.toFixed(1)}
                </p>
              </div>
              <Badge 
                variant={
                  prediction.urgency === 'high' ? 'danger' :
                  prediction.urgency === 'medium' ? 'warning' : 'success'
                }
              >
                {prediction.urgency === 'high' ? 'Urgent' :
                 prediction.urgency === 'medium' ? 'Attention' : 'Normal'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Épuisement estimé</p>
                <p className="font-medium">{Math.ceil(prediction.daysUntilEmpty)} jours</p>
              </div>
              <div>
                <p className="text-gray-600">Quantité recommandée</p>
                <p className="font-medium">{prediction.suggestedReorder} unités</p>
              </div>
              <div className="text-right">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setRestockingProduct(prediction);
                    setShowPredictionsModal(false);
                    setShowRestockModal(true);
                  }}
                >
                  Commander
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Package className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion Inventaire Pro
          </h1>
        </div>
        <p className="text-gray-600">
          Interface professionnelle avec analytics, prédictions IA et automatisations
        </p>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
            { id: 'products', name: 'Produits', icon: Package },
            { id: 'movements', name: 'Mouvements', icon: Activity },
            { id: 'analytics', name: 'Analytics', icon: PieChart },
            { id: 'automation', name: 'Automatisation', icon: Zap }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu des onglets */}
      <div className="min-h-[600px]">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'movements' && renderMovements()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'automation' && renderAutomation()}
      </div>

      {/* Modals */}
      {showAddModal && renderAddProductModal()}
      {showEditModal && renderEditProductModal()}
      {showRestockModal && renderRestockModal()}
      {showPredictionsModal && renderPredictionsModal()}
    </div>
  );
};

export default InventoryModulePro;
