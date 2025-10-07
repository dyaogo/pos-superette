import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../src/contexts/AppContext';
import { 
  ClipboardList, Save, AlertTriangle, Check, Search, 
  Scan, BarChart3, History, Plus, Minus, Calculator,
  Eye, EyeOff, Zap, RefreshCw, PlayCircle, StopCircle
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
  const finalizeSession = async () => {
    if (!activeSession) return;

    const discrepancies = productCatalog.filter(product => {
      const counted = counts[product.id];
      return counted !== undefined && counted !== product.stock;
    });

    if (discrepancies.length === 0) {
      alert('Aucun écart détecté !');
      return;
    }

    const confirmed = confirm(
      `${discrepancies.length} écart(s) détecté(s).\n\nAppliquer les ajustements de stock ?`
    );

    if (!confirmed) return;

    try {
      // Mettre à jour les stocks
      for (const product of discrepancies) {
        const countedQty = counts[product.id];
        await fetch(`/api/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: countedQty })
        });
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

      alert('Inventaire finalisé avec succès !');
      setActiveSession(null);
      setCounts({});
      loadSessions();
    } catch (error) {
      alert('Erreur : ' + error.message);
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
                  <div>
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}