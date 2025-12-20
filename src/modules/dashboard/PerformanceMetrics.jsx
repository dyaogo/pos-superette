import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Activity } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const PerformanceMetrics = () => {
  const { salesHistory, globalProducts, customers, appSettings } = useApp();
  const isDark = appSettings?.darkMode;
  
  // Calculs de performance
  const metrics = useMemo(() => {
    const today = new Date();
    const thisMonth = today.getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    
    // Ventes du mois actuel vs mois précédent
    const thisMonthSales = salesHistory.filter(s => 
      new Date(s.date).getMonth() === thisMonth
    );
    const lastMonthSales = salesHistory.filter(s => 
      new Date(s.date).getMonth() === lastMonth
    );
    
    const thisMonthRevenue = thisMonthSales.reduce((sum, s) => sum + s.total, 0);
    const lastMonthRevenue = lastMonthSales.reduce((sum, s) => sum + s.total, 0);
    const revenueGrowth = lastMonthRevenue > 0 ? 
      ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : 0;
    
    // Produits les plus rentables
    const productProfitability = globalProducts.map(product => {
      const totalSold = salesHistory.reduce((sum, sale) => {
        const item = sale.items.find(i => i.id === product.id);
        return sum + (item ? item.quantity : 0);
      }, 0);
      const revenue = totalSold * product.price;
      const cost = totalSold * product.costPrice;
      const profit = revenue - cost;
      const profitMargin = revenue > 0 ? (profit / revenue * 100).toFixed(1) : 0;
      
      return {
        ...product,
        totalSold,
        revenue,
        profit,
        profitMargin
      };
    }).sort((a, b) => b.profit - a.profit);
    
    // Taux de rotation des stocks
    const stockTurnover = globalProducts.map(product => {
      const totalSold = salesHistory.reduce((sum, sale) => {
        const item = sale.items.find(i => i.id === product.id);
        return sum + (item ? item.quantity : 0);
      }, 0);
      const averageStock = (product.stock + product.maxStock) / 2;
      const turnoverRate = averageStock > 0 ? (totalSold / averageStock).toFixed(2) : 0;
      
      return {
        ...product,
        turnoverRate: parseFloat(turnoverRate)
      };
    }).sort((a, b) => b.turnoverRate - a.turnoverRate);
    
    // Clients VIP (top 5)
    const customerAnalysis = customers.filter(c => c.id !== 1).map(customer => {
      const customerSales = salesHistory.filter(s => s.customerId === customer.id);
      const totalSpent = customerSales.reduce((sum, s) => sum + s.total, 0);
      const averageBasket = customerSales.length > 0 ? totalSpent / customerSales.length : 0;
      
      return {
        ...customer,
        totalSpent,
        averageBasket,
        purchaseCount: customerSales.length
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
    
    return {
      thisMonthRevenue,
      lastMonthRevenue,
      revenueGrowth,
      productProfitability: productProfitability.slice(0, 5),
      stockTurnover: stockTurnover.slice(0, 5),
      customerAnalysis,
      averageBasketSize: salesHistory.length > 0 ? 
        salesHistory.reduce((sum, s) => sum + s.total, 0) / salesHistory.length : 0
    };
  }, [salesHistory, globalProducts, customers]);
  
  const cardStyle = {
    background: isDark ? '#2d3748' : 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  };
  
  return (
    <div style={{ marginTop: '30px' }}>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        marginBottom: '20px',
        color: isDark ? '#f7fafc' : '#2d3748'
      }}>
        Métriques de Performance
      </h2>
      
      {/* KPIs principaux */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: isDark ? '#a0aec0' : '#718096', fontSize: '14px' }}>
                Croissance Mensuelle
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: isDark ? '#f7fafc' : '#2d3748' }}>
                {metrics.revenueGrowth}%
              </div>
            </div>
            {parseFloat(metrics.revenueGrowth) >= 0 ? 
              <TrendingUp size={32} color="#10b981" /> : 
              <TrendingDown size={32} color="#ef4444" />
            }
          </div>
        </div>
        
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: isDark ? '#a0aec0' : '#718096', fontSize: '14px' }}>
                Panier Moyen
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: isDark ? '#f7fafc' : '#2d3748' }}>
                {metrics.averageBasketSize.toLocaleString()} {appSettings?.currency}
              </div>
            </div>
            <DollarSign size={32} color="#3b82f6" />
          </div>
        </div>
      </div>
      
      {/* Top produits rentables */}
      <div style={{ ...cardStyle, marginBottom: '20px' }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          marginBottom: '15px',
          color: isDark ? '#f7fafc' : '#2d3748'
        }}>
          Top 5 Produits les Plus Rentables
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}` }}>
                <th style={{ padding: '10px', textAlign: 'left', color: isDark ? '#a0aec0' : '#718096' }}>
                  Produit
                </th>
                <th style={{ padding: '10px', textAlign: 'right', color: isDark ? '#a0aec0' : '#718096' }}>
                  Vendus
                </th>
                <th style={{ padding: '10px', textAlign: 'right', color: isDark ? '#a0aec0' : '#718096' }}>
                  CA
                </th>
                <th style={{ padding: '10px', textAlign: 'right', color: isDark ? '#a0aec0' : '#718096' }}>
                  Profit
                </th>
                <th style={{ padding: '10px', textAlign: 'right', color: isDark ? '#a0aec0' : '#718096' }}>
                  Marge
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.productProfitability.map((product, index) => (
                <tr key={product.id} style={{ borderBottom: `1px solid ${isDark ? '#374151' : '#f1f5f9'}` }}>
                  <td style={{ padding: '10px', color: isDark ? '#f7fafc' : '#2d3748' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '30px',
                        height: '30px',
                        background: index === 0 ? '#fbbf24' : '#e2e8f0',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}>
                        {index + 1}
                      </span>
                      {product.name}
                    </div>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', color: isDark ? '#f7fafc' : '#2d3748' }}>
                    {product.totalSold}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', color: isDark ? '#f7fafc' : '#2d3748' }}>
                    {product.revenue.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                    {product.profit.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', color: isDark ? '#f7fafc' : '#2d3748' }}>
                    {product.profitMargin}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Clients VIP */}
      {metrics.customerAnalysis.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '15px',
            color: isDark ? '#f7fafc' : '#2d3748'
          }}>
            Top Clients VIP
          </h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {metrics.customerAnalysis.map((customer, index) => (
              <div key={customer.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                background: isDark ? '#374151' : '#f7fafc',
                borderRadius: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '30px',
                    height: '30px',
                    background: '#fbbf24',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: '600', color: isDark ? '#f7fafc' : '#2d3748' }}>
                      {customer.name}
                    </div>
                    <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#718096' }}>
                      {customer.purchaseCount} achats | Panier moyen: {customer.averageBasket.toLocaleString()} {appSettings?.currency}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                    {customer.totalSpent.toLocaleString()} {appSettings?.currency}
                  </div>
                  <div style={{ fontSize: '12px', color: '#f59e0b' }}>
                    {customer.points} points
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMetrics;
