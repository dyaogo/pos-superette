import React, { useState } from 'react';
import { PlusCircle, RotateCcw } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const LoyaltyProgram = () => {
  const { customers, setCustomers, appSettings } = useApp();
  const [points, setPoints] = useState(10);
  const isDark = appSettings.darkMode;

  const list = (customers || []).filter(c => c.id !== 1);

  const addPoints = (id) => {
    const amount = parseInt(points) || 0;
    if (amount <= 0) return;
    setCustomers((customers || []).map(c =>
      c.id === id ? { ...c, points: (c.points || 0) + amount } : c
    ));
  };

  const resetPoints = (id) => {
    if (window.confirm('Réinitialiser les points de ce client ?')) {
      setCustomers((customers || []).map(c =>
        c.id === id ? { ...c, points: 0 } : c
      ));
    }
  };

  const styles = {
    input: {
      padding: '8px',
      borderRadius: '6px',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      background: isDark ? '#374151' : 'white',
      color: isDark ? '#f7fafc' : '#2d3748',
      marginBottom: '20px',
      width: '120px'
    },
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
    },
    actionButton: {
      background: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      padding: '4px 8px',
      cursor: 'pointer',
      marginRight: '6px'
    },
    resetButton: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      padding: '4px 8px',
      cursor: 'pointer'
    }
  };

  return (
    <div>
      <div>
        <label style={{ marginRight: '10px', color: isDark ? '#f7fafc' : '#2d3748' }}>
          Points à ajouter:
        </label>
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          style={styles.input}
        />
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Nom</th>
            <th style={styles.th}>Points</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map(c => (
            <tr key={c.id}>
              <td style={styles.td}>{c.name}</td>
              <td style={styles.td}>{c.points || 0}</td>
              <td style={styles.td}>
                <button onClick={() => addPoints(c.id)} style={styles.actionButton}>
                  <PlusCircle size={16} />
                </button>
                <button onClick={() => resetPoints(c.id)} style={styles.resetButton}>
                  <RotateCcw size={16} />
                </button>
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td style={styles.td} colSpan="3">
                Aucun client enregistré
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LoyaltyProgram;

