import React, { useState } from 'react';
import { CornerUpLeft, History } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import ReturnForm from './ReturnForm';
import ReturnHistory from './ReturnHistory';

const ReturnsModule = () => {
  const { appSettings } = useApp();
  const [activeTab, setActiveTab] = useState('form');
  const isDark = appSettings.darkMode;

  const styles = {
    container: {
      padding: '20px',
      background: isDark ? '#1a202c' : '#f7fafc',
      minHeight: 'calc(100vh - 120px)'
    },
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
    <div style={styles.container}>
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tabButton, ...(activeTab === 'form' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('form')}
        >
          <CornerUpLeft size={18} /> Saisie
        </button>
        <button
          style={{ ...styles.tabButton, ...(activeTab === 'history' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('history')}
        >
          <History size={18} /> Historique
        </button>
      </div>

      {activeTab === 'form' ? <ReturnForm /> : <ReturnHistory />}
    </div>
  );
};

export default ReturnsModule;
