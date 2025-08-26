import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import CustomersModule from './CustomersModule';
import { AppProvider } from '../../contexts/AppContext';

beforeEach(() => {
  window.localStorage.clear();
});

test('affiche la liste des clients par défaut', () => {
  render(
    <AppProvider>
      <CustomersModule />
    </AppProvider>
  );
  expect(screen.getByText(/Aucun client enregistré/i)).toBeInTheDocument();
});

test('ajoute et supprime un client', () => {
  render(
    <AppProvider>
      <CustomersModule />
    </AppProvider>
  );

  fireEvent.change(screen.getByPlaceholderText('Nom'), { target: { value: 'Alice' } });
  fireEvent.change(screen.getByPlaceholderText('Téléphone'), { target: { value: '555' } });
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'a@a.com' } });
  fireEvent.click(screen.getByRole('button', { name: /Ajouter/i }));

  expect(screen.getByText('Alice')).toBeInTheDocument();

  window.confirm = jest.fn().mockReturnValue(true);
  const row = screen.getByText('Alice').closest('tr');
  fireEvent.click(within(row).getByRole('button'));
  expect(screen.getByText(/Aucun client enregistré/i)).toBeInTheDocument();
});

test("n'ajoute pas de client sans nom", () => {
  render(
    <AppProvider>
      <CustomersModule />
    </AppProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /Ajouter/i }));
  expect(screen.getByText(/Aucun client enregistré/i)).toBeInTheDocument();
});
