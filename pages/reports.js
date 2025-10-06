import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useApp } from '../src/contexts/AppContext';
import { BarChart, Calendar, Download, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { exportSalesToExcel } from '../utils/excelExport';


export default function ReportsPage() {
  const handleExport = () => {
  exportSalesToExcel(filteredSales, customers, period);
};
  const { salesHistory, productCatalog, customers, loading } = useApp();
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtrer les ventes par période
  const getFilteredSales = () => {
    const now = new Date();
    let filtered = salesHistory;

    if (period === 'custom' && startDate && endDate) {
      filtered = salesHistory.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
      });
    } else {
      filtered = salesHistory.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        
        switch(period) {
          case 'today':
            return saleDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return saleDate >= weekAgo;
          case 'month':
            return saleDate.getMonth() === now.getMonth() && 
                   saleDate.getFullYear() === now.getFullYear();
          case 'year':
            return saleDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const filteredSales = getFilteredSales();

  // Calculs statistiques
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredSales.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Ventes par catégorie
  const salesByCategory = {};
  filteredSales.forEach(sale => {
    sale.items?.forEach(item => {
      const product = productCatalog.find(p => p.id === item.productId);
      const category = product?.category || 'Autre';
      
      if (!salesByCategory[category]) {
        salesByCategory[category] = { revenue: 0, quantity: 0 };
      }
      salesByCategory[category].revenue += item.total;
      salesByCategory[category].quantity += item.quantity;
    });
  });

  // Ventes par méthode de paiement
  const paymentMethods = {
    cash: 0,
    card: 0,
    mobile: 0
  };
  filteredSales.forEach(sale => {
    paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + sale.total;
  });

  // Produits les plus vendus
  const productSales = {};
  filteredSales.forEach(sale => {
    sale.items?.forEach(item => {
      if (!productSales[item.productName]) {
        productSales[item.productName] = { quantity: 0, revenue: 0 };
      }
      productSales[item.productName].quantity += item.quantity;
      productSales[item.productName].revenue += item.total;
    });
  });

  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10);

  if (loading) {
    return <LoadingSpinner fullScreen />;

  }

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart size={32} />
          Rapports et Statistiques
        </h1>
        <button
  style={{
    padding: '12px 24px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}
  onClick={handleExport}
>
  <Download size={20} />
  Exporter en Excel
</button>
      </div>

      {/* Filtres de période */}
      <div style={{ 
        background: 'var(--color-surface)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} color="#6b7280" />
            <span style={{ fontWeight: '500' }}>Période :</span>
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              minWidth: '150px'
            }}
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
            <option value="custom">Période personnalisée</option>
          </select>

          {period === 'custom' && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: '10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
              />
              <span>à</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: '10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <KPICard
          icon={<DollarSign size={24} />}
          title="Chiffre d'affaires"
          value={`${totalRevenue.toLocaleString()} FCFA`}
          color="#10b981"
        />
        <KPICard
          icon={<TrendingUp size={24} />}
          title="Transactions"
          value={totalTransactions}
          color="#3b82f6"
        />
        <KPICard
          icon={<BarChart size={24} />}
          title="Panier moyen"
          value={`${Math.round(averageTransaction).toLocaleString()} FCFA`}
          color="#8b5cf6"
        />
        <KPICard
          icon={<Users size={24} />}
          title="Clients actifs"
          value={customers.length}
          color="#f59e0b"
        />
      </div>

      {/* Graphiques et tableaux */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* Ventes par catégorie */}
        <div style={{ 
          background: 'var(--color-surface)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>
            Ventes par Catégorie
          </h2>
          {Object.keys(salesByCategory).length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px 0' }}>
              Aucune donnée
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(salesByCategory)
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .map(([category, data]) => (
                  <div key={category} style={{ 
                    padding: '12px',
                    background: 'var(--color-surface-hover)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '500' }}>{category}</span>
                      <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                        {data.revenue.toLocaleString()} FCFA
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      {data.quantity} unités vendues
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Méthodes de paiement */}
        <div style={{ 
          background: 'var(--color-surface)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>
            Méthodes de Paiement
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(paymentMethods).map(([method, amount]) => {
              const percentage = totalRevenue > 0 ? (amount / totalRevenue * 100).toFixed(1) : 0;
              const label = method === 'cash' ? 'Espèces' : 
                           method === 'card' ? 'Carte bancaire' : 'Mobile Money';
              
              return (
                <div key={method} style={{ 
                  padding: '12px',
                  background: 'var(--color-surface-hover)',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '500' }}>{label}</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {amount.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div style={{ 
                    height: '8px',
                    background: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: '#3b82f6',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    {percentage}% du total
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top 10 produits */}
      <div style={{ 
        background: 'var(--color-surface)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>
          Top 10 Produits
        </h2>
        {topProducts.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px 0' }}>
            Aucune vente
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Rang</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Produit</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Quantité</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Chiffre d'affaires</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map(([name, data], index) => (
                <tr key={name} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: index < 3 ? '#3b82f6' : '#e5e7eb',
                      color: index < 3 ? 'white' : '#6b7280',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{name}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{data.quantity}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                    {data.revenue.toLocaleString()} FCFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function KPICard({ icon, title, value, color }) {
  return (
    <div style={{ 
      background: 'var(--color-surface)',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid var(--color-border)'
    }}>
      <div style={{ color: color, marginBottom: '12px' }}>
        {icon}
      </div>
      <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
        {title}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
        {value}
      </div>
    </div>
  );
}