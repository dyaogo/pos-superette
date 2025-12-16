// Composant qui initialise le tracking Sentry utilisateur
import { useSentryUser } from '../hooks/useSentryUser';

export default function SentryProvider({ children }) {
  // Synchroniser automatiquement l'utilisateur avec Sentry
  useSentryUser();

  return children;
}
