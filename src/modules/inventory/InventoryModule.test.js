import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InventoryModule from './InventoryModule';
import { addInventoryRecord } from '../../services/inventory.service';

jest.mock('../../contexts/AppContext', () => ({
  useApp: () => ({
    globalProducts: [{ id: 1, name: 'Produit', category: 'A', stock: 10, costPrice: 5, price: 10 }],
    addProduct: jest.fn(),
    addStock: jest.fn(),
    appSettings: { darkMode: false, currency: 'FCFA' },
    salesHistory: [],
    currentStoreId: 'store1'
  })
}));

jest.mock('./BarcodeSystem', () => () => <div>BarcodeSystem</div>);
jest.mock('./PhysicalInventory', () => () => <div>PhysicalInventory</div>);
jest.mock('./TransferStock', () => () => <div>TransferStock</div>);

beforeEach(() => {
  let storage = {};
  global.localStorage = {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => {
      storage[key] = value;
    },
    removeItem: (key) => {
      delete storage[key];
    },
    clear: () => {
      storage = {};
    }
  };
});

test("affiche l'inventaire et change d'onglet", () => {
  render(<InventoryModule />);
  expect(screen.getByText(/Gestion des Stocks/i)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Produits'));
  expect(screen.getByText(/Ajouter Produit/i)).toBeInTheDocument();
  expect(screen.getByText('Importer')).toBeInTheDocument();
  expect(screen.getByText('Exporter inventaire')).toBeInTheDocument();
});

test("onglet Historique affiche les mouvements après un réapprovisionnement", () => {
  render(<InventoryModule />);
  addInventoryRecord({
    id: 1,
    storeId: 'store1',
    productId: 1,
    productName: 'Produit',
    quantity: 5,
    reason: 'Test restock',
    date: '2024-01-01T00:00:00.000Z'
  });
  fireEvent.click(screen.getByText('Historique'));
  expect(screen.getAllByText('Produit')[1]).toBeInTheDocument();
  expect(screen.getByText(/Test restock/)).toBeInTheDocument();
});

