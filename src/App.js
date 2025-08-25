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
import styles from './App.module.css';

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
    document.body.classList.toggle('dark', appSettings.darkMode);
  }, [appSettings.darkMode]);

  const isDark = appSettings.darkMode;

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
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <h1 className={styles.title}>
            POS Superette
          </h1>
          <p className={styles.subtitle}>Système de Point de Vente</p>

          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              defaultValue="admin"
              className={styles.input}
            />
            <input
              type="password"
              placeholder="Mot de passe"
              defaultValue="admin"
              className={styles.input}
            />
          </div>

          <button
            onClick={() => setIsAuthenticated(true)}
            className={styles.loginButton}
          >
            Se connecter
          </button>

          <div className={styles.infoBox}>
            <strong>Info:</strong><br/>
            Cliquez sur "Se connecter" pour accéder au système
          </div>
        </div>
      </div>
    );
  }

  // Application principale avec navigation
  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.headerTitle}>
            {appSettings.storeName || 'POS Superette'}
          </h1>
        </div>

        <div className={styles.headerRight}>
          <button
            onClick={() => setAppSettings({ ...appSettings, darkMode: !appSettings.darkMode })}
            className={styles.iconButton}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          <button
            className={styles.logoutButton}
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
        <nav className={styles.nav}>
          <button
            className={`${styles.navButton} ${activeModule === 'dashboard' ? styles.navButtonActive : ''}`}
            onClick={() => setActiveModule('dashboard')}
          >
            <Home size={18} />
            Tableau de bord
          </button>

          <button
            className={`${styles.navButton} ${activeModule === 'sales' ? styles.navButtonActive : ''}`}
            onClick={() => setActiveModule('sales')}
          >
            <ShoppingCart size={18} />
            Ventes
          </button>

          <button
            className={`${styles.navButton} ${activeModule === 'stocks' ? styles.navButtonActive : ''}`}
            onClick={() => setActiveModule('stocks')}
          >
            <Package size={18} />
            Stocks
          </button>

          <button
            className={`${styles.navButton} ${activeModule === 'customers' ? styles.navButtonActive : ''}`}
            onClick={() => setActiveModule('customers')}
          >
            <Users size={18} />
            Clients
          </button>

          <button
            className={`${styles.navButton} ${activeModule === 'employees' ? styles.navButtonActive : ''}`}
            onClick={() => setActiveModule('employees')}
          >
            <UserCog size={18} />
            Employés
          </button>

          <button
            className={`${styles.navButton} ${activeModule === 'returns' ? styles.navButtonActive : ''}`}
            onClick={() => setActiveModule('returns')}
          >
            <RotateCcw size={18} />
            Retours
          </button>

          <button
            className={`${styles.navButton} ${activeModule === 'reports' ? styles.navButtonActive : ''}`}
            onClick={() => setActiveModule('reports')}
          >
            <BarChart3 size={18} />
            Rapports
          </button>

          <button
            className={`${styles.navButton} ${activeModule === 'cash' ? styles.navButtonActive : ''}`}
            onClick={() => setActiveModule('cash')}
          >
            <Calculator size={18} />
            Caisse
          </button>

          <button
            className={`${styles.navButton} ${activeModule === 'credits' ? styles.navButtonActive : ''}`}
            onClick={() => setActiveModule('credits')}
          >
            <CreditCard size={18} />
            Crédits
          </button>

          <button
            className={`${styles.navButton} ${activeModule === 'settings' ? styles.navButtonActive : ''}`}
            onClick={() => setActiveModule('settings')}
          >
            <Settings size={18} />
            Paramètres
          </button>
        </nav>
      )}

      <main className={styles.main}>
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