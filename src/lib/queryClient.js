import { QueryClient } from '@tanstack/react-query';

// Configuration du QueryClient avec optimisations
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache les données pendant 5 minutes
      staleTime: 5 * 60 * 1000,
      // Garde les données en cache pendant 10 minutes après le dernier usage
      gcTime: 10 * 60 * 1000,
      // Retry seulement 1 fois en cas d'erreur
      retry: 1,
      // Refetch uniquement si l'onglet redevient actif ET les données sont stale
      refetchOnWindowFocus: false,
      // Ne pas refetch automatiquement au montage si les données sont fraîches
      refetchOnMount: false,
    },
    mutations: {
      // Retry des mutations en cas d'erreur réseau
      retry: 1,
    },
  },
});
