import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRoles = [], requiredPermission = null }) {
  const { currentUser, loading, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Si pas connecté, rediriger vers login
      if (!currentUser) {
        router.push('/login');
        return;
      }

      // Vérifier les rôles requis
      if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
        router.push('/unauthorized');
        return;
      }

      // Vérifier la permission requise
      if (requiredPermission && !hasPermission(requiredPermission)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [currentUser, loading, router, requiredRoles, requiredPermission]);

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--color-bg)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Vérification...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Si pas connecté ou pas les bonnes permissions, ne rien afficher
  // (la redirection se fera dans useEffect)
  if (!currentUser) {
    return null;
  }

  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  // Sinon, afficher le contenu
  return children;
}