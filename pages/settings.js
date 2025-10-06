import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    storeName: 'Mon Superette',
    currency: 'FCFA',
    taxRate: 18,
    lowStockThreshold: 10,
    receiptFooter: 'Merci de votre visite !',
    printerEnabled: false,
    autoBackup: true
  });
  
  const [saved, setSaved] = useState(false);

  // Charger les paramètres depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('pos_settings');
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      }
    }
  }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_settings', JSON.stringify(settings));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Réinitialiser tous les paramètres ?')) {
      const defaultSettings = {
        storeName: 'Mon Superette',
        currency: 'FCFA',
        taxRate: 18,
        lowStockThreshold: 10,
        receiptFooter: 'Merci de votre visite !',
        printerEnabled: false,
        autoBackup: true
      };
      setSettings(defaultSettings);
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_settings', JSON.stringify(defaultSettings));
      }
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={32} />
          Paramètres de l'Application
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Configurez votre point de vente
        </p>
      </div>

      {/* Message de confirmation */}
      {saved && (
        <div style={{
          padding: '15px',
          background: '#dcfce7',
          color: '#166534',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Save size={20} />
          Paramètres enregistrés avec succès !
        </div>
      )}

      {/* Formulaire */}
      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '30px' }}>
        
        {/* Informations du magasin */}
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #e5e7eb' }}>
            Informations du Magasin
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Nom du magasin
            </label>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) => handleChange('storeName', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Devise
              </label>
              <select
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              >
                <option value="FCFA">FCFA (Franc CFA)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (Dollar)</option>
                <option value="XOF">XOF (CFA BCEAO)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Taux de TVA (%)
              </label>
              <input
                type="number"
                value={settings.taxRate}
                onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
                min="0"
                max="100"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>
        </section>

        {/* Gestion de l'inventaire */}
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #e5e7eb' }}>
            Gestion de l'Inventaire
          </h2>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Seuil de stock faible (unités)
            </label>
            <input
              type="number"
              value={settings.lowStockThreshold}
              onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value))}
              min="0"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '5px' }}>
              Les produits en dessous de ce seuil seront marqués comme stock faible
            </p>
          </div>
        </section>

        {/* Reçus et impression */}
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #e5e7eb' }}>
            Reçus et Impression
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Pied de page des reçus
            </label>
            <textarea
              value={settings.receiptFooter}
              onChange={(e) => handleChange('receiptFooter', e.target.value)}
              rows="3"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '16px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            cursor: 'pointer',
            padding: '12px',
            background: 'var(--color-surface-hover)',
            borderRadius: '8px'
          }}>
            <input
              type="checkbox"
              checked={settings.printerEnabled}
              onChange={(e) => handleChange('printerEnabled', e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <div>
              <div style={{ fontWeight: '500' }}>Activer l'impression automatique</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Imprimer automatiquement les reçus après chaque vente
              </div>
            </div>
          </label>
        </section>

        {/* Système */}
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #e5e7eb' }}>
            Système
          </h2>

          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            cursor: 'pointer',
            padding: '12px',
            background: 'var(--color-surface-hover)',
            borderRadius: '8px'
          }}>
            <input
              type="checkbox"
              checked={settings.autoBackup}
              onChange={(e) => handleChange('autoBackup', e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <div>
              <div style={{ fontWeight: '500' }}>Sauvegarde automatique</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Sauvegarder automatiquement les données dans le cloud
              </div>
            </div>
          </label>
        </section>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '2px solid #e5e7eb' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '12px 24px',
              background: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            <RefreshCw size={20} />
            Réinitialiser
          </button>

          <button
            onClick={handleSave}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            <Save size={20} />
            Enregistrer les paramètres
          </button>
        </div>
      </div>
    </div>
  );
}