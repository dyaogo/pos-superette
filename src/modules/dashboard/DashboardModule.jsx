import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
  Users, AlertTriangle, Activity, Zap, ArrowUp, ArrowDown, Award, BarChart3,
  Eye
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

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
    
    const currentMargin = currentRevenue * 0.37;
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

  // Calcul des métriques selon la période sélectionnée
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

  // Top produits
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

  // Ventes récentes
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

  // Fonctions pour générer les données par période
  const generateChartDataForPeriod = (period) => {
    const now = new Date();
    
    switch(period) {
      case 'today':
        // Données par heure pour aujourd'hui
        const todayData = [];
        const hours = ['08h', '10h', '12h', '14h', '16h', '18h'];
        const today = new Date().toDateString();
        
        hours.forEach(hour => {
          const hourSales = (salesHistory || []).filter(sale => {
            const saleDate = new Date(sale.date);
            const saleHour = saleDate.getHours();
            const targetHour = parseInt(hour.replace('h', ''));
            return saleDate.toDateString() === today && 
                   saleHour >= targetHour && saleHour < targetHour + 2;
          });
          
          const sales = hourSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
          const margin = sales * 0.37; // 37% de marge
          
          todayData.push({
            label: hour,
            ventes: sales,
            margesBrutes: margin
          });
        });
        return todayData;
        
      case 'week':
        // Données par jour pour cette semaine
        const weekData = [];
        const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        
        weekDays.forEach((day, index) => {
          const dayDate = new Date(weekStart);
          dayDate.setDate(weekStart.getDate() + index);
          
          const daySales = (salesHistory || []).filter(sale => 
            new Date(sale.date).toDateString() === dayDate.toDateString()
          );
          
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
      {/* Accent coloré */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: color
      }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              padding: '12px',
              borderRadius: '12px',
              background: `${color}15`,
              color: color
            }}>
              <Icon size={24} />
            </div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '500',
              color: isDark ? '#a0aec0' : '#64748b',
              margin: 0
            }}>
              {title}
            </h3>
          </div>
          
          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: isDark ? '#f7fafc' : '#1a202c',
            marginBottom: '8px'
          }}>
            {value}
          </div>

          {marginPercentage && (
            <div style={{
              fontSize: '12px',
              color: isDark ? '#a0aec0' : '#64748b'
            }}>
              Marge: {marginPercentage}%
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: '6px',
          background: trend >= 0 ? '#dcfce7' : '#fef2f2'
        }}>
          {trend >= 0 ? (
            <ArrowUp size={16} color="#16a34a" />
          ) : (
            <ArrowDown size={16} color="#dc2626" />
          )}
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: trend >= 0 ? '#16a34a' : '#dc2626'
          }}>
            {Math.abs(trend).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );

  // Composant QuickAction
  const QuickAction = ({ icon: Icon, title, subtitle, color, onClick }) => (
    <button
      onClick={onClick}
      style={{
        background: isDark ? '#374151' : '#f8fafc',
        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'left',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = 'none';
      }}
    >
      <div style={{
        padding: '12px',
        borderRadius: '12px',
        background: `${color}15`,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={24} />
      </div>
      <div>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: isDark ? '#f7fafc' : '#1a202c',
          marginBottom: '4px'
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '12px',
          color: isDark ? '#a0aec0' : '#64748b'
        }}>
          {subtitle}
        </div>
      </div>
    </button>
  );

  // Remplacer le composant AreaChart par ce nouveau composant :

const AreaChart = ({ data, title, subtitle }) => {
  const isDark = false; // récupérer depuis le contexte
  
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
          height: '250px', // ✅ Plus haut pour les valeurs
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          {data.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.ventes / maxValue) * 180 : 0; // 180px max pour laisser place aux valeurs
            
            return (
              <div key={index} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                flex: 1,
                gap: '8px',
                position: 'relative'
              }}>
                {/* Valeur au-dessus de la barre */}
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
                  {item.ventes > 0 ? `${item.ventes.toLocaleString()}` : ''}
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
                  {/* Barre principale */}
                  <div
                    style={{
                      width: '70%',
                      height: `${barHeight}px`,
                      background: 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: item.ventes > 0 ? '4px' : '0px',
                      position: 'relative',
                      transition: 'all 0.3s ease',
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

        {/* Statistiques en bas du graphique */}
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
              {data.length > 0 ? Math.max(...data.map(d => d.ventes || 0)).toLocaleString() : '0'}
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
              {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + (d.ventes || 0), 0) / data.length).toLocaleString() : '0'}
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
              {data.reduce((sum, d) => sum + (d.ventes || 0), 0).toLocaleString()}
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

  return (
    <div style={{
      padding: '24px',
      background: isDark ? '#1a202c' : '#f7fafc',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* En-tête */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: isDark ? '#f7fafc' : '#1a202c',
            margin: '0 0 8px 0'
          }}>
            Dashboard
          </h1>
          <p style={{
            fontSize: '16px',
            color: isDark ? '#a0aec0' : '#64748b',
            margin: 0
          }}>
            Vue d'ensemble de votre activité {getMetricsForPeriod.periodLabel}
          </p>
        </div>
        
        {/* Sélecteur de période */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: isDark ? '#2d3748' : 'white',
          padding: '4px',
          borderRadius: '12px',
          border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
        }}>
          {['today', 'week', 'month', 'year'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
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

      {/* Cartes statistiques principales */}
      const getGridColumns = (deviceType) => {
  switch(deviceType) {
    case 'mobile':
      return 'repeat(2, 1fr)';  // 2x2 sur mobile
    case 'tablet':
      return 'repeat(2, 1fr)';  // 2x2 sur tablette aussi
    case 'desktop':
    default:
      return 'repeat(4, 1fr)';  // 4x1 sur desktop
  }
};

<div style={{
  display: 'grid',
  gridTemplateColumns: getGridColumns(deviceType),
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
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Activity size={20} color="#6366f1" />
              Ventes Récentes
            </h3>
            <button
              onClick={() => onNavigate('sales-history')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: 'transparent',
                border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '6px',
                color: '#3b82f6',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Eye size={14} />
              Voir toutes les ventes
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentSales.length > 0 ? recentSales.map((sale, index) => (
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
                    fontWeight: '500',
                    color: isDark ? '#f7fafc' : '#1a202c'
                  }}>
                    {sale.customer}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: isDark ? '#a0aec0' : '#64748b'
                  }}>
                    {sale.time}
                  </div>
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#10b981'
                }}>
                  {formatNumber(sale.amount)} FCFA
                </div>
              </div>
            )) : (
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
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Package size={20} color="#6366f1" />
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
                    fontWeight: '500',
                    color: isDark ? '#f7fafc' : '#1a202c'
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

      {/* Section des graphiques */}
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
