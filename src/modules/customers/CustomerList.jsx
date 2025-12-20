import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const CustomerList = () => {
  const { customers, setCustomers, appSettings } = useApp();
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const isDark = appSettings?.darkMode;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addCustomer = () => {
    if (!form.name.trim()) return;

    const newCustomer = {
      id: Date.now(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      totalPurchases: 0,
      points: 0
    };

    setCustomers([...(customers || []), newCustomer]);
    setForm({ name: '', phone: '', email: '' });
  };

  const removeCustomer = (id) => {
    if (window.confirm('Supprimer ce client ?')) {
      setCustomers((customers || []).filter(c => c.id !== id));
    }
  };

  const styles = {
    form: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    input: {
      flex: '1 1 150px',
      padding: '8px',
      borderRadius: '6px',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      background: isDark ? '#374151' : 'white',
      color: isDark ? '#f7fafc' : '#2d3748'
    },
    addButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 12px',
      background: '#3182ce',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer'
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
    deleteButton: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: '#ef4444'
    }
  };

  const list = (customers || []).filter(c => c.id !== 1);

  return (
    <div>
      <div style={styles.form}>
        <input
          name="name"
          placeholder="Nom"
          value={form.name}
          onChange={handleChange}
          style={styles.input}
        />
        <input
          name="phone"
          placeholder="Téléphone"
          value={form.phone}
          onChange={handleChange}
          style={styles.input}
        />
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          style={styles.input}
        />
        <button onClick={addCustomer} style={styles.addButton}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Nom</th>
            <th style={styles.th}>Téléphone</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map(c => (
            <tr key={c.id}>
              <td style={styles.td}>{c.name}</td>
              <td style={styles.td}>{c.phone}</td>
              <td style={styles.td}>{c.email}</td>
              <td style={styles.td}>
                <button onClick={() => removeCustomer(c.id)} style={styles.deleteButton}>
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td style={styles.td} colSpan="4">
                Aucun client enregistré
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerList;

