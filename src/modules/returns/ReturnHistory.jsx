import React from 'react';
import { useApp } from '../../contexts/AppContext';

const ReturnHistory = () => {
  const { returnsHistory, appSettings } = useApp();
  const isDark = appSettings?.darkMode;
  const list = returnsHistory || [];

  const styles = {
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      background: isDark ? '#2d3748' : 'white'
    },
    th: {
      textAlign: 'left',
      padding: '8px',
      borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      color: isDark ? '#f7fafc' : '#2d3748'
    },
    td: {
      padding: '8px',
      borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      color: isDark ? '#f7fafc' : '#2d3748'
    }
  };

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Date</th>
          <th style={styles.th}>Produit</th>
          <th style={styles.th}>Quantité</th>
          <th style={styles.th}>Raison</th>
        </tr>
      </thead>
      <tbody>
        {list.map(r => (
          <tr key={r.id}>
            <td style={styles.td}>{new Date(r.date).toLocaleString()}</td>
            <td style={styles.td}>{r.productName}</td>
            <td style={styles.td}>{r.quantity}</td>
            <td style={styles.td}>{r.reason}</td>
          </tr>
        ))}
        {list.length === 0 && (
          <tr>
            <td style={styles.td} colSpan="4">Aucun retour enregistré</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default ReturnHistory;
