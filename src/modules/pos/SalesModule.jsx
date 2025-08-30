import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useResponsive } from '../../components/ResponsiveComponents';
import Cart from './Cart';
import PaymentModal from './PaymentModal';
import QuickSale from './QuickSale';
import Receipt from './Receipt';
import BarcodeScanner from './BarcodeScanner';

const SalesModule = () => {
  const { globalProducts, processSale, customers, appSettings, addCredit } = useApp();
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [quickMode, setQuickMode] = useState(true);
  const [receipt, setReceipt] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const products = globalProducts;
  const isDark = appSettings.darkMode;

  const { deviceType, isMobile } = useResponsive();

  const frequentAmounts = [500, 1000, 2000, 5000, 10000, 20000];

  useEffect(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * (appSettings.taxRate / 100);
    setTotal(subtotal + tax);
  }, [cart, appSettings.taxRate]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.includes(searchQuery)
  ).slice(0, quickMode ? 12 : 20);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setCart([]);
        setSearchQuery('');
      }
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('product-search')?.focus();
      }
      if (e.key === 'F3' && cart.length > 0) {
        e.preventDefault();
        setShowPaymentModal(true);
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setShowScanner(true);
      }
      if (e.key === 'Escape') {
        if (showPaymentModal) {
          setShowPaymentModal(false);
        } else if (cart.length > 0) {
          if (window.confirm('Vider le panier ?')) {
            setCart([]);
          }
        }
      }
      if (e.key === 'Enter' && searchQuery && !showPaymentModal) {
        e.preventDefault();
        const found = filteredProducts[0];
        if (found) {
          addToCart(found);
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, searchQuery, showPaymentModal, filteredProducts]);

  const styles = {
    container: {
      display: 'grid',
      gridTemplateColumns: isMobile
        ? '1fr'
        : deviceType === 'tablet'
          ? '1fr 300px'
          : quickMode ? '2fr 1fr' : '1fr 400px',
      gap: '20px',
      padding: '20px',
      minHeight: 'calc(100vh - 80px)',
      background: isDark ? '#1a202c' : '#f7fafc'
    }
  };

  const addToCart = (product) => {
    if (product.stock === 0) {
      alert('Produit en rupture de stock!');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert(`Stock insuffisant! Maximum: ${product.stock}`);
        return;
      }
      updateQuantity(product.id, 1);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, change) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQuantity = Math.max(0, Math.min(item.quantity + change, product.stock));
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const calculateChange = (received) => {
    return received ? Math.max(0, parseFloat(received) - total) : 0;
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < total)) {
      alert('Montant reçu insuffisant!');
      return;
    }

    if (paymentMethod === 'credit' && selectedCustomer === 1) {
      alert('Sélectionnez un client pour vendre à crédit');
      return;
    }

    if (paymentMethod === 'credit') {
      const credit = addCredit(selectedCustomer, total, `Vente du ${new Date().toLocaleDateString('fr-FR')}`);
      setReceipt({
        receiptNumber: credit.id,
        total,
        change: 0
      });
    } else {
      const sale = processSale(
        cart,
        paymentMethod,
        paymentMethod === 'cash' ? parseFloat(amountReceived) : total,
        selectedCustomer
      );
      const change = paymentMethod === 'cash' ? sale.change : 0;
      setReceipt({
        receiptNumber: sale.receiptNumber,
        total,
        change
      });
    }

    setCart([]);
    setAmountReceived('');
    setShowPaymentModal(false);
    setPaymentMethod('cash');
    setSearchQuery('');
    document.getElementById('product-search')?.focus();
  };

  const handleBarcodeDetected = (code) => {
    const found = products.find(p => p.barcode === code || p.sku === code);
    if (found) {
      addToCart(found);
      setShowScanner(false);
    } else {
      alert('Produit non trouvé');
    }
  };

  return (
    <div>
      <div style={styles.container}>
        <QuickSale
          products={filteredProducts}
          addToCart={addToCart}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          quickMode={quickMode}
          setQuickMode={setQuickMode}
          cart={cart}
          setCart={setCart}
          isDark={isDark}
          appSettings={appSettings}
          openScanner={() => setShowScanner(true)}
        />
        <Cart
          cart={cart}
          setCart={setCart}
          updateQuantity={updateQuantity}
          total={total}
          appSettings={appSettings}
          isDark={isDark}
          onCheckout={() => setShowPaymentModal(true)}
        />
      </div>

      <div style={{ marginBottom: '15px', padding: '0 20px' }}>
        <label style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#718096' }}>Client</label>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(parseInt(e.target.value))}
          style={{
            width: '100%',
            padding: '8px',
            border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
            borderRadius: '6px',
            fontSize: '14px',
            background: isDark ? '#374151' : 'white',
            color: isDark ? '#f7fafc' : '#2d3748'
          }}
        >
          {customers.map(customer => (
            <option key={customer.id} value={customer.id}>
              {customer.name} {customer.points > 0 ? `(${customer.points} pts)` : ''}
            </option>
          ))}
        </select>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        amountReceived={amountReceived}
        setAmountReceived={setAmountReceived}
        handleCheckout={handleCheckout}
        appSettings={appSettings}
        isDark={isDark}
        selectedCustomer={selectedCustomer}
        frequentAmounts={frequentAmounts}
        calculateChange={calculateChange}
      />

      {receipt && (
        <Receipt
          data={receipt}
          onClose={() => setReceipt(null)}
          appSettings={appSettings}
        />
      )}

      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default SalesModule;
