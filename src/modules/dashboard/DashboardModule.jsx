import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
  Users, AlertTriangle, Activity, Zap, ArrowUp, ArrowDown, Award, BarChart3,
  Eye
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { groupSalesByPeriod } from './SalesChart.jsx';

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

  // Fonction pour obtenir le texte de comparaison selon la période
  const getComparisonText = (period) => {
    switch(period) {
      case 'today':
        return 'vs hier';
      case 'week':
        return 'vs semaine précédente';
      case 'month':
        return 'vs mois précédent';
      case 'year':
        return 'vs année précédente';
      default:
        return 'vs précédent';
    }
  };

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

  // Données pour le graphique - générer des données basées sur vos vraies données
  const chartData = useMemo(() => {
    return generateChartDataForPeriod(selectedPeriod);
  }, [selectedPeriod, salesHistory]);

  // Calcul des tendances (simulation - remplacer par vraie logique)
  const trends = useMemo(() => {
    return {
      revenue: Math.random() > 0.5 ? (Math.random() * 20) : -(Math.random() * 15),
      transactions: Math.random() > 0.5 ? (Math.random() * 25) : -(Math.random() * 20),
      customers: Math.random() > 0.5 ? (Math.random() * 15) : -(Math.random() * 10),
      margin: Math.random() > 0.5 ? (Math.random() * 18) : -(Math.random() * 12)
    };
  }, [selectedPeriod]);

  // Top produits
  const topProducts = useMemo(() => {
    const productSales = {};
    
    (salesHistory || []).forEach(sale => {
      (sale.items || []).forEach(item => {
        const productId = item.productId;
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.name || `Produit ${productId}`,
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

  // Ventes récentes
  const recentSales = useMemo(() => {
    return (salesHistory || [])
      .slice(-5)
      .reverse()
      .map((sale, index) => ({
        customer: sale.customerName || `Client #${sale.id || index + 1}`,
        amount: sale.total || 0,
        time: new Date(sale.date).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
  }, [salesHistory]);

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
              color: isDark ? '#a0aec0' : '#64748b',
              marginBottom: '8px'
            }}>
              {marginPercentage}% du CA
            </div>
          )}
          
          {trend !== undefined && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: trend > 0 ? '#10b981' : '#ef4444'
            }}>
              {trend > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              {Math.abs(trend).toFixed(1)}% {getComparisonText(selectedPeriod)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Composant QuickAction
  const QuickAction = ({ icon: Icon, title, subtitle, color, onClick }) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        background: isDark ? '#374151' : '#f8fafc',
        border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'left',
        width: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = isDark ? '#4a5568' : '#e2e8f0';
      }}
    >
      <div style={{
        padding: '8px',
        borderRadius: '8px',
        background: `${color}15`,
        color: color
      }}>
        <Icon size={20} />
      </div>
      <div>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: isDark ? '#f7fafc' : '#1a202c'
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

  // Composant AreaChart
  const AreaChart = ({ data, title, subtitle }) => {
    const maxValue = Math.max(...data.map(item => Math.max(item.ventes, item.margesBrutes || 0)));
    
    if (maxValue === 0) {
      return (
        <div style={{
          background: isDark ? '#2d3748' : 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: `1px solid ${isDark ? '#4a5568' : '#f1f5f9'}`,
          textAlign: 'center'
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
            color: isDark ? '#a0aec0' : '#64748b'
          }}>
            Aucune donnée pour cette période
          </div>
        </div>
      );
    }

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
          {/* Grille de fond */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDark ? '#4a5568' : '#e2e8f0'} strokeWidth="1" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          
          {/* Graphique en aires */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'end', 
            height: '240px', 
            gap: '8px',
            paddingTop: '20px'
          }}>
            {data.map((item, index) => (
              <div key={index} style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'end'
              }}>
                {/* Barres empilées */}
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  height: '100%',
                  justifyContent: 'end'
                }}>
                  {/* Marge brute */}
                  {item.margesBrutes && (
                    <div 
                      style={{
                        height: `${(item.margesBrutes / maxValue) * 100}%`,
                        background: 'linear-gradient(180deg, #8b5cf6, #a855f7)',
                        borderRadius: '4px 4px 0 0',
                        marginBottom: '2px',
                        minHeight: '4px',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }}
                      title={`Marge: ${formatNumber(item.margesBrutes)} FCFA`}
                    >
                      {/* Valeur au dessus */}
                      <span style={{
                        position: 'absolute',
                        top: '-22px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '14px',
                        color: '#8b5cf6',
                        fontWeight: '700',
                        whiteSpace: 'nowrap'
                      }}>
                        {formatNumber(Math.round(item.margesBrutes/1000))}k
                      </span>
                    </div>
                  )}
                  
                  {/* Ventes */}
                  <div 
                    style={{
                      height: `${(item.ventes / maxValue) * 100}%`,
                      background: 'linear-gradient(180deg, #10b981, #059669)',
                      borderRadius: item.margesBrutes ? '0 0 4px 4px' : '4px',
                      minHeight: '8px',
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}
                    title={`Ventes: ${formatNumber(item.ventes)} FCFA`}
                  >
                    {/* Valeur au dessus */}
                    <span style={{
                      position: 'absolute',
                      top: '-22px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '14px',
                      color: '#10b981',
                      fontWeight: '700',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatNumber(Math.round(item.ventes/1000))}k
                    </span>
                  </div>
                </div>
                
                {/* Label */}
                <div style={{
                  fontSize: '12px',
                  color: isDark ? '#a0aec0' : '#64748b',
                  marginTop: '8px',
                  fontWeight: '500'
                }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
          
          {/* Légende */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            display: 'flex',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#64748b' }}>Ventes</span>
            </div>
            {data[0]?.margesBrutes && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: '#8b5cf6', borderRadius: '2px' }} />
                <span style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#64748b' }}>Marges</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      padding: '24px',
      background: isDark ? '#1a202c' : '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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
          trend={trends.revenue}
          color="#10b981"
          delay={0}
        />
        <StatCard 
          title="Marge Brute"
          value={`${formatNumber(getMetricsForPeriod.grossMargin)} FCFA`}
          icon={TrendingUp}
          trend={trends.margin}
          color="#8b5cf6"
          delay={50}
          marginPercentage={getMetricsForPeriod.revenue > 0 ? 
            ((getMetricsForPeriod.grossMargin / getMetricsForPeriod.revenue) * 100).toFixed(1) : 0}
        />
        <StatCard 
          title="Transactions"
          value={formatNumber(getMetricsForPeriod.transactions)}
          icon={ShoppingCart}
          trend={trends.transactions}
          color="#3b82f6"
          delay={100}
        />
        <StatCard 
          title="Panier Moyen"
          value={`${formatNumber(Math.round(getMetricsForPeriod.avgBasket))} FCFA`}
          icon={Award}
          trend={Math.random() > 0.5 ? Math.random() * 10 : -Math.random() * 8}
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
           {recentSales.map((sale, index) => (
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
           ))}
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
           {topProducts.map((product, index) => (
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
           ))}
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
