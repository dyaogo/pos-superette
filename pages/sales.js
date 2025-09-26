import { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Eye, Download, TrendingUp } from 'lucide-react';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [dateFilter, setDateFilter] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Pour l'instant, données de démo
    const demoSales = [
      {
        id: 1,
        receiptNumber: 'REC-001',
        date: new Date().toISOString(),
        total: 15000,
        paymentMethod: 'cash',
        items: 3,
        cashier: 'Admin'
      },
      {
        id: 2,
        receiptNumber: 'REC-002',
        date: new Date(Date.now() - 3600000).toISOString(),
        total: 8500,
        paymentMethod: 'mobile',
        items: 2,
        cashier: 'Admin'
      },
      {
        id: 3,
        receiptNumber: 'REC-003',
        date: new Date(Date.now() - 7200000).toISOString(),
        total: 22000,
        paymentMethod: 'card',
        items: 5,
        cashier: 'Admin'
      }
    ];
    
    setSales(demoSales);
    setFilteredSales(demoSales);
  }, []);

  const getPaymentBadgeColor = (method) => {
    switch(method) {
      case 'cash': return '#10b981';
      case 'card': return '#3b82f6';
      case 'mobile': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getTotalStats = () => {
    return {
      count: filteredSales.length,
      total: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
      average: filteredSales.length > 0 
        ? Math.round(filteredSales.reduce((sum, sale) => sum + sale.total, 0) / filteredSales.length)
        : 0
    };
  };

  const stats = getTotalStats();

  return (
    <div style={{ padding: '30px' }}>
      <h1>Historique des Ventes</h1>

      {/* Statistiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #3b82f6'
        }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Nombre de ventes</p>
          <h2 style={{ margin: '10px 0', color: '#1f2937' }}>{stats.count}</h2>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #10b981'
        }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Total des ventes</p>
          <h2 style={{ margin: '10px 0', color: '#1f2937' }}>{stats.total.toLocaleString()} FCFA</h2>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #8b5cf6'
        }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Ticket moyen</p>
          <h2 style={{ margin: '10px 0', color: '#1f2937' }}>{stats.average.toLocaleString()} FCFA</h2>
        </div>
      </div>

      {/* Filtres */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '15px',
        alignItems: 'center'
      }}>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            padding: '10px 15px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        >
          <option value="today">Aujourd'hui</option>
          <option value="yesterday">Hier</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="all">Tout</option>
        </select>

        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }} />
          <input
            type="text"
            placeholder="Rechercher par numéro de reçu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 40px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <button
          style={{
            padding: '10px 20px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <Download size={18} />
          Exporter
        </button>
      </div>

      {/* Tableau des ventes */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>N° Reçu</th>
              <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Date & Heure</th>
              <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Articles</th>
              <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Paiement</th>
              <th style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>Montant</th>
              <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Caissier</th>
              <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map(sale => (
              <tr key={sale.id} style={{
                borderBottom: '1px solid #f3f4f6',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#fafafa'}
              onMouseOut={(e) => e.currentTarget.style.background = 'white'}
              >
                <td style={{ padding: '15px', fontWeight: '500' }}>
                  {sale.receiptNumber}
                </td>
                <td style={{ padding: '15px', color: '#6b7280' }}>
                  {new Date(sale.date).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  {sale.items}
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'white',
                    background: getPaymentBadgeColor(sale.paymentMethod)
                  }}>
                    {sale.paymentMethod === 'cash' ? 'Espèces' : 
                     sale.paymentMethod === 'card' ? 'Carte' : 'Mobile'}
                  </span>
                </td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>
                  {sale.total.toLocaleString()} FCFA
                </td>
                <td style={{ padding: '15px', color: '#6b7280' }}>
                  {sale.cashier}
                </td>
                <td style={{ padding: '15px' }}>
                  <button
                    style={{
                      padding: '6px 12px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      margin: '0 auto'
                    }}
                  >
                    <Eye size={16} />
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}