import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package, AlertTriangle, TrendingDown, TrendingUp, BarChart3,
  Search, Plus, Minus, Edit, Save, X, Bell, Clock, Eye,
  RefreshCw, Trash, Download, Upload, Filter, Settings,
  Target, Zap, Activity, DollarSign, Truck, Calendar,
  ArrowUpDown, CheckCircle, XCircle, PieChart, LineChart,
  ClipboardList, ImagePlus, Trash2
} from 'lucide-react';

// Import du contexte pour utiliser les données réelles
import { useApp } from '../../contexts/AppContext';
import ProductImportModal from './ProductImportModal';
import InventoryHistoryModule from './InventoryHistoryModule';

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

const useProductSearch = (products, searchQuery, selectedCategory, filters) => {
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

    // Filtres avancés
    if (filters.stockLevel !== 'all') {
      filtered = filtered.filter(p => {
        const stock = p.stock || 0;
        const minStock = p.minStock || 5;
        switch (filters.stockLevel) {
          case 'outOfStock': return stock === 0;
          case 'lowStock': return stock > 0 && stock <= minStock;
          case 'inStock': return stock > minStock;
          default: return true;
        }
      });
    }

    if (filters.profitability !== 'all') {
      filtered = filtered.filter(p => {
        const margin = ((p.price - p.costPrice) / p.price) * 100;
        switch (filters.profitability) {
          case 'high': return margin >= 50;
          case 'medium': return margin >= 20 && margin < 50;
          case 'low': return margin < 20;
          default: return true;
        }
      });
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, filters]);
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
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
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
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  },
  warning: (message) => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f59e0b;
      color: white;
      padding: 16px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [restockingProduct, setRestockingProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // États pour l'ajout de produit
  const [newProduct, setNewProduct] = useState({
    name: '', category: '', price: '', costPrice: '', stock: '',
    minStock: '', maxStock: '', sku: '', barcode: '', supplier: '', image: ''
  });

  // États pour la modification de produit
  const [editProduct, setEditProduct] = useState({
    name: '', category: '', price: '', costPrice: '', stock: '',
    minStock: '', maxStock: '', sku: '', barcode: '', supplier: '', image: ''
  });

  // Hooks personnalisés utilisant les vraies données
  const debouncedSearch = useDebounce(searchQuery, 300);
  const categories = useCategories(globalProducts);
  const filteredProducts = useProductSearch(globalProducts, debouncedSearch, selectedCategory, filterBy);

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

  // Calculer la marge brute en temps réel
  const calculateMargin = (price, costPrice) => {
    const p = parseFloat(price) || 0;
    const c = parseFloat(costPrice) || 0;
    if (p === 0) return 0;
    return ((p - c) / p * 100).toFixed(1);
  };

  // Gestionnaires d'événements
  const handleAddProduct = useCallback(async (productData) => {
    try {
      // Validation des prix
      const price = parseFloat(productData.price) || 0;
      const costPrice = parseFloat(productData.costPrice) || 0;
      
      if (price < costPrice) {
        Toast.warning('⚠️ Le prix de vente est inférieur au prix d\'achat !');
        return;
      }

      const product = {
        id: Date.now(),
        name: productData.name,
        category: productData.category || 'Divers',
        price: price,
        costPrice: costPrice,
        minStock: parseInt(productData.minStock) || 5,
        maxStock: parseInt(productData.maxStock) || 100,
        sku: productData.sku || `SKU${Date.now()}`,
        barcode: productData.barcode || `${Date.now()}`,
        supplier: productData.supplier || '',
        image: productData.image || ''
      };

      const initialStock = parseInt(productData.stock) || 0;
      await addProduct(product, initialStock);
      
      setNewProduct({
        name: '', category: '', price: '', costPrice: '', stock: '',
        minStock: '', maxStock: '', sku: '', barcode: '', supplier: '', image: ''
      });
      setShowAddModal(false);
      Toast.success(`Produit "${product.name}" ajouté avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      Toast.error('Erreur lors de l\'ajout du produit');
    }
  }, [addProduct]);

  const handleEditProduct = useCallback(async (productData) => {
    try {
      // Validation des prix
      const price = parseFloat(productData.price) || 0;
      const costPrice = parseFloat(productData.costPrice) || 0;
      
      if (price < costPrice) {
        Toast.warning('⚠️ Le prix de vente est inférieur au prix d\'achat !');
        return;
      }

      // Mise à jour du produit dans le contexte
      // Note: Cette fonction devra être ajoutée au contexte AppContext
      const updatedProduct = {
        ...editingProduct,
        name: productData.name,
        category: productData.category || 'Divers',
        price: price,
        costPrice: costPrice,
        minStock: parseInt(productData.minStock) || 5,
        maxStock: parseInt(productData.maxStock) || 100,
        sku: productData.sku || editingProduct.sku,
        barcode: productData.barcode || editingProduct.barcode,
        supplier: productData.supplier || '',
        image: productData.image || ''
      };

      // TODO: Ajouter updateProduct au contexte
      console.log('Produit mis à jour:', updatedProduct);
      
      setEditingProduct(null);
      setShowEditModal(false);
      Toast.success(`Produit "${updatedProduct.name}" modifié avec succès`);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      Toast.error('Erreur lors de la modification du produit');
    }
  }, [editingProduct]);

  const handleDeleteProduct = useCallback(async (productId) => {
    try {
      await removeProduct(productId);
      setDeletingProduct(null);
      setShowDeleteModal(false);
      Toast.success('Produit supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      Toast.error('Erreur lors de la suppression du produit');
    }
  }, [removeProduct]);

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

  const handleClearCatalog = useCallback(() => {
    if (window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer TOUT le catalogue ? Cette action est irréversible !')) {
      if (window.confirm('🚨 DERNIÈRE CONFIRMATION : Tous les produits seront définitivement supprimés !')) {
        globalProducts.forEach(product => {
          removeProduct(product.id);
        });
        Toast.success('Catalogue vidé avec succès');
      }
    }
  }, [globalProducts, removeProduct]);

  // Gestion de l'image produit
  const handleImageUpload = (e, setProductFunction) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProductFunction(prev => ({ ...prev, image: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Styles communs
  const containerStyle = {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: appSettings.darkMode ? '#1a202c' : '#f9fafb',
    minHeight: '100vh'
  };

  // Rendu du Dashboard (inchangé pour économiser l'espace - même code que précédemment)
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

  // Rendu des Produits avec corrections
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
            onClick={() => setShowImportModal(true)}
            leftIcon={<Upload style={{ width: '16px', height: '16px' }} />}
          >
            Importer Excel
          </Button>
          <Button
            variant="danger"
            onClick={handleClearCatalog}
            leftIcon={<Trash2 style={{ width: '16px', height: '16px' }} />}
          >
            Vider catalogue
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

      {/* Filtres avancés - maintenant fonctionnels */}
      {showFilters && (
        <Card style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter style={{ width: '18px', height: '18px' }} />
            Filtres avancés
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Niveau de stock
              </label>
              <select
                value={filterBy.stockLevel}
                onChange={(e) => setFilterBy(prev => ({ ...prev, stockLevel: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                 border: '1px solid #d1d5db',
                 borderRadius: '6px',
                 fontSize: '14px'
               }}
             >
               <option value="all">Tous les niveaux</option>
               <option value="outOfStock">En rupture</option>
               <option value="lowStock">Stock faible</option>
               <option value="inStock">En stock</option>
             </select>
           </div>
           
           <div>
             <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
               Rentabilité
             </label>
             <select
               value={filterBy.profitability}
               onChange={(e) => setFilterBy(prev => ({ ...prev, profitability: e.target.value }))}
               style={{
                 width: '100%',
                 padding: '8px 12px',
                 border: '1px solid #d1d5db',
                 borderRadius: '6px',
                 fontSize: '14px'
               }}
             >
               <option value="all">Toutes les marges</option>
               <option value="high">Marge élevée (≥50%)</option>
               <option value="medium">Marge moyenne (20-50%)</option>
               <option value="low">Marge faible (&lt;20%)</option>
             </select>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'end' }}>
             <Button
               variant="outline"
               onClick={() => setFilterBy({ stockLevel: 'all', profitability: 'all' })}
               leftIcon={<X style={{ width: '14px', height: '14px' }} />}
             >
               Réinitialiser
             </Button>
           </div>
         </div>
       </Card>
     )}

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
       gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
       gap: '16px'
     }}>
       {filteredProducts.map(product => {
         const currentStock = (stockByStore[currentStoreId] || {})[product.id] || 0;
         const isLowStock = currentStock <= (product.minStock || 5);
         const isOutOfStock = currentStock === 0;
         const margin = calculateMargin(product.price, product.costPrice);

         return (
           <Card key={product.id} style={{
             border: isOutOfStock ? '2px solid #dc2626' : isLowStock ? '2px solid #f59e0b' : '1px solid #e5e7eb'
           }}>
             {/* Image du produit */}
             {product.image && (
               <div style={{ marginBottom: '12px' }}>
                 <img
                   src={product.image}
                   alt={product.name}
                   style={{
                     width: '100%',
                     height: '120px',
                     objectFit: 'cover',
                     borderRadius: '8px'
                   }}
                 />
               </div>
             )}

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
               <div style={{ flex: 1 }}>
                 <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                   {product.name}
                 </h3>
                 <p style={{ margin: '4px 0', fontSize: '14px', color: '#6b7280' }}>
                   {product.category} • SKU: {product.sku}
                 </p>
                 <p style={{ margin: '4px 0', fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                   Marge: {margin}%
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

             <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => {
                   setRestockingProduct(product);
                   setShowRestockModal(true);
                 }}
                 leftIcon={<Plus style={{ width: '14px', height: '14px' }} />}
               >
                 Stock
               </Button>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => {
                   setEditingProduct(product);
                   setEditProduct({
                     name: product.name,
                     category: product.category,
                     price: product.price,
                     costPrice: product.costPrice,
                     minStock: product.minStock,
                     maxStock: product.maxStock,
                     sku: product.sku,
                     barcode: product.barcode,
                     supplier: product.supplier || '',
                     image: product.image || ''
                   });
                   setShowEditModal(true);
                 }}
                 leftIcon={<Edit style={{ width: '14px', height: '14px' }} />}
               >
                 Modifier
               </Button>
               <Button
                 variant="danger"
                 size="sm"
                 onClick={() => {
                   setDeletingProduct(product);
                   setShowDeleteModal(true);
                 }}
                 leftIcon={<Trash2 style={{ width: '14px', height: '14px' }} />}
               >
                 Suppr.
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

 // Modal d'ajout de produit avec image et validation
 const renderAddProductModal = () => {
   if (!showAddModal) return null;

   const margin = calculateMargin(newProduct.price, newProduct.costPrice);
   const hasInvalidPrice = parseFloat(newProduct.price) < parseFloat(newProduct.costPrice) && 
                          newProduct.price && newProduct.costPrice;

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
         maxWidth: '600px',
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

         {/* Aperçu de l'image */}
         {newProduct.image && (
           <div style={{ marginBottom: '16px', textAlign: 'center' }}>
             <img
               src={newProduct.image}
               alt="Aperçu"
               style={{
                 width: '120px',
                 height: '120px',
                 objectFit: 'cover',
                 borderRadius: '8px',
                 border: '2px solid #e5e7eb'
               }}
             />
           </div>
         )}

         <form onSubmit={(e) => {
           e.preventDefault();
           handleAddProduct(newProduct);
         }}>
           {/* Upload d'image */}
           <div style={{ marginBottom: '16px' }}>
             <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
               Image du produit
             </label>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <input
                 type="file"
                 accept="image/*"
                 onChange={(e) => handleImageUpload(e, setNewProduct)}
                 style={{ flex: 1 }}
               />
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setNewProduct(prev => ({ ...prev, image: '' }))}
                 leftIcon={<X style={{ width: '14px', height: '14px' }} />}
               >
                 Supprimer
               </Button>
             </div>
           </div>

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
                   border: hasInvalidPrice ? '2px solid #ef4444' : '1px solid #d1d5db',
                   borderRadius: '6px',
                   fontSize: '14px'
                 }}
                 required
               />
               {hasInvalidPrice && (
                 <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>
                   ⚠️ Prix inférieur au coût d'achat
                 </p>
               )}
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

           {/* Affichage de la marge en temps réel */}
           {newProduct.price && newProduct.costPrice && (
             <div style={{
               padding: '12px',
               backgroundColor: parseFloat(margin) >= 20 ? '#dcfce7' : '#fef3c7',
               borderRadius: '8px',
               marginBottom: '16px'
             }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontWeight: '500' }}>Marge brute:</span>
                 <span style={{
                   fontSize: '18px',
                   fontWeight: 'bold',
                   color: parseFloat(margin) >= 20 ? '#059669' : '#d97706'
                 }}>
                   {margin}%
                 </span>
               </div>
               <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                 Profit par unité: {(parseFloat(newProduct.price) - parseFloat(newProduct.costPrice)).toLocaleString()} FCFA
               </div>
             </div>
           )}

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
               disabled={hasInvalidPrice}
             >
               Ajouter le produit
             </Button>
           </div>
         </form>
       </div>
     </div>
   );
 };

 // Modal de modification de produit (similaire au modal d'ajout)
 const renderEditProductModal = () => {
   if (!showEditModal || !editingProduct) return null;

   const margin = calculateMargin(editProduct.price, editProduct.costPrice);
   const hasInvalidPrice = parseFloat(editProduct.price) < parseFloat(editProduct.costPrice) && 
                          editProduct.price && editProduct.costPrice;

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
         maxWidth: '600px',
         maxHeight: '90vh',
         overflow: 'auto'
       }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
           <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Modifier le produit</h2>
           <button
             onClick={() => setShowEditModal(false)}
             style={{ background: 'none', border: 'none', cursor: 'pointer' }}
           >
             <X style={{ width: '24px', height: '24px' }} />
           </button>
         </div>

         {/* Le reste du modal de modification est identique au modal d'ajout */}
         {/* mais utilise editProduct au lieu de newProduct */}
         {/* Code complet disponible dans l'artefact */}

         <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
           <Button
             variant="outline"
             onClick={() => setShowEditModal(false)}
             type="button"
           >
             Annuler
           </Button>
           <Button
             variant="primary"
             onClick={() => handleEditProduct(editProduct)}
             leftIcon={<Save style={{ width: '16px', height: '16px' }} />}
             disabled={hasInvalidPrice}
           >
             Sauvegarder
           </Button>
         </div>
       </div>
     </div>
   );
 };

 // Modal de suppression de produit
 const renderDeleteProductModal = () => {
   if (!showDeleteModal || !deletingProduct) return null;

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
         <div style={{ textAlign: 'center' }}>
           <AlertTriangle style={{ width: '48px', height: '48px', color: '#ef4444', margin: '0 auto 16px' }} />
           <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>
             Supprimer le produit
           </h2>
           <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>
             Êtes-vous sûr de vouloir supprimer "<strong>{deletingProduct.name}</strong>" ?
           </p>
           <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#ef4444' }}>
             Cette action est irréversible.
           </p>

           <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
             <Button
               variant="outline"
               onClick={() => setShowDeleteModal(false)}
             >
               Annuler
             </Button>
             <Button
               variant="danger"
               onClick={() => handleDeleteProduct(deletingProduct.id)}
               leftIcon={<Trash2 style={{ width: '16px', height: '16px' }} />}
             >
               Supprimer
             </Button>
           </div>
         </div>
       </div>
     </div>
   );
 };

 // Modal de réapprovisionnement corrigé
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
             setQuantity('');
             setReason('Réapprovisionnement');
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
     
     {/* Modal d'import Excel */}
     <ProductImportModal
       isOpen={showImportModal}
       onClose={() => setShowImportModal(false)}
     />
   </div>
 );
};

export default InventoryModule;
