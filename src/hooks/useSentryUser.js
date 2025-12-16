import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { setSentryUserContext } from '../utils/sentryContext';

/**
 * Hook qui synchronise automatiquement le contexte utilisateur avec Sentry
 * À utiliser dans _app.js ou Layout pour tracking global
 */
export function useSentryUser() {
  const { currentUser } = useAuth();

  useEffect(() => {
    // Mettre à jour le contexte Sentry quand l'utilisateur change
    setSentryUserContext(currentUser);

    // Cleanup: Supprimer le contexte utilisateur lors du démontage
    return () => {
      if (!currentUser) {
        setSentryUserContext(null);
      }
    };
  }, [currentUser]);
}
