import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const EmployeeForm = () => {
  const { employees, setEmployees, appSettings, stores, currentStoreId } = useApp();
  const [form, setForm] = useState({ name: '', role: '', phone: '', storeId: currentStoreId });
  const isDark = appSettings.darkMode;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addEmployee = () => {
    if (!form.name.trim()) return;
    const newEmployee = {
      id: Date.now(),
      name: form.name.trim(),
      role: form.role.trim(),
      phone: form.phone.trim(),
      storeId: form.storeId,
      shifts: []
    };
    setEmployees([...(employees || []), newEmployee]);
    setForm({ name: '', role: '', phone: '', storeId: currentStoreId });
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
      <input
        name="name"
        placeholder="Nom"
        value={form.name}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        name="role"
        placeholder="Rôle"
        value={form.role}
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
      <select
        name="storeId"
        value={form.storeId}
        onChange={handleChange}
        style={styles.input}
      >
        {(stores || []).map(store => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
      <button onClick={addEmployee} style={styles.addButton}>
        <Plus size={16} /> Ajouter
      </button>
    </div>
  );
};

export default EmployeeForm;
