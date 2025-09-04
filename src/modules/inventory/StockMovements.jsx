import React, { useEffect, useState } from 'react';
import { getInventoryHistory } from '../../services/inventory.service';

const StockMovements = () => {
  const [history, setHistory] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const loadHistory = () => {
      const data = [...(getInventoryHistory() || [])].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setHistory(data);
    };

    // Chargement initial
    loadHistory();

    // Met à jour lorsqu'un autre onglet modifie l'historique
    window.addEventListener('storage', loadHistory);
    return () => window.removeEventListener('storage', loadHistory);
  }, []);

  const filteredHistory = history.filter((record) => {
    const recordDate = record.date ? record.date.slice(0, 10) : '';
    if (startDate && recordDate < startDate) return false;
    if (endDate && recordDate > endDate) return false;
    if (typeFilter === 'entry' && record.quantity < 0) return false;
    if (typeFilter === 'exit' && record.quantity > 0) return false;
    return true;
  });

  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
      <h2 style={{ marginTop: 0 }}>Historique des mouvements</h2>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <label>Type:&nbsp;</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">Tous</option>
            <option value="entry">Entrées</option>
            <option value="exit">Sorties</option>
          </select>
        </div>
        <div>
          <label>Du:&nbsp;</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label>Au:&nbsp;</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', padding: '8px' }}>Date</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', padding: '8px' }}>Produit</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', padding: '8px' }}>Quantité</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', padding: '8px' }}>Type</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', padding: '8px' }}>Note</th>
          </tr>
        </thead>
        <tbody>
          {filteredHistory.length === 0 && (
            <tr>
              <td colSpan="5" style={{ padding: '12px', textAlign: 'center' }}>Aucun mouvement</td>
            </tr>
          )}
          {filteredHistory.map((mvt) => (
            <tr key={mvt.id}>
              <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{
                mvt.date ? new Date(mvt.date).toLocaleDateString() : ''
              }</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{mvt.productName}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{mvt.quantity}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{
                mvt.quantity >= 0 ? 'Entrée' : 'Sortie'
              }</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{mvt.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockMovements;

