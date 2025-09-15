import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
  Users, AlertTriangle, Activity, Zap, ArrowUp, ArrowDown, Award, BarChart3,
  Eye
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useResponsive } from '../../components/ResponsiveComponents';

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

  const { isMobile, deviceType } = useResponsive(); // ✅ Ajout du hook responsive

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

  // Métriques pour la période sélectionnée
  const getMetricsForPeriod = useMemo(() => {
    const now = new Date();
    let filteredSales = [];

    switch (selectedPeriod) {
      case 'today':
        filteredSales = (salesHistory || []).filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        filteredSales = (salesHistory || []).filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate >= weekStart;
        });
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredSales = (salesHistory || []).filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate >= monthStart;
        });
        break;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        filteredSales = (salesHistory || []).filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate >= yearStart;
        });
        break;
      default:
        filteredSales = salesHistory || [];
    }

    const revenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const transactions = filteredSales.length;
    const avgBasket = transactions > 0 ? revenue / transactions : 0;
    const grossMargin = revenue * 0.37; // 37% de marge en moyenne

    return { revenue, transactions, avgBasket, grossMargin };
  }, [salesHistory, selectedPeriod]);

  // Calcul des tendances réelles
  const calculateRealTrends = useMemo(() => {
    const getPreviousPeriodSales = () => {
      const now = new Date();
      let currentPeriodStart, previousPeriodStart, previousPeriodEnd;

      switch (selectedPeriod) {
        case 'today':
          currentPeriodStart = new Date(now);
          currentPeriodStart.setHours(0, 0, 0, 0);
          previousPeriodStart = new Date(currentPeriodStart);
          previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
          previousPeriodEnd = new Date(currentPeriodStart);
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          currentPeriodStart = weekStart;
          previousPeriodStart = new Date(weekStart);
          previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
          previousPeriodEnd = weekStart;
          break;
        case 'month':
          currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          previousPeriodEnd = currentPeriodStart;
          break;
        case 'year':
          currentPeriodStart = new Date(now.getFullYear(), 0, 1);
          previousPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
          previousPeriodEnd = currentPeriodStart;
          break;
        default:
          return { revenue: 0, transactions: 0, avgBasket: 0, grossMargin: 0 };
      }

      const previousSales = (salesHistory || []).filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= previousPeriodStart && saleDate < previousPeriodEnd;
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

  // Génération des données pour le graphique
  const generateChartDataForPeriod = (period) => {
    const now = new Date();
    
    switch (period) {
      case 'today':
        // Données par heure pour aujourd'hui
        const todayData = [];
        for (let hour = 0; hour < 24; hour++) {
          const hourSales = (salesHistory || []).filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate.toDateString() === now.toDateString() && 
                   saleDate.getHours() === hour;
          });
          
          const sales = hourSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
          const margin = sales * 0.37;
          
          todayData.push({
            label: `${hour}h`,
            ventes: sales,
            margesBrutes: margin
          });
        }
        return todayData;
        
      case 'week':
        // Données par jour pour cette semaine
        const weekData = [];
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        
        days.forEach((day, index) => {
          const dayDate = new Date(weekStart);
          dayDate.setDate(weekStart.getDate() + index);
          
          const daySales = (salesHistory || []).filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate.toDateString() === dayDate.toDateString();
          });
          
          const sales = daySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
          const margin = sales * 0.37;
          
          weekData.push({
            label: day,
            ventes: sales,
            margesBrutes: margin
          });
        });
        return weekData;
        
      case 'month':
        // Données par semaine pour ce mois
        const monthData = [];
        const weeks = ['S1', 'S2', 'S3', 'S4'];
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        weeks.forEach((week, index) => {
          const weekStartDate = new Date(monthStart);
          weekStartDate.setDate(1 + (index * 7));
          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekStartDate.getDate() + 6);
          
          const weekSales = (salesHistory || []).filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= weekStartDate && saleDate <= weekEndDate;
          });
          
          const sales = weekSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
          const margin = sales * 0.37;
          
          monthData.push({
            label: week,
            ventes: sales,
            margesBrutes: margin
          });
        });
        return monthData;
        
      case 'year':
        // Données par mois pour cette année
        const yearData = [];
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 
                       'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const currentYear = now.getFullYear();
        
        months.forEach((month, index) => {
          const monthSales = (salesHistory || []).filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate.getFullYear() === currentYear && 
                   saleDate.getMonth() === index;
          });
          
          const sales = monthSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
          const margin = sales * 0.37;
          
          yearData.push({
            label: month,
            ventes: sales,
            margesBrutes: margin
          });
        });
        return yearData;
        
      default:
        return [];
    }
  };

  const chartData = useMemo(() => {
    return generateChartDataForPeriod(selectedPeriod);
  }, [selectedPeriod, salesHistory]);

  // ✅ NOUVEAU COMPOSANT GRAPHIQUE AVEC VALEURS
  const AreaChart = ({ data, title, subtitle }) => {
    if (!data || data.length === 0) {
      return (
        <div style={{
          background: isDark ? '#2d3748' : 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: `1px solid ${isDark ? '#4a5568' : '#f1f5f9'}`
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: isDark ? '#f7fafc' : '#1a202c',
            margin: '0 0 8px 0'
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: '14px',
            color: isDark ? '#a0aec0' : '#64748b',
            margin: '0 0 20px 0'
          }}>
            {subtitle}
          </p>
          <div style={{
            padding: '40px',
            color: isDark ? '#a0aec0' : '#64748b',
            textAlign: 'center'
          }}>
            Aucune donnée pour cette période
          </div>
        </div>
      );
    }

    // Trouver la valeur max pour normaliser les barres
    const maxValue = Math.max(...data.map(item => item.ventes || 0));

    return (
      <div style={{
        background: isDark ? '#2d3748' : 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `1px solid ${isDark ? '#4a5568' : '#f1f5f9'}`
      }}>
        {/* CSS d'animation */}
        <style>
          {`
            @keyframes growBar {
              from {
                height: 0;
                opacity: 0;
              }
              to {
                height: var(--bar-height);
                opacity: 1;
              }
            }
            .bar-animated {
              animation-fill-mode: both;
              transform-origin: bottom;
            }
          `}
        </style>

        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: isDark ? '#f7fafc' : '#1a202c',
          margin: '0 0 8px 0'
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: '14px',
          color: isDark ? '#a0aec0' : '#64748b',
          margin: '0 0 20px 0'
        }}>
          {subtitle}
        </p>
        
        <div style={{
          position: 'relative',
          background: isDark ? '#374151' : '#f8fafc',
          borderRadius: '8px',
          padding: '20px',
          overflow: 'hidden'
        }}>
          {/* Graphique en barres avec valeurs */}
          <div style={{
            display: 'flex',
            alignItems: 'end',
            gap: '12px',
            height: '250px',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            {data.map((item, index) => {
              const barHeight = maxValue > 0 ? (item.ventes / maxValue) * 180 : 0;
              
              return (
                <div key={index} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  flex: 1,
                  gap: '8px',
                  position: 'relative'
                }}>
                  {/* ✅ Valeur au-dessus de la barre */}
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#3b82f6',
                    textAlign: 'center',
                    minHeight: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.ventes > 0 ? `${formatNumber(item.ventes)}` : ''}
                  </div>
                  
                  {/* Container de la barre */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    height: '180px',
                    justifyContent: 'end',
                    position: 'relative'
                  }}>
                    {/* ✅ Barre principale avec animation */}
                    <div
                      className="bar-animated"
                      style={{
                        width: '70%',
                        height: `${barHeight}px`,
                        '--bar-height': `${barHeight}px`,
                        background: 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: item.ventes > 0 ? '4px' : '0px',
                        position: 'relative',
                        animation: `growBar 0.6s ease-out ${index * 0.1}s both`,
                        transformOrigin: 'bottom',
                        boxShadow: item.ventes > 0 ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none'
                      }}
                    >
                      {/* Effet de brillance sur la barre */}
                      {item.ventes > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '30%',
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
                          borderRadius: '4px 4px 0 0'
                        }} />
                      )}
                    </div>
                  </div>
                  
                  {/* Label en bas */}
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    color: isDark ? '#a0aec0' : '#64748b',
                    textAlign: 'center',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ✅ Statistiques en bas du graphique */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: `1px solid ${isDark ? '#4a5568' : '#e5e7eb'}`
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: '#10b981' 
              }}>
                {data.length > 0 ? formatNumber(Math.max(...data.map(d => d.ventes || 0))) : '0'}
              </div>
              <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#6b7280' }}>
                Record
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: '#3b82f6' 
              }}>
                {data.length > 0 ? formatNumber(Math.round(data.reduce((sum, d) => sum + (d.ventes || 0), 0) / data.length)) : '0'}
              </div>
              <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#6b7280' }}>
                Moyenne
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: '#7c3aed' 
              }}>
                {formatNumber(data.reduce((sum, d) => sum + (d.ventes || 0), 0))}
              </div>
              <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#6b7280' }}>
                Total
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Composant StatCard
  const StatCard = ({ title, value, icon: Icon, trend, color, delay = 0, marginPercentage }) => (
    <div
      style={{
        background: isDark ? '#2d3748' : 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `1px solid ${isDark ? '#4a5568' : '#f1f5f9'}`,
        transform: animationStarted ? 'translateY(0)' : 'translateY(20px)',
        opacity: animationStarted ? 1 : 0,
        transition: `all 0.6s ease ${delay}ms`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div style={{
          background: `${color}15`,
          padding: '12px',
          borderRadius: '12px'
        }}>
          <Icon size={24} color={color} />
        </div>
        {trend !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '20px',
            background: trend >= 0 ? '#10b98115' : '#ef444415',
            color: trend >= 0 ? '#10b981' : '#ef4444',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      
      <div style={{
        fontSize: '28px',
        fontWeight: '700',
        color: isDark ? '#f7fafc' : '#1a202c',
        marginBottom: '4px',
        lineHeight: '1.2'
      }}>
        {value}
      </div>
      
      <div style={{
        fontSize: '14px',
        color: isDark ? '#a0aec0' : '#64748b',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {title}
        {marginPercentage && (
          <span style={{
            fontSize: '12px',
            background: isDark ? '#374151' : '#f1f5f9',
            padding: '2px 6px',
            borderRadius: '4px',
            color: color
          }}>
            {marginPercentage}%
          </span>
        )}
      </div>
    </div>
  );

  // Composant QuickAction
  const QuickAction = ({ icon: Icon, title, subtitle, color, onClick }) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '20px',
        background: isDark ? '#374151' : '#f8fafc',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
        ':hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        background: `${color}15`,
        padding: '12px',
        borderRadius: '10px'
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: isDark ? '#f7fafc' : '#1a202c',
          margin: '0 0 4px 0'
        }}>
          {title}
        </h4>
        <p style={{
          fontSize: '12px',
          color: isDark ? '#a0aec0' : '#64748b',
          margin: 0
        }}>
          {subtitle}
        </p>
      </div>
    </div>
  );

  // Top produits vendus
  const topProducts = useMemo(() => {
    const productSales = {};
    
    (salesHistory || []).forEach(sale => {
      (sale.items || []).forEach(item => {
        const productId = item.productId || item.id;
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.name,
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
  }, [salesHistory]);

  return (
    <div style={{
      padding: '24px',
      background: isDark ? '#1a202c' : '#f7fafc',
      minHeight: '100vh'
    }}>
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
            fontWeight: '700',
            color: isDark ? '#f7fafc' : '#1a202c',
            margin: '0 0 8px 0'
          }}>
            Tableau de Bord
          </h1>
          <p style={{
            fontSize: '16px',
            color: isDark ? '#a0aec0' : '#64748b',
            margin: 0
          }}>
            {viewMode === 'consolidated' ? 'Vue consolidée - Tous les magasins' : 
             stores.find(s => s.id === currentStoreId)?.name || 'Vue d\'ensemble'}
          </p>
        </div>
        
        {/* Sélecteur de période */}
        <div style={{
          display: 'flex',
          background: isDark ? '#2d3748' : 'white',
          borderRadius: '12px',
          padding: '4px',
          border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
        }}>
          {['today', 'week', 'month', 'year'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                background: selectedPeriod === period ? '#3b82f6' : 'transparent',
                color: selectedPeriod === period ? 'white' : isDark ? '#a0aec0' : '#64748b',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
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

      {/* ✅ CORRECTION 1: Cartes statistiques principales - 4 sur une ligne */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile 
          ? 'repeat(2, 1fr)'      // Mobile: 2x2
          : 'repeat(4, 1fr)',     // Desktop: 4x1 (forcé sur une ligne)
        gap: isMobile ? '16px' : '24px',
        marginBottom: '32px'
      }}>
        <StatCard 
          title="Chiffre d'Affaires"
          value={`${formatNumber(getMetricsForPeriod.revenue)} FCFA`}
          icon={DollarSign}
          trend={calculateRealTrends.revenue}
          color="#10b981"
          delay={0}
        />
        <StatCard 
          title="Marge Brute"
          value={`${formatNumber(getMetricsForPeriod.grossMargin)} FCFA`}
          icon={TrendingUp}
          trend={calculateRealTrends.margin}
          color="#8b5cf6"
          delay={50}
          marginPercentage={getMetricsForPeriod.revenue > 0 ? 
            ((getMetricsForPeriod.grossMargin / getMetricsForPeriod.revenue) * 100).toFixed(1) : 0}
        />
        <StatCard 
          title="Transactions"
          value={formatNumber(getMetricsForPeriod.transactions)}
          icon={ShoppingCart}
          trend={calculateRealTrends.transactions}
          color="#3b82f6"
          delay={100}
        />
        <StatCard 
          title="Panier Moyen"
          value={`${formatNumber(Math.round(getMetricsForPeriod.avgBasket))} FCFA`}
          icon={Award}
          trend={calculateRealTrends.basket}
          color="#f59e0b"
          delay={150}
        />
      </div>

      {/* Actions rapides */}
      <div style={{
        background: isDark ? '#2d3748' : 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `1px solid ${isDark ? '#4a5568' : '#f1f5f9'}`
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: isDark ? '#f7fafc' : '#1a202c',
          margin: '0 0 20px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Zap size={20} color="#6366f1" />
          Actions Rapides
</h3>
          <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px'
    }}>
      <QuickAction
        icon={ShoppingCart}
        title="Nouvelle Vente"
        subtitle="Scanner ou saisir produits"
        color="#10b981"
        onClick={() => onNavigate('pos')}
      />
      <QuickAction
        icon={Package}
        title="Gérer Stock"
        subtitle="Inventaire et réappro"
        color="#3b82f6"
        onClick={() => onNavigate('stocks')}
      />
      <QuickAction
        icon={Users}
        title="Clients"
        subtitle="Ajouter ou modifier"
        color="#8b5cf6"
        onClick={() => onNavigate('customers')}
      />
      <QuickAction
        icon={BarChart3}
        title="Rapports"
        subtitle="Analytics et stats"
        color="#f59e0b"
        onClick={() => onNavigate('reports')}
      />
    </div>
  </div>

  {/* Section inférieure avec activité récente et top produits */}
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
    marginBottom: '32px'
  }}>
    {/* Ventes récentes */}
    <div style={{
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: `1px solid ${isDark ? '#4a5568' : '#f1f5f9'}`
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: isDark ? '#f7fafc' : '#1a202c',
          margin: 0
        }}>
          Ventes Récentes
        </h3>
        <button
          onClick={() => onNavigate('sales-history')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#3b82f6',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Eye size={16} />
          Voir tout
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(salesHistory || []).slice(0, 5).map(sale => (
          <div key={sale.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: isDark ? '#374151' : '#f8fafc',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
          }}>
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#f7fafc' : '#1a202c',
                marginBottom: '4px'
              }}>
                {sale.receiptNumber}
              </div>
              <div style={{
                fontSize: '12px',
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                {new Date(sale.date).toLocaleString('fr-FR')}
              </div>
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '700',
              color: '#10b981'
            }}>
              {formatNumber(sale.total)} FCFA
            </div>
          </div>
        ))}
        {(!salesHistory || salesHistory.length === 0) && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: isDark ? '#a0aec0' : '#64748b'
          }}>
            Aucune vente récente
          </div>
        )}
      </div>
    </div>

    {/* Top produits */}
    <div style={{
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: `1px solid ${isDark ? '#4a5568' : '#f1f5f9'}`
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: isDark ? '#f7fafc' : '#1a202c',
        margin: '0 0 20px 0'
      }}>
        Top Produits
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {topProducts.length > 0 ? topProducts.map((product, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: isDark ? '#374151' : '#f8fafc',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
          }}>
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#f7fafc' : '#1a202c',
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
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#10b981'
            }}>
              {formatNumber(product.revenue)} FCFA
            </div>
          </div>
        )) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: isDark ? '#a0aec0' : '#64748b'
          }}>
            Aucun produit vendu
          </div>
        )}
      </div>
    </div>
  </div>

  {/* ✅ CORRECTION 2: Section des graphiques avec nouveau composant */}
  <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '24px'
  }}>
    <AreaChart 
      data={chartData} 
      title={`Ventes - ${selectedPeriod === 'today' ? "Aujourd'hui" : 
                        selectedPeriod === 'week' ? 'Cette Semaine' : 
                        selectedPeriod === 'month' ? 'Ce Mois' : 'Cette Année'}`}
      subtitle={selectedPeriod === 'today' ? 'Évolution horaire des ventes et marges' : 
               selectedPeriod === 'week' ? 'Évolution quotidienne de la semaine' :
               selectedPeriod === 'month' ? 'Évolution hebdomadaire du mois' :
               selectedPeriod === 'year' ? 'Évolution mensuelle de l\'année' :
               'Évolution des ventes et marges'}
    />
  </div>
</div>
      );
};
export default DashboardModule;
