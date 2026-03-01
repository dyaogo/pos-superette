import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useAuth } from '../src/contexts/AuthContext';
import ModuleErrorBoundary from '../src/components/ErrorBoundary/ModuleErrorBoundary';
import { FileText, BarChart2 } from 'lucide-react';

// Code splitting: modules chargés uniquement quand nécessaires
const DailyReportModule = dynamic(
  () => import('../src/modules/reports/DailyReportModule'),
  {
    loading: () => (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '16px' }}>
          Chargement du rapport journalier...
        </div>
      </div>
    ),
    ssr: false
  }
);

const AdvancedReportsModule = dynamic(
  () => import('../src/modules/reports/AdvancedReportsModule'),
  {
    loading: () => (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '16px' }}>
          Chargement des rapports avancés...
        </div>
      </div>
    ),
    ssr: false
  }
);

const TABS = [
  { id: 'daily',    label: 'Rapport journalier', icon: FileText },
  { id: 'advanced', label: 'Rapports avancés',   icon: BarChart2 },
];

export default function ReportsPage() {
  const router = useRouter();
  const { currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!hasPermission('view_reports') && !hasPermission('view_accounting')) {
      router.push('/unauthorized');
    }
  }, [currentUser, hasPermission, router]);

  if (!currentUser) return null;

  return (
    <div>
      {/* ── Barre d'onglets ──────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid var(--color-border)',
        background: 'var(--color-surface)',
        padding: '0 24px',
        gap: '4px',
      }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 20px',
                border: 'none',
                borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
                marginBottom: '-2px',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
                color: active ? '#3b82f6' : 'var(--color-text-secondary)',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Contenu de l'onglet actif ─────────────────────────────── */}
      {activeTab === 'daily' && (
        <ModuleErrorBoundary
          moduleName="Rapport Journalier"
          fallbackTitle="Erreur dans le rapport journalier"
          fallbackMessage="Une erreur est survenue lors du chargement du rapport journalier."
          onGoHome={() => router.push('/dashboards')}
          onReset={() => router.reload()}
        >
          <DailyReportModule />
        </ModuleErrorBoundary>
      )}

      {activeTab === 'advanced' && (
        <ModuleErrorBoundary
          moduleName="Rapports"
          fallbackTitle="Erreur dans le module Rapports"
          fallbackMessage="Une erreur est survenue lors du chargement du module de rapports avancés."
          onGoHome={() => router.push('/dashboards')}
          onReset={() => router.reload()}
        >
          <AdvancedReportsModule />
        </ModuleErrorBoundary>
      )}
    </div>
  );
}
