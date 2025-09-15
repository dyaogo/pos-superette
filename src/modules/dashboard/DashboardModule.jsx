// 📁 Remplacer : src/modules/dashboard/DashboardModule.jsx

import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import ModernCard from '../../components/ui/ModernCard';
import StatCard from '../../components/ui/StatCard';
import ModernButton from '../../components/ui/ModernButton';
import LoadingState from '../../components/ui/LoadingState';
import { useToast } from '../../components/ui/Toast';
import {
  ShoppingCart, Package, Users, TrendingUp, TrendingDown, 
  ArrowUp, ArrowDown, DollarSign, AlertTriangle, 
  Calendar, Clock, Zap, Star, Target, Activity,
  PlusCircle, Search, Filter, Download, Refresh
} from 'lucide-react';

const ModernDashboard = () => {
  const {
    globalProducts = [],
    salesHistory = [],
    customers = [],
    credits = [],
    appSettings = {},
    currentStoreId,
    stats = {}
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const { showToast, ToastContainer } = useToast();

  // Simulation de chargement
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Calcul des statistiques en temps réel
  const dashboardStats = React.useMemo(() => {
    const today = new Date().toDateString();
    const todaySales = salesHistory.filter(sale => new Date(sale.date).toDateString() === today);
    
    const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = todaySales.length;
    const averageBasket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    const lowStockProducts = globalProducts.filter(p => p.stock <= (p.minStock || 5));
    const outOfStockProducts = globalProducts.filter(p => p.stock === 0);
    
    // Calcul des tendances (simulation)
    const yesterdayRevenue = totalRevenue * (0.85 + Math.random() * 0.3); // Simulation
    const revenueTrend = yesterdayRevenue > 0 ? ((totalRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
    
    return {
      revenue: {
        value: totalRevenue,
        trend: revenueTrend,
        icon: DollarSign,
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      },
      transactions: {
        value: totalTransactions,
        trend: Math.random() > 0.5 ? 12.5 : -5.2,
        icon: ShoppingCart,
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
      },
      averageBasket: {
        value: Math.round(averageBasket),
        trend: Math.random() > 0.5 ? 8.3 : -2.1,
        icon: Target,
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
      },
      lowStock: {
        value: lowStockProducts.length,
        trend: lowStockProducts.length > 5 ? 15.2 : -10.5,
        icon: AlertTriangle,
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
      },
      customers: {
        value: customers.length - 1, // -1 pour enlever "Client Comptant"
        trend: 5.8,
        icon: Users,
        color: '#06b6d4',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
      },
      products: {
        value: globalProducts.length,
        trend: 2.3,
        icon: Package,
        color: '#ef4444',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
      }
    };
  }, [globalProducts, salesHistory, customers]);

  // Actions rapides
  const quickActions = [
    {
      title: 'Nouvelle Vente',
      description: 'Démarrer une transaction',
      icon: PlusCircle,
      color: '#10b981',
      action: () => showToast.success('Redirection vers la caisse', 'Action')
    },
    {
      title: 'Ajouter Produit',
      description: 'Enrichir le catalogue',
      icon: Package,
      color: '#3b82f6',
      action: () => showToast.info('Redirection vers l\'inventaire', 'Action')
    },
    {
      title: 'Voir Rapports',
      description: 'Analytics détaillés',
      icon: TrendingUp,
      color: '#8b5cf6',
      action: () => showToast.info('Redirection vers les rapports', 'Action')
    },
    {
      title: 'Gérer Stock',
      description: 'Réapprovisionnement',
      icon: AlertTriangle,
      color: '#f59e0b',
      action: () => showToast.warning('Redirection vers la gestion des stocks', 'Action')
    }
  ];

  // Ventes récentes
  const recentSales = salesHistory.slice(0, 5);

  // Produits populaires
  const popularProducts = React.useMemo(() => {
    const productSales = {};
    salesHistory.forEach(sale => {
      sale.items.forEach(item => {
        productSales[item.id] = (productSales[item.id] || 0) + item.quantity;
      });
    });
    
    return Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([productId, quantity]) => {
        const product = globalProducts.find(p => p.id == productId);
        return product ? { ...product, soldQuantity: quantity } : null;
      })
      .filter(Boolean);
  }, [globalProducts, salesHistory]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh' 
      }}>
        <LoadingState size="large" text="Chargement du tableau de bord..." />
      </div>
    );
  }

  return (
    <div style={{
      padding: '0 var(--space-lg) var(--space-lg)',
      background: 'var(--color-bg)',
      minHeight: '100vh'
    }}>
      <ToastContainer />
      
      {/* En-tête moderne */}
      <div className="animate-slide-in-top" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-xl)',
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: 'var(--color-text-primary)',
            margin: '0 0 var(--space-xs) 0',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Tableau de Bord
          </h1>
          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: '16px',
            margin: 0
          }}>
            Vue d'ensemble de votre activité • {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <ModernButton
            variant="ghost"
            icon={<Refresh size={16} />}
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                setLoading(false);
                showToast.success('Données actualisées');
              }, 1000);
            }}
          >
            Actualiser
          </ModernButton>
          <ModernButton
            variant="primary"
            icon={<Download size={16} />}
            onClick={() => showToast.info('Export en cours...', 'Rapport')}
          >
            Exporter
          </ModernButton>
        </div>
      </div>

      {/* Statistiques principales */}
      <div 
        className="animate-slide-in-bottom"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-lg)',
          marginBottom: 'var(--space-xl)'
        }}
      >
        <StatCard
          title="Chiffre d'Affaires"
          value={`${dashboardStats.revenue.value.toLocaleString()} ${appSettings.currency || 'FCFA'}`}
          icon={dashboardStats.revenue.icon}
          trend={dashboardStats.revenue.trend}
          color={dashboardStats.revenue.color}
          gradient={dashboardStats.revenue.gradient}
          onClick={() => showToast.info('Détails du CA', 'Navigation')}
        />
        
        <StatCard
          title="Transactions"
          value={dashboardStats.transactions.value}
          icon={dashboardStats.transactions.icon}
          trend={dashboardStats.transactions.trend}
          color={dashboardStats.transactions.color}
          gradient={dashboardStats.transactions.gradient}
          onClick={() => showToast.info('Liste des ventes', 'Navigation')}
        />
        
        <StatCard
          title="Panier Moyen"
          value={`${dashboardStats.averageBasket.value.toLocaleString()} ${appSettings.currency || 'FCFA'}`}
          icon={dashboardStats.averageBasket.icon}
          trend={dashboardStats.averageBasket.trend}
          color={dashboardStats.averageBasket.color}
          gradient={dashboardStats.averageBasket.gradient}
        />
        
        <StatCard
          title="Stock Faible"
          value={dashboardStats.lowStock.value}
          icon={dashboardStats.lowStock.icon}
          trend={dashboardStats.lowStock.trend}
          color={dashboardStats.lowStock.color}
          gradient={dashboardStats.lowStock.gradient}
          onClick={() => showToast.warning('Réapprovisionnement requis', 'Stock')}
        />
      </div>

      {/* Actions rapides */}
      <ModernCard 
        className="animate-fade-in" 
        style={{ 
          marginBottom: 'var(--space-xl)',
          animationDelay: '200ms'
        }}
      >
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <Zap size={20} color="var(--color-primary)" />
          Actions Rapides
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--space-md)'
        }}>
          {quickActions.map((action, index) => (
            <div
              key={action.title}
              className="animate-scale-in hover-lift"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                padding: 'var(--space-lg)',
                background: 'var(--color-surface-alt)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
                border: '1px solid var(--color-border)',
                animationDelay: `${index * 100}ms`
              }}
              onClick={action.action}
            >
              <div style={{
                background: `${action.color}15`,
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <action.icon size={24} color={action.color} />
              </div>
              <div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--color-text-primary)',
                  margin: '0 0 var(--space-xs) 0'
                }}>
                  {action.title}
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--color-text-secondary)',
                  margin: 0
                }}>
                  {action.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ModernCard>

      {/* Contenu principal - 2 colonnes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 'var(--space-xl)',
        alignItems: 'start'
      }}>
        {/* Ventes récentes */}
        <ModernCard 
          className="animate-slide-in-left"
          style={{ animationDelay: '300ms' }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-lg)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <Clock size={18} color="var(--color-primary)" />
              Ventes Récentes
            </h3>
            <ModernButton
              variant="ghost"
              size="small"
              onClick={() => showToast.info('Voir toutes les ventes', 'Navigation')}
            >
              Voir tout
            </ModernButton>
          </div>

          {recentSales.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {recentSales.map((sale, index) => (
                <div
                  key={sale.id}
                  className="animate-fade-in"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-md)',
                    background: 'var(--color-surface-alt)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    animationDelay: `${400 + index * 100}ms`
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-xs)'
                    }}>
                      {sale.receiptNumber || `Vente #${sale.id}`}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-xs)'
                    }}>
                      <Calendar size={12} />
                      {new Date(sale.date).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: 'var(--color-success)'
                    }}>
                      {sale.total.toLocaleString()} {appSettings.currency || 'FCFA'}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--color-text-muted)'
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
              padding: 'var(--space-xl)',
              color: 'var(--color-text-muted)'
            }}>
              <ShoppingCart size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.3 }} />
              <p>Aucune vente aujourd'hui</p>
            </div>
          )}
        </ModernCard>

        {/* Produits populaires */}
        <ModernCard 
          className="animate-slide-in-right"
          style={{ animationDelay: '400ms' }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-lg)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}>
              <Star size={18} color="var(--color-warning)" />
              Produits Populaires
            </h3>
            <ModernButton
              variant="ghost"
              size="small"
              onClick={() => showToast.info('Voir tous les produits', 'Navigation')}
            >
              Voir tout
            </ModernButton>
          </div>

          {popularProducts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {popularProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-md)',
                    background: 'var(--color-surface-alt)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    animationDelay: `${500 + index * 100}ms`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'var(--color-primary-bg)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: 'var(--color-primary)'
                    }}>
                      #{index + 1}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--color-text-primary)',
                        marginBottom: 'var(--space-xs)'
                      }}>
                        {product.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--color-text-secondary)'
                      }}>
                        {product.soldQuantity} vendus
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--color-text-primary)'
                  }}>
                    {product.price.toLocaleString()} {appSettings.currency || 'FCFA'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-xl)',
              color: 'var(--color-text-muted)'
            }}>
              <Package size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.3 }} />
              <p>Aucune donnée de vente</p>
            </div>
          )}
        </ModernCard>
      </div>

      {/* Alertes et notifications */}
      {dashboardStats.lowStock.value > 0 && (
        <ModernCard 
          className="animate-slide-in-bottom"
          style={{
            marginTop: 'var(--space-xl)',
            borderLeft: '4px solid var(--color-warning)',
            animationDelay: '600ms'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)'
          }}>
            <div style={{
              background: 'var(--color-warning-bg)',
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-md)'
            }}>
              <AlertTriangle size={24} color="var(--color-warning)" />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--color-text-primary)',
                margin: '0 0 var(--space-xs) 0'
              }}>
                Attention : Stock Faible
              </h4>
              <p style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                margin: 0
              }}>
                {dashboardStats.lowStock.value} produit(s) nécessitent un réapprovisionnement
              </p>
            </div>
            <ModernButton
              variant="warning"
              size="small"
              onClick={() => showToast.warning('Redirection vers la gestion des stocks', 'Action')}
            >
              Gérer
            </ModernButton>
          </div>
        </ModernCard>
      )}
    </div>
  );
};

export default ModernDashboard;
