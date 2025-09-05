import React from 'react';
import { render, act } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';
import { getInventoryHistory } from '../services/inventory.service';

jest.mock('../services/api', () => ({
  post: jest.fn().mockResolvedValue(null),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

test('enregistre un réapprovisionnement dans l\'historique', () => {
  localStorage.clear();
  localStorage.setItem('pos_current_store', 'wend-kuuni');
  localStorage.setItem('pos_products_catalog', JSON.stringify([{ id: 1, name: 'Produit test' }]));

  let addStockFn;
  const Collector = () => {
    const { addStock } = useApp();
    addStockFn = addStock;
    return null;
  };

  render(
    <AppProvider>
      <Collector />
    </AppProvider>
  );

  act(() => {
    addStockFn('wend-kuuni', 1, 5, 'Test restock');
  });

  const history = getInventoryHistory();
  expect(history).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        storeId: 'wend-kuuni',
        productId: 1,
        quantity: 5,
        reason: 'Test restock',
        date: expect.any(String)
      })
    ])
  );
});

test("après l'import de plusieurs produits, chaque article conserve sa quantité", async () => {
  localStorage.clear();
  localStorage.setItem('pos_current_store', 'wend-kuuni');

  let addProductFn;
  let getGlobalProducts;
  const Collector = () => {
    const { addProduct, globalProducts } = useApp();
    addProductFn = addProduct;
    getGlobalProducts = () => globalProducts;
    return null;
  };

  render(
    <AppProvider>
      <Collector />
    </AppProvider>
  );

  await act(async () => {
    addProductFn({ id: 1, name: 'Produit 1' }, 3);
    addProductFn({ id: 2, name: 'Produit 2' }, 7);
  });

  const products = getGlobalProducts();
  expect(products).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 1, stock: 3 }),
      expect.objectContaining({ id: 2, stock: 7 })
    ])
  );
});

test('removeProduct supprime le produit du catalogue et du stock de tous les magasins', async () => {
  localStorage.clear();
  localStorage.setItem('pos_current_store', 'wend-kuuni');

  let addProductFn, removeProductFn, setStockForStoreFn, getCatalog, getStock;
  const Collector = () => {
    const { addProduct, removeProduct, setStockForStore, productCatalog, stockByStore } = useApp();
    addProductFn = addProduct;
    removeProductFn = removeProduct;
    setStockForStoreFn = setStockForStore;
    getCatalog = () => productCatalog;
    getStock = () => stockByStore;
    return null;
  };

  render(
    <AppProvider>
      <Collector />
    </AppProvider>
  );

  await act(async () => {
    addProductFn({ id: 1, name: 'Produit 1' }, 5);
    setStockForStoreFn('wend-yam', { 1: 3 });
  });

  act(() => {
    removeProductFn(1);
  });

  expect(getCatalog().find(p => p.id === 1)).toBeUndefined();
  expect(getStock()['wend-kuuni']?.[1]).toBeUndefined();
  expect(getStock()['wend-yam']?.[1]).toBeUndefined();
});
