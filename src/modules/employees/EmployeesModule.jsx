import React, { useState } from 'react';
import { Users, UserPlus, Clock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useResponsive, getResponsiveStyles } from '../../components/ResponsiveComponents';
import EmployeeForm from './EmployeeForm';
import EmployeeList from './EmployeeList';
import ShiftManagement from './ShiftManagement';

const EmployeesModule = () => {
  const { appSettings } = useApp();
  const [activeTab, setActiveTab] = useState('list');
  const isDark = appSettings.darkMode;
  const { deviceType } = useResponsive();
  const sharedStyles = getResponsiveStyles(deviceType, isDark);

  const styles = {
    tabs: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      background: isDark ? '#2d3748' : 'white',
      padding: '8px',
      borderRadius: '8px'
    },
    tabButton: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: '8px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      background: 'transparent',
      color: isDark ? '#a0aec0' : '#64748b',
      fontWeight: '600'
    },
    activeTab: {
      background: isDark ? '#4a5568' : '#e2e8f0',
      color: isDark ? '#f7fafc' : '#1a202c'
    }
  };

  return (
    <div style={sharedStyles.container}>
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tabButton, ...(activeTab === 'list' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('list')}
        >
          <Users size={18} /> Liste
        </button>
        <button
          style={{ ...styles.tabButton, ...(activeTab === 'add' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('add')}
        >
          <UserPlus size={18} /> Ajouter
        </button>
        <button
          style={{ ...styles.tabButton, ...(activeTab === 'shifts' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('shifts')}
        >
          <Clock size={18} /> Horaires
        </button>
      </div>

      {activeTab === 'list' && <EmployeeList />}
      {activeTab === 'add' && <EmployeeForm />}
      {activeTab === 'shifts' && <ShiftManagement />}
    </div>
  );
};

export default EmployeesModule;
