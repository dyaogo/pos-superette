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
    globalProducts, 
    stockByStore, 
    currentStoreId, 
    addStock, // Utiliser addStock au lieu de setStockForStore
    appSettings,
    employees = []
  } = useApp();

  // États principaux
  const [inventorySession, setInventorySession] = useState(null);
  const [activeView, setActiveView] = useState('preparation');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // États de session
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

  // Obtenir les catégories uniques
  const categories = useMemo(() => {
    const cats = [...new Set(globalProducts.map(p => p.category).filter(Boolean))];
    return ['all', ...cats];
  }, [globalProducts]);

  // Filtrer et trier les produits
  const filteredProducts = useMemo(() => {
    let filtered = globalProducts.filter(product => {
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.includes(searchQuery);

      const matchesCategory = selectedCategories.includes('all') || 
        selectedCategories.includes(product.category);

      return matchesSearch && matchesCategory;
    });

    // Tri simple par nom
    filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });

    return filtered;
  }, [globalProducts, searchQuery, selectedCategories, sortOrder]);

  // Calculer les statistiques de session
  const sessionStats = useMemo(() => {
    const totalProducts = globalProducts.length;
    const countedProducts = Object.keys(sessionData.productCounts).length;
    const progressPercent = totalProducts > 0 ? (countedProducts / totalProducts * 100) : 0;

    const discrepancies = globalProducts.filter(product => {
      const currentStock = product.stock || 0;
      const countedStock = sessionData.productCounts[product.id];
      return countedStock !== undefined && countedStock !== currentStock;
    });

    const totalDiscrepancyValue = discrepancies.reduce((sum, product) => {
      const currentStock = product.stock || 0;
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
  }, [globalProducts, sessionData.productCounts]);

  // Démarrer une nouvelle session d'inventaire
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

    // Sauvegarder la session
    try {
      const sessions = JSON.parse(localStorage.getItem('pos_inventory_sessions') || '[]');
      sessions.push(newSession);
      localStorage.setItem('pos_inventory_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.warn('Erreur sauvegarde session:', error);
    }
  }, [sessionData, currentStoreId]);

  // Mettre à jour le comptage d'un produit
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

  // Finaliser l'inventaire - VERSION CORRIGÉE
  const finalizeInventory = useCallback(() => {
    if (!inventorySession) return;

    const discrepancies = globalProducts.filter(product => {
      const currentStock = product.stock || 0;
      const countedStock = sessionData.productCounts[product.id];
      return countedStock !== undefined && countedStock !== currentStock;
    }).map(product => {
      const currentStock = product.stock || 0;
      const countedStock = sessionData.productCounts[product.id] || 0;
      const difference = countedStock - currentStock;
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock,
        countedStock,
        difference,
        valueImpact: difference * (product.costPrice || 0),
        note: sessionData.productNotes[product.id] || ''
      };
    });

    if (discrepancies.length === 0) {
      alert('Aucune différence détectée. Inventaire terminé avec succès !');
      setActiveView('history');
      return;
    }

    const shouldApply = window.confirm(
      `${discrepancies.length} différence(s) détectée(s).\n` +
      `Impact financier: ${sessionStats.totalDiscrepancyValue.toLocaleString()} ${appSettings.currency}\n\n` +
      `Voulez-vous appliquer ces ajustements ?`
    );

    if (shouldApply) {
      try {
        // Appliquer les ajustements un par un avec addStock
        discrepancies.forEach(item => {
          if (item.difference !== 0) {
            // addStock attend un produit et une quantité
            const product = globalProducts.find(p => p.id === item.productId);
            if (product) {
              addStock(product, item.difference, `Ajustement inventaire: ${item.note || 'Comptage physique'}`);
            }
          }
        });

        // Enregistrer l'historique
        const inventoryRecord = {
          id: inventorySession.id,
          type: 'physical_inventory',
          date: new Date().toISOString(),
          storeId: currentStoreId,
          sessionName: inventorySession.name,
          assignedTo: inventorySession.assignedTo,
          notes: inventorySession.notes,
          stats: sessionStats,
          discrepancies,
          appliedAt: new Date().toISOString()
        };

        addInventoryRecord(inventoryRecord);

        // Finaliser la session
        const finalizedSession = {
          ...inventorySession,
          status: 'completed',
          completedAt: new Date().toISOString(),
          finalStats: sessionStats,
          discrepancies
        };

        try {
          const sessions = JSON.parse(localStorage.getItem('pos_inventory_sessions') || '[]');
          const sessionIndex = sessions.findIndex(s => s.id === inventorySession.id);
          if (sessionIndex !== -1) {
            sessions[sessionIndex] = finalizedSession;
            localStorage.setItem('pos_inventory_sessions', JSON.stringify(sessions));
          }
        } catch (error) {
          console.warn('Erreur sauvegarde session finalisée:', error);
        }

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
        
      } catch (error) {
        console.error('Erreur lors de la finalisation:', error);
        alert('Erreur lors de la finalisation de l\'inventaire. Vérifiez la console pour plus de détails.');
      }
    }
  }, [inventorySession, globalProducts, sessionData, sessionStats, currentStoreId, addStock, appSettings.currency]);

  // Vue de préparation (simplifiée)
  const renderPreparationView = () => (
    <div style={{ padding: '24px' }}>
      <div style={{
        background: isDark ? '#374151' : '#f8fafc',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
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
            placeholder="Ex: Inventaire mensuel Mars 2024"
            style={{
              width: '100%',
              padding: '12px',
              border: `2px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
              borderRadius: '8px',
              background: isDark ? '#374151' : 'white',
              color: isDark ? '#f7fafc' : '#1f2937',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px',
            color: isDark ? '#f7fafc' : '#374151'
          }}>
            Notes (optionnel)
          </label>
          <textarea
            value={sessionData.notes}
            onChange={(e) => setSessionData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Instructions spéciales, zones à vérifier, etc."
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              border: `2px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
              borderRadius: '8px',
              background: isDark ? '#374151' : 'white',
              color: isDark ? '#f7fafc' : '#1f2937',
              fontSize: '14px',
              resize: 'vertical'
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
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
        >
          <ClipboardList size={18} />
          Démarrer l'inventaire
        </button>
      </div>

      {/* Statistiques rapides */}
      <div style={{
        background: isDark ? '#374151' : 'white',
        padding: '20px',
        borderRadius: '12px',
        border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
      }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: isDark ? '#f7fafc' : '#1f2937',
          marginBottom: '12px'
        }}>
          Résumé du stock
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
              {globalProducts.length}
            </div>
            <div style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#6b7280' }}>
              Produits à compter
            </div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
              {globalProducts.reduce((sum, p) => sum + (p.stock || 0), 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: isDark ? '#a0aec0' : '#6b7280' }}>
              Unités en stock
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Vue de comptage (simplifiée)
  const renderCountingView = () => (
    <div style={{ padding: '24px' }}>
      {/* Header avec progression */}
      <div style={{
        background: isDark ? '#374151' : '#f8fafc',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: isDark ? '#f7fafc' : '#1f2937',
            margin: 0
          }}>
            {inventorySession?.name}
          </h3>

          <button
            onClick={finalizeInventory}
            disabled={sessionStats.countedProducts === 0}
            style={{
              padding: '8px 16px',
              background: sessionStats.countedProducts > 0 ? '#10b981' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: sessionStats.countedProducts > 0 ? 'pointer' : 'not-allowed',
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
          overflow: 'hidden',
          marginBottom: '16px'
        }}>
          <div style={{
            background: '#10b981',
            height: '100%',
            width: `${sessionStats.progressPercent}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
              {sessionStats.progressPercent}%
            </div>
            <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#6b7280' }}>
              Progression
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: sessionStats.discrepancies > 0 ? '#ef4444' : '#10b981'
            }}>
              {sessionStats.discrepancies}
            </div>
            <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#6b7280' }}>
              Écarts
            </div>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div style={{
        background: isDark ? '#374151' : 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
      }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher produit, SKU, code-barres..."
            style={{
              width: '100%',
              padding: '12px 12px 12px 40px',
              border: `2px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
              borderRadius: '8px',
              background: isDark ? '#4b5563' : 'white',
              color: isDark ? '#f7fafc' : '#1f2937',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Liste des produits */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {filteredProducts.slice(0, 20).map(product => { // Limiter à 20 pour les performances
          const currentStock = product.stock || 0;
          const countedStock = sessionData.productCounts[product.id];
          const isCounted = countedStock !== undefined;
          const difference = isCounted ? countedStock - currentStock : 0;
          const hasDiscrepancy = isCounted && difference !== 0;

          return (
            <div
              key={product.id}
              style={{
                background: isDark ? '#374151' : 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `2px solid ${
                  hasDiscrepancy ? (difference > 0 ? '#10b981' : '#ef4444') :
                  isCounted ? '#10b981' :
                  (isDark ? '#4b5563' : '#e5e7eb')
                }`
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                flexWrap: window.innerWidth <= 768 ? 'wrap' : 'nowrap'
              }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: isDark ? '#f7fafc' : '#1f2937',
                    margin: '0 0 8px 0'
                  }}>
                    {product.name}
                  </h4>
                  <div style={{
                    fontSize: '14px',
                    color: isDark ? '#a0aec0' : '#6b7280'
                  }}>
                    Stock: {currentStock} • SKU: {product.sku}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    value={countedStock || ''}
                    onChange={(e) => updateProductCount(product.id, e.target.value)}
                    placeholder={`${currentStock}`}
                    style={{
                      width: '100px',
                      padding: '8px',
                      textAlign: 'center',
                      border: `2px solid ${
                        hasDiscrepancy ? (difference > 0 ? '#10b981' : '#ef4444') :
                        isCounted ? '#10b981' :
                        (isDark ? '#4b5563' : '#e5e7eb')
                      }`,
                      borderRadius: '6px',
                      background: isDark ? '#4b5563' : 'white',
                      color: isDark ? '#f7fafc' : '#1f2937',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  />

                  {hasDiscrepancy && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: difference > 0 ? '#10b981' : '#ef4444'
                    }}>
                      {difference > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {difference > 0 ? '+' : ''}{difference}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length > 20 && (
        <div style={{
          textAlign: 'center',
          padding: '16px',
          color: isDark ? '#a0aec0' : '#6b7280',
          fontSize: '14px'
        }}>
          Affichage des 20 premiers produits. Utilisez la recherche pour affiner.
        </div>
      )}
    </div>
  );

  // Vue historique (simplifiée)
  const renderHistoryView = () => (
    <div style={{ padding: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: isDark ? '#f7fafc' : '#1f2937',
          margin: 0
        }}>
          Historique des inventaires
        </h3>

        <button
          onClick={() => setActiveView('preparation')}
          style={{
            padding: '8px 16px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={16} />
          Nouvel inventaire
        </button>
      </div>

      <div style={{
        background: isDark ? '#374151' : 'white',
        borderRadius: '12px',
        padding: '24px',
        border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
      }}>
        <p style={{
          color: isDark ? '#a0aec0' : '#6b7280',
          textAlign: 'center',
          fontSize: '16px'
        }}>
          Historique des inventaires en cours de développement...
        </p>
      </div>
    </div>
  );

  // Rendu conditionnel selon la vue active
  const renderContent = () => {
    switch (activeView) {
      case 'preparation':
        return renderPreparationView();
      case 'counting':
        return renderCountingView();
      case 'history':
        return renderHistoryView();
      default:
        return renderPreparationView();
    }
  };

  // Rendu principal
  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? '#1f2937' : '#f9fafb'
    }}>
      {/* Header principal */}
      <div style={{
        background: isDark ? '#374151' : 'white',
        borderBottom: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
        padding: '16px 24px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: isDark ? '#f7fafc' : '#1f2937',
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ClipboardList size={28} color="#3b82f6" />
          Inventaire Physique
        </h1>

        {/* Navigation par onglets */}
        <div style={{
          display: 'flex',
          gap: '2px',
          marginTop: '16px',
          background: isDark ? '#4b5563' : '#f1f5f9',
          borderRadius: '8px',
          padding: '4px'
        }}>
          {[
            { key: 'preparation', label: 'Préparation', icon: Settings },
            { key: 'counting', label: 'Comptage', icon: ClipboardList, disabled: !inventorySession },
            { key: 'history', label: 'Historique', icon: History }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveView(tab.key)}
              disabled={tab.disabled}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: activeView === tab.key ? 
                  (isDark ? '#374151' : 'white') : 'transparent',
                color: tab.disabled ? '#9ca3af' :
                      activeView === tab.key ? 
                      (isDark ? '#f7fafc' : '#1f2937') : 
                      (isDark ? '#a0aec0' : '#6b7280'),
                border: 'none',
                borderRadius: '6px',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu principal */}
      {renderContent()}
    </div>
  );
};

export default PhysicalInventoryModule;
