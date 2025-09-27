import { useState } from 'react';
import { RotateCcw, Search, AlertCircle } from 'lucide-react';

export default function Returns() {
  const [searchReceipt, setSearchReceipt] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState('');

  // Données de démo
  const demoSale = {
    receiptNumber: 'REC-001',
    date: '2024-01-20',
    items: [
      { id: 1, name: 'Coca Cola', quantity: 2, price: 800 },
      { id: 2, name: 'Chips', quantity: 1, price: 500 }
    ],
    total: 2100
  };

  const handleSearch = () => {
    if (searchReceipt === 'REC-001') {
      setSelectedSale(demoSale);
      setReturnItems([]);
    } else {
      alert('Reçu non trouvé');
    }
  };

  const toggleReturnItem = (item) => {
    const exists = returnItems.find(i => i.id === item.id);
    if (exists) {
      setReturnItems(returnItems.filter(i => i.id !== item.id));
    } else {
      setReturnItems([...returnItems, item]);
    }
  };

  const calculateRefund = () => {
    return returnItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const processReturn = () => {
    if (returnItems.length === 0) {
      alert('Sélectionnez au moins un article à retourner');
      return;
    }
    if (!returnReason) {
      alert('Veuillez indiquer la raison du retour');
      return;
    }
    
    alert(`Retour traité!\nRemboursement: ${calculateRefund()} FCFA`);
    setSelectedSale(null);
    setReturnItems([]);
    setReturnReason('');
    setSearchReceipt('');
  };

  return (
    <div style={{ padding: '30px' }}>
      <h1>Retours et Remboursements</h1>

      {/* Recherche de reçu */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3>Rechercher une vente</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Numéro de reçu (ex: REC-001)"
            value={searchReceipt}
            onChange={(e) => setSearchReceipt(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Search size={18} />
            Rechercher
          </button>
        </div>
      </div>

      {/* Détails de la vente */}
      {selectedSale && (
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3>Détails de la vente</h3>
          <p>Reçu: <strong>{selectedSale.receiptNumber}</strong></p>
          <p>Date: {selectedSale.date}</p>
          
          <table style={{ width: '100%', marginTop: '15px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setReturnItems(selectedSale.items);
                      } else {
                        setReturnItems([]);
                      }
                    }}
                  />
                </th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Article</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Quantité</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Prix</th>
              </tr>
            </thead>
            <tbody>
              {selectedSale.items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px' }}>
                    <input
                      type="checkbox"
                      checked={returnItems.some(i => i.id === item.id)}
                      onChange={() => toggleReturnItem(item)}
                    />
                  </td>
                  <td style={{ padding: '10px' }}>{item.name}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    {(item.price * item.quantity).toLocaleString()} FCFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#6b7280' }}>
              Raison du retour
            </label>
            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            >
              <option value="">-- Sélectionner une raison --</option>
              <option value="defective">Produit défectueux</option>
              <option value="wrong">Mauvais produit</option>
              <option value="expired">Produit expiré</option>
              <option value="other">Autre</option>
            </select>
          </div>

          {returnItems.length > 0 && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#fef3c7',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>
                  Montant à rembourser: {calculateRefund().toLocaleString()} FCFA
                </p>
              </div>
              <button
                onClick={processReturn}
                style={{
                  padding: '10px 20px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <RotateCcw size={18} />
                Traiter le retour
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}