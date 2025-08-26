import React from 'react';
import { Database, Settings } from 'lucide-react';

const DataManagerWidget = ({
  showDataManager,
  setShowDataManager,
  globalProducts = [],
  salesHistory = [],
  customers = [],
  credits = [],
  appSettings = {},
  clearAllData,
  isDark,
  setGlobalProducts,
  setSalesHistory,
  setCustomers,
  setCredits,
  setAppSettings
}) => {
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const {
            products,
            sales,
            customers: importedCustomers,
            credits: importedCredits,
            settings
          } = data || {};

          if (
            !Array.isArray(products) ||
            !Array.isArray(sales) ||
            !Array.isArray(importedCustomers) ||
            !Array.isArray(importedCredits) ||
            typeof settings !== 'object'
          ) {
            alert('❌ Structure de sauvegarde invalide');
            return;
          }

          const currentData = {
            timestamp: new Date().toISOString(),
            products: globalProducts,
            sales: salesHistory,
            customers,
            credits,
            settings: appSettings
          };

          try {
            localStorage.setItem(`pos_backup_${Date.now()}`, JSON.stringify(currentData));
          } catch (err) {
            console.warn('Erreur lors de la sauvegarde locale:', err);
          }

          const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `pos-backup-before-import-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          setGlobalProducts(products);
          setSalesHistory(sales);
          setCustomers(importedCustomers);
          setCredits(importedCredits);
          setAppSettings(prev => ({ ...prev, ...settings }));

          alert('✅ Sauvegarde importée avec succès');
        } catch (error) {
          console.error('Erreur lors de l\'importation:', error);
          alert('❌ Fichier de sauvegarde invalide');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
  <div style={{
    background: isDark ? '#2d3748' : 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '15px'
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: isDark ? '#f7fafc' : '#2d3748',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: 0
      }}>
        <Database size={20} />
        Sauvegarde & Synchronisation Cloud
      </h3>
      <button
        onClick={() => setShowDataManager(!showDataManager)}
        style={{
          background: 'transparent',
          border: 'none',
          color: isDark ? '#a0aec0' : '#64748b',
          cursor: 'pointer',
          padding: '4px'
        }}
      >
        <Settings size={16} />
      </button>
    </div>

    {showDataManager && (
      <div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const dataToExport = {
                timestamp: new Date().toISOString(),
                products: globalProducts,
                sales: salesHistory,
                customers,
                credits,
                settings: appSettings
              };

              const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💾 Télécharger Sauvegarde
          </button>

          <button
            onClick={handleImport}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📤 Importer Sauvegarde
          </button>

          <button
            onClick={clearAllData}
            style={{
              padding: '8px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🗑️ Effacer Toutes les Données
          </button>
        </div>
        <p style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#718096', marginTop: '10px', margin: 0 }}>
          💡 Les données sont automatiquement sauvegardées localement dans votre navigateur
        </p>
      </div>
    )}
  </div>
  );
};

export default DataManagerWidget;
