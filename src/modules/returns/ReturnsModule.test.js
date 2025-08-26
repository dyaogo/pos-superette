import React, { useEffect } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReturnsModule from './ReturnsModule';
import { AppProvider, useApp } from '../../contexts/AppContext';

beforeEach(() => {
  window.localStorage.clear();
});

const Setup = () => {
  const { setGlobalProducts } = useApp();
  useEffect(() => {
    setGlobalProducts([{ id: 1, name: 'Produit A', stock: 5 }]);
  }, [setGlobalProducts]);
  return <ReturnsModule />;
};

test('affiche le formulaire de retour par défaut', () => {
  render(
    <AppProvider>
      <ReturnsModule />
    </AppProvider>
  );
  expect(screen.getByText(/Enregistrer/i)).toBeInTheDocument();
});

test('enregistre un retour et l\'affiche dans l\'historique', async () => {
  render(
    <AppProvider>
      <Setup />
    </AppProvider>
  );

  fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
  fireEvent.change(screen.getByPlaceholderText('Quantité'), { target: { value: '2' } });
  fireEvent.change(screen.getByPlaceholderText('Raison'), { target: { value: 'Défaut' } });
  fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

  fireEvent.click(screen.getByRole('button', { name: /Historique/i }));
  await waitFor(() => expect(screen.getByText('Produit A')).toBeInTheDocument());
});

test("affiche un message d'erreur lorsqu'il n'y a pas de retour", () => {
  render(
    <AppProvider>
      <ReturnsModule />
    </AppProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: /Historique/i }));
  expect(screen.getByText(/Aucun retour enregistré/i)).toBeInTheDocument();
});
