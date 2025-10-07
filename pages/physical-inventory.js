import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../src/contexts/AppContext';

import { 
  ClipboardList, Save, AlertTriangle, Check, Search, 
  Scan, BarChart3, History, Plus, Minus, Calculator,
  Eye, EyeOff, Zap, RefreshCw, PlayCircle, StopCircle, Download
} from 'lucide-react';

export default function PhysicalInventoryPage() {
  const { productCatalog, loading } = useApp();
  
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [counts, setCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyDiscrepancies, setShowOnlyDiscrepancies] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scanBuffer, setScanBuffer] = useState('');
  const [lastScanTime, setLastScanTime] = useState(Date.now());
  const [selectedSessionForView, setSelectedSessionForView] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Charger les sessions
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/inventory/sessions');
      const data = await res.json();
      setSessions(data);
      
      // Charger la session active si elle existe
      const active = data.find(s => s.status === 'in_progress');
      if (active) {
        setActiveSession(active);
        loadSessionCounts(active.id);
      }
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
    }
  };

  const loadSessionCounts = async (sessionId) => {
    try {
      const res = await fetch(`/api/inventory/sessions/${sessionId}`);
      const session = await res.json();
      
      const countsMap = {};
      session.counts?.forEach(count => {
        countsMap[count.productId] = count.countedQty;
      });
      setCounts(countsMap);
    } catch (error) {
      console.error('Erreur chargement comptages:', error);
    }
  };

  // Démarrer une nouvelle session
  const startNewSession = async () => {
    const name = prompt('Nom de la session d\'inventaire :');
    if (!name) return;

    try {
      const res = await fetch('/api/inventory/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type: 'physical',
          startedBy: 'Admin' // À remplacer par l'utilisateur connecté
        })
      });

      if (res.ok) {
        const session = await res.json();
        setActiveSession(session);
        setCounts({});
        alert('Session d\'inventaire démarrée !');
      }
    } catch (error) {
      alert('Erreur : ' + error.message);
    }
  };

  // Mettre à jour un comptage
  const updateCount = async (productId, quantity) => {
    if (!activeSession) {
      alert('Aucune session active');
      return;
    }

    const product = productCatalog.find(p => p.id === productId);
    const expectedQty = product?.stock || 0;
    const countedQty = parseInt(quantity) || 0;

    setCounts(prev => ({ ...prev, [productId]: countedQty }));

    // Sauvegarder dans la base
    try {
      await fetch('/api/inventory/counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          productId,
          expectedQty,
          countedQty,
          countedBy: 'Admin'
        })
      });
    } catch (error) {
      console.error('Erreur sauvegarde comptage:', error);
    }
  };

  // Scanner de code-barres
  useEffect(() => {
    if (!scanMode) return;

    const handleKeyPress = (e) => {
      const now = Date.now();
      
      // Reset si plus de 100ms entre les touches
      if (now - lastScanTime > 100) {
        setScanBuffer('');
      }
      
      setLastScanTime(now);
      
      if (e.key === 'Enter' && scanBuffer.length > 0) {
        e.preventDefault();
        processScan(scanBuffer);
        setScanBuffer('');
      } else if (e.key.length === 1) {
        setScanBuffer(prev => prev + e.key);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [scanMode, scanBuffer, lastScanTime]);

  const processScan = useCallback((barcode) => {
    const product = productCatalog.find(p => p.barcode === barcode);
    
    if (product) {
      const currentCount = counts[product.id] || 0;
      updateCount(product.id, currentCount + 1);
      
      // Feedback visuel
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
      
      // Scroll vers le produit
      const element = document.getElementById(`product-${product.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.background = 'var(--color-success)';
        element.style.opacity = '0.3';
        setTimeout(() => {
          element.style.background = '';
          element.style.opacity = '1';
        }, 500);
      }
    } else {
      alert(`Produit non trouvé : ${barcode}`);
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  }, [productCatalog, counts]);

  // Finaliser la session
// Finaliser la session - VERSION CORRIGÉE
const finalizeSession = async () => {
  if (!activeSession) return;

  const discrepancies = productCatalog.filter(product => {
    const counted = counts[product.id];
    return counted !== undefined && counted !== product.stock;
  });

  if (discrepancies.length === 0) {
    alert('Aucun écart détecté ! Inventaire terminé.');
    
    // Clôturer quand même la session
    await fetch(`/api/inventory/sessions/${activeSession.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        completedAt: new Date().toISOString()
      })
    });
    
    setActiveSession(null);
    setCounts({});
    loadSessions();
    return;
  }

  const message = `${discrepancies.length} écart(s) détecté(s):\n\n` +
    discrepancies.map(p => {
      const diff = counts[p.id] - p.stock;
      return `• ${p.name}: ${p.stock} → ${counts[p.id]} (${diff > 0 ? '+' : ''}${diff})`;
    }).slice(0, 5).join('\n') +
    (discrepancies.length > 5 ? `\n... et ${discrepancies.length - 5} autre(s)` : '') +
    '\n\nAppliquer les ajustements de stock ?';

  const confirmed = confirm(message);
  if (!confirmed) return;

  try {
    let successCount = 0;
    let errorCount = 0;

    // Mettre à jour les stocks UN PAR UN
    for (const product of discrepancies) {
      const newStock = counts[product.id];
      
      try {
        const response = await fetch(`/api/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: newStock })
        });

        if (response.ok) {
          successCount++;
          console.log(`✅ Stock mis à jour pour ${product.name}: ${newStock}`);
          
          // Créer un ajustement de stock
          await fetch('/api/inventory/adjustments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: activeSession.id,
              productId: product.id,
              quantity: newStock - product.stock,
              reason: 'Inventaire physique',
              type: 'adjustment'
            })
          });
        } else {
          errorCount++;
          console.error(`❌ Erreur mise à jour ${product.name}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Erreur mise à jour ${product.name}:`, error);
      }
    }

    // Clôturer la session
    await fetch(`/api/inventory/sessions/${activeSession.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        completedAt: new Date().toISOString()
      })
    });

    alert(
      `Inventaire finalisé !\n\n` +
      `✅ ${successCount} produit(s) ajusté(s)\n` +
      (errorCount > 0 ? `❌ ${errorCount} erreur(s)` : '')
    );

    // Recharger les données
    window.location.reload();
  } catch (error) {
    alert('Erreur lors de la finalisation : ' + error.message);
  }
};

// Consulter une session passée
const viewSession = async (session) => {
  try {
    const res = await fetch(`/api/inventory/sessions/${session.id}`);
    const fullSession = await res.json();
    
    // Afficher un modal avec les détails
    setSelectedSessionForView(fullSession);
    setShowSessionModal(true);
  } catch (error) {
    alert('Erreur chargement session : ' + error.message);
  }
};

// Exporter une session en Excel
const exportSessionToExcel = async (session) => {
  try {
    const XLSX = await import('xlsx');
    
    // Récupérer les détails de la session
    const res = await fetch(`/api/inventory/sessions/${session.id}`);
    const fullSession = await res.json();
    
    // Préparer les données
    const data = fullSession.counts.map(count => {
      const product = productCatalog.find(p => p.id === count.productId);
      return {
        'Produit': product?.name || 'Inconnu',
        'Catégorie': product?.category || '-',
        'Code-barres': product?.barcode || '-',
        'Stock Attendu': count.expectedQty,
        'Stock Compté': count.countedQty,
        'Écart': count.difference,
        'Notes': count.notes || '-',
        'Compté par': count.countedBy || '-',
        'Date': new Date(count.countedAt).toLocaleString('fr-FR')
      };
    });

    // Créer le workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Ajuster les largeurs de colonnes
    worksheet['!cols'] = [
      { wch: 30 }, // Produit
      { wch: 15 }, // Catégorie
      { wch: 15 }, // Code-barres
      { wch: 12 }, // Attendu
      { wch: 12 }, // Compté
      { wch: 10 }, // Écart
      { wch: 30 }, // Notes
      { wch: 15 }, // Compté par
      { wch: 20 }  // Date
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventaire');

    // Ajouter une feuille de résumé
    const summary = [
      ['Session', session.name],
      ['Type', session.type],
      ['Démarrée le', new Date(session.startedAt).toLocaleString('fr-FR')],
      ['Terminée le', session.completedAt ? new Date(session.completedAt).toLocaleString('fr-FR') : '-'],
      ['Statut', session.status],
      [''],
      ['Statistiques', ''],
      ['Total produits comptés', fullSession.counts.length],
      ['Écarts détectés', fullSession.counts.filter(c => c.difference !== 0).length],
      ['Ajustements appliqués', fullSession.adjustments?.length || 0]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

    // Télécharger
    const fileName = `inventaire_${session.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    alert('Export Excel réussi !');
  } catch (error) {
    alert('Erreur export : ' + error.message);
  }
};

  // Filtrer les produits
  const filteredProducts = productCatalog.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchQuery));
    
    if (showOnlyDiscrepancies) {
      const counted = counts[product.id];
      return matchesSearch && counted !== undefined && counted !== product.stock;
    }
    
    return matchesSearch;
  });

  // Statistiques
  const totalCounted = Object.keys(counts).length;
  const totalProducts = productCatalog.length;
  const progress = totalProducts > 0 ? (totalCounted / totalProducts * 100).toFixed(1) : 0;
  
  const discrepanciesCount = productCatalog.filter(product => {
    const counted = counts[product.id];
    return counted !== undefined && counted !== product.stock;
  }).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList size={32} />
            Inventaire Physique
          </h1>
          {activeSession && (
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              Session : <strong>{activeSession.name}</strong>
            </p>
          )}
        </div>

        {!activeSession ? (
          <button
            onClick={startNewSession}
            style={{
              padding: '12px 24px',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px'
            }}
          >
            <PlayCircle size={20} />
            Nouvelle Session
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setScanMode(!scanMode)}
              style={{
                padding: '12px 24px',
                background: scanMode ? 'var(--color-success)' : 'var(--color-surface)',
                color: scanMode ? 'white' : 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Scan size={20} />
              {scanMode ? 'Mode Scan Actif' : 'Activer Scanner'}
            </button>
            
            <button
              onClick={finalizeSession}
              style={{
                padding: '12px 24px',
                background: 'var(--color-success)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <StopCircle size={20} />
              Finaliser
            </button>
          </div>
        )}
      </div>

      {activeSession && (
        <>
          {/* Barre de progression */}
          <div style={{ 
            background: 'var(--color-surface)', 
            padding: '20px', 
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Progression</span>
              <span style={{ fontWeight: 'bold' }}>{totalCounted} / {totalProducts} produits</span>
            </div>
            
            <div style={{
              height: '20px',
              background: 'var(--color-border)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--color-primary)',
                transition: 'width 0.3s'
              }} />
            </div>
            
            <div style={{ marginTop: '10px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {discrepanciesCount} écart(s) détecté(s)
            </div>
          </div>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={20} 
                style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} 
              />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 45px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            <button
              onClick={() => setShowOnlyDiscrepancies(!showOnlyDiscrepancies)}
              style={{
                padding: '12px 20px',
                background: showOnlyDiscrepancies ? 'var(--color-warning)' : 'var(--color-surface)',
                color: showOnlyDiscrepancies ? 'white' : 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {showOnlyDiscrepancies ? <Eye size={20} /> : <EyeOff size={20} />}
              {showOnlyDiscrepancies ? 'Écarts uniquement' : 'Tous les produits'}
            </button>
          </div>

          {/* Liste des produits */}
          <div style={{ 
            background: 'var(--color-surface)', 
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            {filteredProducts.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Aucun produit trouvé
              </div>
            ) : (
              filteredProducts.map(product => {
                const counted = counts[product.id];
                const expected = product.stock || 0;
                const difference = counted !== undefined ? counted - expected : 0;
                const hasDiscrepancy = counted !== undefined && counted !== expected;

                return (
                  <div
                    key={product.id}
                    id={`product-${product.id}`}
                    style={{
                      padding: '20px',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      gap: '20px',
                      alignItems: 'center',
                      background: hasDiscrepancy ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        {product.barcode && `Code: ${product.barcode}`}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                        Attendu
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {expected}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => updateCount(product.id, Math.max(0, (counted || 0) - 1))}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-surface)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Minus size={16} />
                      </button>

                      <input
                        type="number"
                        value={counted !== undefined ? counted : ''}
                        onChange={(e) => updateCount(product.id, e.target.value)}
                        placeholder="0"
                        style={{
                          width: '80px',
                          padding: '8px',
                          textAlign: 'center',
                          border: '2px solid var(--color-border)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          background: 'var(--color-surface)',
                          color: 'var(--color-text-primary)'
                        }}
                      />

                      <button
                        onClick={() => updateCount(product.id, (counted || 0) + 1)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-surface)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      {counted !== undefined && (
                        <>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                            Écart
                          </div>
                          <div style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: difference > 0 ? 'var(--color-success)' : difference < 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)'
                          }}>
                            {difference > 0 ? '+' : ''}{difference}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Historique des sessions */}
{!activeSession && sessions.length > 0 && (
  <div style={{ marginTop: '30px' }}>
    <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <History size={24} />
      Historique des sessions
    </h2>

    <div style={{ display: 'grid', gap: '15px' }}>
      {sessions.map(session => (
        <div
          key={session.id}
          style={{
            background: 'var(--color-surface)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--color-border)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 8px 0' }}>{session.name}</h3>
              <p style={{ margin: '0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Démarrée le {new Date(session.startedAt).toLocaleString('fr-FR')}
              </p>
              {session.completedAt && (
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  Terminée le {new Date(session.completedAt).toLocaleString('fr-FR')}
                </p>
              )}
            </div>

            <span style={{
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              background: 
                session.status === 'completed' ? 'var(--color-success)' :
                session.status === 'in_progress' ? 'var(--color-primary)' : 'var(--color-danger)',
              color: 'white'
            }}>
              {session.status === 'completed' ? 'Terminée' :
               session.status === 'in_progress' ? 'En cours' : 'Annulée'}
            </span>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '20px', fontSize: '14px' }}>
            <span>
              <strong>{session.counts?.length || 0}</strong> produits comptés
            </span>
            <span>
              <strong>{session.adjustments?.length || 0}</strong> ajustements
            </span>
          </div>

          {/* NOUVEAUX BOUTONS */}
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
            <button
              onClick={() => viewSession(session)}
              style={{
                padding: '8px 16px',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}
            >
              <Eye size={16} />
              Consulter
            </button>

            <button
              onClick={() => exportSessionToExcel(session)}
              style={{
                padding: '8px 16px',
                background: 'var(--color-success)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}
            >
              <Download size={16} />
              Exporter Excel
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{/* Modal de consultation */}
{showSessionModal && selectedSessionForView && (
  <div
    onClick={() => setShowSessionModal(false)}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'var(--color-surface)',
        borderRadius: '12px',
        padding: '30px',
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>{selectedSessionForView.name}</h2>
          <p style={{ margin: '8px 0 0 0', color: 'var(--color-text-secondary)' }}>
            {new Date(selectedSessionForView.startedAt).toLocaleString('fr-FR')}
          </p>
        </div>
        <button
          onClick={() => setShowSessionModal(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Statistiques */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          background: 'var(--color-bg)', 
          padding: '15px', 
          borderRadius: '8px' 
        }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Produits comptés</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            {selectedSessionForView.counts?.length || 0}
          </div>
        </div>

        <div style={{ 
          background: 'var(--color-bg)', 
          padding: '15px', 
          borderRadius: '8px' 
        }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Écarts détectés</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-danger)' }}>
            {selectedSessionForView.counts?.filter(c => c.difference !== 0).length || 0}
          </div>
        </div>

        <div style={{ 
          background: 'var(--color-bg)', 
          padding: '15px', 
          borderRadius: '8px' 
        }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Ajustements</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-success)' }}>
            {selectedSessionForView.adjustments?.length || 0}
          </div>
        </div>
      </div>

      {/* Liste des comptages */}
      <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Détails des comptages</h3>
      <div style={{ 
        background: 'var(--color-bg)', 
        borderRadius: '8px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 1 }}>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Produit</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Attendu</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Compté</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Écart</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {selectedSessionForView.counts?.map(count => {
              const product = productCatalog.find(p => p.id === count.productId);
              return (
                <tr 
                  key={count.id}
                  style={{ 
                    borderBottom: '1px solid var(--color-border)',
                    background: count.difference !== 0 ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: '500' }}>{product?.name || 'Produit inconnu'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {product?.barcode}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {count.expectedQty}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                    {count.countedQty}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: count.difference > 0 ? 'var(--color-success)' : 
                           count.difference < 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)'
                  }}>
                    {count.difference > 0 ? '+' : ''}{count.difference}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                    {count.notes || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => exportSessionToExcel(selectedSessionForView)}
          style={{
            padding: '12px 24px',
            background: 'var(--color-success)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Download size={20} />
          Exporter en Excel
        </button>

        <button
          onClick={() => setShowSessionModal(false)}
          style={{
            padding: '12px 24px',
            background: 'var(--color-border)',
            color: 'var(--color-text-primary)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}