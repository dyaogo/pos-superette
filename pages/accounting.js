import { useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useAuth } from '../src/contexts/AuthContext';

// Code splitting: AccountingModule chargé uniquement quand nécessaire
const AccountingModule = dynamic(
  () => import('../src/modules/accounting/AccountingModule'),
  {
    loading: () => (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Chargement du module comptabilité...</div>
        </div>
      </div>
    ),
    ssr: false
  }
);

export default function AccountingPage() {
  const router = useRouter();
  const { currentUser, hasPermission } = useAuth();

  useEffect(() => {
    // Vérifier les permissions
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Seuls les admins et managers peuvent accéder à la comptabilité
    if (!hasPermission('view_accounting')) {
      router.push('/unauthorized');
      return;
    }
  }, [currentUser, hasPermission, router]);

  if (!currentUser || !hasPermission('view_accounting')) {
    return null;
  }

  // Pas besoin de <Layout> car _app.js l'ajoute déjà automatiquement
  return <AccountingModule />;
}
