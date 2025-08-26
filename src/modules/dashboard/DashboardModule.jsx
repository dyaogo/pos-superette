import React, { useState, useMemo } from 'react';
import { DollarSign, Package, Users, ShoppingCart, BarChart3 } from 'lucide-react';
import MetricCard from './components/MetricCard';
import AlertsWidget from './components/AlertsWidget';
import TopProductsWidget from './components/TopProductsWidget';
import DataManagerWidget from './components/DataManagerWidget';
import { useApp } from '../../contexts/AppContext'; // ✅ CORRECTION CRITIQUE

const DashboardModule = () => {
  const {
    globalProducts,
    customers,
    salesHistory,
    appSettings,
    getStats,
    clearAllData,
    credits,
    viewMode,
    getCurrentStore
  } = useApp(); // ✅ CORRECTION CRITIQUE
  
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [showDataManager, setShowDataManager] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);
  
  const isDark = appSettings?.darkMode || false;
  const stats = useMemo(() => getStats(), [viewMode, globalProducts, salesHistory, customers]);

  // Protection contre les valeurs undefined
  const safeToLocaleString = (value) => {
    return (value || 0).toLocaleString();
  };

  // Calculs avancés pour les métriques comparatives
  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Définir les périodes
    const periods = {
      today: { start: startOfToday, label: "Aujourd'hui" },
      week: { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), label: "7 derniers jours" },
      month: { start: new Date(now.getFullYear(), now.getMonth(), 1), label: "Ce mois" },
      year: { start: new Date(now.getFullYear(), 0, 1), label: "Cette année" }
    };
    
    const currentPeriod = periods[selectedPeriod];
    const currentSales = (salesHistory || []).filter(s => new Date(s.date) >= currentPeriod.start);
    
    // Période précédente pour comparaison
    const periodDuration = now.getTime() - currentPeriod.start.getTime();
    const previousPeriodStart = new Date(currentPeriod.start.getTime() - periodDuration);
    const previousSales = (salesHistory || []).filter(s => 
      new Date(s.date) >= previousPeriodStart && new Date(s.date) < currentPeriod.start
    );
    
    // Calculs avec protection
    const currentRevenue = currentSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const previousRevenue = previousSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const revenueGrowth = previousRevenue > 0 ? 
      ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;
    
    const currentTransactions = currentSales.length;
    const previousTransactions = previousSales.length;
    const transactionGrowth = previousTransactions > 0 ? 
      ((currentTransactions - previousTransactions) / previousTransactions * 100) : 0;
    
    return {
      periodLabel: currentPeriod.label,
      currentRevenue,
      previousRevenue,
      revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
      currentTransactions,
      previousTransactions,
      transactionGrowth: parseFloat(transactionGrowth.toFixed(1))
    };
  }, [salesHistory, selectedPeriod, viewMode]);

  // Styles
  const styles = {
    container: {
      padding: '20px',
      background: isDark ? '#1a202c' : '#f7fafc',
      minHeight: 'calc(100vh - 100px)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: isDark ? '#f7fafc' : '#2d3748',
      margin: 0
    },
    periodSelector: {
      display: 'flex',
      gap: '8px',
      background: isDark ? '#2d3748' : 'white',
      padding: '4px',
      borderRadius: '8px',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
    },
    periodButton: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    metricCard: {
      background: isDark ? '#2d3748' : 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
    },
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    }
  };
  return (
    <div style={styles.container}>
      {/* En-tête avec sélecteur de période */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            📊 Tableau de Bord - {viewMode === 'consolidated' ? 'Vue consolidée' : getCurrentStore()?.code}
          </h1>
          <p style={{ 
            color: isDark ? '#a0aec0' : '#64748b', 
            margin: '8px 0 0 0',
            fontSize: '16px'
          }}>
            Vue d'ensemble de votre activité - {dashboardMetrics.periodLabel}
          </p>
        </div>
        
        <div style={styles.periodSelector}>
          {['today', 'week', 'month', 'year'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              style={{
                ...styles.periodButton,
                background: selectedPeriod === period 
                  ? (isDark ? '#4a5568' : '#edf2f7') 
                  : 'transparent',
                color: selectedPeriod === period
                  ? (isDark ? '#f7fafc' : '#2d3748')
                  : (isDark ? '#a0aec0' : '#64748b')
              }}
            >
              {period === 'today' && 'Aujourd\'hui'}
              {period === 'week' && '7 jours'}
              {period === 'month' && 'Ce mois'}
              {period === 'year' && 'Cette année'}
            </button>
          ))}
        </div>
      </div>

      {/* Widget gestionnaire de données */}
      <DataManagerWidget
        showDataManager={showDataManager}
        setShowDataManager={setShowDataManager}
        globalProducts={globalProducts}
        salesHistory={salesHistory}
        customers={customers}
        credits={credits}
        appSettings={appSettings}
        clearAllData={clearAllData}
        isDark={isDark}
      />

      {/* Alertes */}
      <AlertsWidget
        globalProducts={globalProducts}
        credits={credits}
        showAlerts={showAlerts}
        setShowAlerts={setShowAlerts}
        isDark={isDark}
      />

      {/* Métriques principales avec comparaison */}
      <div style={styles.metricsGrid}>
        <MetricCard
          title={`Chiffre d'Affaires - ${dashboardMetrics.periodLabel}`}
          value={dashboardMetrics.currentRevenue}
          change={dashboardMetrics.revenueGrowth}
          icon={DollarSign}
          color="#10b981"
          format="currency"
          isDark={isDark}
          currency={appSettings?.currency}
        />

        <MetricCard
          title={`Nombre de Ventes - ${dashboardMetrics.periodLabel}`}
          value={dashboardMetrics.currentTransactions}
          change={dashboardMetrics.transactionGrowth}
          icon={ShoppingCart}
          color="#3b82f6"
          isDark={isDark}
          currency={appSettings?.currency}
        />

        <MetricCard
          title="Produits en Stock"
          value={stats?.totalProducts || 0}
          change={0}
          icon={Package}
          color="#8b5cf6"
          isDark={isDark}
          currency={appSettings?.currency}
        />

        <MetricCard
          title="Clients Fidèles"
          value={stats?.totalCustomers || 0}
          change={0}
          icon={Users}
          color="#f59e0b"
          isDark={isDark}
          currency={appSettings?.currency}
        />
      </div>

      {/* Widgets d'analyse */}
      <div style={styles.chartsGrid}>
        <TopProductsWidget
          globalProducts={globalProducts}
          salesHistory={salesHistory}
          isDark={isDark}
          currency={appSettings?.currency}
        />
        
        {/* Statistiques détaillées */}
        <div style={styles.metricCard}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: isDark ? '#f7fafc' : '#2d3748',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <BarChart3 size={20} />
            Statistiques Détaillées
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
            }}>
              <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>
                Valeur de l'inventaire
              </span>
              <span style={{ 
                fontWeight: 'bold', 
                color: isDark ? '#f7fafc' : '#2d3748' 
              }}>
                {safeToLocaleString(stats?.inventoryValue)} {appSettings?.currency || 'FCFA'}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
            }}>
              <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>
                Stock faible
              </span>
              <span style={{ 
                fontWeight: 'bold', 
                color: stats?.lowStockCount > 0 ? '#f59e0b' : '#10b981'
              }}>
                {stats?.lowStockCount || 0} produits
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '8px 0'
            }}>
              <span style={{ color: isDark ? '#a0aec0' : '#64748b' }}>
                Ruptures de stock
              </span>
              <span style={{ 
                fontWeight: 'bold', 
                color: stats?.outOfStockCount > 0 ? '#ef4444' : '#10b981'
              }}>
                {stats?.outOfStockCount || 0} produits
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardModule;
