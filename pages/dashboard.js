import { useState, useMemo } from 'react';
import { useApp } from '../src/contexts/AppContext';
import SalesChart from '../components/SalesChart';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package,
  Calendar,
  Award,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { salesHistory, productCatalog, customers, credits, loading } = useApp();
  const [period, setPeriod] = useState('week'); // today, week, month, year

  // Calculer les dates selon la période
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return { start: today, end: new Date() };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: weekStart, end: new Date() };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        return { start: monthStart, end: new Date() };
      case 'year':
        const yearStart = new Date(today);
        yearStart.setDate(today.getDate() - 365);
        return { start: yearStart, end: new Date() };
      default:
        return { start: today, end: new Date() };
    }
  };

  const { start, end } = getDateRange();

  // Filtrer les ventes par période
  const periodSales = useMemo(() => {
    return salesHistory.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= start && saleDate <= end;
    });
  }, [salesHistory, start, end]);

  // Statistiques globales
  const stats = useMemo(() => {
    const totalRevenue = periodSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalSales = periodSales.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    const totalStock = productCatalog.reduce((sum, p) => sum + p.stock, 0);
    const stockValue = productCatalog.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);
    const lowStock = productCatalog.filter(p => p.stock < 10).length;
    
    const activeCredits = credits.filter(c => c.status !== 'paid');
    const totalCreditsAmount = activeCredits.reduce((sum, c) => sum + c.remainingAmount, 0);
    
    return {
      totalRevenue,
      totalSales,
      averageTicket,
      totalCustomers: customers.length,
      totalStock,
      stockValue,
      lowStock,
      totalCreditsAmount,
      activeCreditsCount: activeCredits.length
    };
  }, [periodSales, productCatalog, customers, credits]);

  // Données pour le graphique des ventes par jour
  const salesByDay = useMemo(() => {
    const days = {};
    
    periodSales.forEach(sale => {
      const date = new Date(sale.createdAt);
      const dayKey = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      
      if (days[dayKey]) {
        days[dayKey] += sale.total;
      } else {
        days[dayKey] = sale.total;
      }
    });
    
    return Object.entries(days)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([label, value]) => ({ label, value: Math.round(value) }));
  }, [periodSales]);

  // Top 5 produits les plus vendus
  const topProducts = useMemo(() => {
    const productSales = {};
    
    periodSales.forEach(sale => {
      sale.items?.forEach(item => {
        const key = item.productName || item.name;
        if (productSales[key]) {
          productSales[key].quantity += item.quantity;
          productSales[key].revenue += item.total || (item.quantity * item.unitPrice);
        } else {
          productSales[key] = {
            name: key,
            quantity: item.quantity,
            revenue: item.total || (item.quantity * item.unitPrice)
          };
        }
      });
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [periodSales]);

  if (loading) {
    return <div style={{ padding: '20px' }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={32} />
          Tableau de Bord & Analytics
        </h1>
        
        {/* Filtres de période */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { value: 'today', label: "Aujourd'hui" },
            { value: 'week', label: '7 derniers jours' },
            { value: 'month', label: '30 derniers jours' },
            { value: 'year', label: 'Année' }
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '10px 20px',
                background: period === p.value ? 'var(--color-primary)' : 'var(--color-surface)',
                color: period === p.value ? 'white' : 'var(--color-text-primary)',
                border: `2px solid ${period === p.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs principaux */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        {/* Chiffre d'affaires */}
        <div style={{ 
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          padding: '25px', 
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <DollarSign size={24} />
            <span style={{ fontSize: '14px', opacity: 0.9 }}>Chiffre d'affaires</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
            {stats.totalRevenue.toLocaleString()} FCFA
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>
            {stats.totalSales} ventes • Ticket moyen: {Math.round(stats.averageTicket).toLocaleString()} FCFA
          </div>
        </div>

        {/* Ventes */}
        <div style={{ 
          background: 'linear-gradient(135deg, #10b981, #059669)',
          padding: '25px', 
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <ShoppingBag size={24} />
            <span style={{ fontSize: '14px', opacity: 0.9 }}>Transactions</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
            {stats.totalSales}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>
            Total des ventes effectuées
          </div>
        </div>

        {/* Clients */}
        <div style={{ 
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          padding: '25px', 
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Users size={24} />
            <span style={{ fontSize: '14px', opacity: 0.9 }}>Clients</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
            {stats.totalCustomers}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>
            Clients enregistrés
          </div>
        </div>

        {/* Stock */}
        <div style={{ 
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          padding: '25px', 
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Package size={24} />
            <span style={{ fontSize: '14px', opacity: 0.9 }}>Valeur du stock</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
            {Math.round(stats.stockValue).toLocaleString()} FCFA
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>
            {stats.totalStock} unités • {stats.lowStock} en rupture
          </div>
        </div>
      </div>

      {/* Graphiques et analyses */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* Graphique des ventes */}
        <SalesChart 
          data={salesByDay} 
          title="📈 Évolution des ventes"
        />

        {/* Alertes et infos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Crédits en cours */}
          {stats.activeCreditsCount > 0 && (
            <div style={{ 
              background: 'var(--color-surface)', 
              padding: '20px', 
              borderRadius: '12px',
              border: '2px solid #f59e0b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <AlertCircle size={20} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                  Crédits en cours
                </h3>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '5px' }}>
                {stats.totalCreditsAmount.toLocaleString()} FCFA
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                {stats.activeCreditsCount} crédits actifs
              </div>
            </div>
          )}

          {/* Stock faible */}
          {stats.lowStock > 0 && (
            <div style={{ 
              background: 'var(--color-surface)', 
              padding: '20px', 
              borderRadius: '12px',
              border: '2px solid #ef4444'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <AlertCircle size={20} color="#ef4444" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                  Alerte stock
                </h3>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginBottom: '5px' }}>
                {stats.lowStock} produits
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                En rupture ou stock faible
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top produits */}
      <div style={{ 
        background: 'var(--color-surface)', 
        padding: '25px', 
        borderRadius: '12px',
        border: '1px solid var(--color-border)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Award size={24} color="#f59e0b" />
          Top 5 des produits les plus vendus
        </h3>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                Rang
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                Produit
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>
                Quantité vendue
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>
                Chiffre d'affaires
              </th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((product, index) => (
              <tr 
                key={product.name}
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <td style={{ padding: '15px' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: index === 0 ? '#f59e0b' : index === 1 ? '#9ca3af' : index === 2 ? '#cd7f32' : 'var(--color-surface-hover)',
                    color: index < 3 ? 'white' : 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    {index + 1}
                  </span>
                </td>
                <td style={{ padding: '15px', fontWeight: '500' }}>
                  {product.name}
                </td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600', color: 'var(--color-primary)' }}>
                  {product.quantity} unités
                </td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>
                  {Math.round(product.revenue).toLocaleString()} FCFA
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}