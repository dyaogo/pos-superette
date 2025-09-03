import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Calendar, Download, Eye, Receipt, 
  TrendingUp, DollarSign, ShoppingCart, Clock, User
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const SalesHistoryModule = () => {
  const { salesHistory, customers, appSettings, globalProducts } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [statusFilter, setStatusFilter] = useState('all'); // all, completed, refunded
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const isDark = appSettings.darkMode;

  // Fonction pour formater les nombres avec espaces
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Filtrage des ventes
  const filteredSales = useMemo(() => {
    let filtered = [...(salesHistory || [])];

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(sale => {
        const customer = customers.find(c => c.id === sale.customerId);
        const customerName = customer?.name || 'Client Comptant';
        const receiptNumber = sale.receiptNumber || '';
        
        return (
          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.items?.some(item => 
            item.name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      });
    }

    // Filtre par date
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate;

      switch(dateFilter) {
        case 'today':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filtered = filtered.filter(sale => new Date(sale.date) >= startDate);
      }
    }

    // Tri par date (plus récent en premier)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [salesHistory, customers, searchTerm, dateFilter, statusFilter]);

  // Statistiques des ventes filtrées
  const stats = useMemo(() => {
    const total = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const count = filteredSales.length;
    const averageTicket = count > 0 ? Math.round(total / count) : 0;
    const uniqueCustomers = new Set(filteredSales.map(sale => sale.customerId)).size;

    return {
      totalRevenue: total,
      salesCount: count,
      averageTicket,
      uniqueCustomers
    };
  }, [filteredSales]);

  // Composant de statistiques rapides
  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div style={{
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          background: `${color}15`,
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{
          fontSize: '14px',
          fontWeight: '500',
          color: isDark ? '#a0aec0' : '#64748b'
        }}>
          {title}
        </span>
      </div>
      <div style={{
        fontSize: '24px',
        fontWeight: '700',
        color: isDark ? '#f7fafc' : '#1a202c'
      }}>
        {typeof value === 'number' ? formatNumber(Math.round(value)) : value}
      </div>
    </div>
  );

  // Modal de détails d'une vente
  const SaleDetailsModal = ({ sale, onClose }) => {
    if (!sale) return null;

    const customer = customers.find(c => c.id === sale.customerId);
    const customerName = customer?.name || 'Client Comptant';

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
          borderRadius: '16px',
          padding: '24px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
          }}>
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: isDark ? '#f7fafc' : '#1a202c',
                margin: '0 0 4px 0'
              }}>
                Vente #{sale.receiptNumber || sale.id}
              </h2>
              <p style={{
                fontSize: '14px',
                color: isDark ? '#a0aec0' : '#64748b',
                margin: 0
              }}>
                {new Date(sale.date).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: isDark ? '#a0aec0' : '#64748b',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>

          {/* Infos client */}
          <div style={{
            background: isDark ? '#374151' : '#f8fafc',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: isDark ? '#f7fafc' : '#1a202c',
              margin: '0 0 8px 0'
            }}>
              Client
            </h3>
            <p style={{
              fontSize: '14px',
              color: isDark ? '#a0aec0' : '#64748b',
              margin: 0
            }}>
              {customerName}
            </p>
          </div>

          {/* Articles */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: isDark ? '#f7fafc' : '#1a202c',
              margin: '0 0 12px 0'
            }}>
              Articles vendus
            </h3>
            <div style={{
              border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {sale.items?.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: index < sale.items.length - 1 ? `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}` : 'none',
                  background: isDark ? '#374151' : 'white'
                }}>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: isDark ? '#f7fafc' : '#1a202c'
                    }}>
                      {item.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: isDark ? '#a0aec0' : '#64748b'
                    }}>
                      {formatNumber(item.price)} FCFA × {item.quantity}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#10b981'
                  }}>
                    {formatNumber(item.price * item.quantity)} FCFA
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total et méthode de paiement */}
          <div style={{
            background: isDark ? '#374151' : '#f0f9f4',
            borderRadius: '8px',
            padding: '16px',
            border: `1px solid ${isDark ? '#4a5568' : '#d1f7db'}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                color: isDark ? '#f7fafc' : '#1a202c'
              }}>
                Total
              </span>
              <span style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#10b981'
              }}>
                {formatNumber(sale.total)} FCFA
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '14px',
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                Méthode de paiement
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: isDark ? '#f7fafc' : '#1a202c'
              }}>
                {sale.paymentMethod === 'cash' ? 'Espèces' : 
                 sale.paymentMethod === 'card' ? 'Carte' : 
                 sale.paymentMethod === 'credit' ? 'Crédit' : 'Autre'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      padding: '24px',
      background: isDark ? '#1a202c' : '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: isDark ? '#f7fafc' : '#1a202c',
            margin: '0 0 8px 0'
          }}>
            Historique des Ventes
          </h1>
          <p style={{
            fontSize: '16px',
            color: isDark ? '#a0aec0' : '#64748b',
            margin: 0
          }}>
            Consultez et analysez toutes vos transactions
          </p>
        </div>
        
        <button
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onClick={() => {
            // Fonction d'export (à implémenter)
            console.log('Export des ventes');
          }}
        >
          <Download size={16} />
          Exporter
        </button>
      </div>

      {/* Statistiques rapides */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <StatCard 
          title="Chiffre d'Affaires"
          value={`${formatNumber(stats.totalRevenue)} FCFA`}
          icon={DollarSign}
          color="#10b981"
        />
        <StatCard 
          title="Nombre de Ventes"
          value={stats.salesCount}
          icon={ShoppingCart}
          color="#3b82f6"
        />
        <StatCard 
          title="Ticket Moyen"
          value={`${formatNumber(stats.averageTicket)} FCFA`}
          icon={TrendingUp}
          color="#8b5cf6"
        />
        <StatCard 
          title="Clients Uniques"
          value={stats.uniqueCustomers}
          icon={User}
          color="#f59e0b"
        />
      </div>

      {/* Filtres */}
      <div style={{
        background: isDark ? '#2d3748' : 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
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
              fontSize: '14px',
              fontWeight: '500',
              color: isDark ? '#f7fafc' : '#1a202c',
              marginBottom: '6px',
              display: 'block'
            }}>
              Rechercher
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Client, ticket, produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  background: isDark ? '#374151' : 'white',
                  color: isDark ? '#f7fafc' : '#1a202c',
                  fontSize: '14px'
                }}
              />
              <Search 
                size={16} 
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: isDark ? '#a0aec0' : '#64748b'
                }}
              />
            </div>
          </div>

          {/* Filtre de date */}
          <div>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: isDark ? '#f7fafc' : '#1a202c',
              marginBottom: '6px',
              display: 'block'
            }}>
              Période
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '6px',
                background: isDark ? '#374151' : 'white',
                color: isDark ? '#f7fafc' : '#1a202c',
                fontSize: '14px'
              }}
            >
              <option value="all">Toutes les périodes</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des ventes */}
      <div style={{
        background: isDark ? '#2d3748' : 'white',
        borderRadius: '12px',
        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
        overflow: 'hidden'
      }}>
        {/* Header du tableau */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 200px 150px 150px 120px 80px',
          gap: '16px',
          padding: '16px 20px',
          background: isDark ? '#374151' : '#f8fafc',
          borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
          fontSize: '14px',
          fontWeight: '600',
          color: isDark ? '#f7fafc' : '#1a202c'
        }}>
          <div>Client</div>
          <div>Date & Heure</div>
          <div>Articles</div>
          <div>Paiement</div>
          <div>Total</div>
          <div>Actions</div>
        </div>

        {/* Lignes de ventes */}
        {filteredSales.length > 0 ? (
          filteredSales.map((sale, index) => {
            const customer = customers.find(c => c.id === sale.customerId);
            const customerName = customer?.name || 'Client Comptant';
            
            return (
              <div 
                key={sale.id || index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 200px 150px 150px 120px 80px',
                  gap: '16px',
                  padding: '16px 20px',
                  borderBottom: index < filteredSales.length - 1 ? `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}` : 'none',
                  fontSize: '14px'
                }}
              >
                <div>
                  <div style={{
                    fontWeight: '500',
                    color: isDark ? '#f7fafc' : '#1a202c',
                    marginBottom: '2px'
                  }}>
                    {customerName}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: isDark ? '#a0aec0' : '#64748b'
                  }}>
                    #{sale.receiptNumber || sale.id}
                  </div>
                </div>
                
                <div style={{
                  color: isDark ? '#a0aec0' : '#64748b'
                }}>
                  {new Date(sale.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                
                <div style={{
                  color: isDark ? '#a0aec0' : '#64748b'
                }}>
                  {sale.items?.length || 0} article(s)
                </div>
                
                <div style={{
                  color: isDark ? '#f7fafc' : '#1a202c'
                }}>
                  {sale.paymentMethod === 'cash' ? 'Espèces' : 
                   sale.paymentMethod === 'card' ? 'Carte' : 
                   sale.paymentMethod === 'credit' ? 'Crédit' : 'Autre'}
                </div>
                
                <div style={{
                  fontWeight: '600',
                  color: '#10b981'
                }}>
                  {formatNumber(sale.total)} FCFA
                </div>
                
                <div>
                  <button
                    onClick={() => {
                      setSelectedSale(sale);
                      setShowDetails(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6366f1',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                    title="Voir détails"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: isDark ? '#a0aec0' : '#64748b'
          }}>
            <Receipt size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>Aucune vente trouvée pour les critères sélectionnés</p>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showDetails && (
        <SaleDetailsModal 
          sale={selectedSale} 
          onClose={() => {
            setShowDetails(false);
            setSelectedSale(null);
          }}
        />
      )}
    </div>
  );
};

export default SalesHistoryModule;
