import { useState, useEffect } from 'react';
import { AlertTriangle, X, Package } from 'lucide-react';
import { useApp } from '../src/contexts/AppContext';
import Link from 'next/link';

export default function StockAlertNotification() {
  const { productCatalog, appSettings } = useApp();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState([]);

  const lowStockProducts = productCatalog.filter(
    p => p.stock < (appSettings.lowStockThreshold || 10) && 
         !dismissed.includes(p.id)
  );

  useEffect(() => {
    if (lowStockProducts.length > 0) {
      setShow(true);
    }
  }, [lowStockProducts.length]);

  const dismissAlert = (productId) => {
    setDismissed([...dismissed, productId]);
  };

  const dismissAll = () => {
    setDismissed(lowStockProducts.map(p => p.id));
    setShow(false);
  };

  if (!show || lowStockProducts.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      background: 'var(--color-surface)',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      padding: '20px',
      maxWidth: '400px',
      border: '2px solid #f59e0b'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={24} color="#f59e0b" />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              Alertes Stock Faible
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {lowStockProducts.length} produit(s) à réapprovisionner
            </p>
          </div>
        </div>
        <button
          onClick={dismissAll}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--color-text-muted)'
          }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {lowStockProducts.slice(0, 5).map(product => (
          <div 
            key={product.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              background: '#fef3c7',
              borderRadius: '8px',
              marginBottom: '8px'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500', fontSize: '14px' }}>{product.name}</div>
              <div style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>
                Stock: {product.stock} unités
              </div>
            </div>
            <button
              onClick={() => dismissAlert(product.id)}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              OK
            </button>
          </div>
        ))}
      </div>

      {lowStockProducts.length > 5 && (
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '10px 0 0 0', textAlign: 'center' }}>
          + {lowStockProducts.length - 5} autre(s)
        </p>
      )}

      <Link href="/inventory">
        <button style={{
          width: '100%',
          marginTop: '15px',
          padding: '10px',
          background: '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <Package size={16} />
          Voir l'inventaire
        </button>
      </Link>
    </div>
  );
}