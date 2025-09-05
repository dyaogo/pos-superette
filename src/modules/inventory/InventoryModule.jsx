import React, { useState, useEffect } from 'react';
import {
  Package, AlertTriangle, TrendingDown, TrendingUp,
  Search, Plus, Minus, Edit, Save, X, Bell,
  BarChart3, Truck, Clock, Eye, RefreshCw, Trash
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext'; // ✅ Correction critique
import BarcodeSystem from './BarcodeSystem';
import PhysicalInventory from './PhysicalInventory';
import TransferStock from './TransferStock';
import { generateRealExcel } from '../../utils/ExportUtils';
import ProductImportModal from './ProductImportModal';
import StockMovements from './StockMovements';

const InventoryModule = () => {
  const { globalProducts, addStock, appSettings, salesHistory, currentStoreId, addProduct, removeProduct } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [restockingProduct, setRestockingProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [restockReason, setRestockReason] = useState('Réapprovisionnement manuel');
  const [activeTab, setActiveTab] = useState('overview');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const isDark = appSettings.darkMode;

  // Produits du magasin courant
  const products = globalProducts || [];

  // Calculs statistiques mis à jour
  const stats = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + ((p.stock || 0) * (p.costPrice || 0)), 0),
    lowStock: products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStock || 5)).length,
    outOfStock: products.filter(p => (p.stock || 0) === 0).length,
    overStock: products.filter(p => (p.maxStock || Infinity) > 0 && (p.stock || 0) > (p.maxStock || Infinity)).length,
    totalSalesValue: products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0)
  };

  // Calculer les mouvements de stock basés sur l'historique des ventes
  const stockMovements = (salesHistory || []).flatMap(sale => 
    (sale.items || []).map(item => ({
      date: sale.date,
      productName: item.name,
      quantity: -item.quantity,
      type: 'Vente',
      reference: sale.receiptNumber
    }))
  ).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  // Categories uniquement à partir des produits existants
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Produits filtrés
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.barcode?.includes(searchTerm) ||
                         p.id?.toString().includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory && (!lowStockOnly || ((p.stock||0)>0 && (p.stock||0) <= (p.minStock||5)));
  });

  async function handleExportLowStock() {
    const low = products.filter(p => (p.stock||0) > 0 && (p.stock||0) <= (p.minStock||5));
    const reportData = {
      stock: {
        categoryBreakdown: {},
        totalProducts: products.length,
        totalStockValue: 0,
        totalSaleValue: 0,
        outOfStockProducts: [],
        lowStockProducts: low,
      }
    };
    await generateRealExcel(reportData, 'stock', appSettings);
  }

  async function handleExportInventory() {
    const categoryBreakdown = products.reduce((acc, p) => {
      const category = p.category || 'Divers';
      if (!acc[category]) {
        acc[category] = { count: 0, totalStock: 0, totalValue: 0 };
      }
      acc[category].count++;
      acc[category].totalStock += (p.stock || 0);
      acc[category].totalValue += (p.stock || 0) * (p.costPrice || 0);
      return acc;
    }, {});

    const reportData = {
      stock: {
        categoryBreakdown,
        totalProducts: products.length,
        totalStockValue: products.reduce((sum, p) => sum + ((p.stock || 0) * (p.costPrice || 0)), 0),
        totalSaleValue: products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0),
        outOfStockProducts: products.filter(p => (p.stock || 0) === 0),
        lowStockProducts: products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStock || 5)),
        overStockProducts: products.filter(p => (p.maxStock || Infinity) > 0 && (p.stock || 0) > (p.maxStock || Infinity)),
        products
      }
    };
    await generateRealExcel(reportData, 'stock', appSettings);
  }

  // Styles
  const styles = {
    container: {
      padding: '20px',
      background: isDark ? '#1a202c' : '#f7fafc',
      minHeight: 'calc(100vh - 120px)'
    },
    header: {
      background: isDark ? '#2d3748' : 'white',
      padding: '24px',
      borderRadius: '12px',
      marginBottom: '24px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    tabs: {
      display: 'flex',
      gap: '0',
      marginBottom: '24px',
      borderBottom: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '12px 12px 0 0',
      overflow: 'hidden'
    },
    tab: {
      padding: '16px 24px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      color: isDark ? '#a0aec0' : '#718096',
      transition: 'all 0.2s',
      borderBottom: '3px solid transparent'
    },
    activeTab: {
      color: isDark ? '#63b3ed' : '#3182ce',
      background: isDark ? '#4a5568' : '#edf2f7',
      borderBottomColor: isDark ? '#63b3ed' : '#3182ce'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    },
    statCard: {
      background: isDark ? '#2d3748' : 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
    },
    alertCard: {
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
    }
  };

  // Composant Vue d'ensemble
  const OverviewTab = () => (
    <div>
      {/* Statistiques principales */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Package size={24} color="#3182ce" />
            <h3 style={{ margin: 0, color: isDark ? '#f7fafc' : '#2d3748' }}>Produits Total</h3>
          </div>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: isDark ? '#f7fafc' : '#2d3748' }}>
            {stats.totalProducts}
          </p>
          <p style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#718096', margin: '4px 0 0 0' }}>
            Valeur totale: {stats.totalValue.toLocaleString()} {appSettings.currency}
          </p>
        </div>

        <div style={styles.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <AlertTriangle size={24} color="#f59e0b" />
            <h3 style={{ margin: 0, color: isDark ? '#f7fafc' : '#2d3748' }}>Stock Faible</h3>
          </div>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>
            {stats.lowStock}
          </p>
          <p style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#718096', margin: '4px 0 0 0' }}>
            Produits à réapprovisionner
          </p>
        </div>

        <div style={styles.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <TrendingDown size={24} color="#ef4444" />
            <h3 style={{ margin: 0, color: isDark ? '#f7fafc' : '#2d3748' }}>Rupture</h3>
          </div>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#ef4444' }}>
            {stats.outOfStock}
          </p>
          <p style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#718096', margin: '4px 0 0 0' }}>
            Produits en rupture
          </p>
        </div>

        <div style={styles.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <TrendingUp size={24} color="#10b981" />
            <h3 style={{ margin: 0, color: isDark ? '#f7fafc' : '#2d3748' }}>Valeur Stock</h3>
          </div>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: isDark ? '#f7fafc' : '#2d3748' }}>
            {stats.totalSalesValue.toLocaleString()}
          </p>
          <p style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#718096', margin: '4px 0 0 0' }}>
            {appSettings.currency} (prix de vente)
          </p>
        </div>
      </div>

      {/* Alertes */}
      {(stats.lowStock > 0 || stats.outOfStock > 0) && (
        <div style={styles.alertCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Bell size={20} color="#f59e0b" />
            <h3 style={{ margin: 0, color: isDark ? '#f7fafc' : '#2d3748' }}>Alertes Stock</h3>
          </div>
          
          {stats.outOfStock > 0 && (
            <div style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <p style={{ margin: 0, color: '#dc2626', fontWeight: '600' }}>
                🚨 {stats.outOfStock} produit(s) en rupture de stock
              </p>
            </div>
          )}
          
          {stats.lowStock > 0 && (
            <div style={{
              padding: '12px 16px',
              background: '#fefbf2',
              border: '1px solid #fed7aa',
              borderRadius: '8px'
            }}>
              <p style={{ margin: 0, color: '#d97706', fontWeight: '600' }}>
                ⚠️ {stats.lowStock} produit(s) avec stock faible
              </p>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={() => { setLowStockOnly(true); setActiveTab('products'); }}
              style={{
                padding: '8px 16px',
                background: '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Voir les produits
            </button>
          </div>
        </div>
      )}

      {/* Mouvements récents */}
      {stockMovements.length > 0 && (
        <div style={styles.alertCard}>
          <h3 style={{ margin: '0 0 16px 0', color: isDark ? '#f7fafc' : '#2d3748' }}>
            Mouvements récents
          </h3>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {stockMovements.map((movement, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
                }}
              >
                <div>
                  <p style={{
                    margin: 0,
                    fontWeight: '500',
                    color: isDark ? '#f7fafc' : '#2d3748'
                  }}>
                    {movement.productName}
                  </p>
                  <p style={{
                    margin: '2px 0 0 0',
                    fontSize: '12px',
                    color: isDark ? '#a0aec0' : '#718096'
                  }}>
                    {movement.type} - {movement.reference}
                  </p>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <p style={{
                    margin: 0,
                    color: movement.quantity < 0 ? '#ef4444' : '#10b981',
                    fontWeight: '600'
                  }}>
                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                  </p>
                  <p style={{
                    margin: '2px 0 0 0',
                    fontSize: '12px',
                    color: isDark ? '#a0aec0' : '#718096'
                  }}>
                    {new Date(movement.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Composant Liste des produits
  const ProductsTab = () => (
    <div>
      {/* Barre de recherche et filtres */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isDark ? '#a0aec0' : '#718096'
              }}
            />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '8px',
                background: isDark ? '#4a5568' : 'white',
                color: isDark ? '#f7fafc' : '#2d3748',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '12px 16px',
            border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
            borderRadius: '8px',
            background: isDark ? '#4a5568' : 'white',
            color: isDark ? '#f7fafc' : '#2d3748',
            fontSize: '14px'
          }}
        >
          <option value="all">Toutes catégories</option>
          {categories.filter(cat => cat !== 'all').map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={16} />
          Ajouter Produit
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          style={{
            padding: '12px 20px',
            background: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Importer
        </button>
        <button
          onClick={handleExportInventory}
          style={{
            padding: '12px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <BarChart3 size={16} />
          Exporter inventaire
        </button>
        {lowStockOnly && (
          <>
            <button
              onClick={handleExportLowStock}
              style={{
                padding: '12px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <BarChart3 size={16} />
              Exporter
            </button>
            <button
              onClick={() => setLowStockOnly(false)}
              style={{
                padding: '12px 20px',
                background: '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw size={16} />
              Tous les produits
            </button>
          </>
        )}
      </div>

      {/* Liste des produits */}
      <div style={{
        background: isDark ? '#2d3748' : 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {filteredProducts.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: isDark ? '#a0aec0' : '#718096'
          }}>
            <Package size={48} style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
              Aucun produit trouvé
            </p>
            <p style={{ margin: 0 }}>
              {searchTerm || selectedCategory !== 'all' 
                ? 'Modifiez vos critères de recherche' 
                : 'Commencez par ajouter des produits à votre inventaire'
              }
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: isDark ? '#4a5568' : '#f7fafc' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: isDark ? '#f7fafc' : '#2d3748' }}>Produit</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: isDark ? '#f7fafc' : '#2d3748' }}>Stock</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: isDark ? '#f7fafc' : '#2d3748' }}>Prix</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: isDark ? '#f7fafc' : '#2d3748' }}>Valeur</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: isDark ? '#f7fafc' : '#2d3748' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const isLowStock = (product.stock || 0) <= (product.minStock || 5) && (product.stock || 0) > 0;
                  const isOutOfStock = (product.stock || 0) === 0;
                  
                  return (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                        '&:hover': { background: isDark ? '#4a5568' : '#f7fafc' }
                      }}
                    >
                      <td style={{ padding: '16px' }}>
                        <div>
                          <p style={{
                            margin: 0,
                            fontWeight: '600',
                            color: isDark ? '#f7fafc' : '#2d3748'
                          }}>
                            {product.name}
                          </p>
                          <p style={{
                            margin: '4px 0 0 0',
                            fontSize: '12px',
                            color: isDark ? '#a0aec0' : '#718096'
                          }}>
                            {product.category} • {product.barcode || 'Pas de code-barres'}
                          </p>
                        </div>
                      </td>
                      
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: isOutOfStock ? '#fee2e2' : isLowStock ? '#fef3c7' : '#d1fae5',
                          color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#065f46'
                        }}>
                          {product.stock || 0}
                        </span>
                      </td>
                      
                      <td style={{
                        padding: '16px',
                        textAlign: 'right',
                        color: isDark ? '#f7fafc' : '#2d3748',
                        fontWeight: '600'
                      }}>
                        {(product.price || 0).toLocaleString()} {appSettings.currency}
                      </td>
                      
                      <td style={{
                        padding: '16px',
                        textAlign: 'right',
                        color: isDark ? '#f7fafc' : '#2d3748'
                      }}>
                        {((product.stock || 0) * (product.costPrice || 0)).toLocaleString()} {appSettings.currency}
                      </td>
                      
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setRestockingProduct(product);
                              setShowRestockModal(true);
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#3182ce',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Plus size={12} />
                            Stock
                          </button>
                          
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setShowEditModal(true);
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Edit size={12} />
                            Modifier
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm('Supprimer ce produit ?')) {
                                removeProduct(product.id);
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Trash size={12} />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // Modal de réapprovisionnement
  const RestockModal = () => {
    if (!showRestockModal || !restockingProduct) return null;

    const handleRestock = () => {
      const quantity = parseInt(restockQuantity, 10);
      const reason = (restockReason || '').trim() || 'Réapprovisionnement';
      if (quantity > 0) {
        addStock(
          currentStoreId,
          restockingProduct.id,
          quantity,
          reason
        );
        setShowRestockModal(false);
        setRestockingProduct(null);
        setRestockQuantity('');
        setRestockReason('Réapprovisionnement manuel');
      }
    };

    return (
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
          padding: '24px',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: isDark ? '#f7fafc' : '#2d3748' }}>
            Réapprovisionner : {restockingProduct.name}
          </h3>
          
          <p style={{ margin: '0 0 16px 0', color: isDark ? '#a0aec0' : '#718096' }}>
            Stock actuel : {restockingProduct.stock || 0}
          </p>
          
          <input
            type="number"
            min="1"
            placeholder="Quantité à ajouter"
            value={restockQuantity}
            onChange={(e) => setRestockQuantity(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
              borderRadius: '8px',
              background: isDark ? '#4a5568' : 'white',
              color: isDark ? '#f7fafc' : '#2d3748',
              fontSize: '14px',
              marginBottom: '20px',
              boxSizing: 'border-box'
            }}
            autoFocus
          />

          <input
            type="text"
            placeholder="Raison du réapprovisionnement"
            value={restockReason}
            onChange={(e) => setRestockReason(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
              borderRadius: '8px',
              background: isDark ? '#4a5568' : 'white',
              color: isDark ? '#f7fafc' : '#2d3748',
              fontSize: '14px',
              marginBottom: '20px',
              boxSizing: 'border-box'
            }}
          />

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                setShowRestockModal(false);
                setRestockingProduct(null);
                setRestockQuantity('');
              }}
              style={{
                flex: 1,
                padding: '12px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Annuler
            </button>
            
            <button
              onClick={handleRestock}
              disabled={!restockQuantity || parseInt(restockQuantity) <= 0}
              style={{
                flex: 1,
                padding: '12px',
                background: (!restockQuantity || parseInt(restockQuantity) <= 0) ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (!restockQuantity || parseInt(restockQuantity) <= 0) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Ajouter Stock
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal d'ajout de produit (simplifié)
  const AddProductModal = () => {
    const [newProduct, setNewProduct] = useState({
      name: '',
      category: '',
      price: '',
      costPrice: '',
      stock: '',
      minStock: '5',
      barcode: '',
      imageUrl: ''
    });
    const [showImageSearch, setShowImageSearch] = useState(false);

    if (!showAddModal) return null;

    const handleAddProduct = () => {
      if (!newProduct.name || !newProduct.price) {
        alert('Veuillez remplir au moins le nom et le prix');
        return;
      }

      const product = {
        id: Date.now(),
        name: newProduct.name,
        category: newProduct.category || 'Divers',
        price: parseFloat(newProduct.price) || 0,
        costPrice: parseFloat(newProduct.costPrice) || 0,
        minStock: parseInt(newProduct.minStock) || 5,
        barcode: newProduct.barcode || `${Date.now()}`,
        imageUrl: newProduct.imageUrl,
        createdAt: new Date().toISOString()
      };

      const initialStock = parseInt(newProduct.stock) || 0;
      addProduct(product, initialStock);
      setShowAddModal(false);
      setNewProduct({
        name: '',
        category: '',
        price: '',
        costPrice: '',
        stock: '',
        minStock: '5',
        barcode: '',
        imageUrl: ''
      });
    };

    return (
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
          padding: '24px',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: isDark ? '#f7fafc' : '#2d3748' }}>
            Ajouter un nouveau produit
          </h3>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <input
              type="text"
              placeholder="Nom du produit *"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              style={{
                padding: '12px',
                border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '8px',
                background: isDark ? '#4a5568' : 'white',
                color: isDark ? '#f7fafc' : '#2d3748',
                fontSize: '14px'
              }}
            />
            
            <input
              type="text"
              placeholder="Catégorie"
              value={newProduct.category}
              onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
              style={{
                padding: '12px',
                border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '8px',
                background: isDark ? '#4a5568' : 'white',
                color: isDark ? '#f7fafc' : '#2d3748',
                fontSize: '14px'
              }}
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input
                type="number"
                placeholder="Prix de vente *"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                style={{
                  padding: '12px',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  background: isDark ? '#4a5568' : 'white',
                  color: isDark ? '#f7fafc' : '#2d3748',
                  fontSize: '14px'
                }}
              />
              
              <input
                type="number"
                placeholder="Prix d'achat"
                value={newProduct.costPrice}
                onChange={(e) => setNewProduct({...newProduct, costPrice: e.target.value})}
                style={{
                  padding: '12px',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  background: isDark ? '#4a5568' : 'white',
                  color: isDark ? '#f7fafc' : '#2d3748',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input
                type="number"
                placeholder="Stock initial"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                style={{
                  padding: '12px',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  background: isDark ? '#4a5568' : 'white',
                  color: isDark ? '#f7fafc' : '#2d3748',
                  fontSize: '14px'
                }}
              />

              <input
                type="number"
                placeholder="Stock minimum"
                value={newProduct.minStock}
                onChange={(e) => setNewProduct({...newProduct, minStock: e.target.value})}
                style={{
                  padding: '12px',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  background: isDark ? '#4a5568' : 'white',
                  color: isDark ? '#f7fafc' : '#2d3748',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Image field */}
            <div style={{ display: 'grid', gap: '8px' }}>
              {newProduct.imageUrl && (
                <img
                  src={newProduct.imageUrl}
                  alt="Prévisualisation"
                  style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setNewProduct({ ...newProduct, imageUrl: url });
                  }
                }}
                style={{
                  padding: '12px',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  background: isDark ? '#4a5568' : 'white',
                  color: isDark ? '#f7fafc' : '#2d3748',
                  fontSize: '14px'
                }}
              />
              <button
                type="button"
                onClick={() => setShowImageSearch(true)}
                style={{
                  padding: '10px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Rechercher en ligne
              </button>
            </div>

            <input
              type="text"
              placeholder="Code-barres (optionnel)"
              value={newProduct.barcode}
              onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
              style={{
                padding: '12px',
                border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '8px',
                background: isDark ? '#4a5568' : 'white',
                color: isDark ? '#f7fafc' : '#2d3748',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={() => setShowAddModal(false)}
              style={{
                flex: 1,
                padding: '12px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Annuler
            </button>
            
            <button
              onClick={handleAddProduct}
              style={{
                flex: 1,
                padding: '12px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Ajouter Produit
            </button>
          </div>
        </div>
        {showImageSearch && (
          <ImageSearchModal
            isDark={isDark}
            onSelect={(url) => {
              setNewProduct({ ...newProduct, imageUrl: url });
              setShowImageSearch(false);
            }}
            onClose={() => setShowImageSearch(false)}
          />
        )}
      </div>
    );
  };

  const ImageSearchModal = ({ isDark, onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    const searchImages = async () => {
      if (!query) return;
      try {
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&client_id=${process.env.REACT_APP_UNSPLASH_KEY}`);
        const data = await response.json();
        setResults(data.results || []);
      } catch (err) {
        console.error('Image search failed', err);
      }
    };

    return (
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
        zIndex: 1100
      }}>
        <div style={{
          background: isDark ? '#2d3748' : 'white',
          padding: '20px',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Recherche d'image"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '8px',
                background: isDark ? '#4a5568' : 'white',
                color: isDark ? '#f7fafc' : '#2d3748'
              }}
            />
            <button
              onClick={searchImages}
              style={{
                padding: '10px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Chercher
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '10px'
          }}>
            {results.map(img => (
              <img
                key={img.id}
                src={img.urls.small}
                alt={img.alt_description}
                style={{ width: '100%', height: '100px', objectFit: 'cover', cursor: 'pointer', borderRadius: '8px' }}
                onClick={() => onSelect(img.urls.small)}
              />
            ))}
          </div>

          <button
            onClick={onClose}
            style={{
              marginTop: '16px',
              width: '100%',
              padding: '10px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    );
  };

  // Modal d'édition (simplifié)
  const EditProductModal = () => {
    if (!showEditModal || !editingProduct) return null;

    return (
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
          padding: '24px',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: isDark ? '#f7fafc' : '#2d3748' }}>
            Modifier : {editingProduct.name}
          </h3>
          
          <p style={{ color: isDark ? '#a0aec0' : '#718096', margin: '0 0 20px 0' }}>
            Fonctionnalité d'édition complète à implémenter
          </p>
          
          <button
            onClick={() => {
              setShowEditModal(false);
              setEditingProduct(null);
            }}
            style={{
              width: '100%',
              padding: '12px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* En-tête */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Package size={28} color={isDark ? '#63b3ed' : '#3182ce'} />
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: isDark ? '#f7fafc' : '#2d3748' }}>
            Gestion des Stocks
          </h1>
        </div>
        <p style={{ margin: 0, color: isDark ? '#a0aec0' : '#64748b', fontSize: '16px' }}>
          Gérez votre inventaire, suivez les niveaux de stock et recevez des alertes
        </p>
      </div>

      {/* Onglets */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'overview' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('overview')}
        >
          Vue d'ensemble
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'products' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('products')}
        >
          Produits
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'barcodes' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('barcodes')}
        >
          Codes-barres
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'inventory' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('inventory')}
        >
          Inventaire
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'transfer' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('transfer')}
        >
          Transfert
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'history' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('history')}
        >
          Historique
        </button>
      </div>

      {/* Contenu des onglets */}
      <div>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'barcodes' && <BarcodeSystem />}
        {activeTab === 'inventory' && <PhysicalInventory />}
        {activeTab === 'transfer' && <TransferStock />}
        {activeTab === 'history' && <StockMovements />}
      </div>

      {/* Modals */}
      {showAddModal && <AddProductModal />}
      {showEditModal && <EditProductModal />}
      {showRestockModal && <RestockModal />}
      {showImportModal && (
        <ProductImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
};

export default InventoryModule;
