import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import AccountingModule from '../src/modules/accounting/AccountingModule';
import { useAuth } from '../src/contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

export default function AccountingPage() {
  const router = useRouter();
  const { currentUser, hasPermission } = useAuth();
  const [currentStore, setCurrentStore] = useState(null);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    // Vérifier les permissions
    if (currentUser && !hasPermission('view_accounting')) {
      router.push('/unauthorized');
      return;
    }

    loadStores();
  }, [currentUser]);

  const loadStores = async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      setStores(data);

      // Sélectionner le magasin de l'utilisateur ou le premier
      if (currentUser?.storeId) {
        const userStore = data.find((s) => s.id === currentUser.storeId);
        setCurrentStore(userStore || data[0]);
      } else {
        setCurrentStore(data[0]);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <AccountingModule currentStore={currentStore} currentUser={currentUser} />
      </Layout>
    </ProtectedRoute>
  );
}
