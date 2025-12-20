import React, { useState, useMemo } from 'react';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Calendar, 
  Filter, 
  Download,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Truck,
  ShoppingCart,
  User
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const InventoryHistoryModule = () => {
  const { salesHistory, appSettings, stores, currentStoreId } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'in', 'out', 'transfer'
  const [filterPeriod, setFilterPeriod] = useState('week'); // 'day', 'week', 'month', 'all'
  const [selectedStore, setSelectedStore] = useState(currentStoreId || 'all');

  const isDark = appSettings?.darkMode;

  // Simulation des mouvements de stock basés sur l'historique des ventes
  const stockMovements = useMemo(() => {
    const movements = [];

    // Ajouter les mouvements de vente (sorties)
    salesHistory.forEach(sale => {
      sale.items.forEach(item => {
        movements.push({
          id: `sale-${sale.id}-${item.id}`,
          date: sale.date,
          type: 'out',
          subType: 'sale',
          productId: item.id,
          productName: item.name,
          quantity: -item.quantity,
          storeId: currentStoreId,
          reason: `Vente #${sale.receiptNumber}`,
          reference: sale.receiptNumber,
          user: 'Caissier',
          icon: ShoppingCart,
          color: '#ef4444'
        });
      });
    });

    // Ajouter quelques mouvements d'exemple pour l'historique
    const exampleMovements = [
      {
        id: 'restock-1',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'in',
        subType: 'restock',
        productId: 1,
        productName: 'Coca-Cola 33cl',
        quantity: 50,
        storeId: currentStoreId,
        reason: 'Réapprovisionnement hebdomadaire',
        reference: 'REF-001',
        user: 'Manager',
        icon: ArrowUpCircle,
        color: '#059669'
      },
      {
        id: 'transfer-1',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'transfer',
        subType: 'transfer_in',
        productId: 2,
        productName: 'Pain de mie',
        quantity: 15,
        storeId: currentStoreId,
        reason: 'Transfert depuis Wend-Yam',
        reference: 'TRF-001',
        user: 'System',
        icon: Truck,
        color: '#3b82f6'
      },
      {
        id: 'adjustment-1',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'out',
        subType: 'adjustment',
        productId: 3,
        productName: 'Savon Lux',
        quantity: -2,
        storeId: currentStoreId,
        reason: 'Ajustement inventaire - produits endommagés',
        reference: 'ADJ-001',
        user: 'Manager',
        icon: ArrowDownCircle,
        color: '#f59e0b'
      },
      {
        id: 'return-1',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'in',
        subType: 'return',
        productId: 4,
        productName: 'Biscuits Oreo',
        quantity: 3,
        storeId: currentStoreId,
        reason: 'Retour client - produit non conforme',
        reference: 'RET-001',
        user: 'Caissier',
        icon: RefreshCw,
        color: '#8b5cf6'
      }
    ];

    movements.push(...exampleMovements);

    // Trier par date décroissante
    return movements.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [salesHistory, currentStoreId]);

  // Filtrer les mouvements
  const filteredMovements = useMemo(() => {
    let filtered = stockMovements;

    // Filtre par magasin
    if (selectedStore !== 'all') {
      filtered = filtered.filter(movement => movement.storeId === selectedStore);
    }

    // Filtre par type
    if (filterType !== 'all') {
      filtered = filtered.filter(movement => movement.type === filterType);
    }

    // Filtre par période
    const now = new Date();
    const periodStart = new Date();
    
    switch (filterPeriod) {
      case 'day':
        periodStart.setDate(now.getDate() - 1);
        break;
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      default:
        periodStart.setFullYear(2020); // Afficher tout
    }

    if (filterPeriod !== 'all') {
      filtered = filtered.filter(movement => new Date(movement.date) >= periodStart);
    }

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(movement =>
        movement.productName.toLowerCase().includes(query) ||
        movement.reason.toLowerCase().includes(query) ||
        movement.reference.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [stockMovements, selectedStore, filterType, filterPeriod, searchQuery]);

  // Statistiques des mouvements
  const stats = useMemo(() => {
    const totalIn = filteredMovements
      .filter(m => m.quantity > 0)
      .reduce((sum, m) => sum + m.quantity, 0);
    
    const totalOut = filteredMovements
      .filter(m => m.quantity < 0)
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

    const netMovement = totalIn - totalOut;

    return {
      totalMovements: filteredMovements.length,
      totalIn,
      totalOut,
      netMovement
    };
  }, [filteredMovements]);

  // Export des données - CORRIGÉ
  const handleExport = () => {
    try {
      // Créer les en-têtes CSV
      const headers = ['Date', 'Type', 'Produit', 'Quantité', 'Motif', 'Référence', 'Utilisateur'];
      
      // Créer les lignes de données
      const csvData = filteredMovements.map(movement => [
        new Date(movement.date).toLocaleDateString('fr-FR'),
        movement.type === 'in' ? 'Entrée' : movement.type === 'out' ? 'Sortie' : 'Transfert',
        `"${movement.productName.replace(/"/g, '""')}"`, // Échapper les guillemets
        movement.quantity,
        `"${movement.reason.replace(/"/g, '""')}"`, // Échapper les guillemets
        movement.reference,
        movement.user
      ]);

      // Combiner headers et données
      const allRows = [headers, ...csvData];
      
      // Créer le contenu CSV
      const csvContent = allRows.map(row => row.join(',')).join('\n');
      
      // Créer le BOM UTF-8 pour l'encoding correct
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;
      
      // Créer le blob et télécharger
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `mouvements_stock_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      // Notification de succès
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
      toast.textContent = `Export réussi! ${filteredMovements.length} mouvements exportés.`;
      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      
      // Notification d'erreur
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
      toast.textContent = 'Erreur lors de l\'export CSV';
      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
    }
  };

  return (
    <div style={{
      padding: '24px',
      backgroundColor: isDark ? '#1a202c' : '#f9fafb',
      minHeight: '100vh'
    }}>
      {/* En-tête */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <History style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: 'bold',
              color: isDark ? '#f7fafc' : '#1f2937'
            }}>
              Historique des Mouvements
            </h1>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '16px',
              color: isDark ? '#a0aec0' : '#6b7280'
            }}>
              Suivi complet de tous les mouvements de stock
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '20px',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Entrées</h3>
              <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                +{stats.totalIn}
              </p>
            </div>
            <TrendingUp style={{ width: '32px', height: '32px', opacity: 0.8 }} />
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          padding: '20px',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Sorties</h3>
              <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                -{stats.totalOut}
              </p>
            </div>
            <TrendingDown style={{ width: '32px', height: '32px', opacity: 0.8 }} />
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          padding: '20px',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Mouvement Net</h3>
              <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                {stats.netMovement > 0 ? '+' : ''}{stats.netMovement}
              </p>
            </div>
            <Package style={{ width: '32px', height: '32px', opacity: 0.8 }} />
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          padding: '20px',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Total Mouvements</h3>
              <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                {stats.totalMovements}
              </p>
            </div>
            <History style={{ width: '32px', height: '32px', opacity: 0.8 }} />
          </div>
        </div>
      </div>

      {/* Filtres et Actions */}
      <div style={{
        backgroundColor: isDark ? '#2d3748' : 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          {/* Recherche */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
              fontWeight: '500',
              color: isDark ? '#e2e8f0' : '#374151'
            }}>
              Rechercher
            </label>
            <div style={{ position: 'relative' }}>
              <Search style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder="Produit, motif, référence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: isDark ? '#4a5568' : 'white',
                  color: isDark ? '#e2e8f0' : '#374151'
                }}
              />
            </div>
          </div>

          {/* Type de mouvement */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
              fontWeight: '500',
              color: isDark ? '#e2e8f0' : '#374151'
            }}>
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: isDark ? '#4a5568' : 'white',
                color: isDark ? '#e2e8f0' : '#374151'
              }}
            >
              <option value="all">Tous les types</option>
              <option value="in">Entrées</option>
              <option value="out">Sorties</option>
              <option value="transfer">Transferts</option>
            </select>
          </div>

          {/* Période */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
              fontWeight: '500',
              color: isDark ? '#e2e8f0' : '#374151'
            }}>
              Période
            </label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: isDark ? '#4a5568' : 'white',
                color: isDark ? '#e2e8f0' : '#374151'
              }}
            >
              <option value="day">Dernières 24h</option>
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
              <option value="all">Toute la période</option>
            </select>
          </div>

          {/* Magasin */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
              fontWeight: '500',
              color: isDark ? '#e2e8f0' : '#374151'
            }}>
              Magasin
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: isDark ? '#4a5568' : 'white',
                color: isDark ? '#e2e8f0' : '#374151'
              }}
            >
              <option value="all">Tous les magasins</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>

          {/* Export */}
          <div>
            <button
              onClick={handleExport}
              disabled={filteredMovements.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: filteredMovements.length > 0 ? '#059669' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: filteredMovements.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <Download style={{ width: '16px', height: '16px' }} />
              Export CSV ({filteredMovements.length})
            </button>
          </div>
        </div>
      </div>

      {/* Liste des mouvements */}
      <div style={{
        backgroundColor: isDark ? '#2d3748' : 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {filteredMovements.length > 0 ? (
          <div style={{ maxHeight: '600px', overflow: 'auto' }}>
            {filteredMovements.map((movement, index) => {
              const Icon = movement.icon;
              return (
                <div
                  key={movement.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 24px',
                    borderBottom: index < filteredMovements.length - 1 ? 
                      `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}` : 'none',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? '#4a5568' : '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Icône */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: `${movement.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px'
                  }}>
                    <Icon style={{ width: '20px', height: '20px', color: movement.color }} />
                  </div>

                  {/* Informations principales */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                      <div>
                        <h4 style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: '600',
                          color: isDark ? '#f7fafc' : '#1f2937'
                        }}>
                          {movement.productName}
                        </h4>
                        <p style={{
                          margin: '2px 0',
                          fontSize: '14px',
                          color: isDark ? '#a0aec0' : '#6b7280'
                        }}>
                          {movement.reason}
                        </p>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: movement.quantity > 0 ? '#059669' : '#dc2626'
                        }}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: isDark ? '#a0aec0' : '#6b7280'
                        }}>
                          {new Date(movement.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>

                    {/* Métadonnées */}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: isDark ? '#a0aec0' : '#6b7280' }}>
                      <span>Réf: {movement.reference}</span>
                      <span>Par: {movement.user}</span>
                      <span>{new Date(movement.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: isDark ? '#a0aec0' : '#6b7280'
          }}>
            <History style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
              Aucun mouvement trouvé
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Aucun mouvement ne correspond aux filtres sélectionnés
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryHistoryModule;
