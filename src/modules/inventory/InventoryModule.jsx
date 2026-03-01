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
import PhysicalInventoryModule from './PhysicalInventoryModule';

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
        const margin = ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100;
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
    background: 'var(--color-surface)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid var(--color-border)',
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
      background: 'var(--color-surface)',
      color: 'var(--color-text-primary)',
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
      color: 'var(--color-text-secondary)'
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
          color: 'var(--color-text-secondary)'
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
  },
  info: (message) => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3b82f6;
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

// Composant pour le modal de modification - AJOUTER AVANT InventoryModule
const EditModal = ({ product, onClose, onSave, appSettings }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    price: product?.sellingPrice || '',
    costPrice: product?.costPrice || '',
    minStock: product?.minStock || '',
    maxStock: product?.maxStock || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    supplier: product?.supplier || '',
    image: product?.image || ''
  });

  const calculateMargin = (price, costPrice) => {
    const p = parseFloat(price) || 0;
    const c = parseFloat(costPrice) || 0;
    if (p === 0) return 0;
    return ((p - c) / p * 100).toFixed(1);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, image: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const margin = calculateMargin(formData.price, formData.costPrice);
  const hasInvalidPrice = parseFloat(formData.price) < parseFloat(formData.costPrice) && 
                         formData.price && formData.costPrice;

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
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        {/* Aperçu de l'image */}
        {formData.image && (
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <img
              src={formData.image}
              alt="Aperçu"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '2px solid var(--color-border)'
              }}
            />
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          if (!hasInvalidPrice) {
            onSave(formData);
          }
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
                onChange={handleImageUpload}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✕ Supprimer
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Nom du produit *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
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
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
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
                value={formData.costPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
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
          {formData.price && formData.costPrice && (
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
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Profit par unité: {(parseFloat(formData.price) - parseFloat(formData.costPrice)).toLocaleString()} FCFA
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Stock minimum
              </label>
              <input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
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
                value={formData.maxStock}
                onChange={(e) => setFormData(prev => ({ ...prev, maxStock: e.target.value }))}
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
                Fournisseur
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
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
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: 'var(--color-text-primary)',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={hasInvalidPrice}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: hasInvalidPrice ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: hasInvalidPrice ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              <Save style={{ width: '16px', height: '16px' }} />
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== COMPOSANT PRINCIPAL ====================

const InventoryModule = () => {
  // ===== UTILISATION DU CONTEXTE RÉEL =====
  const {
    productCatalog = [], // Produits du magasin actuel uniquement
    allProducts = [], // Tous les produits (pour certaines opérations globales)
    addProduct,
    updateProduct,
    addStock,
    deleteProduct, // ✅ FIX: Utiliser deleteProduct au lieu de removeProduct
    salesHistory = [],
    appSettings = {},
    currentStoreId,
    stockByStore = {},
    stores = []
  } = useApp();

  // Obtenir le magasin actuel
  const currentStore = useMemo(() => {
    return stores.find(s => s.id === currentStoreId);
  }, [stores, currentStoreId]);

  // États locaux du module
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterBy, setFilterBy] = useLocalStorage('inventory-filters', {
    stockLevel: 'all',
    profitability: 'all'
  });

  // ✅ NOUVEAU: État pour la sélection multiple
  const [selectedProducts, setSelectedProducts] = useState([]);

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
  const categories = useCategories(productCatalog);
  const filteredProducts = useProductSearch(productCatalog, debouncedSearch, selectedCategory, filterBy);

  // Analytics basés sur les vraies données
  const analytics = useMemo(() => {
    // productCatalog contient déjà uniquement les produits du magasin actuel
    const productsWithStock = productCatalog;

    const totalProducts = productsWithStock.length;
    // ✅ Arrondir les montants pour éviter les décimales
    const totalValue = Math.round(productsWithStock.reduce((sum, p) => sum + ((p.stock || 0) * (p.costPrice || 0)), 0));
    const totalSalesValue = Math.round(productsWithStock.reduce((sum, p) => sum + ((p.stock || 0) * (p.sellingPrice || 0)), 0));
    const potentialProfit = Math.round(totalSalesValue - totalValue);

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
      averageStockValue: Math.round(totalProducts > 0 ? totalValue / totalProducts : 0)
    };

    return { alerts, totals, productsWithStock };
  }, [productCatalog]);

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
        sellingPrice: price,
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
      const updatedData = {
        ...editingProduct,
        name: productData.name,
        category: productData.category || 'Divers',
        sellingPrice: price,
        costPrice: costPrice,
        minStock: parseInt(productData.minStock) || 5,
        maxStock: parseInt(productData.maxStock) || 100,
        sku: productData.sku || editingProduct.sku,
        barcode: productData.barcode || editingProduct.barcode,
        supplier: productData.supplier || '',
        image: productData.image || ''
      };

      // ✅ CORRECTION : Appeler la fonction updateProduct du contexte
const success = updateProduct(editingProduct.id, updatedData);

if (success) {
  setEditingProduct(null);
  setShowEditModal(false);
  Toast.success(`Produit "${updatedData.name}" modifié avec succès`);
} else {
  Toast.error('Erreur lors de la modification du produit');}
    } 
    catch (error) {
      console.error('Erreur lors de la modification:', error);
    
      Toast.error('Erreur lors de la modification du produit');
    }
  }, [editingProduct, updateProduct]);

  // ==================== EXPORT & WHATSAPP ====================

  const exportToPDF = useCallback(async () => {
    try {
      const productsToExport = [
        ...analytics.alerts.outOfStock,
        ...analytics.alerts.lowStock
      ];

      if (productsToExport.length === 0) {
        Toast.info('Aucun produit à exporter');
        return;
      }

      // Importer jsPDF et autotable dynamiquement
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;

      // En-tête du document
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246);
      doc.text('RÉAPPROVISIONNEMENT', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(currentStore?.name || 'Magasin', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      const dateStr = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Généré le ${dateStr}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;

      // Ligne de séparation
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 10;

      // Résumé
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total produits à commander: ${productsToExport.length}`, 15, yPosition);
      yPosition += 6;
      doc.setTextColor(220, 38, 38);
      doc.text(`Ruptures: ${analytics.alerts.outOfStock.length}`, 15, yPosition);
      yPosition += 6;
      doc.setTextColor(217, 119, 6);
      doc.text(`Stock faible: ${analytics.alerts.lowStock.length}`, 15, yPosition);
      yPosition += 12;

      // Préparer les données pour le tableau
      const tableData = [];

      // Ajouter les ruptures en premier
      analytics.alerts.outOfStock.forEach(p => {
        const toOrder = (p.minStock || 5) * 2;
        tableData.push([
          p.name || '',
          p.category || '-',
          '0',
          (p.minStock || 5).toString(),
          toOrder.toString(),
          (p.costPrice || 0).toLocaleString(),
          p.supplier || '-',
          'Rupture'
        ]);
      });

      // Ajouter les produits en stock faible
      analytics.alerts.lowStock.forEach(p => {
        const stock = p.stock || 0;
        const minStock = p.minStock || 5;
        const toOrder = Math.max(minStock * 2 - stock, minStock);
        tableData.push([
          p.name || '',
          p.category || '-',
          stock.toString(),
          minStock.toString(),
          toOrder.toString(),
          (p.costPrice || 0).toLocaleString(),
          p.supplier || '-',
          'Stock faible'
        ]);
      });

      // Créer le tableau avec autotable
      doc.autoTable({
        startY: yPosition,
        head: [['Produit', 'Catégorie', 'Stock', 'Min', 'À Commander', 'Prix Achat', 'Fournisseur', 'Statut']],
        body: tableData,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 35 },  // Produit
          1: { cellWidth: 25 },  // Catégorie
          2: { cellWidth: 15, halign: 'center' },  // Stock
          3: { cellWidth: 15, halign: 'center' },  // Min
          4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },  // À Commander
          5: { cellWidth: 20, halign: 'right' },   // Prix
          6: { cellWidth: 25 },  // Fournisseur
          7: { cellWidth: 20, halign: 'center' }   // Statut
        },
        didParseCell: function(data) {
          // Colorer les lignes selon le statut
          if (data.row.index >= 0 && data.column.index === 7) {
            if (data.cell.raw === 'Rupture') {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.raw === 'Stock faible') {
              data.cell.styles.textColor = [217, 119, 6];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        margin: { left: 15, right: 15 }
      });

      // Pied de page
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Généré par POS Superette', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Télécharger le PDF
      const date = new Date().toISOString().split('T')[0];
      doc.save(`reapprovisionnement_${date}.pdf`);

      Toast.success(`PDF généré: ${productsToExport.length} produits`);
    } catch (error) {
      console.error('Erreur export PDF:', error);
      Toast.error('Erreur lors de la génération du PDF');
    }
  }, [analytics, currentStore]);

  const shareWhatsApp = useCallback(() => {
    try {
      const outOfStock = analytics.alerts.outOfStock;
      const lowStock = analytics.alerts.lowStock;

      if (outOfStock.length === 0 && lowStock.length === 0) {
        Toast.info('Aucun produit à partager');
        return;
      }

      const storeName = currentStore?.name || 'Magasin';
      const date = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let message = `📦 *RÉAPPROVISIONNEMENT ${storeName.toUpperCase()}*\n`;
      message += `📅 ${date}\n\n`;

      if (outOfStock.length > 0) {
        message += `🔴 *RUPTURES (${outOfStock.length}):*\n`;
        outOfStock.forEach(p => {
          const toOrder = (p.minStock || 5) * 2;
          message += `• ${p.name} - Commander: *${toOrder}*\n`;
        });
        message += '\n';
      }

      if (lowStock.length > 0) {
        message += `🟠 *STOCK FAIBLE (${lowStock.length}):*\n`;
        lowStock.forEach(p => {
          const stock = p.stock || 0;
          const minStock = p.minStock || 5;
          const toOrder = Math.max(minStock * 2 - stock, minStock);
          message += `• ${p.name} - Stock: ${stock} - Commander: *${toOrder}*\n`;
        });
        message += '\n';
      }

      const totalProducts = outOfStock.length + lowStock.length;
      message += `📊 *Total: ${totalProducts} produits*\n`;
      message += `\n_Généré par POS Superette_`;

      // Encoder et ouvrir WhatsApp
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');

      Toast.success('Message WhatsApp préparé');
    } catch (error) {
      console.error('Erreur WhatsApp:', error);
      Toast.error('Erreur lors du partage WhatsApp');
    }
  }, [analytics, currentStore]);

  const handleDeleteProduct = useCallback(async (productId) => {
    try {
      const result = await deleteProduct(productId); // ✅ FIX: Utiliser deleteProduct
      if (result.success) {
        setDeletingProduct(null);
        setShowDeleteModal(false);
        Toast.success('Produit supprimé avec succès');
      } else {
        Toast.error('Erreur lors de la suppression du produit');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      Toast.error('Erreur lors de la suppression du produit');
    }
  }, [deleteProduct]);

  const handleRestock = useCallback(async (productId, quantity, reason = 'Réapprovisionnement') => {
    try {
      const result = await addStock(productId, parseInt(quantity));
      if (result.success) {
        setRestockingProduct(null);
        setShowRestockModal(false);
        Toast.success(`Stock mis à jour: +${quantity} unités`);
      } else {
        Toast.error('Erreur lors du réapprovisionnement');
      }
    } catch (error) {
      console.error('Erreur lors du réapprovisionnement:', error);
      Toast.error('Erreur lors du réapprovisionnement');
    }
  }, [addStock]);

  const handleClearCatalog = useCallback(() => {
    if (window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer TOUS les produits de ce magasin ? Cette action est irréversible !')) {
      if (window.confirm('🚨 DERNIÈRE CONFIRMATION : Tous les produits du magasin actuel seront définitivement supprimés !')) {
        productCatalog.forEach(product => {
          deleteProduct(product.id); // ✅ FIX: Utiliser deleteProduct
        });
        Toast.success('Catalogue du magasin vidé avec succès');
      }
    }
  }, [productCatalog, deleteProduct]);

  // ✅ NOUVEAU: Gestion de la sélection multiple
  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleDeleteSelected = useCallback(async () => {
    if (selectedProducts.length === 0) {
      Toast.info('Aucun produit sélectionné');
      return;
    }

    if (window.confirm(`⚠️ Êtes-vous sûr de vouloir supprimer ${selectedProducts.length} produit(s) ?`)) {
      let successCount = 0;
      let errorCount = 0;

      for (const productId of selectedProducts) {
        try {
          const result = await deleteProduct(productId);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      setSelectedProducts([]);

      if (errorCount === 0) {
        Toast.success(`${successCount} produit(s) supprimé(s) avec succès`);
      } else if (successCount === 0) {
        Toast.error(`Erreur lors de la suppression des produits`);
      } else {
        Toast.warning(`${successCount} supprimé(s), ${errorCount} échec(s)`);
      }
    }
  }, [selectedProducts, deleteProduct]);

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
    backgroundColor: var(--color-bg),
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
                  {analytics.totals.totalValue.toLocaleString()} {appSettings?.currency || 'FCFA'}
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
            color: 'var(--color-text-primary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Profit Potentiel</h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                  {analytics.totals.potentialProfit.toLocaleString()} {appSettings?.currency || 'FCFA'}
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
                  backgroundColor: 'var(--color-bg)',
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

            {/* Boutons d'export et partage */}
            {(analytics.alerts.outOfStock.length > 0 || analytics.alerts.lowStock.length > 0) && (
              <div style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <button
                  onClick={exportToPDF}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    touchAction: 'manipulation',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Exporter la liste au format PDF"
                >
                  <Download style={{ width: '16px', height: '16px' }} />
                  Export PDF
                </button>

                <button
                  onClick={shareWhatsApp}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    touchAction: 'manipulation',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Partager la liste via WhatsApp"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Partager WhatsApp
                </button>
              </div>
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
          {/* ✅ NOUVEAU: Boutons de sélection multiple */}
          {selectedProducts.length > 0 && (
            <>
              <Button
                variant="danger"
                onClick={handleDeleteSelected}
                leftIcon={<Trash2 style={{ width: '16px', height: '16px' }} />}
              >
                Supprimer ({selectedProducts.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedProducts([])}
                leftIcon={<X style={{ width: '16px', height: '16px' }} />}
              >
                Annuler sélection
              </Button>
            </>
          )}

          <Button
            variant="outline"
            onClick={toggleSelectAll}
            leftIcon={<CheckCircle style={{ width: '16px', height: '16px' }} />}
          >
            {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0
              ? 'Tout désélectionner'
              : 'Tout sélectionner'}
          </Button>

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
     {filteredProducts.length === 0 ? (
       <div style={{
         textAlign: 'center',
         padding: '60px 20px',
         background: 'var(--color-surface)',
         borderRadius: '12px',
         border: '2px dashed var(--color-border)'
       }}>
         <Package size={64} style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }} />
         <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>
           Aucun produit trouvé
         </h3>
         <p style={{ margin: '0 0 20px 0', color: 'var(--color-text-secondary)' }}>
           {productCatalog.length === 0
             ? "Commencez par ajouter des produits au catalogue de ce magasin"
             : "Aucun produit ne correspond aux filtres sélectionnés"}
         </p>
         {productCatalog.length === 0 && (
           <Button
             variant="primary"
             onClick={() => setShowAddModal(true)}
             leftIcon={<Plus style={{ width: '16px', height: '16px' }} />}
           >
             Ajouter votre premier produit
           </Button>
         )}
       </div>
     ) : (
       <div style={{
         display: 'grid',
         gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
         gap: '16px'
       }}>
         {filteredProducts.map(product => {
         const currentStock = product.stock || 0;
         const isLowStock = currentStock <= (product.minStock || 5);
         const isOutOfStock = currentStock === 0;
         const margin = calculateMargin(product.sellingPrice, product.costPrice);
         const isSelected = selectedProducts.includes(product.id); // ✅ NOUVEAU

         return (
           <Card key={product.id} style={{
             position: 'relative', // ✅ NOUVEAU
             border: isSelected
               ? '2px solid var(--color-primary)'
               : isOutOfStock ? '2px solid #dc2626' : isLowStock ? '2px solid #f59e0b' : '1px solid var(--color-border)',
             backgroundColor: isSelected ? '#eff6ff' : 'white', // ✅ NOUVEAU
             transition: 'all 0.2s' // ✅ NOUVEAU
           }}>
             {/* ✅ NOUVEAU: Case à cocher en haut à gauche */}
             <div
               style={{
                 position: 'absolute',
                 top: '12px',
                 left: '12px',
                 zIndex: 10,
               }}
             >
               <input
                 type="checkbox"
                 checked={isSelected}
                 onChange={() => toggleProductSelection(product.id)}
                 style={{
                   width: '20px',
                   height: '20px',
                   cursor: 'pointer',
                   accentColor: 'var(--color-primary)',
                 }}
                 title={isSelected ? 'Désélectionner' : 'Sélectionner'}
               />
             </div>

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
                 <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                   {product.name}
                 </h3>
                 <p style={{ margin: '4px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
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
                 <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Prix de vente</span>
                 <span style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>
                   {product.sellingPrice?.toLocaleString()} {appSettings?.currency || 'FCFA'}
                 </span>
               </div>
               <div>
                 <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Stock actuel</span>
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
                     price: product.sellingPrice,
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
                 border: '2px solid var(--color-border)'
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
               <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
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

 // Modal de modification de produit - REMPLACER LA FONCTION EXISTANTE
const renderEditProductModal = () => {
  if (!showEditModal || !editingProduct) return null;

  return (
    <EditModal 
      product={editingProduct}
      appSettings={appSettings}
      onClose={() => setShowEditModal(false)}
      onSave={handleEditProduct}
    />
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
           <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-secondary)' }}>
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
// Modal de réapprovisionnement corrigé
const renderRestockModal = () => {
  if (!showRestockModal || !restockingProduct) return null;

  // ✅ CORRECTION : Déclarer les états à l'intérieur du composant principal
  return (
    <RestockModalContent
      product={restockingProduct}
      onClose={() => setShowRestockModal(false)}
      onRestock={handleRestock}
      currentStock={restockingProduct.stock || 0}
    />
  );
};

// Composant séparé pour le modal de réapprovisionnement
const RestockModalContent = ({ product, onClose, onRestock, currentStock }) => {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Réapprovisionnement');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (quantity && parseInt(quantity) > 0) {
      onRestock(product.id, quantity, reason);
      setQuantity('');
      setReason('Réapprovisionnement');
    }
  };

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
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>
            {product.name}
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Stock actuel: {currentStock} unités
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
              autoFocus
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
              onClick={onClose}
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
   { id: 'movements', name: 'Mouvements', icon: Activity },
   { id: 'physical', name: 'Inventaire Physique', icon: ClipboardList }
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
             color: var(--color-text-primary)
           }}>
             Gestion des Stocks
           </h1>
           <p style={{
             margin: '4px 0 0 0',
             fontSize: '16px',
             color: var(--color-text-secondary)
           }}>
             Magasin: {stores.find(s => s.id === currentStoreId)?.name || 'Non sélectionné'}
           </p>
         </div>
       </div>
     </div>

     {/* Navigation par onglets */}
     <div style={{ borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
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
       {activeTab === 'physical' && <PhysicalInventoryModule />}
     </div>

     {/* Modals */}
     {renderAddProductModal()}
     {renderEditProductModal()}
     {renderDeleteProductModal()}
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
