import React from 'react';
import { Target } from 'lucide-react';

const TopProductsWidget = ({ globalProducts = [], salesHistory = [], isDark, currency }) => {
  const safeToLocaleString = (val) => (val || 0).toLocaleString();

  const topProducts = globalProducts.map(product => {
    const totalSold = salesHistory.reduce((sum, sale) => {
      const item = (sale.items || []).find(i => i.id === product.id);
      return sum + (item ? (item.quantity || 0) : 0);
    }, 0);
    const totalRevenue = totalSold * (product.price || 0);
    return { ...product, totalSold, totalRevenue };
  })
  .filter(p => p.totalSold > 0)
  .sort((a, b) => b.totalRevenue - a.totalRevenue)
  .slice(0, 5);

  return (
    <div style={{
      background: isDark ? '#2d3748' : 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: isDark ? '#f7fafc' : '#2d3748',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Target size={20} />
        Produits Populaires
      </h3>

      {topProducts.length === 0 ? (
        <div style={{ textAlign: 'center', color: isDark ? '#a0aec0' : '#64748b', fontSize: '14px', padding: '20px' }}>
          Aucune vente enregistrée
        </div>
      ) : (
        <div>
          {topProducts.map((product, index) => (
            <div
              key={product.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: index < topProducts.length - 1 ? `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}` : 'none'
              }}
            >
              <div>
                <div style={{ fontWeight: '600', color: isDark ? '#f7fafc' : '#2d3748', fontSize: '14px' }}>
                  {product.name}
                </div>
                <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#64748b' }}>
                  {product.totalSold} vendus
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '14px' }}>
                  {safeToLocaleString(product.totalRevenue)} {currency || 'FCFA'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopProductsWidget;
