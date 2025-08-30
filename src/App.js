import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import POSModule from './modules/pos/POSModule';
import SalesHistoryModule from './modules/pos/SalesHistoryModule';
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
import StoreSelector from './components/StoreSelector';
import {
  ShoppingCart,
  Package,
  Users,
  Home,
  BarChart3,
  Settings,
  Calculator,
  CreditCard,
  UserCog,
  RotateCcw,
  Receipt,
} from 'lucide-react';
import styles from './App.module.css';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Composant principal avec les Providers
function App() {
  const {
    appSettings,
    setAppSettings,
    getStats,
    globalProducts,
    salesHistory,
    customers,
    credits,
    currentStoreId
  } = useApp();
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    return <div>Erreur d\'initialisation de Firebase</div>;
  }
  const { user, role, login, logout, loading } = auth;
  const { isMobile } = useResponsive();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Effet pour le mode sombre
  useEffect(() => {
    document.body.classList.toggle('dark', appSettings.darkMode);
  }, [appSettings.darkMode]);

  useEffect(() => {
    getStats();
  }, [getStats]);

  const isDark = appSettings.darkMode;

  // Rendu conditionnel des modules avec nouvelle architecture
  const roleModules = {
    admin: [
      'dashboard',
      'pos',
      'sales-history',
      'stocks',
      'reports',
      'customers',
      'settings',
      'cash',
      'credits',
      'employees',
      'returns'
    ],
    cashier: ['dashboard', 'pos', 'sales-history', 'cash', 'customers', 'returns']
  };

  const allowedModules = role ? roleModules[role] || [] : [];

  const renderModule = () => {
    if (!allowedModules.includes(activeModule)) {
      return <div>Accès refusé</div>;
    }
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule onNavigate={setActiveModule} />;
      case 'pos':
        return <POSModule />;
      case 'sales-history':
        return <SalesHistoryModule />;
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
        return <DashboardModule onNavigate={setActiveModule} />;
    }
  };

  return (
    <ErrorBoundary fallback={<div>Une erreur est survenue.</div>}>
      <AppProvider>
        <AuthProvider>
          {loading ? (
            <LoadingSpinner />
          ) : !user ? (
            <div className={styles.container}>
              <div className={styles.loginBox}>
                <h1 className={styles.title}>POS Superette</h1>
                <p className={styles.subtitle}>Système de Point de Vente</p>
                <div className={styles.inputGroup}>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                  />
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <button
                  onClick={() =>
                    login(email, password).catch(() => alert('Échec de la connexion'))
                  }
                  className={styles.loginButton}
                >
                  Se connecter
                </button>
                <div className={styles.infoBox}>
                  <strong>Info:</strong>
                  <br />
                  Cliquez sur "Se connecter" pour accéder au système
                </div>
              </div>
            </div>
          ) : !currentStoreId ? (
            <StoreSelector modal />
          ) : (
            <div className={styles.dashboard}>
              <header className={styles.header}>
                <div className={styles.headerLeft}>
                  <h1 className={styles.headerTitle}>
                    {appSettings.storeName || 'POS Superette'}
                  </h1>
                  <StoreSelector />
                </div>
                <div className={styles.headerRight}>
                  <button
                    onClick={() =>
                      setAppSettings({ ...appSettings, darkMode: !appSettings.darkMode })
                    }
                    className={styles.iconButton}
                  >
                    {isDark ? '☀️' : '🌙'}
                  </button>
                  <button
                    className={styles.logoutButton}
                    onClick={() => {
                      logout();
                      setActiveModule('dashboard');
                    }}
                  >
                    Déconnexion
                  </button>
                </div>
              </header>
              {!isMobile && (
                <nav className={styles.nav}>
                  {allowedModules.includes('dashboard') && (
                    <button
                      className={`${styles.navButton} ${
                        activeModule === 'dashboard' ? styles.navButtonActive : ''
                      }`}
                      onClick={() => setActiveModule('dashboard')}
                    >
                      <Home size={18} />
                      Tableau de bord
                    </button>
                  )}
                  {allowedModules.includes('pos') && (
                    <button
                      className={`${styles.navButton} ${
                        activeModule === 'pos' ? styles.navButtonActive : ''
                      }`}
                      onClick={() => setActiveModule('pos')}
                    >
                      <ShoppingCart size={18} />
                      Point de Vente
                    </button>
                  )}
                  {allowedModules.includes('sales-history') && (
                    <button
                      className={`${styles.navButton} ${
                        activeModule === 'sales-history' ? styles.navButtonActive : ''
                      }`}
                      onClick={() => setActiveModule('sales-history')}
                    >
                      <Receipt size={18} />
                      Historique Ventes
                    </button>
                  )}
                  {allowedModules.includes('stocks') && (
                    <button
                      className={`${styles.navButton} ${
                        activeModule === 'stocks' ? styles.navButtonActive : ''
                      }`}
                      onClick={() => setActiveModule('stocks')}
                    >
                      <Package size={18} />
                      Stocks
                    </button>
                  )}
                  {allowedModules.includes('customers') && (
                    <button
                      className={`${styles.navButton} ${
                        activeModule === 'customers' ? styles.navButtonActive : ''
                      }`}
                      onClick={() => setActiveModule('customers')}
                    >
                      <Users size={18} />
                      Clients
                    </button>
                  )}
                  {allowedModules.includes('employees') && (
                    <button
                      className={`${styles.navButton} ${
                        activeModule === 'employees' ? styles.navButtonActive : ''
                      }`}
                      onClick={() => setActiveModule('employees')}
                    >
                      <UserCog size={18} />
                      Employés
                    </button>
                  )}
                  {allowedModules.includes('returns') && (
                    <button
                      className={`${styles.navButton} ${
                        activeModule === 'returns' ? styles.navButtonActive : ''
                      }`}
                      onClick={() => setActiveModule('returns')}
                    >
                      <RotateCcw size={18} />
                      Retours
                    </button>
                  )}
                  {allowedModules.includes('cash') && (
                    <button
                      className={`${styles.navButton} ${
                        activeModule === 'cash' ? styles.navButtonActive : ''
                      }`}
                      onClick={() => setActiveModule('cash')}
                    >
                      <Calculator size={18} />
                      Caisse
                    </button>
                  )}
                  {allowedModules.includes('credits') && (
                    <button
                      className={`${styles.navButton} ${
                        activeModule === 'credits' ? styles.navButtonActive : ''
                      }`}
                      onClick={() => setActiveModule('credits')}
                    >
                      <CreditCard size={18} />
                      Crédits
                    </button>
                  )}
                  {allowedModules.includes('reports') && (
                    <button
                      className={`${styles.navButton} ${
                        activeModule === 'reports' ? styles.navButtonActive : ''
                      }`}
                      onClick={() => setActiveModule('reports')}
                    >
                      <BarChart3 size={18} />
                      Rapports
                    </button>
                  )}
                  {allowedModules.includes('settings') && (
                    <button
                      className={`${styles.navButton} ${
                        activeModule === 'settings' ? styles.navButtonActive : ''
                      }`}
                      onClick={() => setActiveModule('settings')}
                    >
                      <Settings size={18} />
                      Paramètres
                    </button>
                  )}
                </nav>
              )}
              <main className={styles.main}>{renderModule()}</main>
              {isMobile && (
                <MobileNavigation
                  activeModule={activeModule}
                  setActiveModule={setActiveModule}
                  isDark={isDark}
                  allowedModules={allowedModules}
                />
              )}
            </div>
          )}
        </AuthProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;

