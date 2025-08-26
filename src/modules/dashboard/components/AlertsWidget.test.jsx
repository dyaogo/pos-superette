import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertsWidget from './AlertsWidget';

test('renders alerts when out of stock products exist', () => {
  render(
    <AlertsWidget
      globalProducts={[{ stock: 0 }]}
      credits={[]}
      showAlerts={true}
      setShowAlerts={() => {}}
      isDark={false}
      onNavigate={() => {}}
    />
  );
  expect(screen.getByText('Alertes Importantes')).toBeInTheDocument();
});

test('calls onNavigate with stocks when clicking alert', () => {
  const handleNavigate = jest.fn();
  render(
    <AlertsWidget
      globalProducts={[{ stock: 0 }]}
      credits={[]}
      showAlerts={true}
      setShowAlerts={() => {}}
      isDark={false}
      onNavigate={handleNavigate}
    />
  );
  fireEvent.click(screen.getByText('Voir Stocks'));
  expect(handleNavigate).toHaveBeenCalledWith('stocks');
});
