import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import AccountingModule from '../src/modules/accounting/AccountingModule';
import { useAuth } from '../src/contexts/AuthContext';

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

  return (
    <Layout>
      <AccountingModule />
    </Layout>
  );
}
