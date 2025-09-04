import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SalesModule from './SalesModule';

jest.mock('../../contexts/AppContext', () => ({
  useApp: () => ({
    globalProducts: [],
    processSale: jest.fn(),
    customers: [{ id: 1, name: 'Client Comptant', points: 0 }],
    appSettings: { darkMode: false, taxRate: 0 },
    addCredit: jest.fn()
  })
}));

jest.mock('../../components/ResponsiveComponents', () => ({
  useResponsive: () => ({ deviceType: 'desktop', isMobile: false })
}));

jest.mock('./QuickSale', () => () => <div>QuickSale</div>);

jest.mock('./Cart', () => (props) => (
  <div>
    Cart
    <button onClick={props.onCheckout}>Checkout</button>
  </div>
));

jest.mock('./PaymentModal', () => ({ isOpen }) => (isOpen ? <div>Payment Modal</div> : null));

jest.mock('./Receipt', () => () => <div>Receipt</div>);

test('affiche le client et ouvre la modale de paiement', () => {
  render(<SalesModule />);
  expect(screen.getAllByText(/Client/i)[0]).toBeInTheDocument();
  fireEvent.click(screen.getByText('Checkout'));
  expect(screen.getByText('Payment Modal')).toBeInTheDocument();
});

