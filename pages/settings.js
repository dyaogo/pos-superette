import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Store, DollarSign, Percent, AlertTriangle } from 'lucide-react';
import { useApp } from '../src/contexts/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SettingsPage() {
  const { currentStore, updateCurrentStore, loading } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    currency: 'FCFA',
    taxRate: 18
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Charger les données du magasin actif
  useEffect(() => {
    if (currentStore) {
      setFormData({
        name: currentStore.name || '',
        address: currentStore.address || '',
        phone: currentStore.phone || '',
        currency: currentStore.currency || 'FCFA',
        taxRate: currentStore.taxRate || 18
      });
    }
  }, [currentStore]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    const result = await updateCurrentStore(formData);
    
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert('Erreur lors de la sauvegarde');
    }
    
    setSaving(false);
  };

  if (loading || !currentStore) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon size={32} />
          Paramètres
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Configuration du magasin : <strong>{currentStore.name}</strong>
        </p>
      </div>

      {/* Message de confirmation */}
      {saved && (
        <div style={{
          padding: '15px',
          background: 'rgba(16, 185, 129, 0.1)',
          color: 'var(--color-success)',
          border: '1px solid var(--color-success)',
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
      <div style={{ 
        background: 'var(--color-surface)', 
        borderRadius: '12px', 
        border: '1px solid var(--color-border)', 
        padding: '30px' 
      }}>
        
        {/* Informations du magasin */}
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '20px', 
            paddingBottom: '10px', 
            borderBottom: '2px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Store size={20} />
            Informations du Magasin
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Nom du magasin *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Adresse
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Adresse complète du magasin"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+226 XX XX XX XX"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '16px'
              }}
            />
          </div>
        </section>

        {/* Configuration financière */}
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '20px', 
            paddingBottom: '10px', 
            borderBottom: '2px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <DollarSign size={20} />
            Configuration Financière
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Devise
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
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
                <Percent size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Taux de TVA (%)
              </label>
              <input
                type="number"
                value={formData.taxRate}
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange('taxRate', value !== '' ? parseFloat(value) : 0);
                }}
                min="0"
                max="100"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>
        </section>

        {/* Info box */}
        <div style={{
          padding: '15px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid var(--color-primary)',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          gap: '10px'
        }}>
          <AlertTriangle size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            <strong>Note :</strong> Ces paramètres s'appliquent uniquement au magasin actuel (<strong>{currentStore.name}</strong>). 
            Pour modifier un autre magasin, sélectionnez-le dans le menu en haut à droite puis revenez ici.
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 24px',
              background: saving ? 'var(--color-border)' : 'var(--color-success)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Save size={20} />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Info code magasin */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        fontSize: '14px',
        color: 'var(--color-text-secondary)'
      }}>
        <strong>Code du magasin:</strong> {currentStore.code} (non modifiable)
      </div>
    </div>
  );
}