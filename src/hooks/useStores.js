import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';

// Clés de cache pour React Query
export const STORES_KEY = ['stores'];

// Hook pour récupérer les magasins
export function useStores(options = {}) {
  return useQuery({
    queryKey: STORES_KEY,
    queryFn: async () => {
      const res = await fetch('/api/stores');
      if (!res.ok) throw new Error('Failed to fetch stores');
      const data = await res.json();
      return data.data || data;
    },
    ...options,
  });
}

// Hook pour mettre à jour un magasin
export function useUpdateStore() {
  return useMutation({
    mutationFn: async ({ id, ...storeData }) => {
      const res = await fetch(`/api/stores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData),
      });
      if (!res.ok) throw new Error('Failed to update store');
      return res.json();
    },
    onSuccess: (updatedStore) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(STORES_KEY, (old) => {
        if (!old) return [updatedStore];
        return old.map((s) => (s.id === updatedStore.id ? updatedStore : s));
      });
    },
  });
}
