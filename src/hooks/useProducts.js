import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';

// Clés de cache pour React Query
export const PRODUCTS_KEY = ['products'];

// Hook pour récupérer les produits
export function useProducts(options = {}) {
  return useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: async () => {
      const res = await fetch('/api/products?limit=1000');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      return data.data || data;
    },
    ...options,
  });
}

// Hook pour ajouter un produit
export function useAddProduct() {
  return useMutation({
    mutationFn: async (productData) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (!res.ok) throw new Error('Failed to add product');
      return res.json();
    },
    onSuccess: (newProduct) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(PRODUCTS_KEY, (old) => {
        if (!old) return [newProduct];
        return [...old, newProduct].sort((a, b) => a.name.localeCompare(b.name));
      });
    },
  });
}

// Hook pour mettre à jour un produit
export function useUpdateProduct() {
  return useMutation({
    mutationFn: async ({ id, ...productData }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (!res.ok) throw new Error('Failed to update product');
      return res.json();
    },
    onSuccess: (updatedProduct) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(PRODUCTS_KEY, (old) => {
        if (!old) return [updatedProduct];
        return old.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
          .sort((a, b) => a.name.localeCompare(b.name));
      });
    },
  });
}

// Hook pour supprimer un produit
export function useDeleteProduct() {
  return useMutation({
    mutationFn: async (productId) => {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete product');
      return productId;
    },
    onSuccess: (deletedId) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(PRODUCTS_KEY, (old) => {
        if (!old) return [];
        return old.filter((p) => p.id !== deletedId);
      });
    },
  });
}

// Hook pour mettre à jour le stock d'un produit
export function useUpdateProductStock() {
  return useMutation({
    mutationFn: async ({ productId, quantitySold }) => {
      return { productId, quantitySold };
    },
    onSuccess: ({ productId, quantitySold }) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(PRODUCTS_KEY, (old) => {
        if (!old) return [];
        return old.map((p) =>
          p.id === productId
            ? { ...p, stock: Math.max(0, p.stock - quantitySold) }
            : p
        ).sort((a, b) => a.name.localeCompare(b.name));
      });
    },
  });
}
