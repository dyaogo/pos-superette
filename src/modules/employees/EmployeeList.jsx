import React from 'react';
import { Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const EmployeeList = () => {
  const { employees, setEmployees, appSettings } = useApp();
  const isDark = appSettings?.darkMode;

  const removeEmployee = (id) => {
    if (window.confirm('Supprimer cet employé ?')) {
      setEmployees((employees || []).filter(e => e.id !== id));
    }
  };

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
    },
    deleteButton: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: '#ef4444'
    }
  };

  const list = employees || [];

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Nom</th>
          <th style={styles.th}>Rôle</th>
          <th style={styles.th}>Téléphone</th>
          <th style={styles.th}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {list.map(emp => (
          <tr key={emp.id}>
            <td style={styles.td}>{emp.name}</td>
            <td style={styles.td}>{emp.role}</td>
            <td style={styles.td}>{emp.phone}</td>
            <td style={styles.td}>
              <button onClick={() => removeEmployee(emp.id)} style={styles.deleteButton}>
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
        {list.length === 0 && (
          <tr>
            <td style={styles.td} colSpan="4">Aucun employé</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default EmployeeList;
