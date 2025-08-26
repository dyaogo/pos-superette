import React from 'react';
import { AlertTriangle, Package, Clock, Bell } from 'lucide-react';

const AlertsWidget = ({ globalProducts = [], credits = [], showAlerts, setShowAlerts, isDark, onNavigate = () => {} }) => {
  const lowStockProducts = globalProducts.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStock || 5));
  const outOfStockProducts = globalProducts.filter(p => (p.stock || 0) === 0);
  const overdueCredits = credits.filter(c => {
    if (!c.dueDate) return false;
    const dueDate = new Date(c.dueDate);
    return (c.status === 'pending' || c.status === 'partial') && dueDate < new Date();
  });

  const alerts = [];

  if (outOfStockProducts.length > 0) {
    alerts.push({
      type: 'error',
      icon: AlertTriangle,
      title: 'Ruptures de Stock',
      message: `${outOfStockProducts.length} produit(s) en rupture`,
      action: 'Voir Stocks',
      onClick: () => onNavigate('stocks')
    });
  }

  if (lowStockProducts.length > 0) {
    alerts.push({
      type: 'warning',
      icon: Package,
      title: 'Stock Faible',
      message: `${lowStockProducts.length} produit(s) en stock faible`,
      action: 'Réapprovisionner',
      onClick: () => onNavigate('stocks')
    });
  }

  if (overdueCredits.length > 0) {
    alerts.push({
      type: 'error',
      icon: Clock,
      title: 'Crédits en Retard',
      message: `${overdueCredits.length} crédit(s) en retard`,
      action: 'Voir Crédits',
      onClick: () => onNavigate('credits')
    });
  }

  if (!showAlerts || alerts.length === 0) return null;

  return (
    <div style={{ marginBottom: '25px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '15px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: isDark ? '#f7fafc' : '#2d3748',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: 0
        }}>
          <Bell size={20} />
          Alertes Importantes
        </h3>
        <button
          onClick={() => setShowAlerts(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: isDark ? '#a0aec0' : '#64748b',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          Masquer
        </button>
      </div>

      {alerts.map((alert, index) => (
        <div key={index} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          background: isDark ? '#2d3748' : 'white',
          borderRadius: '8px',
          marginBottom: '12px',
          border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
        }}>
          <alert.icon size={20} color={alert.type === 'error' ? '#ef4444' : '#f59e0b'} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: '600',
              color: isDark ? '#f7fafc' : '#2d3748',
              marginBottom: '2px'
            }}>
              {alert.title}
            </div>
            <div style={{
              fontSize: '14px',
              color: isDark ? '#a0aec0' : '#64748b'
            }}>
              {alert.message}
            </div>
          </div>
          <button onClick={alert.onClick} style={{
            padding: '6px 12px',
            background: alert.type === 'error' ? '#ef4444' : '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}>
            {alert.action}
          </button>
        </div>
      ))}
    </div>
  );
};

export default AlertsWidget;
