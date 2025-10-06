import { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useApp } from '../src/contexts/AppContext';
import { 
  TrendingUp, DollarSign, ShoppingCart, Users, Package, 
  AlertTriangle, Calendar, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';

export default function DashboardPage() {
  const { productCatalog, salesHistory, customers, loading } = useApp();

  // Calculer les statistiques
  const todaySales = salesHistory.filter(sale => {
    const saleDate = new Date(sale.createdAt);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  });

  const yesterdaySales = salesHistory.filter(sale => {
    const saleDate = new Date(sale.createdAt);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return saleDate.toDateString() === yesterday.toDateString();
  });

  const thisMonthSales = salesHistory.filter(sale => {
    const saleDate = new Date(sale.createdAt);
    const today = new Date();
    return saleDate.getMonth() === today.getMonth() && 
           saleDate.getFullYear() === today.getFullYear();
  });

  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + sale.total, 0);
  const monthRevenue = thisMonthSales.reduce((sum, sale) => sum + sale.total, 0);
  
  const revenueChange = yesterdayRevenue > 0 
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
    : 0;

  const lowStockProducts = productCatalog.filter(p => p.stock < 10);
  const outOfStockProducts = productCatalog.filter(p => p.stock === 0);
  const totalInventoryValue = productCatalog.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);

  // Top produits vendus (par quantité)
  const productSales = {};
  salesHistory.forEach(sale => {
    sale.items?.forEach(item => {
      if (!productSales[item.productName]) {
        productSales[item.productName] = 0;
      }
      productSales[item.productName] += item.quantity;
    });
  });

  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Ventes récentes
  const recentSales = salesHistory.slice(0, 5);

  if (loading) {
        return <LoadingSpinner fullScreen />;

  }

  return (
    <div className="animate-fade-in" style={{ padding: '30px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>Tableau de Bord</h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* KPIs principaux */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Ventes du jour */}
        <StatCard
          icon={<DollarSign size={24} />}
          title="Ventes aujourd'hui"
          value={`${todayRevenue.toLocaleString()} FCFA`}
          subtitle={`${todaySales.length} transactions`}
          trend={revenueChange}
          color="#10b981"
        />

        {/* Ventes du mois */}
        <StatCard
          icon={<TrendingUp size={24} />}
          title="Ventes du mois"
          value={`${monthRevenue.toLocaleString()} FCFA`}
          subtitle={`${thisMonthSales.length} transactions`}
          color="#3b82f6"
        />

        {/* Produits en stock */}
        <StatCard
          icon={<Package size={24} />}
          title="Produits en stock"
          value={productCatalog.length}
          subtitle={`Valeur: ${totalInventoryValue.toLocaleString()} FCFA`}
          color="#8b5cf6"
        />

        {/* Clients */}
        <StatCard
          icon={<Users size={24} />}
          title="Clients"
          value={customers.length}
          subtitle="Clients enregistrés"
          color="#f59e0b"
        />
      </div>

      {/* Alertes et contenu principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* Ventes récentes */}
        <div style={{ 
          background: 'var(--color-surface)', 
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          padding: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={20} />
            Ventes récentes
          </h2>
          
          {recentSales.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px 0' }}>
              Aucune vente enregistrée
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentSales.map(sale => (
                <div 
                  key={sale.id}
                  style={{
                    padding: '15px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      {sale.items?.length || 0} article(s)
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                      {new Date(sale.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#3b82f6' }}>
                    {sale.total.toLocaleString()} FCFA
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertes stock */}
        <div style={{ 
          background: 'var(--color-surface)', 
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          padding: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} />
            Alertes Stock
          </h2>

          {outOfStockProducts.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                background: '#fef2f2', 
                padding: '12px', 
                borderRadius: '8px',
                border: '1px solid #fecaca'
              }}>
                <div style={{ fontWeight: '500', color: '#991b1b', marginBottom: '8px' }}>
                  Rupture de stock ({outOfStockProducts.length})
                </div>
                {outOfStockProducts.slice(0, 3).map(p => (
                  <div key={p.id} style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '4px' }}>
                    • {p.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowStockProducts.length > 0 && (
            <div>
              <div style={{ 
                background: '#fef3c7', 
                padding: '12px', 
                borderRadius: '8px',
                border: '1px solid #fde68a'
              }}>
                <div style={{ fontWeight: '500', color: '#92400e', marginBottom: '8px' }}>
                  Stock faible ({lowStockProducts.length})
                </div>
                {lowStockProducts.slice(0, 5).map(p => (
                  <div key={p.id} style={{ fontSize: '14px', color: '#78350f', marginBottom: '4px' }}>
                    • {p.name} ({p.stock})
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
              Aucune alerte
            </p>
          )}
        </div>
      </div>

      {/* Top produits */}
      <div style={{ 
        background: 'var(--color-surface)', 
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        padding: '20px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>
          Top 5 Produits Vendus
        </h2>

        {topProducts.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px 0' }}>
            Aucune donnée disponible
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topProducts.map(([name, quantity], index) => (
              <div 
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500' }}>{name}</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                    {quantity} unités vendues
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Composant carte statistique
function StatCard({ icon, title, value, subtitle, trend, color }) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <div className="hover-lift" style={{ 
      background: 'var(--color-surface)', 
      borderRadius: '12px',
      border: '1px solid var(--color-border)',
      padding: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <div style={{ color: color }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            color: isPositive ? '#10b981' : isNegative ? '#ef4444' : '#6b7280',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {isPositive && <ArrowUpRight size={16} />}
            {isNegative && <ArrowDownRight size={16} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
        {title}
      </div>
      
      <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
        {value}
      </div>
      
      <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
        {subtitle}
      </div>
    </div>
  );
}