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
