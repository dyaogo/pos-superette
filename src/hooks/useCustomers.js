import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';

// Clés de cache pour React Query
export const CUSTOMERS_KEY = ['customers'];

// Hook pour récupérer les clients
export function useCustomers(options = {}) {
  return useQuery({
    queryKey: CUSTOMERS_KEY,
    queryFn: async () => {
      const res = await fetch('/api/customers?limit=1000');
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      return data.data || data;
    },
    ...options,
  });
}

// Hook pour ajouter un client
export function useAddCustomer() {
  return useMutation({
    mutationFn: async (customerData) => {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      if (!res.ok) throw new Error('Failed to add customer');
      return res.json();
    },
    onSuccess: (newCustomer) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(CUSTOMERS_KEY, (old) => {
        if (!old) return [newCustomer];
        return [...old, newCustomer];
      });
    },
  });
}

// Hook pour mettre à jour un client
export function useUpdateCustomer() {
  return useMutation({
    mutationFn: async ({ id, ...customerData }) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      if (!res.ok) throw new Error('Failed to update customer');
      return res.json();
    },
    onSuccess: (updatedCustomer) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(CUSTOMERS_KEY, (old) => {
        if (!old) return [updatedCustomer];
        return old.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c));
      });
    },
  });
}
