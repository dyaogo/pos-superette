import React from 'react';

const PaymentModal = ({
  isOpen,
  onClose,
  total,
  paymentMethod,
  setPaymentMethod,
  amountReceived,
  setAmountReceived,
  handleCheckout,
  appSettings,
  isDark,
  selectedCustomer,
  frequentAmounts,
  calculateChange
}) => {
  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modal: {
      background: isDark ? '#2d3748' : 'white',
      padding: '25px',
      borderRadius: '12px',
      width: '90%',
      maxWidth: '400px'
    },
    paymentShortcuts: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px',
      marginBottom: '15px'
    }
  };

  const PaymentShortcuts = () => (
    <div style={styles.paymentShortcuts}>
      {frequentAmounts.map(amount => (
        <button
          key={amount}
          onClick={() => setAmountReceived(amount.toString())}
          style={{
            padding: '8px 4px',
            background: amountReceived === amount.toString() ? '#3b82f6' : 'white',
            color: amountReceived === amount.toString() ? 'white' : '#1f2937',
            border: `1px solid ${amountReceived === amount.toString() ? '#3b82f6' : '#e5e7eb'}`,
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {amount.toLocaleString()}
        </button>
      ))}
    </div>
  );

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{
          marginBottom: '20px',
          color: isDark ? '#f7fafc' : '#2d3748',
          textAlign: 'center'
        }}>
          Paiement
        </h3>

        <div style={{
          marginBottom: '20px',
          textAlign: 'center',
          padding: '15px',
          background: isDark ? '#374151' : '#f8fafc',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
            {total.toLocaleString()} {appSettings?.currency}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPaymentMethod('cash')}
              style={{
                flex: 1,
                padding: '10px',
                border: paymentMethod === 'cash' ? '2px solid #3b82f6' : `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '6px',
                background: paymentMethod === 'cash' ? '#eff6ff' : (isDark ? '#374151' : 'white'),
                cursor: 'pointer'
              }}
            >
              Espèces
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              style={{
                flex: 1,
                padding: '10px',
                border: paymentMethod === 'card' ? '2px solid #3b82f6' : `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '6px',
                background: paymentMethod === 'card' ? '#eff6ff' : (isDark ? '#374151' : 'white'),
                cursor: 'pointer'
              }}
            >
              Carte
            </button>
            <button
              onClick={() => setPaymentMethod('credit')}
              disabled={selectedCustomer === 1}
              style={{
                flex: 1,
                padding: '10px',
                border: paymentMethod === 'credit' ? '2px solid #3b82f6' : `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '6px',
                background: paymentMethod === 'credit' ? '#eff6ff' : (isDark ? '#374151' : 'white'),
                cursor: selectedCustomer !== 1 ? 'pointer' : 'not-allowed',
                opacity: selectedCustomer === 1 ? 0.5 : 1
              }}
            >
              Crédit
            </button>
          </div>
          {selectedCustomer === 1 && paymentMethod === 'credit' && (
            <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '5px' }}>
              Sélectionnez un client pour vendre à crédit
            </p>
          )}
        </div>

        {paymentMethod === 'cash' && (
          <div style={{ marginBottom: '20px' }}>
            <PaymentShortcuts />

            <input
              type="number"
              placeholder="Montant reçu"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                borderRadius: '6px',
                fontSize: '16px',
                background: isDark ? '#374151' : 'white',
                color: isDark ? '#f7fafc' : '#2d3748',
                textAlign: 'center'
              }}
              autoFocus
            />

            {amountReceived && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                background: parseFloat(amountReceived) >= total ? '#f0fdf4' : '#fef2f2',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{
                  color: parseFloat(amountReceived) >= total ? '#166534' : '#dc2626',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  {parseFloat(amountReceived) >= total
                    ? `Monnaie: ${calculateChange(amountReceived).toLocaleString()} ${appSettings?.currency}`
                    : `Manque: ${(total - parseFloat(amountReceived)).toLocaleString()} ${appSettings?.currency}`}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: '#64748b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleCheckout}
            disabled={
              (paymentMethod === 'cash' && parseFloat(amountReceived) < total) ||
              (paymentMethod === 'credit' && selectedCustomer === 1)
            }
            style={{
              flex: 1,
              padding: '12px',
              background: (
                paymentMethod === 'card' ||
                (paymentMethod === 'cash' && parseFloat(amountReceived) >= total) ||
                (paymentMethod === 'credit' && selectedCustomer !== 1)
              ) ? '#10b981' : '#94a3b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (
                paymentMethod === 'card' ||
                (paymentMethod === 'cash' && parseFloat(amountReceived) >= total) ||
                (paymentMethod === 'credit' && selectedCustomer !== 1)
              ) ? 'pointer' : 'not-allowed',
              fontWeight: 'bold'
            }}
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
