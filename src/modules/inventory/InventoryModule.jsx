{/* Modals */}
      {renderAddProductModal()}
      {renderRestimport React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package, AlertTriangle, TrendingDown, TrendingUp, BarChart3,
  Search, Plus, Minus, Edit, Save, X, Bell, Clock, Eye,
  RefreshCw, Trash, Download, Upload, Filter, Settings,
  Target, Zap, Activity, DollarSign, Truck, Calendar,
  ArrowUpDown, CheckCircle, XCircle, PieChart, LineChart,
  ClipboardList
} from 'lucide-react';

// Import du contexte pour utiliser les données réelles
import { useApp } from '../../contexts/AppContext';

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

const useCategories = (products) => {
  return useMemo(() => {
    const categorySet = new Set(products.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(categorySet)];
  }, [products]);
};

const useProductSearch = (products, searchQuery, selectedCategory) => {
  return useMemo(() => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, searchQuery, selectedCategory]);
};

// ==================== COMPOSANTS UI ====================

const Card = ({ children, style = {}, className = '' }) => (
  <div style={{
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    ...style
  }} className={className}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', leftIcon, onClick, disabled, style = {} }) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '500',
    borderRadius: '8px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled ? 0.6 : 1,
    ...style
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      color: 'white',
      padding: size === 'sm' ? '8px 12px' : '12px 16px',
      fontSize: size === 'sm' ? '14px' : '16px'
    },
    outline: {
      background: 'white',
      color: '#374151',
      border: '1px solid #d1d5db',
      padding: size === 'sm' ? '8px 12px' : '12px 16px',
      fontSize: size === 'sm' ? '14px' : '16px'
    },
    danger: {
      background: '#ef4444',
      color: 'white',
      padding: size === 'sm' ? '8px 12px' : '12px 16px',
      fontSize: size === 'sm' ? '14px' : '16px'
    }
  };

  return (
    <button
      style={{ ...baseStyle, ...variantStyles[variant] }}
      onClick={onClick}
      disabled={disabled}
    >
      {leftIcon}
      {children}
    </button>
  );
};

const SearchInput = ({ placeholder, value, onChange, onClear }) => (
  <div style={{ position: 'relative' }}>
    <Search style={{
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '20px',
      height: '20px',
      color: '#9ca3af'
    }} />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '12px 40px',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '16px',
        outline: 'none',
        transition: 'border-color 0.2s'
      }}
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
          cursor: 'pointer',
          color: '#9ca3af'
        }}
      >
        <X style={{ width: '20px', height: '20px' }} />
      </button>
    )}
  </div>
);

const Toast = {
  success: (message) => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 16px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  },
  error: (message) => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 16px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  }
};

// ==================== COMPOSANT PRINCIPAL ====================

