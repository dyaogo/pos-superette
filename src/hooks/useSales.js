import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';

// Clés de cache pour React Query
export const SALES_KEY = ['sales'];

// Hook pour récupérer les ventes
export function useSales(options = {}) {
  return useQuery({
    queryKey: SALES_KEY,
    queryFn: async () => {
      const res = await fetch('/api/sales?limit=500');
      if (!res.ok) throw new Error('Failed to fetch sales');
      const data = await res.json();
      return data.data || data;
    },
    ...options,
  });
}

// Hook pour ajouter une vente
export function useAddSale() {
  return useMutation({
    mutationFn: async (saleData) => {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });
      if (!res.ok) throw new Error('Failed to add sale');
      return res.json();
    },
    onSuccess: (newSale) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(SALES_KEY, (old) => {
        if (!old) return [newSale];
        return [newSale, ...old];
      });
    },
  });
}
