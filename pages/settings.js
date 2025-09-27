import { useState } from 'react';
import { Settings, Store, Printer, Bell, Save, Shield, Globe } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    storeName: 'Superette Centre',
    currency: 'FCFA',
    taxRate: 18,
    language: 'fr',
    printerEnabled: false,
    lowStockAlert: 10,
    autoBackup: true,
    receiptFooter: 'Merci de votre visite!'
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Ici on sauvegarderait dans la base de données
    localStorage.setItem('pos_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px' }}>
      <h1>Paramètres</h1>

      {saved && (
        <div style={{
          padding: '15px',
          background: '#10b981',
          color: 'white',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          ✓ Paramètres sauvegardés avec succès
        </div>
      )}

      {/* Paramètres généraux */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Store size={24} />
          Informations du Magasin
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#6b7280' }}>
            Nom du magasin
          </label>
          <input
            type="text"
            value={settings.storeName}
            onChange={(e) => setSettings({...settings, storeName: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#6b7280' }}>
              Devise
            </label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({...settings, currency: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            >
              <option value="FCFA">FCFA</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#6b7280' }}>
              Taux de TVA (%)
            </label>
            <input
              type="number"
              value={settings.taxRate}
              onChange={(e) => setSettings({...settings, taxRate: parseFloat(e.target.value)})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Paramètres système */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Settings size={24} />
          Configuration Système
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={settings.printerEnabled}
              onChange={(e) => setSettings({...settings, printerEnabled: e.target.checked})}
            />
            <Printer size={20} />
            Activer l'impression des reçus
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={settings.autoBackup}
              onChange={(e) => setSettings({...settings, autoBackup: e.target.checked})}
            />
            <Shield size={20} />
            Sauvegarde automatique quotidienne
          </label>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#6b7280' }}>
            <Bell size={16} style={{ display: 'inline', marginRight: '5px' }} />
            Alerte stock faible (unités)
          </label>
          <input
            type="number"
            value={settings.lowStockAlert}
            onChange={(e) => setSettings({...settings, lowStockAlert: parseInt(e.target.value)})}
            style={{
              width: '200px',
              padding: '10px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
        </div>
      </div>

      {/* Personnalisation reçu */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '20px' }}>Message de Reçu</h2>
        
        <textarea
          value={settings.receiptFooter}
          onChange={(e) => setSettings({...settings, receiptFooter: e.target.value})}
          placeholder="Message en bas du reçu..."
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            minHeight: '80px',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Bouton sauvegarder */}
      <button
        onClick={handleSave}
        style={{
          padding: '15px 40px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <Save size={20} />
        Sauvegarder les paramètres
      </button>
    </div>
  );
}