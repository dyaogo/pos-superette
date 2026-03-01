import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardList, Save, AlertTriangle, Check, Search, Filter,
  Download, Upload, Scan, BarChart3, Calendar, Users,
  Package, TrendingUp, TrendingDown, AlertCircle, CheckCircle,
  Eye, EyeOff, Calculator, FileText, History, Settings,
  ChevronDown, ChevronUp, X, Plus, Minus, Edit3, Target,
  Zap, RefreshCw, ArrowRight, Timer, Activity
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { addInventoryRecord } from '../../services/inventory.service';

const PhysicalInventoryModule = () => {
  const {
    globalProducts = [],
    stockByStore = {},
    currentStoreId,
    setStockForStore,
    appSettings = {}
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
  const [selectedSession, setSelectedSession] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [countingMode, setCountingMode] = useState('manual'); // manual, scan, quick
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [employees, setEmployees] = useState([]); // ✅ Charger les employés localement

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
    progressPercent: 0,
    estimatedTimeRemaining: 0
  });

  const isDark = appSettings?.darkMode || false;

  // ✅ EFFET POUR CHARGER LES EMPLOYÉS
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          // L'API retourne directement un tableau d'utilisateurs
          const users = Array.isArray(data) ? data : [];
          setEmployees(users);
        }
      } catch (error) {
        console.error('Erreur chargement employés:', error);
      }
    };
    loadEmployees();
  }, []);

  // ✅ EFFET POUR CHARGER LES SESSIONS D'INVENTAIRE
  useEffect(() => {
    try {
      const sessions = JSON.parse(localStorage.getItem('pos_inventory_sessions') || '[]');
      setInventorySessions(sessions.reverse());
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
      setInventorySessions([]);
    }
  }, [activeView]);

  // ✅ AUTO-SAVE EN TEMPS RÉEL
  useEffect(() => {
    if (autoSaveEnabled && inventorySession && Object.keys(sessionData.productCounts).length > 0) {
      const timeoutId = setTimeout(() => {
        try {
          const sessions = JSON.parse(localStorage.getItem('pos_inventory_sessions') || '[]');
          const sessionIndex = sessions.findIndex(s => s.id === inventorySession.id);
          if (sessionIndex !== -1) {
            sessions[sessionIndex] = {
              ...sessions[sessionIndex],
              productCounts: sessionData.productCounts,
              productNotes: sessionData.productNotes,
              lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('pos_inventory_sessions', JSON.stringify(sessions));
          }
        } catch (error) {
          console.warn('Erreur auto-save:', error);
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [sessionData.productCounts, sessionData.productNotes, inventorySession, autoSaveEnabled]);

  // ✅ CATÉGORIES - USEMEMO SÉCURISÉ
  const categories = useMemo(() => {
    if (!Array.isArray(globalProducts)) return ['all'];
    const cats = [...new Set(globalProducts.map(p => p?.category).filter(Boolean))];
    return ['all', ...cats];
  }, [globalProducts]);

  // ✅ PRODUITS FILTRÉS AVANCÉS
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

    // Tri avancé
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
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
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
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
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

  // ✅ STATISTIQUES AVANCÉES
  const sessionStats = useMemo(() => {
    if (!Array.isArray(globalProducts)) {
      return {
        totalProducts: 0,
        countedProducts: 0,
        progressPercent: 0,
        discrepancies: 0,
        totalDiscrepancyValue: 0,
        accuracy: 0,
        positiveAdjustments: 0,
        negativeAdjustments: 0,
        averageTimePerProduct: 0,
        estimatedTimeRemaining: 0
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

    // Estimation du temps restant
    const averageTimePerProduct = countedProducts > 0 ? 30 : 45; // secondes par produit
    const remainingProducts = totalProducts - countedProducts;
    const estimatedTimeRemaining = remainingProducts * averageTimePerProduct;

    return {
      totalProducts,
      countedProducts,
      progressPercent: Math.round(progressPercent),
      discrepancies: discrepancies.length,
      totalDiscrepancyValue: Math.round(totalDiscrepancyValue), // ✅ Arrondir pour éviter les décimales
      positiveAdjustments,
      negativeAdjustments,
      accuracy: discrepancies.length === 0 && countedProducts > 0 ? 100 : 
               countedProducts > 0 ? Math.round((countedProducts - discrepancies.length) / countedProducts * 100) : 0,
      averageTimePerProduct,
      estimatedTimeRemaining
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
      storeId: currentStoreId,
      countingMode: 'manual'
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

    // Animation de feedback
    const productElement = document.getElementById(`product-${productId}`);
    if (productElement) {
      productElement.style.animation = 'pulse 0.3s ease-in-out';
      setTimeout(() => {
        productElement.style.animation = '';
      }, 300);
    }
  }, [sessionData.productCounts, sessionData.productNotes]);

  // ✅ FONCTION SCAN CODE-BARRES AMÉLIORÉE
  const handleBarcodeScan = useCallback((barcode) => {
    if (!Array.isArray(globalProducts)) return;
    
    const product = globalProducts.find(p => p?.barcode === barcode || p?.sku === barcode);
    if (product) {
      const currentCount = sessionData.productCounts[product.id] || 0;
      updateProductCount(product.id, currentCount + 1);
      setScanInput('');
      
      // Feedback visuel et sonore
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
      
      // Auto-scroll vers le produit
      const productElement = document.getElementById(`product-${product.id}`);
      if (productElement) {
        productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        productElement.style.background = '#dcfce7';
        setTimeout(() => {
          productElement.style.background = '';
        }, 1000);
      }
    } else {
      alert(`Produit non trouvé pour le code: ${barcode}`);
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  }, [globalProducts, sessionData.productCounts, updateProductCount]);

  // ✅ NAVIGATION RAPIDE ENTRE PRODUITS
  const navigateToProduct = useCallback((direction) => {
    const maxIndex = filteredProducts.length - 1;
    let newIndex = currentProductIndex;
    
    if (direction === 'next' && newIndex < maxIndex) {
      newIndex++;
    } else if (direction === 'prev' && newIndex > 0) {
      newIndex--;
    }
    
    setCurrentProductIndex(newIndex);
    
    const productElement = document.getElementById(`product-${filteredProducts[newIndex]?.id}`);
    if (productElement) {
      productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentProductIndex, filteredProducts]);

  // ✅ FONCTION FINALISER AMÉLIORÉE
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
          valueImpact: Math.round(difference * (product.costPrice || 0)), // ✅ Arrondir l'impact
          note: sessionData.productNotes[product.id] || ''
        };
      });

      if (discrepancies.length === 0) {
        alert('✅ Aucune différence détectée. Inventaire terminé avec succès !');
        setActiveView('history');
        return;
      }

      const shouldApply = window.confirm(
        `📊 RÉSUMÉ DE L'INVENTAIRE\n\n` +
        `• ${discrepancies.length} différence(s) détectée(s)\n` +
        `• ${sessionStats.positiveAdjustments} ajustement(s) positif(s)\n` +
        `• ${sessionStats.negativeAdjustments} ajustement(s) négatif(s)\n` +
        `• Impact financier: ${sessionStats.totalDiscrepancyValue.toLocaleString()} ${appSettings?.currency || 'FCFA'}\n\n` +
        `Voulez-vous appliquer ces ajustements ?`
      );

      if (shouldApply) {
        const newStock = { ...(stockByStore[currentStoreId] || {}) };
        
        Object.entries(sessionData.productCounts).forEach(([productIdStr, count]) => {
          const productId = parseInt(productIdStr);
          newStock[productId] = parseInt(count) || 0;
        });

        setStockForStore(currentStoreId, newStock);

        // Enregistrer l'historique complet
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

        // Finaliser la session dans localStorage
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
          console.warn('Erreur sauvegarde finale:', error);
        }

        alert(`✅ Inventaire finalisé avec succès !\n\n📈 ${discrepancies.length} ajustement(s) appliqué(s)\n💰 Impact: ${sessionStats.totalDiscrepancyValue.toLocaleString()} ${appSettings?.currency || 'FCFA'}`);
        
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
          progressPercent: 0,
          estimatedTimeRemaining: 0
        });
        setActiveView('history');
      }
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
      alert('❌ Erreur lors de la finalisation de l\'inventaire.');
    }
  }, [inventorySession, globalProducts, sessionData, stockByStore, currentStoreId, setStockForStore, sessionStats, appSettings?.currency]);

  // ✅ EXPORT AVANCÉ
  const exportInventoryData = useCallback((format = 'json') => {
    if (!inventorySession) return;

    const exportData = {
      session: inventorySession,
      stats: sessionStats,
      productCounts: sessionData.productCounts,
      productNotes: sessionData.productNotes,
      exportedAt: new Date().toISOString(),
      storeId: currentStoreId
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventaire-${inventorySession.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [inventorySession, sessionStats, sessionData, currentStoreId]);

  // ✅ FORMATAGE DU TEMPS
  const formatTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }, []);

  // ✅ RENDU PRINCIPAL MODERNE
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)'
    }}>
      {/* Header Modern */}
      <div style={{
        background: isDark ? '#1e293b' : 'white',
        borderBottom: '1px solid var(--color-border)',
        padding: '20px 24px'
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
              fontWeight: '800',
              color: isDark ? '#f1f5f9' : '#0f172a',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                borderRadius: '12px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ClipboardList size={24} color="white" />
              </div>
              Inventaire Physique
            </h1>
            <p style={{
              color: isDark ? '#94a3b8' : '#64748b',
              margin: 0,
              fontSize: '16px'
            }}>
              Gestion complète des inventaires avec comptage intelligent
            </p>
          </div>

          {/* Indicateur de session active moderne */}
          {inventorySession && (
            <div style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'white',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--color-surface)',
                animation: 'pulse 2s infinite'
              }} />
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Session Active
                </div>
                <div style={{
                  fontSize: '12px',
                  opacity: 0.9
                }}>
                  {inventorySession.name}
                </div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {sessionStats.progressPercent}%
              </div>
            </div>
          )}
        </div>

        {/* Navigation moderne avec animations */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginTop: '20px',
          background: isDark ? '#334155' : '#f1f5f9',
          borderRadius: '12px',
          padding: '4px'
        }}>
          {[
            { key: 'preparation', label: 'Préparation', icon: Settings },
            { key: 'counting', label: 'Comptage', icon: Target, disabled: !inventorySession },
            { key: 'review', label: 'Révision', icon: Eye, disabled: !inventorySession || sessionStats.discrepancies === 0 },
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
                  (isDark ? '#1e293b' : 'white') : 'transparent',
                color: tab.disabled ? '#94a3b8' :
                      activeView === tab.key ? 
                      (isDark ? '#f1f5f9' : '#0f172a') : 
                      (isDark ? '#94a3b8' : '#64748b'),
                border: 'none',
                borderRadius: '8px',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: activeView === tab.key ? 
                  '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              <tab.icon size={16} />
              {window.innerWidth > 640 && tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu principal selon la vue active */}
      <div style={{ padding: '24px' }}>
        {activeView === 'preparation' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Configuration moderne */}
            <div style={{
              background: isDark ? '#1e293b' : 'white',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  borderRadius: '10px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Settings size={20} color="white" />
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  margin: 0
                }}>
                  Configuration de l'inventaire
                </h3>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
                gap: '20px',
                marginBottom: '24px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: 'var(--color-text-primary)'
                  }}>
                    Nom de l'inventaire *
                  </label>
                  <input
                    type="text"
                    value={sessionData.name}
                    onChange={(e) => setSessionData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Inventaire mensuel Mars 2024"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid var(--color-border)',
                      borderRadius: '10px',
                      background: 'var(--color-bg)',
                      color: isDark ? '#f1f5f9' : '#0f172a',
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--color-border)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label style={{
            display: 'block',
                   fontSize: '14px',
                   fontWeight: '600',
                   marginBottom: '8px',
                   color: 'var(--color-text-primary)'
                 }}>
                   Assigné à
                 </label>
                 <select
                   value={sessionData.assignedTo}
                   onChange={(e) => setSessionData(prev => ({ ...prev, assignedTo: e.target.value }))}
                   style={{
                     width: '100%',
                     padding: '12px 16px',
                     border: '2px solid var(--color-border)',
                     borderRadius: '10px',
                     background: 'var(--color-bg)',
                     color: isDark ? '#f1f5f9' : '#0f172a',
                     fontSize: '14px'
                   }}
                 >
                   <option value="">Sélectionner un employé</option>
                   {employees.map(emp => (
                     <option key={emp.id} value={emp.fullName}>{emp.fullName}</option>
                   ))}
                   <option value="Responsable Stock">Responsable Stock</option>
                   <option value="Manager">Manager</option>
                 </select>
               </div>
             </div>

             <div style={{ marginBottom: '24px' }}>
               <label style={{
                 display: 'block',
                 fontSize: '14px',
                 fontWeight: '600',
                 marginBottom: '8px',
                 color: 'var(--color-text-primary)'
               }}>
                 Notes et instructions (optionnel)
               </label>
               <textarea
                 value={sessionData.notes}
                 onChange={(e) => setSessionData(prev => ({ ...prev, notes: e.target.value }))}
                 placeholder="Instructions spéciales, zones prioritaires, remarques..."
                 rows={3}
                 style={{
                   width: '100%',
                   padding: '12px 16px',
                   border: '2px solid var(--color-border)',
                   borderRadius: '10px',
                   background: 'var(--color-bg)',
                   color: isDark ? '#f1f5f9' : '#0f172a',
                   fontSize: '14px',
                   resize: 'vertical',
                   minHeight: '80px'
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
                   padding: '14px 28px',
                   background: sessionData.name.trim() ? 
                     'linear-gradient(135deg, #10b981, #059669)' : '#94a3b8',
                   color: 'white',
                   border: 'none',
                   borderRadius: '10px',
                   fontWeight: '700',
                   cursor: sessionData.name.trim() ? 'pointer' : 'not-allowed',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '10px',
                   fontSize: '16px',
                   boxShadow: sessionData.name.trim() ? 
                     '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                   transition: 'all 0.2s ease'
                 }}
                 onMouseEnter={(e) => {
                   if (sessionData.name.trim()) {
                     e.target.style.transform = 'translateY(-1px)';
                     e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                   }
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.transform = 'translateY(0)';
                   e.target.style.boxShadow = sessionData.name.trim() ? 
                     '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none';
                 }}
               >
                 <Target size={20} />
                 Démarrer l'inventaire
               </button>

               <button
                 onClick={() => setActiveView('history')}
                 style={{
                   padding: '14px 28px',
                   background: 'transparent',
                   color: 'var(--color-text-primary)',
                   border: '2px solid var(--color-border)',
                   borderRadius: '10px',
                   fontWeight: '600',
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '10px',
                   fontSize: '16px',
                   transition: 'all 0.2s ease'
                 }}
                 onMouseEnter={(e) => {
                   e.target.style.borderColor = '#3b82f6';
                   e.target.style.color = '#3b82f6';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.borderColor = 'var(--color-border)';
                   e.target.style.color = 'var(--color-text-primary)';
                 }}
               >
                 <History size={20} />
                 Voir l'historique
               </button>
             </div>
           </div>

           {/* Statistiques pré-inventaire */}
           <div style={{
             display: 'grid',
             gridTemplateColumns: window.innerWidth > 768 ? 'repeat(3, 1fr)' : '1fr',
             gap: '20px'
           }}>
             {[
               {
                 title: 'Produits à compter',
                 value: globalProducts.length,
                 icon: Package,
                 color: '#3b82f6',
                 gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
               },
               {
                 title: 'Valeur du stock',
                 value: `${globalProducts.reduce((sum, p) => {
                   const stock = (stockByStore[currentStoreId] || {})[p.id] || 0;
                   return sum + (stock * (p.costPrice || 0));
                 }, 0).toLocaleString()} ${appSettings?.currency || 'FCFA'}`,
                 icon: Calculator,
                 color: '#10b981',
                 gradient: 'linear-gradient(135deg, #10b981, #059669)'
               },
               {
                 title: 'Alertes stock',
                 value: globalProducts.filter(p => {
                   const stock = (stockByStore[currentStoreId] || {})[p.id] || 0;
                   return stock <= (p.minStock || 5);
                 }).length,
                 icon: AlertTriangle,
                 color: '#f59e0b',
                 gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
               }
             ].map((stat, index) => (
               <div
                 key={index}
                 style={{
                   background: isDark ? '#1e293b' : 'white',
                   borderRadius: '16px',
                   padding: '24px',
                   border: '1px solid var(--color-border)',
                   boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                   position: 'relative',
                   overflow: 'hidden'
                 }}
               >
                 <div style={{
                   position: 'absolute',
                   top: '-50%',
                   right: '-50%',
                   width: '100%',
                   height: '100%',
                   background: stat.gradient,
                   opacity: 0.1,
                   borderRadius: '50%'
                 }} />
                 
                 <div style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '12px',
                   marginBottom: '12px',
                   position: 'relative'
                 }}>
                   <div style={{
                     background: stat.gradient,
                     borderRadius: '10px',
                     padding: '8px',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center'
                   }}>
                     <stat.icon size={20} color="white" />
                   </div>
                   <span style={{
                     fontSize: '14px',
                     fontWeight: '600',
                     color: 'var(--color-text-primary)'
                   }}>
                     {stat.title}
                   </span>
                 </div>
                 <div style={{
                   fontSize: '24px',
                   fontWeight: '800',
                   color: stat.color,
                   position: 'relative'
                 }}>
                   {stat.value}
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}

       {activeView === 'counting' && (
         <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
           {/* Dashboard de comptage moderne */}
           <div style={{
             background: isDark ? '#1e293b' : 'white',
             borderRadius: '16px',
             padding: '24px',
             border: '1px solid var(--color-border)',
             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
             marginBottom: '24px'
           }}>
             <div style={{
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               marginBottom: '20px',
               flexWrap: 'wrap',
               gap: '16px'
             }}>
               <div>
                 <h3 style={{
                   fontSize: '20px',
                   fontWeight: '700',
                   color: isDark ? '#f1f5f9' : '#0f172a',
                   margin: '0 0 8px 0'
                 }}>
                   {inventorySession?.name}
                 </h3>
                 <p style={{
                   color: isDark ? '#94a3b8' : '#64748b',
                   margin: 0,
                   fontSize: '14px'
                 }}>
                   {sessionStats.countedProducts} / {sessionStats.totalProducts} produits comptés
                   {sessionStats.estimatedTimeRemaining > 0 && (
                     <span> • Temps estimé: {formatTime(sessionStats.estimatedTimeRemaining)}</span>
                   )}
                 </p>
               </div>

               <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                 <button
                   onClick={() => setActiveView('review')}
                   disabled={sessionStats.discrepancies === 0}
                   style={{
                     padding: '10px 16px',
                     background: sessionStats.discrepancies > 0 ? 
                       'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#94a3b8',
                     color: 'white',
                     border: 'none',
                     borderRadius: '8px',
                     fontWeight: '600',
                     cursor: sessionStats.discrepancies > 0 ? 'pointer' : 'not-allowed',
                     fontSize: '14px',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '6px'
                   }}
                 >
                   <Eye size={16} />
                   Réviser ({sessionStats.discrepancies})
                 </button>
                 
                 <button
                   onClick={finalizeInventory}
                   disabled={sessionStats.countedProducts === 0}
                   style={{
                     padding: '10px 16px',
                     background: sessionStats.countedProducts > 0 ? 
                       'linear-gradient(135deg, #10b981, #059669)' : '#94a3b8',
                     color: 'white',
                     border: 'none',
                     borderRadius: '8px',
                     fontWeight: '600',
                     cursor: sessionStats.countedProducts > 0 ? 'pointer' : 'not-allowed',
                     fontSize: '14px',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '6px'
                   }}
                 >
                   <CheckCircle size={16} />
                   Finaliser
                 </button>

                 <button
                   onClick={() => exportInventoryData('json')}
                   style={{
                     padding: '10px 16px',
                     background: 'transparent',
                     color: 'var(--color-text-primary)',
                     border: '1px solid var(--color-border)',
                     borderRadius: '8px',
                     fontWeight: '600',
                     cursor: 'pointer',
                     fontSize: '14px',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '6px'
                   }}
                 >
                   <Download size={16} />
                   Export
                 </button>
               </div>
             </div>

             {/* Barre de progression animée */}
             <div style={{
               background: isDark ? '#334155' : '#f1f5f9',
               borderRadius: '10px',
               height: '10px',
               overflow: 'hidden',
               marginBottom: '20px',
               position: 'relative'
             }}>
               <div style={{
                 background: 'linear-gradient(90deg, #10b981, #34d399)',
                 height: '100%',
                 width: `${sessionStats.progressPercent}%`,
                 borderRadius: '10px',
                 transition: 'width 0.5s ease',
                 position: 'relative'
               }}>
                 <div style={{
                   position: 'absolute',
                   top: 0,
                   left: 0,
                   right: 0,
                   bottom: 0,
                   background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                   animation: sessionStats.progressPercent < 100 ? 'shimmer 2s infinite' : 'none'
                 }} />
               </div>
             </div>

             {/* Statistiques temps réel */}
             <div style={{
               display: 'grid',
               gridTemplateColumns: window.innerWidth > 768 ? 'repeat(5, 1fr)' : 'repeat(2, 1fr)',
               gap: '16px'
             }}>
               {[
                 {
                   label: 'Progression',
                   value: `${sessionStats.progressPercent}%`,
                   color: '#10b981',
                   icon: TrendingUp
                 },
                 {
                   label: 'Écarts',
                   value: sessionStats.discrepancies,
                   color: sessionStats.discrepancies > 0 ? '#ef4444' : '#10b981',
                   icon: AlertTriangle
                 },
                 {
                   label: 'Précision',
                   value: `${sessionStats.accuracy}%`,
                   color: sessionStats.accuracy >= 95 ? '#10b981' : 
                          sessionStats.accuracy >= 85 ? '#f59e0b' : '#ef4444',
                   icon: Target
                 },
                 {
                   label: 'Impact',
                   value: `${Math.abs(sessionStats.totalDiscrepancyValue).toLocaleString()}`,
                   color: sessionStats.totalDiscrepancyValue >= 0 ? '#10b981' : '#ef4444',
                   icon: Calculator
                 },
                 {
                   label: 'Temps restant',
                   value: formatTime(sessionStats.estimatedTimeRemaining),
                   color: '#3b82f6',
                   icon: Timer
                 }
               ].map((stat, index) => (
                 <div key={index} style={{ textAlign: 'center' }}>
                   <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: '4px',
                     marginBottom: '4px'
                   }}>
                     <stat.icon size={14} color={stat.color} />
                     <span style={{
                       fontSize: '20px',
                       fontWeight: '700',
                       color: stat.color
                     }}>
                       {stat.value}
                     </span>
                   </div>
                   <div style={{
                     fontSize: '12px',
                     color: isDark ? '#94a3b8' : '#64748b',
                     fontWeight: '500'
                   }}>
                     {stat.label}
                   </div>
                 </div>
               ))}
             </div>
           </div>

           {/* Zone de scan et modes de comptage */}
           <div style={{
             background: isDark ? '#1e293b' : 'white',
             borderRadius: '16px',
             padding: '20px',
             border: '1px solid var(--color-border)',
             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
             marginBottom: '24px'
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
                 color: isDark ? '#f1f5f9' : '#0f172a',
                 margin: 0,
                 display: 'flex',
                 alignItems: 'center',
                 gap: '8px'
               }}>
                 <Scan size={20} />
                 Modes de comptage
               </h4>

               <div style={{ display: 'flex', gap: '8px' }}>
                 {[
                   { key: 'manual', label: 'Manuel', icon: Edit3 },
                   { key: 'scan', label: 'Scan', icon: Scan },
                   { key: 'quick', label: 'Rapide', icon: Zap }
                 ].map(mode => (
                   <button
                     key={mode.key}
                     onClick={() => setCountingMode(mode.key)}
                     style={{
                       padding: '8px 12px',
                       background: countingMode === mode.key ? 
                         'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'transparent',
                       color: countingMode === mode.key ? 'white' : 'var(--color-text-primary)',
                       border: `1px solid ${countingMode === mode.key ? '#3b82f6' : 'var(--color-border)'}`,
                       borderRadius: '8px',
                       fontSize: '12px',
                       cursor: 'pointer',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '4px',
                       fontWeight: '600'
                     }}
                   >
                     <mode.icon size={14} />
                     {mode.label}
                   </button>
                 ))}
               </div>
             </div>

             {countingMode === 'scan' && (
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
                     padding: '12px 16px',
                     border: '2px solid var(--color-border)',
                     borderRadius: '10px',
                     background: 'var(--color-bg)',
                     color: isDark ? '#f1f5f9' : '#0f172a',
                     fontSize: '14px'
                   }}
                   autoFocus
                 />
                 
                 <button
                   onClick={() => scanInput.trim() && handleBarcodeScan(scanInput.trim())}
                   disabled={!scanInput.trim()}
                   style={{
                     padding: '12px 16px',
                     background: scanInput.trim() ? 
                       'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#94a3b8',
                     color: 'white',
                     border: 'none',
                     borderRadius: '10px',
                     cursor: scanInput.trim() ? 'pointer' : 'not-allowed',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '6px'
                   }}
                 >
                   <Scan size={18} />
                   Scanner
                 </button>
               </div>
             )}
           </div>

           {/* Filtres avancés */}
           <div style={{
             background: isDark ? '#1e293b' : 'white',
             borderRadius: '16px',
             padding: '20px',
             border: '1px solid var(--color-border)',
             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
             marginBottom: '24px'
           }}>
             <div style={{
               display: 'flex',
               gap: '12px',
               marginBottom: '16px',
               flexWrap: 'wrap',
               alignItems: 'center'
             }}>
               <div style={{ flex: 1, minWidth: '250px' }}>
                 <div style={{ position: 'relative' }}>
                   <Search size={18} style={{
                     position: 'absolute',
                     left: '12px',
                     top: '50%',
                     transform: 'translateY(-50%)',
                     color: '#94a3b8'
                   }} />
                   <input
                     type="text"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Rechercher produit, SKU, code-barres..."
                     style={{
                       width: '100%',
                       padding: '12px 12px 12px 40px',
                       border: '2px solid var(--color-border)',
                       borderRadius: '10px',
                       background: 'var(--color-bg)',
                       color: isDark ? '#f1f5f9' : '#0f172a',
                       fontSize: '14px'
                     }}
                   />
                 </div>
               </div>

               <button
                 onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                 style={{
                   padding: '12px 16px',
                   background: showAdvancedFilters ? 
                     'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'transparent',
                   color: showAdvancedFilters ? 'white' : 'var(--color-text-primary)',
                   border: `2px solid ${showAdvancedFilters ? '#3b82f6' : 'var(--color-border)'}`,
                   borderRadius: '10px',
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '8px',
                   fontSize: '14px',
                   fontWeight: '600'
                 }}
               >
                 <Filter size={16} />
                 Filtres avancés
               </button>

               <div style={{ display: 'flex', gap: '8px' }}>
                 <button
                   onClick={() => setCompactView(!compactView)}
                   style={{
                     padding: '12px',
                     background: 'transparent',
                     color: 'var(--color-text-primary)',
                     border: '1px solid var(--color-border)',
                     borderRadius: '8px',
                     cursor: 'pointer'
                   }}
                   title={compactView ? 'Vue détaillée' : 'Vue compacte'}
                 >
                   {compactView ? <Eye size={16} /> : <EyeOff size={16} />}
                 </button>

                 <button
                   onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                   style={{
                     padding: '12px',
                     background: autoSaveEnabled ? 
                       'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                     color: autoSaveEnabled ? 'white' : 'var(--color-text-primary)',
                     border: `1px solid ${autoSaveEnabled ? '#10b981' : 'var(--color-border)'}`,
                     borderRadius: '8px',
                     cursor: 'pointer'
                   }}
                   title={autoSaveEnabled ? 'Auto-save activé' : 'Auto-save désactivé'}
                 >
                   <Save size={16} />
                 </button>
               </div>
             </div>

             {/* Filtres avancés */}
             {showAdvancedFilters && (
               <div style={{
                 borderTop: '1px solid var(--color-border)',
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
                     color: isDark ? '#94a3b8' : '#64748b'
                   }}>
                     Catégorie
                   </label>
                   <select
                     value={selectedCategories[0]}
                     onChange={(e) => setSelectedCategories([e.target.value])}
                     style={{
                       width: '100%',
                       padding: '8px 12px',
                       border: '1px solid var(--color-border)',
                       borderRadius: '8px',
                       background: 'var(--color-bg)',
                       color: isDark ? '#f1f5f9' : '#0f172a',
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
                     color: isDark ? '#94a3b8' : '#64748b'
                   }}>
                     Trier par
                   </label>
                   <select
                     value={sortBy}
                     onChange={(e) => setSortBy(e.target.value)}
                     style={{
                       width: '100%',
                       padding: '8px 12px',
                       border: '1px solid var(--color-border)',
                       borderRadius: '8px',
                       background: 'var(--color-bg)',
                       color: isDark ? '#f1f5f9' : '#0f172a',
                       fontSize: '14px'
                     }}
                   >
                     <option value="name">Nom</option>
                     <option value="stock">Stock</option>
                     <option value="value">Valeur</option>
                     <option value="category">Catégorie</option>
                     <option value="difference">Écart</option>
                   </select>
                 </div>

                 <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
                   <button
                     onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                     style={{
                       padding: '8px',
                       background: 'transparent',
                       color: 'var(--color-text-primary)',
                       border: '1px solid var(--color-border)',
                       borderRadius: '6px',
                       cursor: 'pointer'
                     }}
                     title={`Tri ${sortOrder === 'asc' ? 'croissant' : 'décroissant'}`}
                   >
                     {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                   </button>
                 </div>

                 <div style={{ display: 'flex', gap: '4px', alignItems: 'end', flexWrap: 'wrap' }}>
                   <button
                     onClick={() => setShowDiscrepanciesOnly(!showDiscrepanciesOnly)}
                     style={{
                       padding: '6px 10px',
                       background: showDiscrepanciesOnly ? '#ef4444' : 'transparent',
                       color: showDiscrepanciesOnly ? 'white' : '#ef4444',
                       border: '1px solid #ef4444',
                       borderRadius: '6px',
                       fontSize: '11px',
                       cursor: 'pointer',
                       fontWeight: '600'
                     }}
                   >
                     Écarts
                   </button>
                   
                   <button
                     onClick={() => setShowCompletedOnly(!showCompletedOnly)}
                     style={{
                       padding: '6px 10px',
                       background: showCompletedOnly ? '#10b981' : 'transparent',
                       color: showCompletedOnly ? 'white' : '#10b981',
                       border: '1px solid #10b981',
                       borderRadius: '6px',
                       fontSize: '11px',
                       cursor: 'pointer',
                       fontWeight: '600'
                     }}
                   >
                     Comptés
                   </button>
                 </div>
               </div>
             )}
           </div>

           {/* Liste des produits moderne */}
           <div style={{
             display: 'grid',
             gap: compactView ? '8px' : '16px'
           }}>
             {filteredProducts.slice(0, 20).map((product, index) => {
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
                     background: isDark ? '#1e293b' : 'white',
                     borderRadius: compactView ? '8px' : '12px',
                     padding: compactView ? '12px' : '20px',
                     border: `2px solid ${
                       hasDiscrepancy ? (difference > 0 ? '#10b981' : '#ef4444') :
                       isCounted ? '#10b981' :
                       'var(--color-border)'
                     }`,
                     boxShadow: hasDiscrepancy ? 
                       `0 4px 12px ${difference > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}` :
                       '0 2px 8px rgba(0, 0, 0, 0.05)',
                     transition: 'all 0.3s ease',
                     position: 'relative'
                   }}
                 >
                   {/* Badge de statut */}
                   {isCounted && (
                     <div style={{
                       position: 'absolute',
                       top: '12px',
                       right: '12px',
                       background: hasDiscrepancy ? 
                         (difference > 0 ? '#10b981' : '#ef4444') : '#10b981',
                       color: 'white',
                       borderRadius: '12px',
                       padding: '4px 8px',
                       fontSize: '10px',
                       fontWeight: '700',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '4px'
                     }}>
                       {hasDiscrepancy ? (
                         <>
                           {difference > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                           {difference > 0 ? '+' : ''}{difference}
                         </>
                       ) : (
                         <>
                           <CheckCircle size={10} />
                           OK
                         </>
                       )}
                     </div>
                   )}

                   <div style={{
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: compactView ? 'center' : 'flex-start',
                     gap: '16px',
                     flexWrap: compactView ? 'nowrap' : (window.innerWidth <= 768 ? 'wrap' : 'nowrap')
                   }}>
                     {/* Informations produit */}
                     <div style={{ flex: 1, minWidth: compactView ? '150px' : '200px' }}>
                       <div style={{
                         display: 'flex',
                         alignItems: 'center',
                         gap: '8px',
                         marginBottom: compactView ? '4px' : '8px'
                       }}>
                         <h4 style={{
                           fontSize: compactView ? '14px' : '16px',
                           fontWeight: '600',
                           color: isDark ? '#f1f5f9' : '#0f172a',
                           margin: 0
                         }}>
                           {product.name}
                         </h4>
                         
                         {index === currentProductIndex && (
                           <div style={{
                             background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                             borderRadius: '4px',
                             padding: '2px 6px',
                             fontSize: '10px',
                             color: 'white',
                             fontWeight: '600'
                           }}>
                             ACTUEL
                           </div>
                         )}
                       </div>

                       {!compactView && (
                         <div style={{
                           display: 'flex',
                           gap: '16px',
                           fontSize: '13px',
                           color: isDark ? '#94a3b8' : '#64748b',
                           marginBottom: '8px',
                           flexWrap: 'wrap'
                         }}>
                           <span><strong>SKU:</strong> {product.sku}</span>
                           <span><strong>Stock:</strong> {currentStock}</span>
                           <span><strong>Catégorie:</strong> {product.category}</span>
                           {product.costPrice && (
                             <span><strong>Valeur:</strong> {(currentStock * product.costPrice).toLocaleString()} {appSettings?.currency || 'FCFA'}</span>
                           )}
                         </div>
                       )}

                       {compactView && (
                         <div style={{
                           fontSize: '12px',
                           color: isDark ? '#94a3b8' : '#64748b'
                         }}>
                           {product.sku} • Stock: {currentStock}
                         </div>
                       )}

                       {sessionData.productNotes[product.id] && (
                         <div style={{
                           background: isDark ? '#334155' : '#f1f5f9',
                           padding: compactView ? '6px' : '8px',
                           borderRadius: '6px',
                           fontSize: '12px',
                           color: 'var(--color-text-primary)',
                           marginTop: '8px',
                           display: 'flex',
                           alignItems: 'center',
                           gap: '6px'
                         }}>
                           <FileText size={12} />
                           {sessionData.productNotes[product.id]}
                         </div>
                       )}
                     </div>

                     {/* Zone de comptage moderne */}
                     <div style={{
                       display: 'flex',
                       flexDirection: compactView ? 'row' : 'column',
                       gap: compactView ? '8px' : '12px',
                       minWidth: compactView ? '200px' : '240px',
                       alignItems: compactView ? 'center' : 'stretch'
                     }}>
                       <div style={{
                         display: 'flex',
                         alignItems: 'center',
                         gap: '8px'
                       }}>
                         {countingMode === 'quick' || quickCountMode ? (
                           <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                             <button
                               onClick={() => updateProductCount(product.id, Math.max(0, (countedStock || 0) - 1))}
                               style={{
                                 padding: compactView ? '6px' : '8px',
                                 background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                 color: 'white',
                                 border: 'none',
                                 borderRadius: '6px',
                                 cursor: 'pointer',
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                               }}
                             >
                               <Minus size={compactView ? 12 : 16} />
                             </button>
                             
                             <input
                               type="number"
                               value={countedStock || ''}
                               onChange={(e) => updateProductCount(product.id, e.target.value)}
                               placeholder="0"
                               style={{
                                 width: compactView ? '60px' : '80px',
                                 padding: compactView ? '6px' : '8px',
                                 textAlign: 'center',
                                 border: '2px solid var(--color-border)',
                                 borderRadius: '6px',
                                 background: 'var(--color-bg)',
                                 color: isDark ? '#f1f5f9' : '#0f172a',
                                 fontSize: compactView ? '14px' : '16px',
                                 fontWeight: '600'
                               }}
                             />
                             
                             <button
                               onClick={() => updateProductCount(product.id, (countedStock || 0) + 1)}
                               style={{
                                 padding: compactView ? '6px' : '8px',
                                 background: 'linear-gradient(135deg, #10b981, #059669)',
                                 color: 'white',
                                 border: 'none',
                                 borderRadius: '6px',
                                 cursor: 'pointer',
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                               }}
                             >
                               <Plus size={compactView ? 12 : 16} />
                             </button>
                           </div>
                         ) : (
                           <input
                             type="number"
                             value={countedStock || ''}
                             onChange={(e) => updateProductCount(product.id, e.target.value)}
                             placeholder={`Stock: ${currentStock}`}
                             style={{
                               width: compactView ? '100px' : '140px',
                               padding: compactView ? '8px' : '12px',
                               textAlign: 'center',
                               border: `2px solid ${
                                 hasDiscrepancy ? (difference > 0 ? '#10b981' : '#ef4444') :
                                 isCounted ? '#10b981' :
                                 'var(--color-border)'
                               }`,
                               borderRadius: '8px',
                               background: 'var(--color-bg)',
                               color: isDark ? '#f1f5f9' : '#0f172a',
                               fontSize: compactView ? '14px' : '16px',
                               fontWeight: '600',
                               boxShadow: hasDiscrepancy ? 
                                 `0 0 0 3px ${difference > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}` : 
                                 'none'
                             }}
                           />
                         )}

                         {hasDiscrepancy && (
                           <div style={{
                             display: 'flex',
                             alignItems: 'center',
                             gap: '4px',
                             fontSize: compactView ? '12px' : '14px',
                             fontWeight: '700',
                             color: difference > 0 ? '#10b981' : '#ef4444',
                             background: difference > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                             padding: '4px 8px',
                             borderRadius: '6px'
                           }}>
                             {difference > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                             {difference > 0 ? '+' : ''}{difference}
                           </div>
                         )}
                       </div>

                       {/* Champ de note moderne */}
                       {!compactView && (
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
                             padding: '8px 12px',
                             border: '1px solid var(--color-border)',
                             borderRadius: '6px',
                             background: 'var(--color-bg)',
                             color: isDark ? '#f1f5f9' : '#0f172a',
                             fontSize: '12px'
                           }}
                         />
                       )}
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>

           {/* Navigation rapide entre produits */}
           {filteredProducts.length > 1 && !compactView && (
             <div style={{
               position: 'fixed',
               bottom: '24px',
               right: '24px',
               display: 'flex',
               gap: '8px',
               background: isDark ? '#1e293b' : 'white',
               padding: '12px',
               borderRadius: '12px',
               boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
               border: '1px solid var(--color-border)'
             }}>
               <button
                 onClick={() => navigateToProduct('prev')}
                 disabled={currentProductIndex === 0}
                 style={{
                   padding: '8px',
                   background: currentProductIndex === 0 ? '#94a3b8' : 
                     'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                   color: 'white',
                   border: 'none',
                   borderRadius: '6px',
                   cursor: currentProductIndex === 0 ? 'not-allowed' : 'pointer'
                 }}
               >
                 <ChevronUp size={16} />
               </button>
               
               <div style={{
                 padding: '8px 12px',
                 fontSize: '12px',
                 color: isDark ? '#f1f5f9' : '#0f172a',
                 fontWeight: '600',
                 display: 'flex',
                 alignItems: 'center'
               }}>
                 {currentProductIndex + 1} / {filteredProducts.length}
               </div>
               
               <button
                 onClick={() => navigateToProduct('next')}
                 disabled={currentProductIndex === filteredProducts.length - 1}
                 style={{
                   padding: '8px',
                   background: currentProductIndex === filteredProducts.length - 1 ? '#94a3b8' : 
                     'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                   color: 'white',
                   border: 'none',
                   borderRadius: '6px',
                   cursor: currentProductIndex === filteredProducts.length - 1 ? 'not-allowed' : 'pointer'
                 }}
               >
                 <ChevronDown size={16} />
               </button>
             </div>
           )}

           {/* Message si trop de produits */}
           {filteredProducts.length > 20 && (
             <div style={{
               background: isDark ? '#1e293b' : '#f8fafc',
               borderRadius: '12px',
               padding: '16px',
               textAlign: 'center',
               color: isDark ? '#94a3b8' : '#64748b',
               fontSize: '14px',
               marginTop: '16px',
               border: '1px solid var(--color-border)'
             }}>
               📊 Affichage des 20 premiers produits sur {filteredProducts.length} • 
               Utilisez la recherche pour affiner les résultats
             </div>
           )}

           {/* Message si aucun produit */}
           {filteredProducts.length === 0 && (
             <div style={{
               background: isDark ? '#1e293b' : 'white',
               borderRadius: '16px',
               padding: '48px 24px',
               textAlign: 'center',
               border: '1px solid var(--color-border)',
               boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
             }}>
               <Package size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
               <h3 style={{
                 fontSize: '18px',
                 fontWeight: '600',
                 color: isDark ? '#f1f5f9' : '#0f172a',
                 margin: '0 0 8px 0'
               }}>
                 Aucun produit trouvé
               </h3>
               <p style={{
                 color: isDark ? '#94a3b8' : '#64748b',
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
       )}

       {activeView === 'review' && (
         <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
           {/* Vue de révision moderne */}
           <div style={{
             background: isDark ? '#1e293b' : 'white',
             borderRadius: '16px',
             padding: '32px',
             border: '1px solid var(--color-border)',
             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
           }}>
             <div style={{
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               marginBottom: '24px'
             }}>
               <div>
                 <h3 style={{
                   fontSize: '24px',
                   fontWeight: '700',
                   color: isDark ? '#f1f5f9' : '#0f172a',
                   margin: '0 0 8px 0',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '12px'
                 }}>
                   <div style={{
                     background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                     borderRadius: '10px',
                     padding: '8px',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center'
                   }}>
                     <Eye size={20} color="white" />
                   </div>
                   Révision des écarts
                 </h3>
                 <p style={{
                   color: isDark ? '#94a3b8' : '#64748b',
                   margin: 0,
                   fontSize: '16px'
                 }}>
                   Vérifiez et validez les différences détectées
                 </p>
               </div>

               <div style={{ display: 'flex', gap: '8px' }}>
                 <button
                   onClick={() => setActiveView('counting')}
                   style={{
                     padding: '10px 16px',
                     background: 'transparent',
                     color: 'var(--color-text-primary)',
                     border: '2px solid var(--color-border)',
                     borderRadius: '8px',
                     fontWeight: '600',
                     cursor: 'pointer',
                     fontSize: '14px',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '6px'
                   }}
                 >
                   <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
                   Retour comptage
                 </button>
                 
                 <button
                   onClick={finalizeInventory}
                   style={{
                     padding: '10px 16px',
                     background: 'linear-gradient(135deg, #10b981, #059669)',
                     color: 'white',
                     border: 'none',
                     borderRadius: '8px',
                     fontWeight: '600',
                     cursor: 'pointer',
                     fontSize: '14px',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '6px'
                   }}
                 >
                   <CheckCircle size={16} />
                   Finaliser l'inventaire
                 </button>
               </div>
             </div>

             {/* Résumé des écarts */}
             <div style={{
               background: sessionStats.totalDiscrepancyValue < 0 ? '#fef2f2' : '#f0fdf4',
               border: `2px solid ${sessionStats.totalDiscrepancyValue < 0 ? '#fecaca' : '#bbf7d0'}`,
               borderRadius: '12px',
               padding: '20px',
               marginBottom: '24px'
             }}>
               <div style={{
                 display: 'grid',
                 gridTemplateColumns: window.innerWidth > 768 ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
                 gap: '16px'
               }}>
                 <div style={{ textAlign: 'center' }}>
                   <div style={{
                     fontSize: '24px',
                     fontWeight: '700',
                     color: '#ef4444',
                     marginBottom: '4px'
                   }}>
                     {sessionStats.discrepancies}
                   </div>
                   <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                     Écarts détectés
                   </div>
                 </div>

                 <div style={{ textAlign: 'center' }}>
                   <div style={{
                     fontSize: '20px',
                     fontWeight: '700',
                     color: sessionStats.totalDiscrepancyValue >= 0 ? '#10b981' : '#ef4444',
                     marginBottom: '4px'
                   }}>
                     {sessionStats.totalDiscrepancyValue.toLocaleString()} {appSettings?.currency || 'FCFA'}
                   </div>
                   <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                     Impact financier
                   </div>
                 </div>

                 <div style={{ textAlign: 'center' }}>
                   <div style={{
                     fontSize: '24px',
                     fontWeight: '700',
                     color: '#10b981',
                     marginBottom: '4px'
                   }}>
                     {sessionStats.positiveAdjustments}
                   </div>
                   <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                     Ajustements +
                   </div>
                 </div>

                 <div style={{ textAlign: 'center' }}>
                   <div style={{
                     fontSize: '24px',
                     fontWeight: '700',
                     color: '#ef4444',
                     marginBottom: '4px'
                   }}>
                     {sessionStats.negativeAdjustments}
                   </div>
                   <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                     Ajustements -
                   </div>
                 </div>
               </div>
             </div>

             {/* Message d'encouragement */}
             <div style={{
               textAlign: 'center',
               padding: '24px',
               background: 'var(--color-bg)',
               borderRadius: '12px',
               marginBottom: '24px'
             }}>
               <p style={{
                 fontSize: '16px',
                 color: isDark ? '#f1f5f9' : '#0f172a',
                 margin: 0,
                 fontWeight: '600'
               }}>
                 🎯 Inventaire terminé avec <span style={{ color: '#10b981' }}>{sessionStats.accuracy}% de précision</span>
               </p>
               <p style={{
                 fontSize: '14px',
                 color: isDark ? '#94a3b8' : '#64748b',
                 margin: '8px 0 0 0'
               }}>
                 Prêt à appliquer les ajustements ? Cliquez sur "Finaliser l'inventaire"
               </p>
             </div>
           </div>
         </div>
       )}

       {activeView === 'history' && (
         <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
           {/* Historique moderne */}
           <div style={{
             background: isDark ? '#1e293b' : 'white',
             borderRadius: '16px',
             padding: '32px',
             border: '1px solid var(--color-border)',
             boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
           }}>
             <div style={{
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               marginBottom: '24px'
             }}>
               <div>
                 <h3 style={{
                   fontSize: '24px',
                   fontWeight: '700',
                   color: isDark ? '#f1f5f9' : '#0f172a',
                   margin: '0 0 8px 0',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '12px'
                 }}>
                   <div style={{
                     background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                     borderRadius: '10px',
                     padding: '8px',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center'
                   }}>
                     <History size={20} color="white" />
                   </div>
                   Historique des inventaires
                 </h3>
                 <p style={{
                   color: isDark ? '#94a3b8' : '#64748b',
                   margin: 0,
                   fontSize: '16px'
                 }}>
                   Consultez tous les inventaires effectués
                 </p>
               </div>

               <button
                 onClick={() => setActiveView('preparation')}
                 style={{
                   padding: '12px 20px',
                   background: 'linear-gradient(135deg, #10b981, #059669)',
                   color: 'white',
                   border: 'none',
                   borderRadius: '10px',
                   fontWeight: '600',
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '8px',
                   fontSize: '16px',
                   boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                 }}
               >
                 <Plus size={18} />
                 Nouvel inventaire
               </button>
             </div>

             {inventorySessions.length > 0 ? (
               <div style={{ display: 'grid', gap: '16px' }}>
                 {inventorySessions.map(session => (
                   <div
                     key={session.id}
                     style={{
                       background: 'var(--color-bg)',
                       borderRadius: '12px',
                       padding: '20px',
                       border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
                       cursor: 'pointer',
                       transition: 'all 0.2s ease'
                     }}
                     onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                     onMouseEnter={(e) => {
                       e.target.style.borderColor = '#3b82f6';
                       e.target.style.transform = 'translateY(-1px)';
                     }}
                     onMouseLeave={(e) => {
                       e.target.style.borderColor = isDark ? '#475569' : '#e2e8f0';
                       e.target.style.transform = 'translateY(0)';
                     }}
                   >
                     <div style={{
                       display: 'flex',
                       justifyContent: 'space-between',
                       alignItems: 'flex-start',
                       marginBottom: '12px'
                     }}>
                       <div>
                         <h4 style={{
                           fontSize: '18px',
                           fontWeight: '600',
                           color: isDark ? '#f1f5f9' : '#0f172a',
                           margin: '0 0 8px 0'
                         }}>
                           {session.name}
                         </h4>
                         <div style={{
                           fontSize: '14px',
                           color: isDark ? '#94a3b8' : '#64748b'
                         }}>
                           {new Date(session.startedAt).toLocaleString('fr-FR')}
                           {session.assignedTo && ` • Assigné à ${session.assignedTo}`}
                         </div>
                       </div>

                       <div style={{
                         display: 'flex',
                         alignItems: 'center',
                         gap: '8px'
                       }}>
                         <div style={{
                           padding: '4px 8px',
                           borderRadius: '12px',
                           fontSize: '12px',
                           fontWeight: '600',
                           background: session.status === 'completed' ? '#dcfce7' : 
                                      session.status === 'cancelled' ? '#fef2f2' : '#fef3c7',
                           color: session.status === 'completed' ? '#166534' :
                                  session.status === 'cancelled' ? '#991b1b' : '#92400e'
                         }}>
                           {session.status === 'completed' ? '✅ Terminé' :
                            session.status === 'cancelled' ? '❌ Annulé' : '⏳ En cours'}
                         </div>
                       </div>
                     </div>

                     {session.finalStats && (
                       <div style={{
                         display: 'grid',
                         gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                         gap: '12px',
                         marginTop: '16px'
                       }}>
                         <div style={{ textAlign: 'center' }}>
                           <div style={{
                             fontSize: '18px',
                             fontWeight: '700',
                             color: '#3b82f6'
                           }}>
                             {session.finalStats.countedProducts}
                           </div>
                           <div style={{
                             fontSize: '12px',
                             color: isDark ? '#94a3b8' : '#64748b'
                           }}>
                             Produits
                           </div>
                         </div>

                         <div style={{ textAlign: 'center' }}>
                           <div style={{
                             fontSize: '18px',
                             fontWeight: '700',
                             color: session.finalStats.discrepancies > 0 ? '#ef4444' : '#10b981'
                           }}>
                             {session.finalStats.discrepancies}
                           </div>
                           <div style={{
                             fontSize: '12px',
                             color: isDark ? '#94a3b8' : '#64748b'
                           }}>
                             Écarts
                           </div>
                         </div>

                         <div style={{ textAlign: 'center' }}>
                           <div style={{
                             fontSize: '18px',
                             fontWeight: '700',
                             color: session.finalStats.accuracy >= 95 ? '#10b981' : 
                                   session.finalStats.accuracy >= 85 ? '#f59e0b' : '#ef4444'
                           }}>
                             {session.finalStats.accuracy}%
                           </div>
                           <div style={{
                             fontSize: '12px',
                             color: isDark ? '#94a3b8' : '#64748b'
                           }}>
                             Précision
                           </div>
                         </div>

                         <div style={{ textAlign: 'center' }}>
                           <div style={{
                             fontSize: '14px',
                             fontWeight: '700',
                             color: session.finalStats.totalDiscrepancyValue >= 0 ? '#10b981' : '#ef4444'
                           }}>
                             {session.finalStats.totalDiscrepancyValue >= 0 ? '+' : ''}{session.finalStats.totalDiscrepancyValue.toLocaleString()} {appSettings?.currency || 'FCFA'}
                           </div>
                           <div style={{
                             fontSize: '12px',
                             color: isDark ? '#94a3b8' : '#64748b'
                           }}>
                             Impact
                           </div>
                         </div>
                       </div>
                     )}

                     {/* Détails étendus si sélectionné */}
                     {selectedSession?.id === session.id && session.discrepancies && (
                       <div style={{
                         marginTop: '20px',
                         paddingTop: '20px',
                         borderTop: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`
                       }}>
                         <h5 style={{
                           fontSize: '16px',
                           fontWeight: '600',
                           color: isDark ? '#f1f5f9' : '#0f172a',
                           marginBottom: '12px'
                         }}>
                           Détail des écarts ({session.discrepancies.length})
                         </h5>
                         
                         <div style={{
                           maxHeight: '300px',
                           overflowY: 'auto',
                           display: 'grid',
                           gap: '8px'
                         }}>
                           {session.discrepancies.map((item, index) => (
                             <div
                               key={index}
                               style={{
                                 display: 'flex',
                                 justifyContent: 'space-between',
                                 alignItems: 'center',
                                 padding: '12px',
                                 background: isDark ? '#475569' : 'white',
                                 borderRadius: '8px',
                                 fontSize: '14px'
                               }}
                             >
                               <div>
                                 <span style={{
                                   fontWeight: '600',
                                   color: isDark ? '#f1f5f9' : '#0f172a'
                                 }}>
                                   {item.productName}
                                 </span>
                                 {item.note && (
                                   <span style={{
                                     marginLeft: '8px',
                                     fontSize: '12px',
                                     color: isDark ? '#94a3b8' : '#64748b'
                                   }}>
                                     • {item.note}
                                   </span>
                                 )}
                               </div>
                               
                               <div style={{
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '12px'
                               }}>
                                 <span style={{
                                   color: isDark ? '#94a3b8' : '#64748b'
                                 }}>
                                   {item.currentStock} → {item.countedStock}
                                 </span>
                                 
                                 <span style={{
                                   fontWeight: '700',
                                   color: item.difference > 0 ? '#10b981' : '#ef4444'
                                 }}>
                                   {item.difference > 0 ? '+' : ''}{item.difference}
                                 </span>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             ) : (
               <div style={{
                 textAlign: 'center',
                 padding: '48px 24px',
                 background: 'var(--color-bg)',
                 borderRadius: '12px',
                 border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`
               }}>
                 <History size={64} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                 <h3 style={{
                   fontSize: '20px',
                   fontWeight: '600',
                   color: isDark ? '#f1f5f9' : '#0f172a',
                   margin: '0 0 8px 0'
                 }}>
                   Aucun inventaire trouvé
                 </h3>
                 <p style={{
                   color: isDark ? '#94a3b8' : '#64748b',
                   margin: '0 0 24px 0',
                   fontSize: '16px'
                 }}>
                   Commencez votre premier inventaire physique pour voir l'historique
                 </p>
                 <button
                   onClick={() => setActiveView('preparation')}
                   style={{
                     padding: '12px 24px',
                     background: 'linear-gradient(135deg, #10b981, #059669)',
                     color: 'white',
                     border: 'none',
                     borderRadius: '10px',
                     fontWeight: '600',
                     cursor: 'pointer',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '8px',
                     margin: '0 auto',
                     fontSize: '16px'
                   }}
                 >
                   <ClipboardList size={18} />
                   Créer un inventaire
                 </button>
               </div>
             )}
           </div>
         </div>
       )}
     </div>

     {/* Styles pour les animations */}
     <style>{`
       @keyframes pulse {
         0%, 100% { opacity: 1; }
         50% { opacity: 0.7; }
       }
       
       @keyframes shimmer {
         0% { transform: translateX(-100%); }
         100% { transform: translateX(100%); }
       }
       
       @keyframes flash {
         0% { background-color: transparent; }
         50% { background-color: rgba(16, 185, 129, 0.1); }
         100% { background-color: transparent; }
       }

       @keyframes slideIn {
         from { 
           opacity: 0; 
           transform: translateY(10px); 
         }
         to { 
           opacity: 1; 
           transform: translateY(0); 
         }
       }

       /* Responsive adjustments */
       @media (max-width: 768px) {
         .inventory-grid {
           grid-template-columns: 1fr !important;
         }
         
         .inventory-stats {
           grid-template-columns: repeat(2, 1fr) !important;
         }
       }
     `}</style>
   </div>
 );
};

export default PhysicalInventoryModule;
                             
