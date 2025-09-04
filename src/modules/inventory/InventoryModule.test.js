import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InventoryModule from './InventoryModule';

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

test("affiche l'inventaire et change d'onglet", () => {
  render(<InventoryModule />);
  expect(screen.getByText(/Gestion des Stocks/i)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Produits'));
  expect(screen.getByText(/Ajouter Produit/i)).toBeInTheDocument();
  expect(screen.getByText('Importer')).toBeInTheDocument();
});

