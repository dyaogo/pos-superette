import React from 'react';
import { render, screen } from '@testing-library/react';
import AlertsWidget from './AlertsWidget';

test('renders alerts when out of stock products exist', () => {
  render(
    <AlertsWidget
      globalProducts={[{ stock: 0 }]}
      credits={[]}
      showAlerts={true}
      setShowAlerts={() => {}}
      isDark={false}
    />
  );
  expect(screen.getByText('Alertes Importantes')).toBeInTheDocument();
});
