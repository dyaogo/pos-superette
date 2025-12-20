import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const ShiftManagement = () => {
  const { employees, setEmployees, appSettings } = useApp();
  const [shift, setShift] = useState({ employeeId: '', date: '', start: '', end: '' });
  const isDark = appSettings?.darkMode;

  const handleChange = (e) => {
    setShift({ ...shift, [e.target.name]: e.target.value });
  };

  const addShift = () => {
    const { employeeId, date, start, end } = shift;
    if (!employeeId || !date || !start || !end) return;
    setEmployees((employees || []).map(emp =>
      emp.id === parseInt(employeeId)
        ? { ...emp, shifts: [...(emp.shifts || []), { id: Date.now(), date, start, end }] }
        : emp
    ));
    setShift({ employeeId: '', date: '', start: '', end: '' });
  };

  const removeShift = (empId, shiftId) => {
    setEmployees((employees || []).map(emp =>
      emp.id === empId
        ? { ...emp, shifts: (emp.shifts || []).filter(s => s.id !== shiftId) }
        : emp
    ));
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
      marginTop: '10px',
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
    <div>
      <div style={styles.form}>
        <select name="employeeId" value={shift.employeeId} onChange={handleChange} style={styles.input}>
          <option value="">Employé</option>
          {list.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
        <input type="date" name="date" value={shift.date} onChange={handleChange} style={styles.input} />
        <input type="time" name="start" value={shift.start} onChange={handleChange} style={styles.input} />
        <input type="time" name="end" value={shift.end} onChange={handleChange} style={styles.input} />
        <button onClick={addShift} style={styles.addButton}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {list.map(emp => (
        <div key={emp.id} style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '10px 0', color: isDark ? '#f7fafc' : '#2d3748' }}>{emp.name}</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Début</th>
                <th style={styles.th}>Fin</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(emp.shifts || []).map(s => (
                <tr key={s.id}>
                  <td style={styles.td}>{s.date}</td>
                  <td style={styles.td}>{s.start}</td>
                  <td style={styles.td}>{s.end}</td>
                  <td style={styles.td}>
                    <button onClick={() => removeShift(emp.id, s.id)} style={styles.deleteButton}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {(emp.shifts || []).length === 0 && (
                <tr>
                  <td style={styles.td} colSpan="4">Aucun horaire</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default ShiftManagement;
