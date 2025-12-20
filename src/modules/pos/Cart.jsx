import React from 'react';
import { ShoppingCart, CreditCard } from 'lucide-react';

const Cart = ({ cart, setCart, updateQuantity, total, appSettings, isDark, onCheckout }) => {
  return (
    <div style={{
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      height: 'fit-content'
    }}>
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: isDark ? '#f7fafc' : '#2d3748'
      }}>
        <ShoppingCart size={20} />
        Panier ({cart.reduce((sum, item) => sum + item.quantity, 0)})
      </div>

      {cart.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '30px',
          color: isDark ? '#a0aec0' : '#94a3b8'
        }}>
          <ShoppingCart size={40} />
          <p style={{ marginTop: '10px', fontSize: '14px' }}>
            Panier vide
          </p>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '250px', marginBottom: '15px' }}>
            {cart.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px',
                borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                marginBottom: '8px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isDark ? '#f7fafc' : '#2d3748'
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: isDark ? '#a0aec0' : '#64748b'
                  }}>
                    {item.price} × {item.quantity} = {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    style={{
                      width: '24px', height: '24px',
                      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                      background: isDark ? '#374151' : 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    -
                  </button>
                  <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '14px' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    style={{
                      width: '24px', height: '24px',
                      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                      background: isDark ? '#374151' : 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => setCart(cart.filter(i => i.id !== item.id))}
                    style={{
                      width: '24px', height: '24px',
                      border: '1px solid #ef4444',
                      background: isDark ? '#374151' : 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#ef4444',
                      fontSize: '12px'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            paddingTop: '15px',
            borderTop: `2px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '15px',
              color: isDark ? '#f7fafc' : '#2d3748'
            }}>
              <span>Total:</span>
              <span style={{ color: '#3b82f6' }}>
                {total.toLocaleString()} {appSettings?.currency}
              </span>
            </div>

            <button
              onClick={onCheckout}
              style={{
                width: '100%',
                padding: '12px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <CreditCard size={18} />
              Payer
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
