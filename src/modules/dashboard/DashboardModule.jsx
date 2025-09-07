// Dans src/modules/dashboard/DashboardModule.jsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
  Users, AlertTriangle, Activity, Zap, ArrowUp, ArrowDown, Award, BarChart3,
  Eye
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
// Supprimez cette ligne car groupSalesByPeriod n'est pas utilisé dans ce fichier
// import { groupSalesByPeriod } from './SalesChart.jsx';

const DashboardModule = ({ onNavigate }) => {
  const {
    globalProducts,
    salesHistory,
    customers,
    credits,
    appSettings,
    getStats,
    currentStoreId,
    stores,
    viewMode
  } = useApp();

  const [animationStarted, setAnimationStarted] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const isDark = appSettings.darkMode;

  useEffect(() => {
    setTimeout(() => setAnimationStarted(true), 300);
  }, []);

  // Fonction pour formater les nombres avec espaces comme séparateur de milliers
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // NOUVELLE FONCTION : Calcul des vraies tendances basées sur la comparaison avec la période précédente
  const calculateRealTrends = useMemo(() => {
    const now = new Date();
    
    // Fonction pour obtenir les dates selon la période
    const getPeriodDates = (period, offset = 0) => {
      const date = new Date(now);
      let startDate = new Date(date);
      
      switch(period) {
        case 'today':
          startDate.setDate(date.getDate() + offset);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          return { startDate, endDate };
          
        case 'week':
          startDate.setDate(date.getDate() + (offset * 7) - 7);
          startDate.setHours(0, 0, 0, 0);
          const weekEnd = new Date(startDate);
          weekEnd.setDate(startDate.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          return { startDate, endDate: weekEnd };
          
        case 'month':
          startDate = new Date(date.getFullYear(), date.getMonth() + offset, 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + offset + 1, 0);
          monthEnd.setHours(23, 59, 59, 999);
          return { startDate, endDate: monthEnd };
          
        case 'year':
          startDate = new Date(date.getFullYear() + offset, 0, 1);
          const yearEnd = new Date(date.getFullYear() + offset, 11, 31);
          yearEnd.setHours(23, 59, 59, 999);
          return { startDate, endDate: yearEnd };
          
        default:
          return { startDate: new Date(date), endDate: new Date(date) };
      }
    };

    // Obtenir les périodes actuelle et précédente
    const currentPeriod = getPeriodDates(selectedPeriod, 0);
    const previousPeriod = getPeriodDates(selectedPeriod, -1);

    // Filtrer les ventes pour chaque période
    const currentSales = (salesHistory || []).filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= currentPeriod.startDate && saleDate <= currentPeriod.endDate;
    });

    const previousSales = (salesHistory || []).filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= previousPeriod.startDate && saleDate <= previousPeriod.endDate;
    });

    // Calculer les métriques pour chaque période
    const currentRevenue = currentSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const previousRevenue = previousSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    
    const currentTransactions = currentSales.length;
    const previousTransactions = previousSales.length;
    
    const currentMargin = currentRevenue * 0.37; // 37% de marge
    const previousMargin = previousRevenue * 0.37;

    const currentBasket = currentTransactions > 0 ? currentRevenue / currentTransactions : 0;
    const previousBasket = previousTransactions > 0 ? previousRevenue / previousTransactions : 0;

    // Calculer les pourcentages de changement
    const calculateTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      revenue: calculateTrend(currentRevenue, previousRevenue),
      transactions: calculateTrend(currentTransactions, previousTransactions),
      margin: calculateTrend(currentMargin, previousMargin),
      basket: calculateTrend(currentBasket, previousBasket)
    };
  }, [selectedPeriod, salesHistory]);

  // Calcul des métriques selon la période sélectionnée (garder votre code existant)
  const getMetricsForPeriod = useMemo(() => {
    const now = new Date();
    let startDate;
    
    switch(selectedPeriod) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    }

    // Filtrer les ventes de la période
    const currentPeriodSales = (salesHistory || []).filter(sale => 
      new Date(sale.date) >= startDate
    );

    // Calculer les métriques
    const revenue = currentPeriodSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const transactions = currentPeriodSales.length;
    const uniqueCustomers = new Set(currentPeriodSales.map(sale => sale.customerId)).size;
    
    // Calcul de la marge brute (approximation: 37% du CA)
    const grossMargin = revenue * 0.37;
    
    // Panier moyen
    const avgBasket = transactions > 0 ? revenue / transactions : 0;

    // Labels de période
    const periodLabels = {
      today: "d'aujourd'hui",
      week: "de cette semaine", 
      month: "de ce mois",
      year: "de cette année"
    };

    return {
      revenue,
      transactions,
      uniqueCustomers,
      grossMargin,
      avgBasket,
      periodLabel: periodLabels[selectedPeriod] || "de la période"
    };
  }, [selectedPeriod, salesHistory]);

  // Garder votre code existant pour topProducts et recentSales
  const topProducts = useMemo(() => {
    const productSales = {};
    
    (salesHistory || []).forEach(sale => {
      (sale.items || []).forEach(item => {
        const productId = item.productId;
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.name || globalProducts?.find(p => p.id === productId)?.name || `Produit ${productId}`,
            sales: 0,
            revenue: 0
          };
        }
        productSales[productId].sales += item.quantity || 0;
        productSales[productId].revenue += (item.price || 0) * (item.quantity || 0);
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [salesHistory, globalProducts]);

  const recentSales = useMemo(() => {
    return (salesHistory || [])
      .slice(-5)
      .reverse()
      .map((sale, index) => ({
        customer: sale.customerName || customers?.find(c => c.id === sale.customerId)?.name || `Client #${sale.id || index + 1}`,
        amount: sale.total || 0,
        time: new Date(sale.date).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
  }, [salesHistory, customers]);

  // Garder votre code existant pour generateChartDataForPeriod
  const generateChartDataForPeriod = (period) => {
    // ... (garder votre code existant)
  };

  const chartData = useMemo(() => {
    return generateChartDataForPeriod(selectedPeriod);
  }, [selectedPeriod, salesHistory]);

  // REMPLACER la section trends par les vraies tendances
  // SUPPRIMEZ CETTE PARTIE:
  /*
  const trends = useMemo(() => {
    return {
      revenue: Math.random() > 0.5 ? (Math.random() * 20) : -(Math.random() * 15),
      transactions: Math.random() > 0.5 ? (Math.random() * 25) : -(Math.random() * 20),
      customers: Math.random() > 0.5 ? (Math.random() * 15) : -(Math.random() * 10),
      margin: Math.random() > 0.5 ? (Math.random() * 18) : -(Math.random() * 12)
    };
  }, [selectedPeriod]);
  */

  // COMPOSANT StatCard - garder votre code existant
  const StatCard = ({ title, value, icon: Icon, trend, color, delay = 0, marginPercentage }) => (
    // ... garder votre code existant
  );

  // COMPOSANT QuickAction - garder votre code existant  
  const QuickAction = ({ icon: Icon, title, subtitle, color, onClick }) => (
    // ... garder votre code existant
  );

  // COMPOSANT AreaChart - garder votre code existant
  const AreaChart = ({ data, title, subtitle }) => (
    // ... garder votre code existant
  );

  return (
    <div style={{
      padding: '24px',
      background: isDark ? '#1a202c' : '#f7fafc',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Garder votre en-tête existant */}

      {/* Cartes statistiques principales - CORRIGER ICI */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <StatCard 
          title="Chiffre d'Affaires"
          value={`${formatNumber(getMetricsForPeriod.revenue)} FCFA`}
          icon={DollarSign}
          trend={calculateRealTrends.revenue} // CORRIGÉ : vraie tendance
          color="#10b981"
          delay={0}
        />
        <StatCard 
          title="Marge Brute"
          value={`${formatNumber(getMetricsForPeriod.grossMargin)} FCFA`}
          icon={TrendingUp}
          trend={calculateRealTrends.margin} // CORRIGÉ : vraie tendance
          color="#8b5cf6"
          delay={50}
          marginPercentage={getMetricsForPeriod.revenue > 0 ? 
            ((getMetricsForPeriod.grossMargin / getMetricsForPeriod.revenue) * 100).toFixed(1) : 0}
        />
        <StatCard 
          title="Transactions"
          value={formatNumber(getMetricsForPeriod.transactions)}
          icon={ShoppingCart}
          trend={calculateRealTrends.transactions} // CORRIGÉ : vraie tendance
          color="#3b82f6"
          delay={100}
        />
        <StatCard 
          title="Panier Moyen"
          value={`${formatNumber(Math.round(getMetricsForPeriod.avgBasket))} FCFA`}
          icon={Award}
          trend={calculateRealTrends.basket} // CORRIGÉ : vraie tendance au lieu de Math.random()
          color="#f59e0b"
          delay={150}
        />
      </div>

      {/* Garder le reste de votre code existant */}
    </div>
  );
};

export default DashboardModule;
