import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import POSModule from './POSModule';

jest.mock('../../contexts/AppContext', () => ({
  useApp: () => ({
    globalProducts: [
      { id: 1, name: 'Apple', category: 'Fruits', sku: 'A1', price: 100, stock: 10 },
      { id: 2, name: 'Banana', category: 'Fruits', sku: 'B1', price: 150, stock: 10 },
      { id: 3, name: 'Milk', category: 'Dairy', sku: 'M1', price: 200, stock: 10 }
    ],
    processSale: jest.fn(),
    customers: [{ id: 1, name: 'Client Comptant', points: 0 }],
    appSettings: { darkMode: false, taxRate: 0, currency: 'CFA' },
    addCredit: jest.fn()
  })
}));

jest.mock('../../components/ResponsiveComponents', () => ({
  useResponsive: () => ({ deviceType: 'desktop', isMobile: false })
}));

test('filtre les produits par catégorie', () => {
  render(<POSModule />);
  expect(screen.getByText('Apple')).toBeInTheDocument();
  expect(screen.getByText('Banana')).toBeInTheDocument();
  expect(screen.getByText('Milk')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Catégorie'), { target: { value: 'Fruits' } });

  expect(screen.getByText('Apple')).toBeInTheDocument();
  expect(screen.getByText('Banana')).toBeInTheDocument();
  expect(screen.queryByText('Milk')).not.toBeInTheDocument();
});
