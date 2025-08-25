import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import SalesModule from './modules/sales/SalesModule';
import InventoryModule from './modules/inventory/InventoryModule';
import CustomersModule from './modules/customers/CustomersModule';
import SettingsModule from './modules/settings/SettingsModule';
import CashRegisterModule from './modules/cash/CashRegisterModule';
import CreditManagementModule from './modules/credits/CreditManagementModule';
import DashboardModule from './modules/dashboard/DashboardModule';
import ReportsModule from './modules/reports/ReportsModule';
import EmployeesModule from './modules/employees/EmployeesModule';
import ReturnsModule from './modules/returns/ReturnsModule';
import { MobileNavigation, useResponsive } from './components/ResponsiveComponents';
import { ShoppingCart, Package, Users, Home, BarChart3, Settings, Calculator, CreditCard, UserCog, RotateCcw } from 'lucide-react';

// Composant principal avec le Provider
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

// Contenu de l'application
function AppContent() {
  const { 
    appSettings, 
    setAppSettings, 
    getStats,
    globalProducts,
    salesHistory,
    customers,
    credits
  } = useApp();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const { isMobile } = useResponsive();
  
  const stats = getStats();

  // Effet pour le mode sombre
  useEffect(() => {
    if (appSettings.darkMode) {
      document.body.style.background = '#1a202c';
    } else {
      document.body.style.background = '#f7fafc';
    }
  }, [appSettings.darkMode]);

  // Styles dynamiques basés sur le thème
  const isDark = appSettings.darkMode;
  const styles = {
    container: {
      minHeight: '100vh',
      background: isDark ? 'linear-gradient(135deg, #1e3a8a 0%, #581c87 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    loginBox: {
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '12px',
      padding: '40px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
      maxWidth: '400px',
      width: '100%'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: isDark ? '#f7fafc' : '#1a202c',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    },
    subtitle: {
      color: isDark ? '#a0aec0' : '#718096',
      textAlign: 'center',
      marginBottom: '30px'
    },
    dashboard: {
      minHeight: '100vh',
      background: isDark ? '#1a202c' : '#f7fafc',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      background: isDark ? '#2d3748' : 'white',
      padding: '15px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    nav: {
      background: isDark ? '#2d3748' : 'white',
      padding: '10px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      gap: '10px',
      overflowX: 'auto'
    },
    navButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: 'transparent',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      color: isDark ? '#a0aec0' : '#64748b',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap'
    },
    navButtonActive: {
      background: isDark ? '#4a5568' : '#e2e8f0',
      color: isDark ? '#f7fafc' : '#1a202c'
    },
    main: {
      flex: 1,
      padding: isMobile ? '10px' : '20px',
      paddingBottom: isMobile ? '80px' : '20px'
    }
  };

  // Rendu conditionnel des modules
  const renderModule = () => {
    switch(activeModule) {
      case 'dashboard':
        return <DashboardModule />;
      case 'sales':
        return <SalesModule />;
      case 'stocks':
        return <InventoryModule />;
      case 'reports':
        return <ReportsModule />;
      case 'customers':
        return <CustomersModule />;
      case 'settings':
        return <SettingsModule />;
      case 'cash':
        return <CashRegisterModule />;
      case 'credits':
        return <CreditManagementModule />;
      case 'employees':
        return <EmployeesModule />;
      case 'returns':
        return <ReturnsModule />;
      default:
        return <DashboardModule />;
    }
  };

  // Page de connexion
  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.loginBox}>
          <h1 style={styles.title}>
            POS Superette
          </h1>
          <p style={styles.subtitle}>Système de Point de Vente</p>
          
          <div style={{ marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="Nom d'utilisateur"
              defaultValue="admin"
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '6px',
                fontSize: '14px',
                background: isDark ? '#374151' : 'white',
                color: isDark ? '#f7fafc' : '#2d3748'
              }}
            />
            <input 
              type="password" 
              placeholder="Mot de passe"
              defaultValue="admin"
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '6px',
                fontSize: '14px',
                background: isDark ? '#374151' : 'white',
                color: isDark ? '#f7fafc' : '#2d3748'
              }}
            />
          </div>
          
          <button 
            onClick={() => setIsAuthenticated(true)}
            style={{
              width: '100%',
              padding: '12px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#2563eb'}
            onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
          >
            Se connecter
          </button>
          
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: isDark ? '#374151' : '#f0f9ff',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#4a5568' : '#cbd5e0'}`
          }}>
            <strong>Info:</strong><br/>
            Cliquez sur "Se connecter" pour accéder au système
          </div>
        </div>
      </div>
    );
  }

  // Application principale avec navigation
  return (
    <div style={styles.dashboard}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: isDark ? '#f7fafc' : '#2d3748' }}>
            {appSettings.storeName || 'POS Superette'}
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => setAppSettings({...appSettings, darkMode: !appSettings.darkMode})}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isDark ? '#f7fafc' : '#2d3748'
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          
          <button 
            style={{
              padding: '8px 20px',
              background: '#f56565',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
            onClick={() => {
              setIsAuthenticated(false);
              setActiveModule('dashboard');
            }}
          >
            Déconnexion
          </button>
        </div>
      </header>
      
      {/* Navigation */}
      {!isMobile && (
        <nav style={styles.nav}>
          <button
            style={{
              ...styles.navButton,
              ...(activeModule === 'dashboard' ? styles.navButtonActive : {})
            }}
            onClick={() => setActiveModule('dashboard')}
          >
            <Home size={18} />
            Tableau de bord
          </button>
          
          <button
            style={{
              ...styles.navButton,
              ...(activeModule === 'sales' ? styles.navButtonActive : {})
            }}
            onClick={() => setActiveModule('sales')}
          >
            <ShoppingCart size={18} />
            Ventes
          </button>
          
          <button
            style={{
              ...styles.navButton,
              ...(activeModule === 'stocks' ? styles.navButtonActive : {})
            }}
            onClick={() => setActiveModule('stocks')}
          >
            <Package size={18} />
            Stocks
          </button>
          
          <button
            style={{
              ...styles.navButton,
              ...(activeModule === 'customers' ? styles.navButtonActive : {})
            }}
            onClick={() => setActiveModule('customers')}
          >
            <Users size={18} />
            Clients
          </button>

          <button
            style={{
              ...styles.navButton,
              ...(activeModule === 'employees' ? styles.navButtonActive : {})
            }}
            onClick={() => setActiveModule('employees')}
          >
            <UserCog size={18} />
            Employés
          </button>

          <button
            style={{
              ...styles.navButton,
              ...(activeModule === 'returns' ? styles.navButtonActive : {})
            }}
            onClick={() => setActiveModule('returns')}
          >
            <RotateCcw size={18} />
            Retours
          </button>

          <button
            style={{
              ...styles.navButton,
              ...(activeModule === 'reports' ? styles.navButtonActive : {})
            }}
            onClick={() => setActiveModule('reports')}
          >
            <BarChart3 size={18} />
            Rapports
          </button>

          <button
            style={{
              ...styles.navButton,
              ...(activeModule === 'cash' ? styles.navButtonActive : {})
            }}
            onClick={() => setActiveModule('cash')}
          >
            <Calculator size={18} />
            Caisse
          </button>
          
          <button
            style={{
              ...styles.navButton,
              ...(activeModule === 'credits' ? styles.navButtonActive : {})
            }}
            onClick={() => setActiveModule('credits')}
          >
            <CreditCard size={18} />
            Crédits
          </button>

          <button
            style={{
              ...styles.navButton,
              ...(activeModule === 'settings' ? styles.navButtonActive : {})
            }}
            onClick={() => setActiveModule('settings')}
          >
            <Settings size={18} />
            Paramètres
          </button>
        </nav>
      )}
      
      <main style={styles.main}>
        {renderModule()}
      </main>

      {/* Navigation mobile */}
      {isMobile && (
        <MobileNavigation 
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          isDark={isDark}
        />
      )}
    </div>
  );
}

export default App;