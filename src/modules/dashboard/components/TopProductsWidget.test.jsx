import React from 'react';
import { render, screen } from '@testing-library/react';
import TopProductsWidget from './TopProductsWidget';

test('renders top products', () => {
  const products = [{ id: 1, name: 'Prod', price: 10 }];
  const sales = [{ items: [{ id: 1, quantity: 2 }] }];
  render(
    <TopProductsWidget
      globalProducts={products}
      salesHistory={sales}
      isDark={false}
      currency="FCFA"
    />
  );
  expect(screen.getByText('Prod')).toBeInTheDocument();
});
