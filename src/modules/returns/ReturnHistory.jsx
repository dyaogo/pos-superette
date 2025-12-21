import React, { useState, useEffect } from 'react';
import { Package, Calendar, CreditCard, FileText, Filter } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const ReturnHistory = () => {
  const { returnsHistory, appSettings } = useApp();
  const [returns, setReturns] = useState([]);
  const [filter, setFilter] = useState('all');
  const isDark = appSettings?.darkMode;

  useEffect(() => {
    // Charger depuis localStorage aussi
    if (typeof window !== 'undefined') {
      try {
        const savedReturns = localStorage.getItem('returns_history');
        if (savedReturns) {
          const parsed = JSON.parse(savedReturns);
          setReturns(parsed);
        } else {
          setReturns(returnsHistory || []);
        }
      } catch (e) {
        setReturns(returnsHistory || []);
      }
    } else {
      setReturns(returnsHistory || []);
    }
  }, [returnsHistory]);

  const filteredReturns = filter === 'all'
    ? returns
    : returns.filter(r => r.refundMethod === filter);

  const totalAmount = filteredReturns.reduce((sum, r) => sum + (r.amount || 0), 0);

  const styles = {
    container: {
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '12px',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      overflow: 'hidden'
    },
    header: {
      padding: '20px',
      borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px'
    },
    stats: {
      display: 'flex',
      gap: '24px',
      alignItems: 'center'
    },
    statItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    statLabel: {
      fontSize: '12px',
      color: isDark ? '#a0aec0' : '#64748b',
      fontWeight: '500'
    },
    statValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: isDark ? '#f7fafc' : '#1a202c'
    },
    filterButtons: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    filterButton: (isActive) => ({
      padding: '8px 16px',
      borderRadius: '6px',
      border: `2px solid ${isActive ? '#3b82f6' : (isDark ? '#4a5568' : '#e2e8f0')}`,
      background: isActive ? '#3b82f6' : 'transparent',
      color: isActive ? 'white' : (isDark ? '#f7fafc' : '#2d3748'),
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      transition: 'all 0.2s'
    }),
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'left',
      padding: '16px',
      background: isDark ? '#374151' : '#f7fafc',
      color: isDark ? '#f7fafc' : '#2d3748',
      fontWeight: '600',
      fontSize: '13px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    td: {
      padding: '16px',
      borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      color: isDark ? '#f7fafc' : '#2d3748'
    },
    emptyState: {
      padding: '60px 20px',
      textAlign: 'center',
      color: isDark ? '#a0aec0' : '#64748b'
    },
    badge: (method) => {
      const colors = {
        cash: { bg: '#10b981', text: 'white' },
        mobile: { bg: '#3b82f6', text: 'white' },
        credit: { bg: '#f59e0b', text: 'white' },
        stock: { bg: '#8b5cf6', text: 'white' }
      };
      const color = colors[method] || colors.cash;
      return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '12px',
        background: color.bg,
        color: color.text,
        fontSize: '12px',
        fontWeight: '600'
      };
    },
    amountCell: {
      fontWeight: 'bold',
      color: '#ef4444',
      fontSize: '15px'
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'cash': return '💵';
      case 'mobile': return '📱';
      case 'credit': return '📝';
      case 'stock': return '📦';
      default: return '💵';
    }
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case 'cash': return 'Espèces';
      case 'mobile': return 'Mobile';
      case 'credit': return 'Crédit';
      case 'stock': return 'Stock';
      default: return 'Espèces';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <div style={styles.statLabel}>Total retours</div>
            <div style={styles.statValue}>{filteredReturns.length}</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statLabel}>Montant total</div>
            <div style={{ ...styles.statValue, color: '#ef4444' }}>
              {totalAmount.toLocaleString()} FCFA
            </div>
          </div>
        </div>

        <div style={styles.filterButtons}>
          <button
            onClick={() => setFilter('all')}
            style={styles.filterButton(filter === 'all')}
          >
            <Filter size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Tous
          </button>
          <button
            onClick={() => setFilter('cash')}
            style={styles.filterButton(filter === 'cash')}
          >
            💵 Espèces
          </button>
          <button
            onClick={() => setFilter('mobile')}
            style={styles.filterButton(filter === 'mobile')}
          >
            📱 Mobile
          </button>
          <button
            onClick={() => setFilter('credit')}
            style={styles.filterButton(filter === 'credit')}
          >
            📝 Crédit
          </button>
        </div>
      </div>

      {filteredReturns.length === 0 ? (
        <div style={styles.emptyState}>
          <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            Aucun retour trouvé
          </div>
          <div style={{ fontSize: '14px' }}>
            {filter === 'all'
              ? 'Les retours enregistrés apparaîtront ici'
              : `Aucun retour avec la méthode ${getMethodLabel(filter)}`}
          </div>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>
                <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Date
              </th>
              <th style={styles.th}>
                <FileText size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Vente / Produits
              </th>
              <th style={styles.th}>Raison</th>
              <th style={styles.th}>
                <CreditCard size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Méthode
              </th>
              <th style={styles.th} align="right">Montant</th>
            </tr>
          </thead>
          <tbody>
            {filteredReturns.map(r => (
              <tr key={r.id}>
                <td style={styles.td}>
                  <div>{new Date(r.createdAt || r.date).toLocaleDateString('fr-FR')}</div>
                  <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#64748b' }}>
                    {new Date(r.createdAt || r.date).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </td>
                <td style={styles.td}>
                  {r.items && r.items.length > 0 ? (
                    <div>
                      <div style={{ fontWeight: '600' }}>
                        {r.items.length} article(s)
                      </div>
                      <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#64748b' }}>
                        {r.items.map(item => item.productName).join(', ')}
                      </div>
                    </div>
                  ) : r.productName ? (
                    <div>
                      <div style={{ fontWeight: '600' }}>{r.productName}</div>
                      <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#64748b' }}>
                        Qté: {r.quantity}
                      </div>
                    </div>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td style={styles.td}>
                  <div style={{ maxWidth: '250px', fontSize: '13px' }}>
                    {r.reason || 'Aucune raison'}
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={styles.badge(r.refundMethod)}>
                    {getMethodIcon(r.refundMethod)} {getMethodLabel(r.refundMethod)}
                  </div>
                </td>
                <td style={{ ...styles.td, ...styles.amountCell }} align="right">
                  {(r.amount || 0).toLocaleString()} FCFA
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReturnHistory;
