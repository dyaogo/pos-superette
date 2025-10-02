import { useState, useEffect } from 'react';
import { useApp } from '../src/contexts/AppContext';
import { RotateCcw, Plus, Search, AlertCircle } from 'lucide-react';

export default function ReturnsPage() {
  const { salesHistory, loading } = useApp();
  const [returns, setReturns] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      const res = await fetch('/api/returns');
      const data = await res.json();
      setReturns(data);
    } catch (error) {
      console.error('Erreur chargement retours:', error);
    }
  };

  const totalReturns = returns.reduce((sum, r) => sum + r.amount, 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RotateCcw size={32} />
          Gestion des Retours
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={20} />
          Nouveau Retour
        </button>
      </div>

      {/* Statistiques */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ color: '#6b7280', marginBottom: '8px' }}>Total retours</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
            {returns.length}
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ color: '#6b7280', marginBottom: '8px' }}>Montant total remboursé</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
            {totalReturns.toLocaleString()} FCFA
          </div>
        </div>
      </div>

      {/* Liste des retours */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {returns.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
            Aucun retour enregistré
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Vente</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Raison</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>Montant</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Articles</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Méthode</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((returnItem) => (
                <tr key={returnItem.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '15px' }}>
                    {new Date(returnItem.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '15px' }}>
                    {returnItem.saleId.substring(0, 8)}...
                  </td>
                  <td style={{ padding: '15px' }}>{returnItem.reason}</td>
                  <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>
                    {returnItem.amount.toLocaleString()} FCFA
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    {returnItem.items?.length || 0}
                  </td>
                  <td style={{ padding: '15px' }}>
                    {returnItem.refundMethod === 'cash' ? 'Espèces' :
                     returnItem.refundMethod === 'card' ? 'Carte' : 'Crédit'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nouveau Retour */}
      {showAddModal && (
        <ReturnModal
          sales={salesHistory}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadReturns();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function ReturnModal({ sales, onClose, onSuccess }) {
  const [selectedSale, setSelectedSale] = useState('');
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('cash');
  const [selectedItems, setSelectedItems] = useState([]);

  const sale = sales.find(s => s.id === selectedSale);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      alert('Sélectionnez au moins un article à retourner');
      return;
    }

    const returnData = {
      saleId: selectedSale,
      reason,
      refundMethod,
      items: selectedItems
    };

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData)
      });

      if (res.ok) {
        alert('Retour enregistré avec succès');
        onSuccess();
      }
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  const toggleItem = (item) => {
    const exists = selectedItems.find(i => i.productId === item.productId);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.productId !== item.productId));
    } else {
      setSelectedItems([...selectedItems, {
        productId: item.productId,
        productName: item.productName || item.product?.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      }]);
    }
  };

  return (
    <div 
      onClick={onClose}
      style={{
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
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          width: '600px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        <h2>Nouveau Retour</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Sélectionner une vente *</label>
            <select
              value={selectedSale}
              onChange={(e) => setSelectedSale(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            >
              <option value="">Choisir une vente...</option>
              {sales.slice(0, 20).map(s => (
                <option key={s.id} value={s.id}>
                  {new Date(s.createdAt).toLocaleDateString()} - {s.total} FCFA
                </option>
              ))}
            </select>
          </div>

          {sale && (
            <div style={{ marginBottom: '15px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ fontWeight: '500', marginBottom: '8px' }}>Articles de la vente :</div>
              {sale.items?.map(item => (
                <label 
                  key={item.id}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.some(i => i.productId === item.productId)}
                    onChange={() => toggleItem(item)}
                  />
                  <span>{item.productName || item.product?.name} - {item.quantity} × {item.unitPrice} FCFA</span>
                </label>
              ))}
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Raison du retour *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows="3"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Méthode de remboursement *</label>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            >
              <option value="cash">Espèces</option>
              <option value="card">Carte bancaire</option>
              <option value="credit">Crédit client</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Enregistrer le retour
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}