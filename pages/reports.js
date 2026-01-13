import { useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useAuth } from '../src/contexts/AuthContext';
import ModuleErrorBoundary from '../src/components/ErrorBoundary/ModuleErrorBoundary';

// Code splitting: AdvancedReportsModule chargé uniquement quand nécessaire
const AdvancedReportsModule = dynamic(
  () => import('../src/modules/reports/AdvancedReportsModule'),
  {
    loading: () => (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Chargement des rapports...</div>
        </div>
      </div>
    ),
    ssr: false
  }
);

export default function ReportsPage() {
  const router = useRouter();
  const { currentUser, hasPermission } = useAuth();

  useEffect(() => {
    // Vérifier les permissions
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Seuls les admins et managers peuvent accéder aux rapports
    if (!hasPermission('view_reports') && !hasPermission('view_accounting')) {
      router.push('/unauthorized');
      return;
    }
  }, [currentUser, hasPermission, router]);

  if (!currentUser) {
    return null;
  }

  return (
    <ModuleErrorBoundary
      moduleName="Rapports"
      fallbackTitle="Erreur dans le module Rapports"
      fallbackMessage="Une erreur est survenue lors du chargement du module de rapports avancés."
      onGoHome={() => router.push('/dashboards')}
      onReset={() => router.reload()}
    >
      <AdvancedReportsModule />
    </ModuleErrorBoundary>
  );
}
