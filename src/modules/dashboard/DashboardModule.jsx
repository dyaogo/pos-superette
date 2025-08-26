import React, { useState, useMemo } from 'react';
import { DollarSign, Package, Users, ShoppingCart, BarChart3 } from 'lucide-react';
import MetricCard from './components/MetricCard';
import AlertsWidget from './components/AlertsWidget';
import TopProductsWidget from './components/TopProductsWidget';
import DataManagerWidget from './components/DataManagerWidget';
import SalesChart from './SalesChart';
import { useApp } from '../../contexts/AppContext'; // ✅ CORRECTION CRITIQUE
import styles from './DashboardModule.module.css';

const DashboardModule = ({ onNavigate }) => {
  const {
    globalProducts,
    customers,
    salesHistory,
    appSettings,
    getStats,
    clearAllData,
    credits,
    viewMode,
    getCurrentStore,
    setGlobalProducts,
    setSalesHistory,
    setCustomers,
    setCredits,
    setAppSettings
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

    const marginFromSale = (sale) =>
      (sale.items || []).reduce(
        (mSum, i) => mSum + (i.quantity || 0) * (((i.price || 0) - (i.costPrice || 0))),
        0
      );

    const currentMargin = currentSales.reduce((sum, s) => sum + marginFromSale(s), 0);
    const previousMargin = previousSales.reduce((sum, s) => sum + marginFromSale(s), 0);
    const marginGrowth = previousMargin > 0 ?
      ((currentMargin - previousMargin) / previousMargin * 100) : 0;

    const currentTransactions = currentSales.length;
    const previousTransactions = previousSales.length;
    const transactionGrowth = previousTransactions > 0 ?
      ((currentTransactions - previousTransactions) / previousTransactions * 100) : 0;

    return {
      periodLabel: currentPeriod.label,
      currentRevenue,
      previousRevenue,
      revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
      currentMargin,
      previousMargin,
      marginGrowth: parseFloat(marginGrowth.toFixed(1)),
      currentTransactions,
      previousTransactions,
      transactionGrowth: parseFloat(transactionGrowth.toFixed(1))
    };
  }, [salesHistory, selectedPeriod, viewMode]);

  return (
    <div className={`${styles.container} ${isDark ? styles.dark : ''}`}>
      {/* En-tête avec sélecteur de période */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            📊 Tableau de Bord - {viewMode === 'consolidated' ? 'Vue consolidée' : getCurrentStore()?.code}
          </h1>
          <p className={styles.subtitle}>
            Vue d'ensemble de votre activité - {dashboardMetrics.periodLabel}
          </p>
        </div>

        <div className={styles.periodSelector}>
          {['today', 'week', 'month', 'year'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`${styles.periodButton} ${selectedPeriod === period ? styles.active : ''}`}
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
        setGlobalProducts={setGlobalProducts}
        setSalesHistory={setSalesHistory}
        setCustomers={setCustomers}
        setCredits={setCredits}
        setAppSettings={setAppSettings}
      />

      {/* Alertes */}
      <AlertsWidget
        globalProducts={globalProducts}
        credits={credits}
        showAlerts={showAlerts}
        setShowAlerts={setShowAlerts}
        isDark={isDark}
        onNavigate={onNavigate}
      />

      {/* Métriques principales avec comparaison */}
      <div className={styles.metricsGrid}>
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
          title={`Marge brute - ${dashboardMetrics.periodLabel}`}
          value={dashboardMetrics.currentMargin}
          change={dashboardMetrics.marginGrowth}
          icon={BarChart3}
          color="#14b8a6"
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
      <SalesChart
        salesHistory={salesHistory}
        selectedPeriod={selectedPeriod}
      />

      {/* Widgets d'analyse */}
      <div className={styles.chartsGrid}>
        <TopProductsWidget
          globalProducts={globalProducts}
          salesHistory={salesHistory}
          isDark={isDark}
          currency={appSettings?.currency}
        />

        {/* Statistiques détaillées */}
        <div className={styles.metricCard}>
          <h3 className={styles.detailTitle}>
            <BarChart3 size={20} />
            Statistiques Détaillées
          </h3>

          <div className={styles.detailList}>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>
                Valeur de l'inventaire
              </span>
              <span className={styles.detailItemValue}>
                {safeToLocaleString(stats?.inventoryValue)} {appSettings?.currency || 'FCFA'}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>
                Stock faible
              </span>
              <span className={`${styles.detailItemValue} ${stats?.lowStockCount > 0 ? styles.warning : styles.success}`}>
                {stats?.lowStockCount || 0} produits
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>
                Ruptures de stock
              </span>
              <span className={`${styles.detailItemValue} ${stats?.outOfStockCount > 0 ? styles.error : styles.success}`}>
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
