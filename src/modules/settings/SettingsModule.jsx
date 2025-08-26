import React, { useState, useEffect } from 'react';
import { 
  Settings, Store, Palette, Database, Shield, 
  Save, RotateCcw, Download, Upload, Trash2,
  Moon, Sun, DollarSign, Percent, User,
  Phone, MapPin, Clock, Bell
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const SettingsModule = () => {
  const { 
    appSettings, 
    setAppSettings, 
    stores, 
    getCurrentStore,
    clearAllData,
    getStats
  } = useApp();
  
  const [localSettings, setLocalSettings] = useState(appSettings);
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  
  const isDark = appSettings.darkMode;
  const currentStore = getCurrentStore();
  const stats = getStats();

  useEffect(() => {
    setLocalSettings(appSettings);
  }, [appSettings]);

  // Détecter les changements
  useEffect(() => {
    const hasChanged = JSON.stringify(localSettings) !== JSON.stringify(appSettings);
    setHasChanges(hasChanged);
  }, [localSettings, appSettings]);

  // Sauvegarder les paramètres
  const handleSave = () => {
    setAppSettings(localSettings);
    setHasChanges(false);
    alert('✅ Paramètres sauvegardés avec succès !');
  };

  // Réinitialiser les changements
  const handleReset = () => {
    setLocalSettings(appSettings);
    setHasChanges(false);
  };

  // Exporter les données
  const handleExport = () => {
    try {
      const data = {
        settings: appSettings,
        exportDate: new Date().toISOString(),
        storeInfo: currentStore,
        stats: stats
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos-settings-${currentStore.code}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('✅ Paramètres exportés avec succès !');
    } catch (error) {
      alert('❌ Erreur lors de l\'export des paramètres');
    }
  };

  // Importer les données
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.settings) {
          setLocalSettings(data.settings);
          alert('✅ Paramètres importés avec succès ! Cliquez sur "Sauvegarder" pour appliquer.');
        } else {
          alert('❌ Fichier de paramètres invalide');
        }
      } catch (error) {
        alert('❌ Erreur lors de la lecture du fichier');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const updateSetting = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'store', label: 'Magasin', icon: Store },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'data', label: 'Données', icon: Database },
    { id: 'security', label: 'Sécurité', icon: Shield }
  ];

  return (
    <div style={{
      padding: '20px',
      background: isDark ? '#1a202c' : '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* En-tête */}
      <div style={{
        background: isDark ? '#2d3748' : 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Settings size={28} color={isDark ? '#63b3ed' : '#3182ce'} />
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '28px', 
              fontWeight: 'bold',
              color: isDark ? '#f7fafc' : '#2d3748'
            }}>
              Paramètres
            </h1>
            <p style={{
              margin: '4px 0 0 0',
              color: isDark ? '#cbd5e0' : '#718096',
              fontSize: '16px'
            }}>
              Configuration du système POS - {currentStore.name}
            </p>
          </div>
        </div>
        
        {hasChanges && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: '#fef5e7',
            border: '1px solid #f6ad55',
            borderRadius: '8px',
            color: '#c05621'
          }}>
            <Bell size={16} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              Vous avez des modifications non sauvegardées
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button
                onClick={handleReset}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: '1px solid #c05621',
                  borderRadius: '4px',
                  color: '#c05621',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <RotateCcw size={12} style={{ marginRight: '4px' }} />
                Annuler
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '6px 12px',
                  background: '#c05621',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                <Save size={12} style={{ marginRight: '4px' }} />
                Sauvegarder
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
        {/* Menu des onglets */}
        <div style={{
          background: isDark ? '#2d3748' : 'white',
          borderRadius: '12px',
          padding: '16px',
          height: 'fit-content',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: isDark ? '#f7fafc' : '#2d3748'
          }}>
            Catégories
          </h3>
          
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  margin: '2px 0',
                  background: isActive 
                    ? (isDark ? '#4a5568' : '#edf2f7') 
                    : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: isDark ? '#f7fafc' : '#2d3748',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Contenu des paramètres */}
        <div style={{
          background: isDark ? '#2d3748' : 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {/* Onglet Général */}
          {activeTab === 'general' && (
            <div>
              <h2 style={{
                margin: '0 0 24px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: isDark ? '#f7fafc' : '#2d3748'
              }}>
                Paramètres généraux
              </h2>

              <div style={{ display: 'grid', gap: '24px' }}>
                {/* Devise */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: isDark ? '#cbd5e0' : '#4a5568'
                  }}>
                    <DollarSign size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Devise
                  </label>
                  <select
                    value={localSettings.currency}
                    onChange={(e) => updateSetting('currency', e.target.value)}
                    style={{
                      width: '200px',
                      padding: '10px 12px',
                      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                      borderRadius: '6px',
                      background: isDark ? '#4a5568' : 'white',
                      color: isDark ? '#f7fafc' : '#2d3748',
                      fontSize: '14px'
                    }}
                  >
                    <option value="FCFA">FCFA (Franc CFA)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="USD">USD (Dollar)</option>
                    <option value="XOF">XOF (Franc CFA Ouest)</option>
                  </select>
                </div>

                {/* Taux de taxe */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: isDark ? '#cbd5e0' : '#4a5568'
                  }}>
                    <Percent size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Taux de taxe (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localSettings.taxRate}
                    onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '200px',
                      padding: '10px 12px',
                      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                      borderRadius: '6px',
                      background: isDark ? '#4a5568' : 'white',
                      color: isDark ? '#f7fafc' : '#2d3748',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Points par achat */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: isDark ? '#cbd5e0' : '#4a5568'
                  }}>
                    Points de fidélité par 1000 {localSettings.currency}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={localSettings.pointsPerPurchase}
                    onChange={(e) => updateSetting('pointsPerPurchase', parseInt(e.target.value) || 1)}
                    style={{
                      width: '200px',
                      padding: '10px 12px',
                      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                      borderRadius: '6px',
                      background: isDark ? '#4a5568' : 'white',
                      color: isDark ? '#f7fafc' : '#2d3748',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Onglet Magasin */}
          {activeTab === 'store' && (
            <div>
              <h2 style={{
                margin: '0 0 24px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: isDark ? '#f7fafc' : '#2d3748'
              }}>
                Informations du magasin
              </h2>

              <div style={{ display: 'grid', gap: '24px' }}>
                {/* Nom du magasin */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: isDark ? '#cbd5e0' : '#4a5568'
                  }}>
                    <Store size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Nom du magasin
                  </label>
                  <input
                    type="text"
                    value={localSettings.storeName}
                    onChange={(e) => updateSetting('storeName', e.target.value)}
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      padding: '10px 12px',
                      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
                      borderRadius: '6px',
                      background: isDark ? '#4a5568' : 'white',
                      color: isDark ? '#f7fafc' : '#2d3748',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Informations actuelles du magasin */}
                <div style={{
                  padding: '16px',
                  background: isDark ? '#4a5568' : '#f7fafc',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? '#718096' : '#e2e8f0'}`
                }}>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    color: isDark ? '#f7fafc' : '#2d3748',
                    fontSize: '16px'
                  }}>
                    Magasin actuel : {currentStore.name}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div>
                      <strong>Code :</strong> {currentStore.code}
                    </div>
                    <div>
                      <strong>Gérant :</strong> {currentStore.manager}
                    </div>
                    <div>
                      <strong>Adresse :</strong> {currentStore.address}
                    </div>
                    <div>
                      <strong>Téléphone :</strong> {currentStore.phone}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Apparence */}
          {activeTab === 'appearance' && (
            <div>
              <h2 style={{
                margin: '0 0 24px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: isDark ? '#f7fafc' : '#2d3748'
              }}>
                Apparence et thème
              </h2>

              <div style={{ display: 'grid', gap: '24px' }}>
                {/* Mode sombre */}
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    color: isDark ? '#cbd5e0' : '#4a5568'
                  }}>
                    {localSettings.darkMode ? <Moon size={16} /> : <Sun size={16} />}
                    Mode sombre
                    <input
                      type="checkbox"
                      checked={localSettings.darkMode}
                      onChange={(e) => updateSetting('darkMode', e.target.checked)}
                      style={{
                        marginLeft: 'auto',
                        width: '20px',
                        height: '20px',
                        accentColor: '#3182ce'
                      }}
                    />
                  </label>
                  <p style={{
                    margin: '8px 0 0 28px',
                    fontSize: '12px',
                    color: isDark ? '#a0aec0' : '#718096'
                  }}>
                    Activez le mode sombre pour une meilleure expérience en faible luminosité
                  </p>
                </div>

                {/* Aperçu du thème */}
                <div>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    color: isDark ? '#f7fafc' : '#2d3748'
                  }}>
                    Aperçu du thème
                  </h4>
                  <div style={{
                    padding: '16px',
                    background: localSettings.darkMode ? '#1a202c' : '#f8fafc',
                    border: `1px solid ${localSettings.darkMode ? '#4a5568' : '#e2e8f0'}`,
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      padding: '12px 16px',
                      background: localSettings.darkMode ? '#2d3748' : 'white',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      color: localSettings.darkMode ? '#f7fafc' : '#2d3748'
                    }}>
                      Exemple d'en-tête
                    </div>
                    <div style={{
                      padding: '12px 16px',
                      background: localSettings.darkMode ? '#4a5568' : '#edf2f7',
                      borderRadius: '6px',
                      color: localSettings.darkMode ? '#cbd5e0' : '#4a5568',
                      fontSize: '14px'
                    }}>
                      Exemple de contenu avec le thème {localSettings.darkMode ? 'sombre' : 'clair'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Données */}
          {activeTab === 'data' && (
            <div>
              <h2 style={{
                margin: '0 0 24px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: isDark ? '#f7fafc' : '#2d3748'
              }}>
                Gestion des données
              </h2>

              <div style={{ display: 'grid', gap: '24px' }}>
                {/* Statistiques */}
                <div style={{
                  padding: '16px',
                  background: isDark ? '#4a5568' : '#f7fafc',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? '#718096' : '#e2e8f0'}`
                }}>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    color: isDark ? '#f7fafc' : '#2d3748'
                  }}>
                    Statistiques des données
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '14px' }}>
                    <div>
                      <strong>Produits :</strong> {stats.totalProducts}
                    </div>
                    <div>
                      <strong>Clients :</strong> {stats.totalCustomers}
                    </div>
                    <div>
                      <strong>Ventes ce mois :</strong> {stats.monthTransactions}
                    </div>
                    <div>
                      <strong>Chiffre d'affaires :</strong> {stats.monthRevenue.toLocaleString()} {localSettings.currency}
                    </div>
                  </div>
                </div>

                {/* Export/Import */}
                <div>
                  <h4 style={{
                    margin: '0 0 16px 0',
                    color: isDark ? '#f7fafc' : '#2d3748'
                  }}>
                    Sauvegarde et restauration
                  </h4>
                  
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleExport}
                      style={{
                        padding: '10px 16px',
                        background: '#3182ce',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      <Download size={16} />
                      Exporter les paramètres
                    </button>
                    
                    <label style={{
                      padding: '10px 16px',
                      background: '#48bb78',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      <Upload size={16} />
                      Importer les paramètres
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>

                {/* Zone de danger */}
                <div style={{
                  padding: '16px',
                  background: '#fed7d7',
                  border: '1px solid #fc8181',
                  borderRadius: '8px'
                }}>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    color: '#c53030',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Trash2 size={16} />
                    Zone de danger
                  </h4>
                  <p style={{
                    margin: '0 0 12px 0',
                    color: '#c53030',
                    fontSize: '14px'
                  }}>
                    Cette action effacera définitivement toutes les données de tous les magasins.
                  </p>
                  <button
                    onClick={clearAllData}
                    style={{
                      padding: '8px 16px',
                      background: '#e53e3e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Effacer toutes les données
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Sécurité */}
          {activeTab === 'security' && (
            <div>
              <h2 style={{
                margin: '0 0 24px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: isDark ? '#f7fafc' : '#2d3748'
              }}>
                Sécurité et accès
              </h2>

              <div style={{ display: 'grid', gap: '24px' }}>
                {/* Informations de session */}
                <div style={{
                  padding: '16px',
                  background: isDark ? '#4a5568' : '#f7fafc',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? '#718096' : '#e2e8f0'}`
                }}>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    color: isDark ? '#f7fafc' : '#2d3748',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <User size={16} />
                    Session actuelle
                  </h4>
                  <div style={{ fontSize: '14px', color: isDark ? '#cbd5e0' : '#4a5568' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Utilisateur :</strong> Administrateur
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Magasin :</strong> {currentStore.name}
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Dernière connexion :</strong> {new Date().toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Recommandations de sécurité */}
                <div>
                  <h4 style={{
                    margin: '0 0 16px 0',
                    color: isDark ? '#f7fafc' : '#2d3748'
                  }}>
                    Recommandations de sécurité
                  </h4>
                  
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {[
                      '🔒 Changez régulièrement vos mots de passe',
                      '💾 Effectuez des sauvegardes régulières de vos données',
                      '🔄 Mettez à jour le système régulièrement',
                      '👥 Limitez l\'accès aux fonctions administratives',
                      '📱 Utilisez l\'authentification à deux facteurs si disponible'
                    ].map((tip, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '12px',
                          background: isDark ? '#4a5568' : 'white',
                          border: `1px solid ${isDark ? '#718096' : '#e2e8f0'}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: isDark ? '#cbd5e0' : '#4a5568'
                        }}
                      >
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;
