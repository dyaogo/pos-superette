import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const ReturnForm = () => {
  const { globalProducts, processReturn, appSettings } = useApp();
  const [form, setForm] = useState({ productId: '', quantity: '', reason: '' });
  const isDark = appSettings.darkMode;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = () => {
    const quantity = parseInt(form.quantity, 10);
    if (!form.productId || !quantity) return;
    processReturn(parseInt(form.productId, 10), quantity, form.reason.trim());
    setForm({ productId: '', quantity: '', reason: '' });
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
    }
  };

  return (
    <div style={styles.form}>
      <select name="productId" value={form.productId} onChange={handleChange} style={styles.input}>
        <option value="">Produit</option>
        {(globalProducts || []).map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <input
        name="quantity"
        type="number"
        placeholder="Quantité"
        value={form.quantity}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        name="reason"
        placeholder="Raison"
        value={form.reason}
        onChange={handleChange}
        style={styles.input}
      />
      <button onClick={submit} style={styles.addButton}>
        <Plus size={16} /> Enregistrer
      </button>
    </div>
  );
};

export default ReturnForm;
