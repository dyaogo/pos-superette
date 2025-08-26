import React from 'react';
import { render, screen } from '@testing-library/react';
import DataManagerWidget from './DataManagerWidget';

test('renders data manager widget heading', () => {
  render(
    <DataManagerWidget
      showDataManager={true}
      setShowDataManager={() => {}}
      globalProducts={[]}
      salesHistory={[]}
      customers={[]}
      credits={[]}
      appSettings={{}}
      clearAllData={() => {}}
      isDark={false}
    />
  );
  expect(screen.getByText(/Sauvegarde/)).toBeInTheDocument();
});
