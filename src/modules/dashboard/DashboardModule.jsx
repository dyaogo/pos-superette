import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart, 
  AlertTriangle, BarChart3, Clock, Target, Eye, Bell, Calendar, 
  ArrowUp, ArrowDown, Activity, Settings, Sun, Moon, Database
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext'; // ✅ CORRECTION CRITIQUE

const DashboardModule = () => {
  const { 
    globalProducts, 
    customers, 
    salesHistory, 
    appSettings, 
    setAppSettings, 
    getStats, 
    clearAllData, 
    credits 
  } = useApp(); // ✅ CORRECTION CRITIQUE
  
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [showDataManager, setShowDataManager] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);
  
  const isDark = appSettings?.darkMode || false;
  const stats = getStats(); // Utilise la fonction existante

  // Protection contre les valeurs undefined
  const safeToLocaleString = (value) => {
    return (value || 0).toLocaleString();
  };

  // Calculs avancés pour les métriques comparatives
  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    
    // Définir les périodes
    const periods = {
      today: { start: new Date(now.setHours(0,0,0,0)), label: "Aujourd'hui" },
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
  }, [salesHistory, selectedPeriod]);

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
    alertCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px',
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '8px',
      marginBottom: '12px',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
    },
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    }
  };

  // Composant MetricCard avec protection
  const MetricCard = ({ title, value, change, icon: Icon, color, format = 'number' }) => {
    const formatValue = (val) => {
      if (format === 'currency') {
        return `${safeToLocaleString(val)} ${appSettings?.currency || 'FCFA'}`;
      }
      return safeToLocaleString(val);
    };

    const changeColor = change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280';
    const ChangeIcon = change > 0 ? ArrowUp : change < 0 ? ArrowDown : Activity;

    return (
      <div style={styles.metricCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Icon size={24} color={color} />
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: isDark ? '#f7fafc' : '#2d3748',
            margin: 0
          }}>
            {title}
          </h3>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: isDark ? '#f7fafc' : '#2d3748',
            marginBottom: '4px'
          }}>
            {formatValue(value)}
          </div>
        </div>
        
        {change !== 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            fontSize: '14px',
            color: changeColor
          }}>
            <ChangeIcon size={16} />
            <span>{Math.abs(change)}% vs période précédente</span>
          </div>
        )}
      </div>
    );
  };

  // Widget des alertes avec protection
  const AlertsWidget = () => {
    const safeProducts = globalProducts || [];
    const safeCredits = credits || [];
    
    const lowStockProducts = safeProducts.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStock || 5));
    const outOfStockProducts = safeProducts.filter(p => (p.stock || 0) === 0);
    const overdueCredits = safeCredits.filter(c => {
      if (!c.dueDate) return false;
      const dueDate = new Date(c.dueDate);
      return (c.status === 'pending' || c.status === 'partial') && dueDate < new Date();
    });

    const alerts = [];
    
    if (outOfStockProducts.length > 0) {
      alerts.push({
        type: 'error',
        icon: AlertTriangle,
        title: 'Ruptures de Stock',
        message: `${outOfStockProducts.length} produit(s) en rupture`,
        action: 'Voir Stocks'
      });
    }
    
    if (lowStockProducts.length > 0) {
      alerts.push({
        type: 'warning',
        icon: Package,
        title: 'Stock Faible',
        message: `${lowStockProducts.length} produit(s) en stock faible`,
        action: 'Réapprovisionner'
      });
    }
    
    if (overdueCredits.length > 0) {
      alerts.push({
        type: 'error',
        icon: Clock,
        title: 'Crédits en Retard',
        message: `${overdueCredits.length} crédit(s) en retard`,
        action: 'Voir Crédits'
      });
    }

    if (!showAlerts || alerts.length === 0) return null;

    return (
      <div style={{ marginBottom: '25px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '15px' 
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: isDark ? '#f7fafc' : '#2d3748', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            margin: 0
          }}>
            <Bell size={20} />
            Alertes Importantes
          </h3>
          <button
            onClick={() => setShowAlerts(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: isDark ? '#a0aec0' : '#64748b',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            Masquer
          </button>
        </div>
        
        {alerts.map((alert, index) => (
          <div key={index} style={styles.alertCard}>
            <alert.icon size={20} color={alert.type === 'error' ? '#ef4444' : '#f59e0b'} />
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontWeight: '600', 
                color: isDark ? '#f7fafc' : '#2d3748',
                marginBottom: '2px'
              }}>
                {alert.title}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: isDark ? '#a0aec0' : '#64748b'
              }}>
                {alert.message}
              </div>
            </div>
            <button style={{
              padding: '6px 12px',
              background: alert.type === 'error' ? '#ef4444' : '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}>
              {alert.action}
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Widget des produits populaires avec protection
  const TopProductsWidget = () => {
    const safeProducts = globalProducts || [];
    const safeSales = salesHistory || [];
    
    const topProducts = safeProducts.map(product => {
      const totalSold = safeSales.reduce((sum, sale) => {
        const item = (sale.items || []).find(i => i.id === product.id);
        return sum + (item ? (item.quantity || 0) : 0);
      }, 0);
      
      const totalRevenue = totalSold * (product.price || 0);
      
      return {
        ...product,
        totalSold,
        totalRevenue
      };
    })
    .filter(p => p.totalSold > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

    return (
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
          <Target size={20} />
          Produits Populaires
        </h3>
        
        {topProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: isDark ? '#a0aec0' : '#64748b',
            fontSize: '14px',
            padding: '20px'
          }}>
            Aucune vente enregistrée
          </div>
        ) : (
          <div>
            {topProducts.map((product, index) => (
              <div 
                key={product.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: index < topProducts.length - 1 
                    ? `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}` 
                    : 'none'
                }}
              >
                <div>
                  <div style={{ 
                    fontWeight: '600', 
                    color: isDark ? '#f7fafc' : '#2d3748', 
                    fontSize: '14px' 
                  }}>
                    {product.name}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: isDark ? '#a0aec0' : '#64748b' 
                  }}>
                    {product.totalSold} vendus
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#3b82f6', 
                    fontSize: '14px' 
                  }}>
                    {safeToLocaleString(product.totalRevenue)} {appSettings?.currency || 'FCFA'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Widget gestionnaire de données avec protection
  const DataManagerWidget = () => (
    <div style={styles.metricCard}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '15px' 
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: isDark ? '#f7fafc' : '#2d3748',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: 0
        }}>
          <Database size={20} />
          Sauvegarde & Synchronisation Cloud
        </h3>
        <button
          onClick={() => setShowDataManager(!showDataManager)}
          style={{
            background: 'transparent',
            border: 'none',
            color: isDark ? '#a0aec0' : '#64748b',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <Settings size={16} />
        </button>
      </div>

      {showDataManager && (
        <div>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '10px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => {
                const dataToExport = {
                  timestamp: new Date().toISOString(),
                  products: globalProducts || [],
                  sales: salesHistory || [],
                  customers: customers || [],
                  credits: credits || [],
                  settings: appSettings || {}
                };
                
                const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
                  type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              style={{
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              💾 Télécharger Sauvegarde
            </button>

            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      JSON.parse(reader.result);
                      alert('📄 Fichier valide ! Fonctionnalité d\'import en cours de développement...');
                    } catch (error) {
                      alert('❌ Fichier de sauvegarde invalide');
                    }
                  };
                  reader.readAsText(file);
                };
                input.click();
              }}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📤 Importer Sauvegarde
            </button>

            <button
              onClick={clearAllData}
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🗑️ Effacer Toutes les Données
            </button>
          </div>
          <p style={{ 
            fontSize: '12px', 
            color: isDark ? '#a0aec0' : '#718096', 
            marginTop: '10px',
            margin: 0
          }}>
            💡 Les données sont automatiquement sauvegardées localement dans votre navigateur
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      {/* En-tête avec sélecteur de période */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📊 Tableau de Bord</h1>
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
      <DataManagerWidget />

      {/* Alertes */}
      <AlertsWidget />

      {/* Métriques principales avec comparaison */}
      <div style={styles.metricsGrid}>
        <MetricCard
          title={`Chiffre d'Affaires - ${dashboardMetrics.periodLabel}`}
          value={dashboardMetrics.currentRevenue}
          change={dashboardMetrics.revenueGrowth}
          icon={DollarSign}
          color="#10b981"
          format="currency"
        />
        
        <MetricCard
          title={`Nombre de Ventes - ${dashboardMetrics.periodLabel}`}
          value={dashboardMetrics.currentTransactions}
          change={dashboardMetrics.transactionGrowth}
          icon={ShoppingCart}
          color="#3b82f6"
        />
        
        <MetricCard
          title="Produits en Stock"
          value={stats?.totalProducts || 0}
          change={0}
          icon={Package}
          color="#8b5cf6"
        />
        
        <MetricCard
          title="Clients Fidèles"
          value={stats?.totalCustomers || 0}
          change={0}
          icon={Users}
          color="#f59e0b"
        />
      </div>

      {/* Widgets d'analyse */}
      <div style={styles.chartsGrid}>
        <TopProductsWidget />
        
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
