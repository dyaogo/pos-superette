import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import EmployeesModule from './EmployeesModule';
import { AppProvider } from '../../contexts/AppContext';

beforeEach(() => {
  window.localStorage.clear();
});

test('affiche la liste des employés par défaut', () => {
  render(
    <AppProvider>
      <EmployeesModule />
    </AppProvider>
  );
  expect(screen.getByText(/Aucun employé/i)).toBeInTheDocument();
});

test('ajoute et supprime un employé', () => {
  render(
    <AppProvider>
      <EmployeesModule />
    </AppProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /Ajouter/i }));
  fireEvent.change(screen.getByPlaceholderText('Nom'), { target: { value: 'Jean' } });
  fireEvent.change(screen.getByPlaceholderText('Rôle'), { target: { value: 'Caissier' } });
  fireEvent.change(screen.getByPlaceholderText('Téléphone'), { target: { value: '123' } });
  fireEvent.click(screen.getAllByRole('button', { name: /Ajouter/i })[1]);

  fireEvent.click(screen.getByRole('button', { name: /Liste/i }));
  expect(screen.getByText('Jean')).toBeInTheDocument();

  window.confirm = jest.fn().mockReturnValue(true);
  const row = screen.getByText('Jean').closest('tr');
  fireEvent.click(within(row).getByRole('button'));
  expect(screen.getByText(/Aucun employé/i)).toBeInTheDocument();
});

test("n'ajoute pas d'employé sans nom", () => {
  render(
    <AppProvider>
      <EmployeesModule />
    </AppProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /Ajouter/i }));
  fireEvent.click(screen.getAllByRole('button', { name: /Ajouter/i })[1]);
  fireEvent.click(screen.getByRole('button', { name: /Liste/i }));
  expect(screen.getByText(/Aucun employé/i)).toBeInTheDocument();
});
