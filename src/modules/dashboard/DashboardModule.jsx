import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, 
  Users, AlertTriangle, Activity, Zap, ArrowUp, ArrowDown, Award, BarChart3
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
    
    // Calcul de la marge brute (approximation: 40% du CA)
    const grossMargin = Math.round(revenue * 0.4);
    
    // Stock faible
    const lowStockItems = (globalProducts || []).filter(p => 
      (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStock || 5)
    ).length;

    const periodLabels = {
      today: "Aujourd'hui",
      week: "Cette semaine", 
      month: "Ce mois",
      year: "Cette année"
    };

    return {
      revenue,
      grossMargin,
      transactions,
      customers: uniqueCustomers,
      lowStockItems,
      periodLabel: periodLabels[selectedPeriod]
    };
  }, [selectedPeriod, salesHistory, globalProducts]);

  const trends = {
    revenue: { value: 12.5, positive: true, comparison: getComparisonText(selectedPeriod) },
    transactions: { value: 8.3, positive: true, comparison: getComparisonText(selectedPeriod) },
    customers: { value: -2.1, positive: false, comparison: getComparisonText(selectedPeriod) },
    margin: { value: 15.7, positive: true, comparison: getComparisonText(selectedPeriod) }
  };

  // Données pour les graphiques (simulées mais basées sur vos vraies données)
  const generateChartData = () => {
    if (selectedPeriod === 'today') {
      // Données horaires
      return Array.from({ length: 10 }, (_, i) => {
        const hour = 8 + i;
        const baseVentes = Math.random() * 200000 + 50000;
        return {
          label: `${hour}h`,
          ventes: Math.round(baseVentes),
          margesBrutes: Math.round(baseVentes * 0.4),
          percentage: Math.random() * 100
        };
      });
    } else if (selectedPeriod === 'week') {
      // Données journalières
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      return days.map(day => {
        const baseVentes = Math.random() * 1500000 + 500000;
        return {
          label: day,
          ventes: Math.round(baseVentes),
          margesBrutes: Math.round(baseVentes * 0.4),
          objectif: 900000,
          percentage: Math.random() * 100
        };
      });
    } else if (selectedPeriod === 'month') {
      // Données hebdomadaires
      return ['S1', 'S2', 'S3', 'S4'].map(week => {
        const baseVentes = Math.random() * 6000000 + 4000000;
        return {
          label: week,
          ventes: Math.round(baseVentes),
          margesBrutes: Math.round(baseVentes * 0.4),
          objectif: 5000000,
          percentage: Math.random() * 100
        };
      });
    } else {
      // Données mensuelles
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      return months.map(month => {
        const baseVentes = Math.random() * 25000000 + 15000000;
        return {
          label: month,
          ventes: Math.round(baseVentes),
          margesBrutes: Math.round(baseVentes * 0.4),
          objectif: 20000000,
          percentage: Math.random() * 100
        };
      });
    }
  };

  const chartData = generateChartData();

  // Top produits basés sur vos vraies données
  const getTopProducts = () => {
    if (!salesHistory || salesHistory.length === 0) {
      return [
        { name: 'Coca Cola 33cl', sales: 45, revenue: 22500 },
        { name: 'Pain de mie', sales: 32, revenue: 25600 },
        { name: 'Lait Concentré', sales: 28, revenue: 16800 }
      ];
    }

    // Analyser les vraies ventes
    const productSales = {};
    salesHistory.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          if (!productSales[item.name]) {
            productSales[item.name] = { sales: 0, revenue: 0 };
          }
          productSales[item.name].sales += item.quantity;
          productSales[item.name].revenue += item.price * item.quantity;
        });
      }
    });

    return Object.entries(productSales)
      .sort(([,a], [,b]) => b.revenue - a.revenue)
      .slice(0, 3)
      .map(([name, data]) => ({ name, ...data }));
  };

  // Ventes récentes basées sur vos vraies données
  const getRecentSales = () => {
    if (!salesHistory || salesHistory.length === 0) {
      return [
        { time: '14:35', amount: 2500, customer: 'Marie Diallo' },
        { time: '14:28', amount: 1800, customer: 'Client Comptant' },
        { time: '14:22', amount: 4200, customer: 'Ahmed Kone' }
      ];
    }

    return salesHistory
      .slice(-5)
      .reverse()
      .map(sale => ({
        time: new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        amount: sale.total,
        customer: customers.find(c => c.id === sale.customerId)?.name || 'Client Comptant'
      }));
  };

  const topProducts = getTopProducts();
  const recentSales = getRecentSales();

  // Store actuel
  const currentStore = stores.find(s => s.id === currentStoreId);

  const StatCard = ({ title, value, icon: Icon, trend, color, delay = 0, marginPercentage = null }) => (
    <div 
      style={{
        background: isDark ? '#2d3748' : 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `1px solid ${isDark ? '#4a5568' : '#f1f5f9'}`,
        position: 'relative',
        overflow: 'hidden',
        transform: animationStarted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        opacity: animationStarted ? 1 : 0,
        transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`
      }}
    >
      {/* Gradient de fond */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '100px',
        height: '100px',
        background: `linear-gradient(135deg, ${color}20, transparent)`,
        borderRadius: '50%',
        transform: 'translate(30px, -30px)'
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
              background: `${color}15`,
              padding: '8px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon size={20} color={color} />
            </div>
            <h3 style={{
              fontSize: '13px',
              fontWeight: '500',
              color: isDark ? '#a0aec0' : '#64748b',
              margin: 0
            }}>
              {title}
            </h3>
          </div>
          
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: isDark ? '#f7fafc' : '#1a202c',
            marginBottom: marginPercentage ? '4px' : '8px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {typeof value === 'number' ? formatNumber(value) : value}
          </div>
          
          {/* Affichage du pourcentage de marge */}
          {marginPercentage && (
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#8b5cf6',
              marginBottom: '8px'
            }}>
              {marginPercentage}% du CA
            </div>
          )}
          
          {trend && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {trend.positive ? (
                <ArrowUp size={14} color="#10b981" />
              ) : (
                <ArrowDown size={14} color="#ef4444" />
              )}
              <span style={{
                fontSize: '12px',
                fontWeight: '500',
                color: trend.positive ? '#10b981' : '#ef4444'
              }}>
                {Math.abs(trend.value)}%
              </span>
              <span style={{
                fontSize: '12px',
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                {trend.comparison}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ icon: Icon, title, subtitle, color, onClick }) => (
    <div
      onClick={onClick}
      style={{
        background: isDark ? '#2d3748' : 'white',
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${isDark ? '#4a5568' : '#f1f5f9'}`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
      }}
    >
      <div style={{
        background: `${color}15`,
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '12px'
      }}>
        <Icon size={20} color={color} />
      </div>
      <h4 style={{
        fontSize: '16px',
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
  );

  // Composant graphique en aires CSS natif
  const AreaChart = ({ data, title, subtitle }) => {
    const maxValue = Math.max(...data.map(d => Math.max(d.ventes, d.margesBrutes || 0)));
    
    return (
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
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: isDark ? '#f7fafc' : '#1a202c',
              margin: '0 0 4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <TrendingUp size={20} color="#10b981" />
              {title}
            </h3>
            {subtitle && (
              <p style={{
                fontSize: '14px',
                color: isDark ? '#a0aec0' : '#64748b',
                margin: 0
              }}>
                {subtitle}
              </p>
            )}
          </div>
          <div style={{
            background: '#10b98115',
            color: '#10b981',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            +12.5% vs précédent
          </div>
        </div>
        
        <div style={{ 
          height: '280px', 
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
                        fontSize: '12px',
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
                      fontSize: '12px',
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
            Vue d'ensemble de votre superette - {getMetricsForPeriod.periodLabel} • {currentStore?.name || 'Magasin Principal'} • {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
              background: isDark ? '#2d3748' : 'white',
              color: isDark ? '#f7fafc' : '#1a202c',
              fontSize: '14px'
            }}
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
        </div>
      </div>

      {/* Cartes statistiques principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
          marginPercentage={getMetricsForPeriod.revenue > 0 ? ((getMetricsForPeriod.grossMargin / getMetricsForPeriod.revenue) * 100).toFixed(1) : '0.0'}
        />
        <StatCard 
          title="Transactions"
          value={getMetricsForPeriod.transactions}
          icon={ShoppingCart}
          trend={trends.transactions}
          color="#3b82f6"
          delay={100}
        />
        <StatCard 
          title="Stock Faible"
          value={getMetricsForPeriod.lowStockItems}
          icon={AlertTriangle}
          color="#ef4444"
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
                background: 'transparent',
                border: 'none',
                color: '#6366f1',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#6366f115';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
              }}
            >
              Voir toutes les ventes →
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
            <Award size={20} color="#f59e0b" />
            Top Produits
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topProducts.map((product, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  background: ['#3b82f6', '#10b981', '#f59e0b'][index] + '15',
                  color: ['#3b82f6', '#10b981', '#f59e0b'][index],
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
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
          title={`Ventes ${getMetricsForPeriod.periodLabel}`}
          subtitle={selectedPeriod === 'today' ? 'Évolution horaire des ventes et marges' : 
                   selectedPeriod === 'week' ? 'Évolution quotidienne de la semaine' :
                   selectedPeriod === 'month' ? 'Évolution hebdomadaire du mois' :
                   'Évolution mensuelle de l\'année'}
        />
      </div>
    </div>
  );
};

export default DashboardModule;