const InventoryModule = () => {
  // ===== UTILISATION DU CONTEXTE RÉEL =====
  const {
    globalProducts = [],
    addProduct,
    addStock,
    removeProduct,
    salesHistory = [],
    appSettings = {},
    currentStoreId,
    stockByStore = {},
    stores = []
  } = useApp();

  // États locaux du module
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

  // Hooks personnalisés utilisant les vraies données
  const debouncedSearch = useDebounce(searchQuery, 300);
  const categories = useCategories(globalProducts);
  const filteredProducts = useProductSearch(globalProducts, debouncedSearch, selectedCategory);

  // Analytics basés sur les vraies données
  const analytics = useMemo(() => {
    const currentStoreStock = stockByStore[currentStoreId] || {};
    
    // Créer la liste des produits avec les stocks du magasin actuel
    const productsWithStock = globalProducts.map(product => ({
      ...product,
      stock: currentStoreStock[product.id] || 0
    }));

    const totalProducts = productsWithStock.length;
    const totalValue = productsWithStock.reduce((sum, p) => sum + ((p.stock || 0) * (p.costPrice || 0)), 0);
    const totalSalesValue = productsWithStock.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);
    const potentialProfit = totalSalesValue - totalValue;
    
    const alerts = {
      outOfStock: productsWithStock.filter(p => (p.stock || 0) === 0),
      lowStock: productsWithStock.filter(p => {
        const stock = p.stock || 0;
        const minStock = p.minStock || 5;
        return stock > 0 && stock <= minStock;
      }),
      overStock: productsWithStock.filter(p => {
        const stock = p.stock || 0;
        const maxStock = p.maxStock || 100;
        return stock > maxStock;
      })
    };

    const totals = {
      totalProducts,
      totalValue,
      totalSalesValue,
      potentialProfit,
      averageStockValue: totalProducts > 0 ? totalValue / totalProducts : 0
    };

    return { alerts, totals, productsWithStock };
  }, [globalProducts, stockByStore, currentStoreId]);

  // Gestionnaires d'événements
  const handleAddProduct = useCallback(async (productData) => {
    try {
      const product = {
        id: Date.now(),
        name: productData.name,
        category: productData.category || 'Divers',
        price: parseFloat(productData.price) || 0,
        costPrice: parseFloat(productData.costPrice) || 0,
        minStock: parseInt(productData.minStock) || 5,
        maxStock: parseInt(productData.maxStock) || 100,
        sku: productData.sku || `SKU${Date.now()}`,
        barcode: productData.barcode || `${Date.now()}`,
        supplier: productData.supplier || ''
      };

      const initialStock = parseInt(productData.stock) || 0;
      await addProduct(product, initialStock);
      
      setNewProduct({
        name: '', category: '', price: '', costPrice: '', stock: '',
        minStock: '', maxStock: '', sku: '', barcode: '', supplier: ''
      });
      setShowAddModal(false);
      Toast.success(`Produit "${product.name}" ajouté avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      Toast.error('Erreur lors de l\'ajout du produit');
    }
  }, [addProduct]);

  const handleRestock = useCallback(async (productId, quantity, reason = 'Réapprovisionnement') => {
    try {
      await addStock(currentStoreId, productId, parseInt(quantity), reason);
      setRestockingProduct(null);
      setShowRestockModal(false);
      Toast.success(`Stock mis à jour: +${quantity} unités`);
    } catch (error) {
      console.error('Erreur lors du réapprovisionnement:', error);
      Toast.error('Erreur lors du réapprovisionnement');
    }
  }, [addStock, currentStoreId]);

  // Styles communs
  const containerStyle = {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: appSettings.darkMode ? '#1a202c' : '#f9fafb',
    minHeight: '100vh'
  };

  // Rendu du Dashboard
  const renderDashboard = () => {
    const stockDistribution = [
      { 
        label: 'Stock optimal', 
        value: analytics.productsWithStock.filter(p => {
          const stock = p.stock || 0;
          const minStock = p.minStock || 5;
          const maxStock = p.maxStock || 50;
          return stock > minStock && stock <= maxStock;
        }).length, 
        color: '#059669' 
      },
      { label: 'Stock faible', value: analytics.alerts.lowStock.length, color: '#d97706' },
      { label: 'Rupture', value: analytics.alerts.outOfStock.length, color: '#dc2626' },
      { label: 'Surstock', value: analytics.alerts.overStock.length, color: '#3b82f6' }
    ];

    return (
      <div>
        {/* KPIs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <Card style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Total Produits</h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'bold' }}>
                  {analytics.totals.totalProducts}
                </p>
              </div>
              <Package style={{ width: '48px', height: '48px', opacity: 0.8 }} />
            </div>
          </Card>

          <Card style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Valeur Stock</h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                  {analytics.totals.totalValue.toLocaleString()} {appSettings.currency || 'FCFA'}
                </p>
              </div>
              <DollarSign style={{ width: '48px', height: '48px', opacity: 0.8 }} />
            </div>
          </Card>

          <Card style={{
            background: analytics.alerts.outOfStock.length > 0 
              ? 'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)'
              : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Alertes</h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'bold' }}>
                  {analytics.alerts.outOfStock.length + analytics.alerts.lowStock.length}
                </p>
              </div>
              <AlertTriangle style={{ width: '48px', height: '48px', opacity: 0.8 }} />
            </div>
          </Card>

          <Card style={{
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            color: '#2d3748'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Profit Potentiel</h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                  {analytics.totals.potentialProfit.toLocaleString()} {appSettings.currency || 'FCFA'}
                </p>
              </div>
              <TrendingUp style={{ width: '48px', height: '48px', opacity: 0.8 }} />
            </div>
          </Card>
        </div>

        {/* Distribution du stock et Alertes */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <Card>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
              Distribution du Stock
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stockDistribution.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      backgroundColor: item.color
                    }} />
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>
                      {item.label}
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold',
                    color: item.color
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 style={{ marginTop: 0, color: '#dc2626' }}>
              <AlertTriangle style={{ width: '20px', height: '20px', display: 'inline', marginRight: '8px' }} />
              Alertes Stock
            </h3>
            
            {analytics.alerts.outOfStock.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', color: '#dc2626', margin: '0 0 8px 0' }}>
                  Ruptures ({analytics.alerts.outOfStock.length})
                </h4>
                {analytics.alerts.outOfStock.slice(0, 3).map(product => (
                  <div key={product.id} style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: '4px',
                    marginBottom: '4px'
                  }}>
                    {product.name}
                  </div>
                ))}
              </div>
            )}

            {analytics.alerts.lowStock.length > 0 && (
              <div>
                <h4 style={{ fontSize: '14px', color: '#d97706', margin: '0 0 8px 0' }}>
                  Stock faible ({analytics.alerts.lowStock.length})
                </h4>
                {analytics.alerts.lowStock.slice(0, 3).map(product => (
                  <div key={product.id} style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '4px',
                    marginBottom: '4px'
                  }}>
                    {product.name} (Stock: {product.stock})
                  </div>
                ))}
              </div>
            )}

            {analytics.alerts.outOfStock.length === 0 && analytics.alerts.lowStock.length === 0 && (
              <p style={{ color: '#059669', fontSize: '14px' }}>
                ✅ Aucune alerte stock
              </p>
            )}
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
            variant="primary"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus style={{ width: '16px', height: '16px' }} />}
          >
            Ajouter Produit
          </Button>
        </div>
      </div>

      {/* Filtres de catégorie */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: selectedCategory === category ? '2px solid #3b82f6' : '1px solid #d1d5db',
                background: selectedCategory === category ? '#dbeafe' : 'white',
                color: selectedCategory === category ? '#1d4ed8' : '#374151',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {category === 'all' ? 'Toutes' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des produits */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {filteredProducts.map(product => {
          const currentStock = (stockByStore[currentStoreId] || {})[product.id] || 0;
          const isLowStock = currentStock <= (product.minStock || 5);
          const isOutOfStock = currentStock === 0;

          return (
            <Card key={product.id} style={{
              border: isOutOfStock ? '2px solid #dc2626' : isLowStock ? '2px solid #f59e0b' : '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                    {product.name}
                  </h3>
                  <p style={{ margin: '4px 0', fontSize: '14px', color: '#6b7280' }}>
                    {product.category} • SKU: {product.sku}
                  </p>
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: isOutOfStock ? '#fee2e2' : isLowStock ? '#fef3c7' : '#dcfce7',
                  color: isOutOfStock ? '#991b1b' : isLowStock ? '#92400e' : '#166534'
                }}>
                  {isOutOfStock ? 'Rupture' : isLowStock ? 'Stock faible' : 'En stock'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280', display: 'block' }}>Prix de vente</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>
                    {product.price?.toLocaleString()} {appSettings.currency || 'FCFA'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280', display: 'block' }}>Stock actuel</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: isOutOfStock ? '#dc2626' : '#111827' }}>
                    {currentStock} unités
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRestockingProduct(product);
                    setShowRestockModal(true);
                  }}
                  leftIcon={<Plus style={{ width: '14px', height: '14px' }} />}
                >
                  Réapprovisionner
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit style={{ width: '14px', height: '14px' }} />}
                >
                  Modifier
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <Package style={{ width: '64px', height: '64px', color: '#9ca3af', margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#6b7280' }}>
            Aucun produit trouvé
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>
            {searchQuery ? 'Essayez de modifier votre recherche' : 'Commencez par ajouter des produits'}
          </p>
        </Card>
      )}
    </div>
  );

  // Modal d'ajout de produit
  const renderAddProductModal = () => {
    if (!showAddModal) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Ajouter un produit</h2>
            <button
              onClick={() => setShowAddModal(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X style={{ width: '24px', height: '24px' }} />
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleAddProduct(newProduct);
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Nom du produit *
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Catégorie
                </label>
                <input
                  type="text"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Prix de vente (FCFA) *
                </label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Prix d'achat (FCFA) *
                </label>
                <input
                  type="number"
                  value={newProduct.costPrice}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, costPrice: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Stock initial
                </label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Stock minimum
                </label>
                <input
                  type="number"
                  value={newProduct.minStock}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, minStock: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Stock maximum
                </label>
                <input
                  type="number"
                  value={newProduct.maxStock}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, maxStock: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                type="button"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                type="submit"
                leftIcon={<Save style={{ width: '16px', height: '16px' }} />}
              >
                Ajouter le produit
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Modal de réapprovisionnement
  const renderRestockModal = () => {
    if (!showRestockModal || !restockingProduct) return null;

    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('Réapprovisionnement');

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Réapprovisionner</h2>
            <button
              onClick={() => setShowRestockModal(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>
              {restockingProduct.name}
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              Stock actuel: {(stockByStore[currentStoreId] || {})[restockingProduct.id] || 0} unités
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (quantity && parseInt(quantity) > 0) {
              handleRestock(restockingProduct.id, quantity, reason);
            }
          }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Quantité à ajouter *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                min="1"
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Motif
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                onClick={() => setShowRestockModal(false)}
                type="button"
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                type="submit"
                leftIcon={<Plus style={{ width: '16px', height: '16px' }} />}
              >
                Réapprovisionner
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Onglets de navigation
  const tabs = [
    { id: 'dashboard', name: 'Tableau de bord', icon: BarChart3 },
    { id: 'products', name: 'Produits', icon: Package },
    { id: 'movements', name: 'Mouvements', icon: Activity }
  ];

  // Interface utilisateur principale
  return (
    <div style={containerStyle}>
      {/* En-tête */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Package style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: appSettings.darkMode ? '#f7fafc' : '#1f2937'
            }}>
              Gestion des Stocks
            </h1>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '16px',
              color: appSettings.darkMode ? '#a0aec0' : '#6b7280'
            }}>
              Magasin: {stores.find(s => s.id === currentStoreId)?.name || 'Non sélectionné'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <nav style={{ display: 'flex', gap: '32px', marginBottom: '-1px' }}>
          {tabs.map(tab => {
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
                  padding: '12px 24px',
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
        {activeTab === 'movements' && <InventoryHistoryModule />}
      </div>

      {/* Modals */}
      {renderAddProductModal()}
      {renderRestockModal()}
    </div>
  );
};

export default InventoryModule;
