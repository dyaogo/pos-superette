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
    setStockForStore, 
    appSettings,
    employees = []
  } = useApp();

  // États principaux
  const [inventorySession, setInventorySession] = useState(null);
  const [activeView, setActiveView] = useState('preparation'); // preparation, counting, review, history
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // name, stock, value, difference
  const [sortOrder, setSortOrder] = useState('asc');

  // États de session
  const [sessionData, setSessionData] = useState({
    id: null,
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
    assignedTo: '',
    notes: '',
    status: 'preparation', // preparation, in_progress, completed, cancelled
    productCounts: {},
    productNotes: {},
    discrepancies: [],
    totalProducts: 0,
    countedProducts: 0,
    progressPercent: 0
  });

  // États d'interface
  const [showDiscrepanciesOnly, setShowDiscrepanciesOnly] = useState(false);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [batchScanMode, setBatchScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [quickCountMode, setQuickCountMode] = useState(false);

  const isDark = appSettings?.darkMode || false;

  // Obtenir les catégories uniques
  const categories = useMemo(() => {
    const cats = [...new Set(globalProducts.map(p => p.category).filter(Boolean))];
    return ['all', ...cats];
  }, [globalProducts]);

  // Filtrer et trier les produits
  const filteredProducts = useMemo(() => {
    let filtered = globalProducts.filter(product => {
      // Filtre par recherche
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.includes(searchQuery);

      // Filtre par catégorie
      const matchesCategory = selectedCategories.includes('all') || 
        selectedCategories.includes(product.category);

      // Filtre par discrepances
      if (showDiscrepanciesOnly) {
        const currentStock = (stockByStore[currentStoreId] || {})[product.id] || 0;
        const countedStock = sessionData.productCounts[product.id];
        return matchesSearch && matchesCategory && 
               countedStock !== undefined && countedStock !== currentStock;
      }

      // Filtre par produits comptés
      if (showCompletedOnly) {
        return matchesSearch && matchesCategory && 
               sessionData.productCounts[product.id] !== undefined;
      }

      return matchesSearch && matchesCategory;
    });

    // Tri
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'stock':
          aValue = (stockByStore[currentStoreId] || {})[a.id] || 0;
          bValue = (stockByStore[currentStoreId] || {})[b.id] || 0;
          break;
        case 'value':
          const aStock = (stockByStore[currentStoreId] || {})[a.id] || 0;
          const bStock = (stockByStore[currentStoreId] || {})[b.id] || 0;
          aValue = aStock * (a.costPrice || 0);
          bValue = bStock * (b.costPrice || 0);
          break;
        case 'difference':
          const aCurrentStock = (stockByStore[currentStoreId] || {})[a.id] || 0;
          const bCurrentStock = (stockByStore[currentStoreId] || {})[b.id] || 0;
          const aCountedStock = sessionData.productCounts[a.id] || 0;
          const bCountedStock = sessionData.productCounts[b.id] || 0;
          aValue = Math.abs(aCountedStock - aCurrentStock);
          bValue = Math.abs(bCountedStock - bCurrentStock);
          break;
        default: // name
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [globalProducts, searchQuery, selectedCategories, showDiscrepanciesOnly, 
      showCompletedOnly, sortBy, sortOrder, sessionData.productCounts, 
      stockByStore, currentStoreId]);

  // Calculer les statistiques de session
  const sessionStats = useMemo(() => {
    const totalProducts = globalProducts.length;
    const countedProducts = Object.keys(sessionData.productCounts).length;
    const progressPercent = totalProducts > 0 ? (countedProducts / totalProducts * 100) : 0;

    const discrepancies = globalProducts.filter(product => {
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

    const positiveAdjustments = discrepancies.filter(product => {
      const currentStock = (stockByStore[currentStoreId] || {})[product.id] || 0;
      const countedStock = sessionData.productCounts[product.id] || 0;
      return countedStock > currentStock;
    }).length;

    const negativeAdjustments = discrepancies.filter(product => {
      const currentStock = (stockByStore[currentStoreId] || {})[product.id] || 0;
      const countedStock = sessionData.productCounts[product.id] || 0;
      return countedStock < currentStock;
    }).length;

    return {
      totalProducts,
      countedProducts,
      progressPercent: Math.round(progressPercent),
      discrepancies: discrepancies.length,
      totalDiscrepancyValue,
      positiveAdjustments,
      negativeAdjustments,
      accuracy: discrepancies.length === 0 && countedProducts > 0 ? 100 : 
               countedProducts > 0 ? Math.round((countedProducts - discrepancies.length) / countedProducts * 100) : 0
    };
  }, [globalProducts, sessionData.productCounts, stockByStore, currentStoreId]);

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

    console.log('Session d\'inventaire démarrée:', newSession);
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

    // Sauvegarder en temps réel
    if (inventorySession) {
      try {
        const updatedSession = {
          ...inventorySession,
          productCounts: newCounts,
          productNotes: newNotes,
          lastUpdated: new Date().toISOString()
        };
        
        const sessions = JSON.parse(localStorage.getItem('pos_inventory_sessions') || '[]');
        const sessionIndex = sessions.findIndex(s => s.id === inventorySession.id);
        if (sessionIndex !== -1) {
          sessions[sessionIndex] = updatedSession;
          localStorage.setItem('pos_inventory_sessions', JSON.stringify(sessions));
        }
      } catch (error) {
        console.warn('Erreur sauvegarde temps réel:', error);
      }
    }
  }, [sessionData.productCounts, sessionData.productNotes, inventorySession]);

  // Scan de code-barres
  const handleBarcodeScan = useCallback((barcode) => {
    const product = globalProducts.find(p => p.barcode === barcode || p.sku === barcode);
    if (product) {
      const currentCount = sessionData.productCounts[product.id] || 0;
      updateProductCount(product.id, currentCount + 1);
      setScanInput('');
      
      // Feedback visuel
      const productElement = document.getElementById(`product-${product.id}`);
      if (productElement) {
        productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        productElement.style.animation = 'flash 0.5s ease-in-out';
        setTimeout(() => {
          productElement.style.animation = '';
        }, 500);
      }
    } else {
      alert(`Produit non trouvé pour le code: ${barcode}`);
    }
  }, [globalProducts, sessionData.productCounts, updateProductCount]);

  // Finaliser l'inventaire - VERSION CORRIGÉE COMPLÈTE
  const finalizeInventory = useCallback(() => {
    if (!inventorySession) {
      alert('Aucune session d\'inventaire active');
      return;
    }

    if (!setStockForStore) {
      alert('Fonction setStockForStore non disponible');
      return;
    }

    const discrepancies = globalProducts.filter(product => {
      const currentStock = (stockByStore[currentStoreId] || {})[product.id] || 0;
      const countedStock = sessionData.productCounts[product.id];
      return countedStock !== undefined && countedStock !== currentStock;
    }).map(product => {
      const currentStock = (stockByStore[currentStoreId] || {})[product.id] || 0;
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
      `Impact financier: ${sessionStats.totalDiscrepancyValue.toLocaleString()} ${appSettings?.currency || 'FCFA'}\n\n` +
      `Voulez-vous appliquer ces ajustements ?`
    );

    if (shouldApply) {
      try {
        // ✅ PARTIE CORRIGÉE - Appliquer les ajustements
        const newStock = { ...(stockByStore[currentStoreId] || {}) };
        
        // Mettre à jour seulement les produits comptés
        Object.entries(sessionData.productCounts).forEach(([productIdStr, count]) => {
          const productId = parseInt(productIdStr);
          newStock[productId] = parseInt(count) || 0;
        });

        // Appliquer le nouveau stock
        setStockForStore(currentStoreId, newStock);

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
        } catch (storageError) {
          console.warn('Erreur sauvegarde session:', storageError);
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
  }, [inventorySession, globalProducts, sessionData, stockByStore, currentStoreId, 
      sessionStats, setStockForStore, appSettings?.currency]);

  // Vue de préparation
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
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Settings size={24} />
          Configuration de l'inventaire
        </h3>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div>
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

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: isDark ? '#f7fafc' : '#374151'
            }}>
              Assigné à
            </label>
            <select
              value={sessionData.assignedTo}
              onChange={(e) => setSessionData(prev => ({ ...prev, assignedTo: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                borderRadius: '8px',
                background: isDark ? '#374151' : 'white',
                color: isDark ? '#f7fafc' : '#1f2937',
                fontSize: '14px'
              }}
            >
              <option value="">Sélectionner un employé</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.name}>{emp.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
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

        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
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

          <button
            onClick={() => setActiveView('history')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: isDark ? '#f7fafc' : '#374151',
              border: `2px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            <History size={18} />
            Voir l'historique
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth > 768 ? 'repeat(3, 1fr)' : '1fr',
        gap: '16px'
      }}>
        <div style={{
          background: isDark ? '#374151' : 'white',
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Package size={24} color="#3b82f6" />
            <span style={{ fontSize: '16px', fontWeight: '600', color: isDark ? '#f7fafc' : '#1f2937' }}>
              Produits à compter
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
            {globalProducts.length}
          </div>
        </div>

        <div style={{
          background: isDark ? '#374151' : 'white',
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Calculator size={24} color="#10b981" />
            <span style={{ fontSize: '16px', fontWeight: '600', color: isDark ? '#f7fafc' : '#1f2937' }}>
              Valeur du stock
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
            {globalProducts.reduce((sum, p) => {
              const stock = (stockByStore[currentStoreId] || {})[p.id] || 0;
              return sum + (stock * (p.costPrice || 0));
            }, 0).toLocaleString()} {appSettings?.currency || 'FCFA'}
          </div>
        </div>

        <div style={{
          background: isDark ? '#374151' : 'white',
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <AlertTriangle size={24} color="#f59e0b" />
            <span style={{ fontSize: '16px', fontWeight: '600', color: isDark ? '#f7fafc' : '#1f2937' }}>
              Alertes stock
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
            {globalProducts.filter(p => {
              const stock = (stockByStore[currentStoreId] || {})[p.id] || 0;
              return stock <= (p.minStock || 5);
            }).length}
          </div>
        </div>
      </div>
    </div>
  );

  // Vue de comptage
  const renderCountingView = () => (
    <div style={{ padding: '24px' }}>
      {/* Header avec statistiques de progression */}
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
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: isDark ? '#f7fafc' : '#1f2937',
              margin: '0 0 8px 0'
            }}>
              {inventorySession?.name}
            </h3>
            <p style={{
              color: isDark ? '#a0aec0' : '#6b7280',
              margin: 0,
              fontSize: '14px'
            }}>
              {sessionStats.countedProducts} / {sessionStats.totalProducts} produits comptés
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveView('review')}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Réviser ({sessionStats.discrepancies})
            </button>
            
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
              Finaliser
            </button>
          </div>
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

        {/* Statistiques rapides */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 768 ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: '#10b981',
              marginBottom: '4px'
            }}>
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
              color: sessionStats.discrepancies > 0 ? '#ef4444' : '#10b981',
              marginBottom: '4px'
            }}>
              {sessionStats.discrepancies}
            </div>
            <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#6b7280' }}>
              Écarts
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: sessionStats.accuracy >= 95 ? '#10b981' : sessionStats.accuracy >= 85 ? '#f59e0b' : '#ef4444',
              marginBottom: '4px'
            }}>
              {sessionStats.accuracy}%
            </div>
            <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#6b7280' }}>
              Précision
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '700', 
              color: sessionStats.totalDiscrepancyValue >= 0 ? '#10b981' : '#ef4444',
              marginBottom: '4px'
            }}>
              {sessionStats.totalDiscrepancyValue.toLocaleString()} {appSettings?.currency || 'FCFA'}
            </div>
            <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#6b7280' }}>
              Impact financier
            </div>
          </div>
        </div>
      </div>

      {/* Zone de scan rapide */}
      <div style={{
        background: isDark ? '#374151' : 'white',
       borderRadius: '12px',
       padding: '20px',
       marginBottom: '24px',
       border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
     }}>
       <div style={{
         display: 'flex',
         justifyContent: 'space-between',
         alignItems: 'center',
         marginBottom: '16px'
       }}>
         <h4 style={{
           fontSize: '16px',
           fontWeight: '600',
           color: isDark ? '#f7fafc' : '#1f2937',
           margin: 0,
           display: 'flex',
           alignItems: 'center',
           gap: '8px'
         }}>
           <Scan size={20} />
           Scan rapide
         </h4>

         <div style={{ display: 'flex', gap: '8px' }}>
           <button
             onClick={() => setBatchScanMode(!batchScanMode)}
             style={{
               padding: '6px 12px',
               background: batchScanMode ? '#3b82f6' : 'transparent',
               color: batchScanMode ? 'white' : (isDark ? '#f7fafc' : '#374151'),
               border: `1px solid ${batchScanMode ? '#3b82f6' : (isDark ? '#4b5563' : '#e5e7eb')}`,
               borderRadius: '6px',
               fontSize: '12px',
               cursor: 'pointer'
             }}
           >
             Mode batch
           </button>

           <button
             onClick={() => setQuickCountMode(!quickCountMode)}
             style={{
               padding: '6px 12px',
               background: quickCountMode ? '#10b981' : 'transparent',
               color: quickCountMode ? 'white' : (isDark ? '#f7fafc' : '#374151'),
               border: `1px solid ${quickCountMode ? '#10b981' : (isDark ? '#4b5563' : '#e5e7eb')}`,
               borderRadius: '6px',
               fontSize: '12px',
               cursor: 'pointer'
             }}
           >
             Comptage rapide
           </button>
         </div>
       </div>

       <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
         <input
           type="text"
           value={scanInput}
           onChange={(e) => setScanInput(e.target.value)}
           onKeyPress={(e) => {
             if (e.key === 'Enter' && scanInput.trim()) {
               handleBarcodeScan(scanInput.trim());
             }
           }}
           placeholder="Scanner ou saisir code-barres / SKU"
           style={{
             flex: 1,
             padding: '12px',
             border: `2px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
             borderRadius: '8px',
             background: isDark ? '#4b5563' : 'white',
             color: isDark ? '#f7fafc' : '#1f2937',
             fontSize: '14px'
           }}
         />
         
         <button
           onClick={() => scanInput.trim() && handleBarcodeScan(scanInput.trim())}
           disabled={!scanInput.trim()}
           style={{
             padding: '12px 16px',
             background: scanInput.trim() ? '#3b82f6' : '#9ca3af',
             color: 'white',
             border: 'none',
             borderRadius: '8px',
             cursor: scanInput.trim() ? 'pointer' : 'not-allowed'
           }}
         >
           <Scan size={18} />
         </button>
       </div>
     </div>

     {/* Filtres et recherche */}
     <div style={{
       background: isDark ? '#374151' : 'white',
       borderRadius: '12px',
       padding: '20px',
       marginBottom: '24px',
       border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
     }}>
       <div style={{
         display: 'flex',
         gap: '12px',
         marginBottom: '16px',
         flexWrap: 'wrap',
         alignItems: 'center'
       }}>
         <div style={{ flex: 1, minWidth: '200px' }}>
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

         <button
           onClick={() => setShowFilters(!showFilters)}
           style={{
             padding: '12px 16px',
             background: showFilters ? '#3b82f6' : 'transparent',
             color: showFilters ? 'white' : (isDark ? '#f7fafc' : '#374151'),
             border: `2px solid ${showFilters ? '#3b82f6' : (isDark ? '#4b5563' : '#e5e7eb')}`,
             borderRadius: '8px',
             cursor: 'pointer',
             display: 'flex',
             alignItems: 'center',
             gap: '8px',
             fontSize: '14px'
           }}
         >
           <Filter size={16} />
           Filtres
         </button>
       </div>

       {/* Filtres avancés */}
       {showFilters && (
         <div style={{
           borderTop: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
           paddingTop: '16px',
           display: 'grid',
           gridTemplateColumns: window.innerWidth > 768 ? 'repeat(4, 1fr)' : '1fr',
           gap: '12px'
         }}>
           <div>
             <label style={{
               display: 'block',
               fontSize: '12px',
               fontWeight: '600',
               marginBottom: '4px',
               color: isDark ? '#a0aec0' : '#6b7280'
             }}>
               Catégorie
             </label>
             <select
               value={selectedCategories[0]}
               onChange={(e) => setSelectedCategories([e.target.value])}
               style={{
                 width: '100%',
                 padding: '8px',
                 border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                 borderRadius: '6px',
                 background: isDark ? '#4b5563' : 'white',
                 color: isDark ? '#f7fafc' : '#1f2937',
                 fontSize: '14px'
               }}
             >
               {categories.map(cat => (
                 <option key={cat} value={cat}>
                   {cat === 'all' ? 'Toutes les catégories' : cat}
                 </option>
               ))}
             </select>
           </div>

           <div>
             <label style={{
               display: 'block',
               fontSize: '12px',
               fontWeight: '600',
               marginBottom: '4px',
               color: isDark ? '#a0aec0' : '#6b7280'
             }}>
               Trier par
             </label>
             <select
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value)}
               style={{
                 width: '100%',
                 padding: '8px',
                 border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                 borderRadius: '6px',
                 background: isDark ? '#4b5563' : 'white',
                 color: isDark ? '#f7fafc' : '#1f2937',
                 fontSize: '14px'
               }}
             >
               <option value="name">Nom</option>
               <option value="stock">Stock</option>
               <option value="value">Valeur</option>
               <option value="difference">Écart</option>
             </select>
           </div>

           <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
             <button
               onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
               style={{
                 padding: '8px',
                 background: 'transparent',
                 color: isDark ? '#f7fafc' : '#374151',
                 border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                 borderRadius: '6px',
                 cursor: 'pointer'
               }}
             >
               {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
             </button>
           </div>

           <div style={{ display: 'flex', gap: '4px', alignItems: 'end', flexWrap: 'wrap' }}>
             <button
               onClick={() => setShowDiscrepanciesOnly(!showDiscrepanciesOnly)}
               style={{
                 padding: '6px 12px',
                 background: showDiscrepanciesOnly ? '#ef4444' : 'transparent',
                 color: showDiscrepanciesOnly ? 'white' : '#ef4444',
                 border: '1px solid #ef4444',
                 borderRadius: '6px',
                 fontSize: '12px',
                 cursor: 'pointer'
               }}
             >
               Écarts seulement
             </button>
             
             <button
               onClick={() => setShowCompletedOnly(!showCompletedOnly)}
               style={{
                 padding: '6px 12px',
                 background: showCompletedOnly ? '#10b981' : 'transparent',
                 color: showCompletedOnly ? 'white' : '#10b981',
                 border: '1px solid #10b981',
                 borderRadius: '6px',
                 fontSize: '12px',
                 cursor: 'pointer'
               }}
             >
               Comptés seulement
             </button>
           </div>
         </div>
       )}
     </div>

     {/* Liste des produits */}
     <div style={{
       display: 'grid',
       gap: '12px'
     }}>
       {filteredProducts.map(product => {
         const currentStock = (stockByStore[currentStoreId] || {})[product.id] || 0;
         const countedStock = sessionData.productCounts[product.id];
         const isCounted = countedStock !== undefined;
         const difference = isCounted ? countedStock - currentStock : 0;
         const hasDiscrepancy = isCounted && difference !== 0;

         return (
           <div
             key={product.id}
             id={`product-${product.id}`}
             style={{
               background: isDark ? '#374151' : 'white',
               borderRadius: '12px',
               padding: '16px',
               border: `2px solid ${
                 hasDiscrepancy ? (difference > 0 ? '#10b981' : '#ef4444') :
                 isCounted ? '#10b981' :
                 (isDark ? '#4b5563' : '#e5e7eb')
               }`,
               transition: 'all 0.2s ease'
             }}
           >
             <div style={{
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'flex-start',
               gap: '16px',
               flexWrap: window.innerWidth <= 768 ? 'wrap' : 'nowrap'
             }}>
               {/* Informations produit */}
               <div style={{ flex: 1, minWidth: '200px' }}>
                 <div style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '8px',
                   marginBottom: '8px'
                 }}>
                   <h4 style={{
                     fontSize: '16px',
                     fontWeight: '600',
                     color: isDark ? '#f7fafc' : '#1f2937',
                     margin: 0
                   }}>
                     {product.name}
                   </h4>
                   
                   {isCounted && (
                     <CheckCircle size={16} color="#10b981" />
                   )}
                   
                   {hasDiscrepancy && (
                     <AlertCircle size={16} color={difference > 0 ? '#10b981' : '#ef4444'} />
                   )}
                 </div>

                 <div style={{
                   display: 'flex',
                   gap: '16px',
                   fontSize: '14px',
                   color: isDark ? '#a0aec0' : '#6b7280',
                   marginBottom: '8px'
                 }}>
                   <span>SKU: {product.sku}</span>
                   <span>Stock: {currentStock}</span>
                   <span>Catégorie: {product.category}</span>
                 </div>

                 {sessionData.productNotes[product.id] && (
                   <div style={{
                     background: isDark ? '#4b5563' : '#f3f4f6',
                     padding: '8px',
                     borderRadius: '6px',
                     fontSize: '12px',
                     color: isDark ? '#f7fafc' : '#374151',
                     marginTop: '8px'
                   }}>
                     📝 {sessionData.productNotes[product.id]}
                   </div>
                 )}
               </div>

               {/* Zone de comptage */}
               <div style={{
                 display: 'flex',
                 flexDirection: 'column',
                 gap: '8px',
                 minWidth: '200px'
               }}>
                 <div style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '8px'
                 }}>
                   {quickCountMode ? (
                     <div style={{ display: 'flex', gap: '4px' }}>
                       <button
                         onClick={() => updateProductCount(product.id, Math.max(0, (countedStock || 0) - 1))}
                         style={{
                           padding: '8px',
                           background: '#ef4444',
                           color: 'white',
                           border: 'none',
                           borderRadius: '6px',
                           cursor: 'pointer'
                         }}
                       >
                         <Minus size={16} />
                       </button>
                       
                       <input
                         type="number"
                         value={countedStock || ''}
                         onChange={(e) => updateProductCount(product.id, e.target.value)}
                         placeholder="0"
                         style={{
                           width: '80px',
                           padding: '8px',
                           textAlign: 'center',
                           border: `2px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                           borderRadius: '6px',
                           background: isDark ? '#4b5563' : 'white',
                           color: isDark ? '#f7fafc' : '#1f2937',
                           fontSize: '16px',
                           fontWeight: '600'
                         }}
                       />
                       
                       <button
                         onClick={() => updateProductCount(product.id, (countedStock || 0) + 1)}
                         style={{
                           padding: '8px',
                           background: '#10b981',
                           color: 'white',
                           border: 'none',
                           borderRadius: '6px',
                           cursor: 'pointer'
                         }}
                       >
                         <Plus size={16} />
                       </button>
                     </div>
                   ) : (
                     <input
                       type="number"
                       value={countedStock || ''}
                       onChange={(e) => updateProductCount(product.id, e.target.value)}
                       placeholder={`Stock actuel: ${currentStock}`}
                       style={{
                         width: '120px',
                         padding: '12px',
                         textAlign: 'center',
                         border: `2px solid ${
                           hasDiscrepancy ? (difference > 0 ? '#10b981' : '#ef4444') :
                           isCounted ? '#10b981' :
                           (isDark ? '#4b5563' : '#e5e7eb')
                         }`,
                         borderRadius: '8px',
                         background: isDark ? '#4b5563' : 'white',
                         color: isDark ? '#f7fafc' : '#1f2937',
                         fontSize: '16px',
                         fontWeight: '600'
                       }}
                     />
                   )}

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

                 {/* Champ de note rapide */}
                 <input
                   type="text"
                   value={sessionData.productNotes[product.id] || ''}
                   onChange={(e) => {
                     const newNotes = { ...sessionData.productNotes };
                     if (e.target.value.trim()) {
                       newNotes[product.id] = e.target.value;
                     } else {
                       delete newNotes[product.id];
                     }
                     setSessionData(prev => ({ ...prev, productNotes: newNotes }));
                   }}
                   placeholder="Note (optionnel)"
                   style={{
                     width: '100%',
                     padding: '8px',
                     border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                     borderRadius: '6px',
                     background: isDark ? '#4b5563' : 'white',
                     color: isDark ? '#f7fafc' : '#1f2937',
                     fontSize: '12px'
                   }}
                 />
               </div>
             </div>
           </div>
         );
       })}
     </div>

     {/* Message si aucun produit */}
     {filteredProducts.length === 0 && (
       <div style={{
         background: isDark ? '#374151' : 'white',
         borderRadius: '12px',
         padding: '48px 24px',
         textAlign: 'center',
         border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
       }}>
         <Package size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
         <h3 style={{
           fontSize: '18px',
           fontWeight: '600',
           color: isDark ? '#f7fafc' : '#1f2937',
           margin: '0 0 8px 0'
         }}>
           Aucun produit trouvé
         </h3>
         <p style={{
           color: isDark ? '#a0aec0' : '#6b7280',
           margin: 0
         }}>
           {searchQuery ? 
             'Essayez de modifier votre recherche ou vos filtres' :
             'Tous les produits ont été filtrés'
           }
         </p>
       </div>
     )}
   </div>
 );

 // Vue de révision (simplifiée)
 const renderReviewView = () => (
   <div style={{ padding: '24px' }}>
     <div style={{
       background: isDark ? '#374151' : '#f8fafc',
       borderRadius: '12px',
       padding: '24px'
     }}>
       <h3 style={{
         fontSize: '20px',
         fontWeight: '700',
         color: isDark ? '#f7fafc' : '#1f2937',
         marginBottom: '16px'
       }}>
         Révision des écarts
       </h3>
       <p style={{
         color: isDark ? '#a0aec0' : '#6b7280'
       }}>
         {sessionStats.discrepancies} écart(s) détecté(s)
       </p>
       <button
         onClick={() => setActiveView('counting')}
         style={{
           padding: '8px 16px',
           background: '#3b82f6',
           color: 'white',
           border: 'none',
           borderRadius: '8px',
           marginTop: '16px',
           cursor: 'pointer'
         }}
       >
         Retour au comptage
       </button>
     </div>
   </div>
 );

 // Vue historique
 const renderHistoryView = () => {
   const [inventorySessions, setInventorySessions] = useState([]);

   useEffect(() => {
     try {
       const sessions = JSON.parse(localStorage.getItem('pos_inventory_sessions') || '[]');
       setInventorySessions(sessions.reverse());
     } catch (error) {
       console.error('Erreur chargement sessions:', error);
       setInventorySessions([]);
     }
   }, []);

   return (
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

       {inventorySessions.length > 0 ? (
         <div style={{ display: 'grid', gap: '16px' }}>
           {inventorySessions.map(session => (
             <div
               key={session.id}
               style={{
                 background: isDark ? '#374151' : 'white',
                 borderRadius: '12px',
                 padding: '20px',
                 border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
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
               <div style={{
                 fontSize: '14px',
                 color: isDark ? '#a0aec0' : '#6b7280'
               }}>
                 {new Date(session.startedAt).toLocaleString('fr-FR')}
                 {session.assignedTo && ` • ${session.assignedTo}`}
               </div>
               <div style={{
                 marginTop: '12px',
                 padding: '8px 12px',
                 background: session.status === 'completed' ? '#dcfce7' : '#fef3c7',
                 color: session.status === 'completed' ? '#166534' : '#92400e',
                 borderRadius: '6px',
                 fontSize: '12px',
                 fontWeight: '600',
                 display: 'inline-block'
               }}>
                 {session.status === 'completed' ? 'Terminé' : 'En cours'}
               </div>
             </div>
           ))}
         </div>
       ) : (
         <div style={{
           background: isDark ? '#374151' : 'white',
           borderRadius: '12px',
           padding: '48px 24px',
           textAlign: 'center',
           border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`
         }}>
           <History size={64} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
           <h3 style={{
             fontSize: '18px',
             fontWeight: '600',
             color: isDark ? '#f7fafc' : '#1f2937',
             margin: '0 0 8px 0'
           }}>
             Aucun inventaire trouvé
           </h3>
           <p style={{
             color: isDark ? '#a0aec0' : '#6b7280',
             margin: '0 0 24px 0'
           }}>
             Commencez votre premier inventaire physique
           </p>
           <button
             onClick={() => setActiveView('preparation')}
             style={{
               padding: '12px 24px',
               background: '#10b981',
               color: 'white',
               border: 'none',
               borderRadius: '8px',
               fontWeight: '600',
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center',
               gap: '8px',
               margin: '0 auto'
             }}
           >
             <ClipboardList size={18} />
             Créer un inventaire
           </button>
         </div>
       )}
     </div>
   );
 };

 // Rendu conditionnel selon la vue active
 const renderContent = () => {
   switch (activeView) {
     case 'preparation':
       return renderPreparationView();
     case 'counting':
       return renderCountingView();
     case 'review':
       return renderReviewView();
     case 'history':
       return renderHistoryView();
     default:
       return renderPreparationView();
   }
 };

 // Rendu principal avec navigation
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
       <div style={{
         display: 'flex',
         justifyContent: 'space-between',
         alignItems: 'center',
         flexWrap: 'wrap',
         gap: '16px'
       }}>
         <div>
           <h1 style={{
             fontSize: '28px',
             fontWeight: '700',
             color: isDark ? '#f7fafc' : '#1f2937',
             margin: '0 0 8px 0',
             display: 'flex',
             alignItems: 'center',
             gap: '12px'
           }}>
             <ClipboardList size={32} color="#3b82f6" />
             Inventaire Physique
           </h1>
           <p style={{
             color: isDark ? '#a0aec0' : '#6b7280',
             margin: 0,
             fontSize: '16px'
           }}>
             Gestion complète des inventaires avec comptage, révision et historique
           </p>
         </div>

         {/* Indicateur de session active */}
         {inventorySession && (
           <div style={{
             background: '#dcfce7',
             border: '1px solid #bbf7d0',
             borderRadius: '8px',
             padding: '12px 16px',
             display: 'flex',
             alignItems: 'center',
             gap: '8px'
           }}>
             <div style={{
               width: '8px',
               height: '8px',
               borderRadius: '50%',
               background: '#10b981',
               animation: 'pulse 2s infinite'
             }} />
             <div>
               <div style={{
                 fontSize: '14px',
                 fontWeight: '600',
                 color: '#166534'
               }}>
                 Session active
               </div>
               <div style={{
                 fontSize: '12px',
                 color: '#166534'
               }}>
                 {inventorySession.name}
               </div>
             </div>
           </div>
         )}
       </div>

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
           { key: 'review', label: 'Révision', icon: Eye, disabled: !inventorySession },
           { key: 'history', label: 'Historique', icon: History }
         ].map(tab => (
           <button
             key={tab.key}
             onClick={() => !tab.disabled && setActiveView(tab.key)}
             disabled={tab.disabled}
             style={{
               flex: 1,
               padding: '12px 16px',
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
               gap: '8px',
               transition: 'all 0.2s ease',
               boxShadow: activeView === tab.key ? 
                 '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
             }}
           >
             <tab.icon size={16} />
             {window.innerWidth > 640 && tab.label}
           </button>
         ))}
       </div>
     </div>

     {/* Contenu principal */}
     <div style={{ paddingBottom: '24px' }}>
       {renderContent()}
     </div>

     {/* Styles pour l'animation */}
     <style>{`
       @keyframes pulse {
         0%, 100% { opacity: 1; }
         50% { opacity: 0.5; }
       }
       
       @keyframes flash {
         0% { background-color: transparent; }
         50% { background-color: rgba(16, 185, 129, 0.1); }
         100% { background-color: transparent; }
       }
     `}</style>
   </div>
 );
};

export default PhysicalInventoryModule;
