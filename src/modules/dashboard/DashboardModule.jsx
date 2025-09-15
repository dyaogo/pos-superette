// 📁 CORRECTION COMPLÈTE : Remplacer tout le fichier src/modules/dashboard/DashboardModule.jsx

import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  ShoppingCart, Package, Users, TrendingUp, TrendingDown, 
  ArrowUp, ArrowDown, DollarSign, AlertTriangle, 
  Calendar, Clock, Zap, Star, Target, Activity,
  PlusCircle, Search, Filter, Download, RefreshCw // ✅ CORRIGÉ
} from 'lucide-react';

const DashboardModule = () => {
  const {
    globalProducts = [],
    salesHistory = [],
    customers = [],
    credits = [],
    appSettings = {},
    currentStoreId,
    stats = {}
  } = useApp();

  const [loading, setLoading] = useState(false);

  // Calcul des statistiques en temps réel
  const dashboardStats = React.useMemo(() => {
    const today = new Date().toDateString();
    const todaySales = salesHistory.filter(sale => new Date(sale.date).toDateString() === today);
    
    const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = todaySales.length;
    const averageBasket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    const lowStockProducts = globalProducts.filter(p => p.stock <= (p.minStock || 5));
    
    // Calcul des tendances (simulation)
    const yesterdayRevenue = totalRevenue * (0.85 + Math.random() * 0.3);
    const revenueTrend = yesterdayRevenue > 0 ? ((totalRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
    
    return {
      revenue: {
        value: totalRevenue,
        trend: revenueTrend,
        icon: DollarSign,
        color: '#10b981'
      },
      transactions: {
        value: totalTransactions,
        trend: Math.random() > 0.5 ? 12.5 : -5.2,
        icon: ShoppingCart,
        color: '#3b82f6'
      },
      averageBasket: {
        value: Math.round(averageBasket),
        trend: Math.random() > 0.5 ? 8.3 : -2.1,
        icon: Target,
        color: '#8b5cf6'
      },
      lowStock: {
        value: lowStockProducts.length,
        trend: lowStockProducts.length > 5 ? 15.2 : -10.5,
        icon: AlertTriangle,
        color: '#f59e0b'
      }
    };
  }, [globalProducts, salesHistory]);

  // Composant StatCard simple
  const StatCard = ({ title, value, icon: Icon, trend, color }) => (
    <div style={{
      background: appSettings.darkMode ? '#2d3748' : 'white',
      borderRadius: '16px',
      padding: '24px',
      border: `1px solid ${appSettings.darkMode ? '#4a5568' : '#e2e8f0'}`,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.1)';
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
        opacity: 0.3,
        borderRadius: '50%'
      }} />

      {/* En-tête avec icône */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        position: 'relative'
      }}>
        <div style={{
          background: `${color}15`,
          borderRadius: '10px',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={20} color={color} />
        </div>
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: appSettings.darkMode ? '#f1f5f9' : '#374151'
        }}>
          {title}
        </span>
      </div>

      {/* Valeur principale */}
      <div style={{
        fontSize: '28px',
        fontWeight: '800',
        color: appSettings.darkMode ? '#f7fafc' : '#1a202c',
        marginBottom: '8px',
        position: 'relative'
      }}>
        {typeof value === 'number' && title.includes('Affaires') 
          ? `${value.toLocaleString()} ${appSettings.currency || 'FCFA'}`
          : value
        }
      </div>

      {/* Indicateur de tendance */}
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
          fontWeight: '600',
          width: 'fit-content'
        }}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  );

  // Ventes récentes simplifiées
  const recentSales = salesHistory.slice(0, 3);

  return (
    <div style={{
      padding: '20px',
      background: appSettings.darkMode ? '#1a202c' : '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* En-tête moderne */}
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
            color: appSettings.darkMode ? '#f7fafc' : '#1a202c',
            margin: '0 0 8px 0'
          }}>
            Tableau de Bord
          </h1>
          <p style={{
            color: appSettings.darkMode ? '#a0aec0' : '#64748b',
            fontSize: '16px',
            margin: 0
          }}>
            Vue d'ensemble • {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
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
              background: appSettings.darkMode ? '#4a5568' : '#e2e8f0',
              color: appSettings.darkMode ? '#f7fafc' : '#2d3748',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '40px',
          color: appSettings.darkMode ? '#a0aec0' : '#64748b'
        }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
          Actualisation...
        </div>
      )}

      {/* Statistiques principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <StatCard
          title="Chiffre d'Affaires"
          value={dashboardStats.revenue.value}
          icon={dashboardStats.revenue.icon}
          trend={dashboardStats.revenue.trend}
          color={dashboardStats.revenue.color}
        />
        
        <StatCard
          title="Transactions"
          value={dashboardStats.transactions.value}
          icon={dashboardStats.transactions.icon}
          trend={dashboardStats.transactions.trend}
          color={dashboardStats.transactions.color}
        />
        
        <StatCard
          title="Panier Moyen"
          value={`${dashboardStats.averageBasket.value.toLocaleString()} ${appSettings.currency || 'FCFA'}`}
          icon={dashboardStats.averageBasket.icon}
          trend={dashboardStats.averageBasket.trend}
          color={dashboardStats.averageBasket.color}
        />
        
        <StatCard
          title="Stock Faible"
          value={dashboardStats.lowStock.value}
          icon={dashboardStats.lowStock.icon}
          trend={dashboardStats.lowStock.trend}
          color={dashboardStats.lowStock.color}
        />
      </div>

      {/* Ventes récentes */}
      <div style={{
        background: appSettings.darkMode ? '#2d3748' : 'white',
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${appSettings.darkMode ? '#4a5568' : '#e2e8f0'}`,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: appSettings.darkMode ? '#f7fafc' : '#2d3748',
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
                  background: appSettings.darkMode ? '#374151' : '#f8fafc',
                  borderRadius: '8px',
                  border: `1px solid ${appSettings.darkMode ? '#4a5568' : '#e2e8f0'}`
                }}
              >
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: appSettings.darkMode ? '#f7fafc' : '#2d3748',
                    marginBottom: '4px'
                  }}>
                    Vente #{sale.id}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: appSettings.darkMode ? '#a0aec0' : '#64748b'
                  }}>
                    {new Date(sale.date).toLocaleString('fr-FR')}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#10b981'
                  }}>
                    {sale.total.toLocaleString()} {appSettings.currency || 'FCFA'}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: appSettings.darkMode ? '#a0aec0' : '#64748b'
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
            color: appSettings.darkMode ? '#a0aec0' : '#64748b'
          }}>
            <ShoppingCart size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p>Aucune vente aujourd'hui</p>
          </div>
        )}
      </div>

      {/* Animation CSS pour le spin */}
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
};

export default DashboardModule;
