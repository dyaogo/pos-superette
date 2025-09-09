import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardList, Save, AlertTriangle, Check, Search, Filter,
  Download, Upload, Scan, BarChart3, Calendar, Users,
  Package, TrendingUp, TrendingDown, AlertCircle, CheckCircle,
  Eye, EyeOff, Calculator, FileText, History, Settings,
  ChevronDown, ChevronUp, X, Plus, Minus, Edit3
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { addInventoryRecord } from '../../services/inventory.service';

const PhysicalInventoryModule = () => {
  const { 
    globalProducts = [], 
    stockByStore = {}, 
    currentStoreId, 
    setStockForStore, 
    appSettings = {},
    employees = []
  } = useApp();

  // ✅ TOUS LES HOOKS DÉCLARÉS AU DÉBUT
  const [inventorySession, setInventorySession] = useState(null);
  const [activeView, setActiveView] = useState('preparation');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [scanInput, setScanInput] = useState('');
  const [quickCountMode, setQuickCountMode] = useState(false);
  const [batchScanMode, setBatchScanMode] = useState(false);
  const [showDiscrepanciesOnly, setShowDiscrepanciesOnly] = useState(false);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [inventorySessions, setInventorySessions] = useState([]);

  const [sessionData, setSessionData] = useState({
    id: null,
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
    assignedTo: '',
    notes: '',
    status: 'preparation',
    productCounts: {},
    productNotes: {},
    discrepancies: [],
    totalProducts: 0,
    countedProducts: 0,
    progressPercent: 0
  });

  const isDark = appSettings?.darkMode || false;

  // ✅ EFFET POUR CHARGER LES SESSIONS D'INVENTAIRE
  useEffect(() => {
    try {
      const sessions = JSON.parse(localStorage.getItem('pos_inventory_sessions') || '[]');
      setInventorySessions(sessions.reverse());
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
      setInventorySessions([]);
    }
  }, [activeView]); // Se recharge quand on change de vue

  // ✅ CATÉGORIES - USEMEMO SÉCURISÉ
  const categories = useMemo(() => {
    if (!Array.isArray(globalProducts)) return ['all'];
    const cats = [...new Set(globalProducts.map(p => p?.category).filter(Boolean))];
    return ['all', ...cats];
  }, [globalProducts]);

  // ✅ PRODUITS FILTRÉS - USEMEMO SÉCURISÉ
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(globalProducts)) return [];
    
    let filtered = globalProducts.filter(product => {
      if (!product) return false;
      
      const matchesSearch = !searchQuery || 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.includes(searchQuery);

      const matchesCategory = selectedCategories.includes('all') || 
        selectedCategories.includes(product.category);

      if (showDiscrepanciesOnly) {
        const currentStock = (stockByStore[currentStoreId] || {})[product.id] || 0;
        const countedStock = sessionData.productCounts[product.id];
        return matchesSearch && matchesCategory && 
               countedStock !== undefined && countedStock !== currentStock;
      }

      if (showCompletedOnly) {
        return matchesSearch && matchesCategory && 
               sessionData.productCounts[product.id] !== undefined;
      }

      return matchesSearch && matchesCategory;
    });

    // Tri simple par nom
    filtered.sort((a, b) => {
      const aName = a?.name || '';
      const bName = b?.name || '';
      return sortOrder === 'asc' ? 
        aName.localeCompare(bName) : 
        bName.localeCompare(aName);
    });

    return filtered;
  }, [globalProducts, searchQuery, selectedCategories, showDiscrepanciesOnly, 
      showCompletedOnly, sortOrder, sessionData.productCounts, 
      stockByStore, currentStoreId]);

  // ✅ STATISTIQUES SESSION - USEMEMO SÉCURISÉ
  const sessionStats = useMemo(() => {
    if (!Array.isArray(globalProducts)) {
      return {
        totalProducts: 0,
        countedProducts: 0,
        progressPercent: 0,
        discrepancies: 0,
        totalDiscrepancyValue: 0,
        accuracy: 0
      };
    }

    const totalProducts = globalProducts.length;
    const countedProducts = Object.keys(sessionData.productCounts || {}).length;
    const progressPercent = totalProducts > 0 ? (countedProducts / totalProducts * 100) : 0;

    const discrepancies = globalProducts.filter(product => {
      if (!product) return false;
      const currentStock = (stockByStore[currentStoreId] || {})[product.id] || 0;
      const countedStock = sessionData.productCounts[product.id];
      return countedStock !== undefined && countedStock !== currentStock;
    });

    const totalDiscrepancyValue = discrepancies.reduce((sum, product) => {
      const currentStock = (stockByStore[currentStoreId] || {})[product.id] || 0;
      const countedStock = sessionData.productCounts[product.id] || 0;
      const difference = countedStock - currentStock;
      return sum + (difference * (product.costPrice || 0));
    }, 0);

    return {
      totalProducts,
      countedProducts,
      progressPercent: Math.round(progressPercent),
      discrepancies: discrepancies.length,
      totalDiscrepancyValue,
      accuracy: discrepancies.length === 0 && countedProducts > 0 ? 100 : 
               countedProducts > 0 ? Math.round((countedProducts - discrepancies.length) / countedProducts * 100) : 0
    };
  }, [globalProducts, sessionData.productCounts, stockByStore, currentStoreId]);

  // ✅ FONCTION POUR DÉMARRER UNE SESSION
  const startInventorySession = useCallback(() => {
    const newSession = {
      id: `INV-${Date.now()}`,
      name: sessionData.name || `Inventaire ${new Date().toLocaleDateString('fr-FR')}`,
      startDate: sessionData.startDate,
      startTime: sessionData.startTime,
      assignedTo: sessionData.assignedTo,
      notes: sessionData.notes,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      productCounts: {},
      productNotes: {},
      storeId: currentStoreId
    };

    setInventorySession(newSession);
    setSessionData(prev => ({ ...prev, ...newSession, status: 'in_progress' }));
    setActiveView('counting');

    try {
      const sessions = JSON.parse(localStorage.getItem('pos_inventory_sessions') || '[]');
      sessions.push(newSession);
      localStorage.setItem('pos_inventory_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.warn('Erreur sauvegarde session:', error);
    }
  }, [sessionData, currentStoreId]);

  // ✅ FONCTION POUR METTRE À JOUR LE COMPTAGE
  const updateProductCount = useCallback((productId, count, note = '') => {
    const newCounts = { ...sessionData.productCounts, [productId]: parseInt(count) || 0 };
    const newNotes = { ...sessionData.productNotes };
    
    if (note.trim()) {
      newNotes[productId] = note.trim();
    } else {
      delete newNotes[productId];
    }

    setSessionData(prev => ({
      ...prev,
      productCounts: newCounts,
      productNotes: newNotes
    }));
  }, [sessionData.productCounts, sessionData.productNotes]);

  // ✅ FONCTION SCAN CODE-BARRES
  const handleBarcodeScan = useCallback((barcode) => {
    if (!Array.isArray(globalProducts)) return;
    
    const product = globalProducts.find(p => p?.barcode === barcode || p?.sku === barcode);
    if (product) {
      const currentCount = sessionData.productCounts[product.id] || 0;
      updateProductCount(product.id, currentCount + 1);
      setScanInput('');
    } else {
      alert(`Produit non trouvé pour le code: ${barcode}`);
    }
  }, [globalProducts, sessionData.productCounts, updateProductCount]);

  // ✅ FONCTION FINALISER - VERSION SÉCURISÉE
  const finalizeInventory = useCallback(() => {
    if (!inventorySession) {
      alert('Aucune session d\'inventaire active');
      return;
    }

    if (!setStockForStore) {
      alert('Fonction setStockForStore non disponible');
      return;
    }

    try {
      const discrepancies = globalProducts.filter(product => {
        if (!product) return false;
        const currentStock = (stockByStore[currentStoreId] || {})[product.id] || 0;
        const countedStock = sessionData.productCounts[product.id];
        return countedStock !== undefined && countedStock !== currentStock;
      });

      if (discrepancies.length === 0) {
        alert('Aucune différence détectée. Inventaire terminé avec succès !');
        setActiveView('history');
        return;
      }

      const shouldApply = window.confirm(
        `${discrepancies.length} différence(s) détectée(s).\n` +
        `Voulez-vous appliquer ces ajustements ?`
      );

      if (shouldApply) {
        const newStock = { ...(stockByStore[currentStoreId] || {}) };
        
        Object.entries(sessionData.productCounts).forEach(([productIdStr, count]) => {
          const productId = parseInt(productIdStr);
          newStock[productId] = parseInt(count) || 0;
        });

        setStockForStore(currentStoreId, newStock);

        // Enregistrer l'historique
        const inventoryRecord = {
          id: inventorySession.id,
          type: 'physical_inventory',
          date: new Date().toISOString(),
          storeId: currentStoreId,
          sessionName: inventorySession.name,
          discrepancies: discrepancies.length,
          appliedAt: new Date().toISOString()
        };

        addInventoryRecord(inventoryRecord);

        alert(`Inventaire finalisé avec succès !\n${discrepancies.length} ajustement(s) appliqué(s).`);
        
        // Réinitialiser
        setInventorySession(null);
        setSessionData({
          id: null,
          name: '',
          startDate: new Date().toISOString().split('T')[0],
          startTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
          assignedTo: '',
          notes: '',
          status: 'preparation',
          productCounts: {},
          productNotes: {},
          discrepancies: [],
          totalProducts: 0,
          countedProducts: 0,
          progressPercent: 0
        });
        setActiveView('history');
      }
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
      alert('Erreur lors de la finalisation de l\'inventaire.');
    }
  }, [inventorySession, globalProducts, sessionData, stockByStore, currentStoreId, setStockForStore]);

  // ✅ RENDU PRINCIPAL - STRUCTURE SIMPLE
  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? '#1f2937' : '#f9fafb',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{
        background: isDark ? '#374151' : 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: isDark ? '#f7fafc' : '#1f2937',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ClipboardList size={28} color="#3b82f6" />
          Inventaire Physique
        </h1>

        {/* Navigation simple */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'preparation', label: 'Préparation' },
            { key: 'counting', label: 'Comptage', disabled: !inventorySession },
            { key: 'history', label: 'Historique' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveView(tab.key)}
              disabled={tab.disabled}
              style={{
                padding: '8px 16px',
                background: activeView === tab.key ? '#3b82f6' : 'transparent',
                color: activeView === tab.key ? 'white' : (isDark ? '#f7fafc' : '#1f2937'),
                border: `1px solid ${activeView === tab.key ? '#3b82f6' : (isDark ? '#4b5563' : '#e5e7eb')}`,
                borderRadius: '6px',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu selon la vue active */}
      {activeView === 'preparation' && (
        <div style={{
          background: isDark ? '#374151' : 'white',
          borderRadius: '12px',
          padding: '24px',
          border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: isDark ? '#f7fafc' : '#1f2937',
            marginBottom: '16px'
          }}>
            Configuration de l'inventaire
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: isDark ? '#f7fafc' : '#374151'
            }}>
              Nom de l'inventaire
            </label>
            <input
              type="text"
              value={sessionData.name}
              onChange={(e) => setSessionData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Inventaire mensuel"
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                borderRadius: '8px',
                background: isDark ? '#4b5563' : 'white',
                color: isDark ? '#f7fafc' : '#1f2937',
                fontSize: '14px'
              }}
            />
          </div>

          <button
            onClick={startInventorySession}
            disabled={!sessionData.name.trim()}
            style={{
              padding: '12px 24px',
              background: sessionData.name.trim() ? '#10b981' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: sessionData.name.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px'
            }}
          >
            Démarrer l'inventaire
          </button>

          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: isDark ? '#4b5563' : '#f8fafc',
            borderRadius: '8px'
          }}>
            <p style={{
              margin: 0,
              color: isDark ? '#a0aec0' : '#6b7280',
              fontSize: '14px'
            }}>
              Produits à compter: <strong>{globalProducts.length}</strong>
            </p>
          </div>
        </div>
      )}

      {activeView === 'counting' && (
        <div style={{
          background: isDark ? '#374151' : 'white',
          borderRadius: '12px',
          padding: '24px',
          border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: isDark ? '#f7fafc' : '#1f2937',
              margin: 0
            }}>
              Comptage en cours
            </h3>

            <button
              onClick={finalizeInventory}
              style={{
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Finaliser ({sessionStats.discrepancies} écarts)
            </button>
          </div>

          {/* Barre de progression */}
          <div style={{
            background: isDark ? '#4b5563' : '#e5e7eb',
            borderRadius: '8px',
            height: '8px',
            marginBottom: '24px'
          }}>
            <div style={{
              background: '#10b981',
              height: '100%',
              width: `${sessionStats.progressPercent}%`,
              borderRadius: '8px'
            }} />
          </div>

          {/* Recherche */}
          <div style={{ marginBottom: '24px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit..."
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                borderRadius: '8px',
                background: isDark ? '#4b5563' : 'white',
                color: isDark ? '#f7fafc' : '#1f2937',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Liste des produits */}
          <div style={{ display: 'grid', gap: '12px' }}>
            {filteredProducts.slice(0, 10).map(product => {
              const currentStock = (stockByStore[currentStoreId] || {})[product.id] || 0;
              const countedStock = sessionData.productCounts[product.id];
              const difference = countedStock !== undefined ? countedStock - currentStock : 0;

              return (
                <div
                  key={product.id}
                  style={{
                    padding: '16px',
                    border: `2px solid ${difference !== 0 && countedStock !== undefined ? 
                      (difference > 0 ? '#10b981' : '#ef4444') : 
                      (isDark ? '#4b5563' : '#e5e7eb')}`,
                    borderRadius: '8px',
                    background: isDark ? '#4b5563' : '#f8fafc'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: isDark ? '#f7fafc' : '#1f2937',
                        margin: '0 0 4px 0'
                      }}>
                        {product.name}
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: isDark ? '#a0aec0' : '#6b7280',
                        margin: 0
                      }}>
                        Stock actuel: {currentStock}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        value={countedStock || ''}
                        onChange={(e) => updateProductCount(product.id, e.target.value)}
                        placeholder="Compter"
                        style={{
                          width: '100px',
                          padding: '8px',
                          textAlign: 'center',
                          border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                          borderRadius: '6px',
                          background: isDark ? '#374151' : 'white',
                          color: isDark ? '#f7fafc' : '#1f2937'
                        }}
                      />
                      
                      {difference !== 0 && countedStock !== undefined && (
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: difference > 0 ? '#10b981' : '#ef4444'
                        }}>
                          {difference > 0 ? '+' : ''}{difference}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length > 10 && (
            <p style={{
              textAlign: 'center',
              marginTop: '16px',
              color: isDark ? '#a0aec0' : '#6b7280',
              fontSize: '14px'
            }}>
              Affichage des 10 premiers produits. Utilisez la recherche pour affiner.
            </p>
          )}
        </div>
      )}

      {activeView === 'history' && (
        <div style={{
          background: isDark ? '#374151' : 'white',
          borderRadius: '12px',
          padding: '24px',
          border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: isDark ? '#f7fafc' : '#1f2937',
            marginBottom: '16px'
          }}>
            Historique des inventaires
          </h3>

          {inventorySessions.length > 0 ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {inventorySessions.map(session => (
                <div
                  key={session.id}
                  style={{
                    padding: '16px',
                    border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    background: isDark ? '#4b5563' : '#f8fafc'
                  }}
                >
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: isDark ? '#f7fafc' : '#1f2937',
                    margin: '0 0 8px 0'
                  }}>
                    {session.name}
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: isDark ? '#a0aec0' : '#6b7280',
                    margin: 0
                  }}>
                    {new Date(session.startedAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{
              textAlign: 'center',
              color: isDark ? '#a0aec0' : '#6b7280',
              fontSize: '16px',
              margin: '32px 0'
            }}>
              Aucun inventaire trouvé
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PhysicalInventoryModule;
