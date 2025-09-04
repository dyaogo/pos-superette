import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';

const TransferStock = () => {
  const { stores, productCatalog, stockByStore, transferStock, currentStoreId } = useApp();
  const [fromStore, setFromStore] = useState(currentStoreId);
  const [toStore, setToStore] = useState(stores.find(s => s.id !== currentStoreId)?.id || '');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleTransfer = () => {
    const qty = parseInt(quantity);
    if (fromStore && toStore && productId && qty > 0) {
      transferStock(fromStore, toStore, productId, qty);
      setQuantity('');
    }
  };

  const sourceProducts = (productCatalog || []).map(p => ({
    ...p,
    stock: (stockByStore[fromStore] || {})[p.id] || 0
  }));

  return (
    <div style={{ padding: '20px' }}>
      <h3>Transférer du stock</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
        <select value={fromStore} onChange={e => setFromStore(e.target.value)}>
          {stores.map(store => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </select>
        <select value={toStore} onChange={e => setToStore(e.target.value)}>
          {stores.filter(s => s.id !== fromStore).map(store => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </select>
        <select value={productId} onChange={e => setProductId(e.target.value)}>
          <option value="">Choisir un produit</option>
          {sourceProducts.map(p => (
            <option key={p.id} value={p.id}>{p.name} (stock {p.stock})</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Quantité"
          value={quantity}
          min="1"
          onChange={e => setQuantity(e.target.value)}
        />
        <button onClick={handleTransfer}>Transférer</button>
      </div>
    </div>
  );
};

export default TransferStock;
