import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Home, ShoppingCart, Package, Users, 
  Settings, FileText, BarChart, CreditCard, RotateCcw 
} from 'lucide-react';
import OfflineIndicator from './OfflineIndicator';
import DarkModeToggle from './DarkModeToggle';


export default function Layout({ children }) {
  const router = useRouter();

  if (typeof window === 'undefined') {
    return <div>{children}</div>;
  }
  
  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Tableau de bord' },
    { path: '/pos', icon: ShoppingCart, label: 'Caisse' },
    { path: '/inventory', icon: Package, label: 'Inventaire' },
    { path: '/sales', icon: FileText, label: 'Ventes' },
    { path: '/customers', icon: Users, label: 'Clients' },
    { path: '/credits', icon: CreditCard, label: 'Crédits' },
    { path: '/returns', icon: RotateCcw, label: 'Retours' },
    { path: '/reports', icon: BarChart, label: 'Rapports' },
    { path: '/settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <>
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Sidebar */}
        <nav style={{
          width: '250px',
          background: '#1f2937',
          color: 'white',
          padding: '20px 0'
        }}>
          <h2 style={{ padding: '0 20px', marginBottom: '30px' }}>
            POS Superette
          </h2>
          
          {menuItems.map(item => (
            <Link key={item.path} href={item.path}>
              <div style={{
                padding: '15px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                background: router.pathname === item.path ? '#374151' : 'transparent',
                borderLeft: router.pathname === item.path ? '3px solid #3b82f6' : '3px solid transparent',
                transition: 'all 0.2s'
              }}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Main Content */}
        <main style={{ flex: 1, overflow: 'auto', background: '#f5f5f5' }}>
          {children}
        </main>
      </div>
      
      {/* Indicateur de connexion */}
      <OfflineIndicator />
      StockAlertNotification />
      <DarkModeToggle />

    </>
  );
}