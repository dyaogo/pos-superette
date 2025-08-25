import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CashRegisterModule from './CashRegisterModule';

jest.mock('../../contexts/AppContext', () => ({
  useApp: () => ({
    salesHistory: [],
    appSettings: { darkMode: false, currency: 'FCFA' }
  })
}));

test('affiche la caisse et ouvre la modale', () => {
  render(<CashRegisterModule />);
  expect(screen.getByText(/Gestion de Caisse/i)).toBeInTheDocument();
  fireEvent.click(screen.getAllByText(/Ouvrir la caisse/i)[0]);
  expect(screen.getByText(/Ouverture de Caisse/i)).toBeInTheDocument();
});

