// 📁 src/modules/dashboard/DashboardModule.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  ShoppingCart, Package, Users, TrendingUp, TrendingDown,
  ArrowUp, ArrowDown, DollarSign, AlertTriangle,
  Calendar, Clock, Zap, Star, Target, Activity,
  PlusCircle, Search, Filter, Download, RefreshCw, Award
} from 'lucide-react';

const DashboardModule = () => {
  const { appSettings = {} } = useApp();

  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [salesHistory, setSalesHistory] = useState([]);
  const [productCatalog, setProductCatalog] = useState([]);
  const [customers, setCustomers] = useState([]);
  const isDark = appSettings?.darkMode;

  // ✅ Charger les données depuis l'API au montage (comme dashboard.js)
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [salesRes, productsRes, customersRes] = await Promise.all([
          fetch('/api/sales?limit=1000'),
          fetch('/api/products'),
          fetch('/api/customers'),
        ]);

        const salesData = await salesRes.json();
        const productsData = await productsRes.json();
        const customersData = await customersRes.json();

        setSalesHistory(
          Array.isArray(salesData?.data) ? salesData.data :
          Array.isArray(salesData) ? salesData : []
        );
        setProductCatalog(
          Array.isArray(productsData?.data) ? productsData.data :
          Array.isArray(productsData) ? productsData : []
        );
        setCustomers(
          Array.isArray(customersData?.data) ? customersData.data :
          Array.isArray(customersData) ? customersData : []
        );
      } catch (error) {
        console.error('Erreur chargement dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Fonction utilitaire pour formater les nombres
  const formatNumber = (number) => {
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K';
    }
    return number.toString();
  };

  // Calcul des métriques pour la période sélectionnée
  const getMetricsForPeriod = useMemo(() => {
    const now = new Date();
    let startDate, endDate;

    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        endDate = new Date(weekStart);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
    }

    const periodSales = (salesHistory || []).filter(sale => {
      const saleDate = new Date(sale.createdAt || sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    const revenue = periodSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const transactions = periodSales.length;
    const avgBasket = transactions > 0 ? revenue / transactions : 0;
    const grossMargin = revenue * 0.37; // 37% de marge moyenne

    return { revenue, transactions, avgBasket, grossMargin };
  }, [salesHistory, selectedPeriod]);

  // Calcul des tendances par rapport à la période précédente
  const calculateTrends = useMemo(() => {
    const getPreviousPeriodSales = () => {
      const now = new Date();
      let previousStart, previousEnd;

      switch (selectedPeriod) {
        case 'today':
          previousStart = new Date(now);
          previousStart.setDate(now.getDate() - 1);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd = new Date(now);
          previousEnd.setDate(now.getDate() - 1);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay() - 7);
          weekStart.setHours(0, 0, 0, 0);
          previousStart = weekStart;
          previousEnd = new Date(weekStart);
          previousEnd.setDate(previousEnd.getDate() + 6);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        case 'month':
          previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        case 'year':
          previousStart = new Date(now.getFullYear() - 1, 0, 1);
          previousEnd = new Date(now.getFullYear() - 1, 11, 31);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        default:
          return { revenue: 0, transactions: 0, avgBasket: 0, grossMargin: 0 };
      }

      const previousSales = (salesHistory || []).filter(sale => {
        const saleDate = new Date(sale.createdAt || sale.date);
        return saleDate >= previousStart && saleDate <= previousEnd;
      });

      const revenue = previousSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const transactions = previousSales.length;
      const avgBasket = transactions > 0 ? revenue / transactions : 0;
      const grossMargin = revenue * 0.37;

      return { revenue, transactions, avgBasket, grossMargin };
    };

    const previous = getPreviousPeriodSales();
    const current = getMetricsForPeriod;

    const calculateTrend = (currentValue, previousValue) => {
      if (previousValue === 0) return currentValue > 0 ? 100 : 0;
      return ((currentValue - previousValue) / previousValue) * 100;
    };

    return {
      revenue: calculateTrend(current.revenue, previous.revenue),
      transactions: calculateTrend(current.transactions, previous.transactions),
      basket: calculateTrend(current.avgBasket, previous.avgBasket),
      margin: calculateTrend(current.grossMargin, previous.grossMargin)
    };
  }, [getMetricsForPeriod, salesHistory, selectedPeriod]);

  // Génération des données pour le graphique selon la période
  const chartData = useMemo(() => {
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'today':
        // Données par heure
        const todayData = [];
        for (let hour = 0; hour < 24; hour++) {
          const hourSales = salesHistory.filter(sale => {
            const saleDate = new Date(sale.createdAt || sale.date);
            return saleDate.toDateString() === now.toDateString() &&
                   saleDate.getHours() === hour;
          });
          
          const sales = hourSales.reduce((sum, sale) => sum + sale.total, 0);
          const margin = sales * 0.37;
          
          todayData.push({
            label: `${hour}h`,
            ventes: sales,
            marges: margin
          });
        }
        return todayData;
        
      case 'week':
        // Données par jour de la semaine
        const weekData = [];
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        
        for (let i = 0; i < 7; i++) {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + i);
          
          const daySales = salesHistory.filter(sale => {
            const saleDate = new Date(sale.createdAt || sale.date);
            return saleDate.toDateString() === day.toDateString();
          });
          
          const sales = daySales.reduce((sum, sale) => sum + sale.total, 0);
          const margin = sales * 0.37;
          
          weekData.push({
            label: days[i],
            ventes: sales,
            marges: margin
          });
        }
        return weekData;
        
      case 'month':
        // Données par semaine du mois
        const monthData = [];
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        for (let week = 1; week <= 4; week++) {
          const weekStart = new Date(monthStart);
          weekStart.setDate((week - 1) * 7 + 1);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          const weekSales = salesHistory.filter(sale => {
            const saleDate = new Date(sale.createdAt || sale.date);
            return saleDate >= weekStart && saleDate <= weekEnd;
          });
          
          const sales = weekSales.reduce((sum, sale) => sum + sale.total, 0);
          const margin = sales * 0.37;
          
          monthData.push({
            label: `S${week}`,
            ventes: sales,
            marges: margin
          });
        }
        return monthData;
        
      case 'year':
        // Données par mois de l'année
        const yearData = [];
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        
        for (let month = 0; month < 12; month++) {
          const monthSales = salesHistory.filter(sale => {
            const saleDate = new Date(sale.createdAt || sale.date);
            return saleDate.getFullYear() === now.getFullYear() &&
                   saleDate.getMonth() === month;
          });
          
          const sales = monthSales.reduce((sum, sale) => sum + sale.total, 0);
          const margin = sales * 0.37;
          
          yearData.push({
            label: months[month],
            ventes: sales,
            marges: margin
          });
        }
        return yearData;
        
      default:
        return [];
    }
  }, [salesHistory, selectedPeriod]);

  // Composant StatCard avec tendances
  const StatCard = ({ title, value, icon: Icon, trend, color, delay = 0, marginPercentage }) => (
    <div 
      style={{
        background: isDark ? '#2d3748' : 'white',
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        animation: 'slideUp 0.5s ease-out',
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
      }}
    >
      {/* Gradient de fond */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, ${color}15, ${color}05)`,
        opacity: 0.6,
        borderRadius: '50%'
      }} />

      {/* En-tête avec icône */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          background: `${color}15`,
          borderRadius: '12px',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={22} color={color} />
        </div>
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: isDark ? '#f1f5f9' : '#374151'
        }}>
          {title}
        </span>
      </div>

      {/* Valeur principale */}
      <div style={{
        fontSize: '32px',
        fontWeight: '800',
        color: isDark ? '#f7fafc' : '#1a202c',
        marginBottom: '12px',
        position: 'relative',
        zIndex: 1,
        lineHeight: '1.2'
      }}>
        {value}
        {marginPercentage && (
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: color,
            marginLeft: '8px',
            background: `${color}15`,
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            {marginPercentage}%
          </span>
        )}
      </div>

      {/* Indicateur de tendance */}
      {trend !== undefined && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '20px',
          background: trend >= 0 ? '#10b98115' : '#ef444415',
          color: trend >= 0 ? '#10b981' : '#ef4444',
          fontSize: '13px',
          fontWeight: '600',
          width: 'fit-content',
          position: 'relative',
          zIndex: 1
        }}>
          {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  );

  // Composant graphique simple
  const SimpleChart = ({ data, title, subtitle }) => {
    const maxValue = Math.max(...data.map(d => Math.max(d.ventes, d.marges)));
    
    return (
      <div style={{
        background: isDark ? '#2d3748' : 'white',
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: isDark ? '#f7fafc' : '#1a202c',
            margin: '0 0 4px 0'
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: '14px',
            color: isDark ? '#a0aec0' : '#64748b',
            margin: 0
          }}>
            {subtitle}
          </p>
        </div>

        <div style={{ height: '300px', position: 'relative' }}>
          {/* Légende */}
          <div style={{
            display: 'flex',
            gap: '24px',
            marginBottom: '16px',
            justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#3b82f6',
                borderRadius: '2px'
              }} />
              <span style={{
                fontSize: '12px',
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                Ventes
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#10b981',
                borderRadius: '2px'
              }} />
              <span style={{
                fontSize: '12px',
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                Marges Brutes
              </span>
            </div>
          </div>

          {/* Graphique en barres simple */}
          <div style={{
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'space-around',
            height: '250px',
            padding: '0 20px'
          }}>
            {data.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
                maxWidth: '60px'
              }}>
                {/* Barres */}
                <div style={{
                  display: 'flex',
                  alignItems: 'end',
                  gap: '2px',
                  height: '200px'
                }}>
                  {/* Barre des ventes */}
                  <div style={{
                    width: '16px',
                    height: `${maxValue > 0 ? (item.ventes / maxValue) * 180 : 2}px`,
                    backgroundColor: '#3b82f6',
                    borderRadius: '2px 2px 0 0',
                    minHeight: '2px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  title={`Ventes: ${item.ventes.toLocaleString()} FCFA`}
                  />
                  
                  {/* Barre des marges */}
                  <div style={{
                    width: '16px',
                    height: `${maxValue > 0 ? (item.marges / maxValue) * 180 : 2}px`,
                    backgroundColor: '#10b981',
                    borderRadius: '2px 2px 0 0',
                    minHeight: '2px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  title={`Marges: ${item.marges.toLocaleString()} FCFA`}
                  />
                </div>

                {/* Label */}
                <span style={{
                  fontSize: '11px',
                  color: isDark ? '#a0aec0' : '#64748b',
                  fontWeight: '500'
                }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Top produits vendus
  const topProducts = useMemo(() => {
    const productSales = {};

    salesHistory.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const productId = item.productId || item.id;
        const unitPrice = item.unitPrice || item.price || item.total / (item.quantity || 1);

        if (!productSales[productId]) {
          productSales[productId] = {
            id: productId,
            sales: 0,
            revenue: 0,
          };
        }
        productSales[productId].sales += item.quantity || 0;
        productSales[productId].revenue += unitPrice * (item.quantity || 0);
      });
    });

    // Enrichir avec les informations du catalogue
    return Object.values(productSales)
      .map((productSale) => {
        const catalogProduct = productCatalog.find(p => p.id === productSale.id);
        return {
          ...productSale,
          name: catalogProduct ? catalogProduct.name : `Produit #${productSale.id?.slice(-6) || 'inconnu'}`,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [salesHistory, productCatalog]);

  // Ventes récentes
  const recentSales = useMemo(() => {
    return [...salesHistory]
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, 5);
  }, [salesHistory]);

  // Produits en stock faible
  const lowStockProducts = useMemo(() => {
    return productCatalog.filter((p) => p.stock <= (p.minStock || 5));
  }, [productCatalog]);

  // ✅ Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div style={{
        padding: '24px',
        background: isDark ? '#1a202c' : '#f7fafc',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <RefreshCw size={48} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
        <p style={{ color: isDark ? '#a0aec0' : '#64748b', fontSize: '16px' }}>Chargement des données...</p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      background: isDark ? '#1a202c' : '#f7fafc',
      minHeight: '100vh'
    }}>
      {/* Animations CSS */}
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* En-tête avec sélecteur de période */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: isDark ? '#f7fafc' : '#1a202c',
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Tableau de Bord
          </h1>
          <p style={{
            fontSize: '16px',
            color: isDark ? '#a0aec0' : '#64748b',
            margin: 0
          }}>
            Vue d'ensemble • {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        {/* Sélecteur de période */}
        <div style={{
          display: 'flex',
          background: isDark ? '#2d3748' : 'white',
          borderRadius: '12px',
          padding: '4px',
          border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          {['today', 'week', 'month', 'year'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: '8px',
                background: selectedPeriod === period ? '#3b82f6' : 'transparent',
                color: selectedPeriod === period ? 'white' : isDark ? '#a0aec0' : '#64748b',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '14px'
              }}
            >
              {period === 'today' ? "Aujourd'hui" : 
               period === 'week' ? 'Semaine' : 
               period === 'month' ? 'Mois' : 'Année'}
            </button>
          ))}
        </div>
      </div>

      {/* Bouton actualiser */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1000);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: isDark ? '#4a5568' : '#e2e8f0',
            color: isDark ? '#f7fafc' : '#2d3748',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </div>

      {/* Statistiques principales avec marges brutes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <StatCard
          title="Chiffre d'Affaires"
          value={`${formatNumber(getMetricsForPeriod.revenue)} FCFA`}
          icon={DollarSign}
          trend={calculateTrends.revenue}
          color="#10b981"
          delay={0}
        />
        
        <StatCard
          title="Marge Brute"
          value={`${formatNumber(getMetricsForPeriod.grossMargin)} FCFA`}
          icon={TrendingUp}
          trend={calculateTrends.margin}
          color="#8b5cf6"
          delay={100}
          marginPercentage={getMetricsForPeriod.revenue > 0 ? 
            ((getMetricsForPeriod.grossMargin / getMetricsForPeriod.revenue) * 100).toFixed(1) : 0}
        />
        
        <StatCard
          title="Transactions"
          value={formatNumber(getMetricsForPeriod.transactions)}
          icon={ShoppingCart}
          trend={calculateTrends.transactions}
          color="#3b82f6"
          delay={200}
        />
        
        <StatCard
          title="Panier Moyen"
          value={`${formatNumber(Math.round(getMetricsForPeriod.avgBasket))} FCFA`}
          icon={Award}
          trend={calculateTrends.basket}
          color="#f59e0b"
          delay={300}
        />
      </div>

      {/* Graphique des ventes et marges */}
      <div style={{ marginBottom: '32px' }}>
        <SimpleChart 
          data={chartData}
          title={`Évolution des Ventes et Marges - ${
            selectedPeriod === 'today' ? "Aujourd'hui" : 
            selectedPeriod === 'week' ? 'Cette Semaine' : 
            selectedPeriod === 'month' ? 'Ce Mois' : 'Cette Année'
          }`}
          subtitle={
            selectedPeriod === 'today' ? 'Données par heure' : 
            selectedPeriod === 'week' ? 'Données par jour' :
            selectedPeriod === 'month' ? 'Données par semaine' :
            'Données par mois'
          }
        />
      </div>

      {/* Section ventes récentes et top produits */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        {/* Ventes récentes */}
        <div style={{
          background: isDark ? '#2d3748' : 'white',
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: isDark ? '#f7fafc' : '#1a202c',
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Clock size={18} color="#3b82f6" />
            Ventes Récentes
          </h3>

          {recentSales.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: isDark ? '#374151' : '#f8fafc',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: isDark ? '#f7fafc' : '#2d3748',
                      marginBottom: '4px'
                    }}>
                      Vente #{sale.id}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: isDark ? '#a0aec0' : '#64748b'
                    }}>
                      {new Date(sale.createdAt || sale.date).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#10b981'
                    }}>
                      {sale.total.toLocaleString()} FCFA
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: isDark ? '#a0aec0' : '#64748b'
                    }}>
                      {sale.items?.length || 0} article(s)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: isDark ? '#a0aec0' : '#64748b'
            }}>
              <ShoppingCart size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p>Aucune vente récente</p>
            </div>
          )}
        </div>

        {/* Top produits */}
        <div style={{
          background: isDark ? '#2d3748' : 'white',
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: isDark ? '#f7fafc' : '#1a202c',
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Star size={18} color="#f59e0b" />
            Top Produits
          </h3>

          {topProducts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topProducts.map((product, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: isDark ? '#374151' : '#f8fafc',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: '#f59e0b15',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#f59e0b'
                    }}>
                      #{index + 1}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: isDark ? '#f7fafc' : '#2d3748',
                        marginBottom: '4px'
                      }}>
                        {product.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: isDark ? '#a0aec0' : '#64748b'
                      }}>
                        {product.sales} unités vendues
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#10b981'
                  }}>
                    {formatNumber(product.revenue)} FCFA
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: isDark ? '#a0aec0' : '#64748b'
            }}>
              <Package size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p>Aucun produit vendu</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div style={{
        marginTop: '32px',
        background: isDark ? '#2d3748' : 'white',
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: isDark ? '#f7fafc' : '#1a202c',
          margin: '0 0 20px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Zap size={18} color="#3b82f6" />
          Actions Rapides
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {[
            { title: 'Nouvelle Vente', icon: PlusCircle, color: '#10b981' },
            { title: 'Ajouter Produit', icon: Package, color: '#3b82f6' },
            { title: 'Voir Rapports', icon: TrendingUp, color: '#8b5cf6' },
            { title: 'Gérer Stock', icon: AlertTriangle, color: '#f59e0b' }
          ].map((action, index) => (
            <div
              key={action.title}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: isDark ? '#374151' : '#f8fafc',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                background: `${action.color}15`,
                padding: '8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <action.icon size={20} color={action.color} />
              </div>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#f7fafc' : '#2d3748'
              }}>
                {action.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Alertes si stock faible */}
      {lowStockProducts.length > 0 && (
        <div style={{
          marginTop: '24px',
          background: 'linear-gradient(135deg, #fef3c7, #fed7af)',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #f59e0b',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <AlertTriangle size={24} color="#d97706" />
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#92400e',
              margin: '0 0 4px 0'
            }}>
              Attention : Stock Faible
            </h4>
            <p style={{
              fontSize: '14px',
              color: '#d97706',
              margin: 0
            }}>
              {lowStockProducts.length} produit(s)
              nécessitent un réapprovisionnement
            </p>
          </div>
        </div>
      )}

      {/* ✅ Vue d'ensemble (comme dashboard.js) */}
      <div style={{
        marginTop: '32px',
        background: isDark ? '#2d3748' : 'white',
        padding: '24px',
        borderRadius: '16px',
        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: isDark ? '#f7fafc' : '#1a202c',
          margin: '0 0 20px 0'
        }}>
          Vue d'ensemble
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div>
            <div style={{
              fontSize: '14px',
              color: isDark ? '#a0aec0' : '#64748b',
              marginBottom: '8px'
            }}>
              Total Produits
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: isDark ? '#f7fafc' : '#1e293b'
            }}>
              {productCatalog.length}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '14px',
              color: isDark ? '#a0aec0' : '#64748b',
              marginBottom: '8px'
            }}>
              Total Clients
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: isDark ? '#f7fafc' : '#1e293b'
            }}>
              {customers.length}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '14px',
              color: isDark ? '#a0aec0' : '#64748b',
              marginBottom: '8px'
            }}>
              Toutes Ventes
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: isDark ? '#f7fafc' : '#1e293b'
            }}>
              {salesHistory.length}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '14px',
              color: isDark ? '#a0aec0' : '#64748b',
              marginBottom: '8px'
            }}>
              CA Total
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#10b981'
            }}>
              {formatNumber(salesHistory.reduce((sum, s) => sum + (s.total || 0), 0))} FCFA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardModule;
