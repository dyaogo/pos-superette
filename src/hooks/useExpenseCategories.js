import { useQuery } from '@tanstack/react-query';

// Clés de cache pour React Query
export const EXPENSE_CATEGORIES_KEY = ['expenseCategories'];

// Hook pour récupérer les catégories de dépenses
export function useExpenseCategories(options = {}) {
  return useQuery({
    queryKey: EXPENSE_CATEGORIES_KEY,
    queryFn: async () => {
      const res = await fetch('/api/accounting/categories');
      if (!res.ok) throw new Error('Failed to fetch expense categories');
      return res.json();
    },
    // Cache plus longtemps car les catégories changent rarement
    staleTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
}
