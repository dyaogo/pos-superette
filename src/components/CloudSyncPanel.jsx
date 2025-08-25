import React, { useState } from 'react';
import { useCloudSync } from '../hooks/useCloudSync';

export const CloudSyncPanel = ({ isDark = false }) => {
  const {
    syncStatus,
    lastSync,
    isCloudEnabled,
    user,
    enableCloud,
    manualSync,
    signOut,
    createBackup,
    restoreBackup
  } = useCloudSync();

  const [showCloudSetup, setShowCloudSetup] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isNewAccount, setIsNewAccount] = useState(false);

  const handleEnableCloud = async () => {
    const result = await enableCloud(credentials.email, credentials.password, isNewAccount);
    if (result.success) {
      setShowCloudSetup(false);
      setCredentials({ email: '', password: '' });
    }
    alert(result.message);
  };

  const handleFileRestore = (event) => {
    const file = event.target.files[0];
    if (file) {
      restoreBackup(file).then(result => {
        alert(result.message);
      });
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing': return '🔄';
      case 'creating': return '📦';
      case 'restoring': return '📥';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '☁️';
    }
  };

  const styles = {
    panel: {
      background: isDark ? '#2d3748' : 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    },
    button: {
      padding: '10px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      marginRight: '10px',
      marginBottom: '10px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    input: {
      width: '100%',
      padding: '10px',
      border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`,
      borderRadius: '6px',
      background: isDark ? '#374151' : 'white',
      color: isDark ? '#f7fafc' : '#2d3748',
      marginBottom: '10px'
    }
  };

  return (
    <div style={styles.panel}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '15px',
        color: isDark ? '#f7fafc' : '#2d3748'
      }}>
        Sauvegarde & Synchronisation Cloud
      </h3>

      {/* Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px',
        background: isDark ? '#374151' : '#f8fafc',
        borderRadius: '6px',
        marginBottom: '15px'
      }}>
        <span style={{ fontSize: '20px' }}>{getSyncStatusIcon()}</span>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: isDark ? '#f7fafc' : '#2d3748' }}>
            {isCloudEnabled ? `Cloud activé (${user?.email})` : 'Sauvegarde locale uniquement'}
          </div>
          {lastSync && (
            <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#64748b' }}>
              Dernière sync: {new Date(lastSync).toLocaleString('fr-FR')}
            </div>
          )}
          <div style={{ fontSize: '12px', color: isDark ? '#a0aec0' : '#64748b' }}>
            Status: {syncStatus === 'syncing' ? 'Synchronisation...' :
                     syncStatus === 'creating' ? 'Création sauvegarde...' :
                     syncStatus === 'restoring' ? 'Restauration...' :
                     syncStatus === 'success' ? 'Opération réussie' :
                     syncStatus === 'error' ? 'Erreur' : 'Prêt'}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div>
        {!isCloudEnabled ? (
          <button
            onClick={() => setShowCloudSetup(true)}
            style={{
              ...styles.button,
              background: '#3b82f6',
              color: 'white'
            }}
          >
            Activer la synchronisation cloud
          </button>
        ) : (
          <>
            <button
              onClick={manualSync}
              disabled={syncStatus === 'syncing'}
              style={{
                ...styles.button,
                background: '#10b981',
                color: 'white',
                opacity: syncStatus === 'syncing' ? 0.7 : 1
              }}
            >
              Synchroniser maintenant
            </button>

            <button
              onClick={signOut}
              style={{
                ...styles.button,
                background: '#ef4444',
                color: 'white'
              }}
            >
              Déconnecter cloud
            </button>
          </>
        )}

        <button
          onClick={createBackup}
          disabled={syncStatus === 'creating' || syncStatus === 'restoring'}
          style={{
            ...styles.button,
            background: '#f59e0b',
            color: 'white',
            opacity: syncStatus === 'creating' || syncStatus === 'restoring' ? 0.7 : 1
          }}
        >
          Télécharger sauvegarde
        </button>

        <label style={{
          ...styles.button,
          background: isDark ? '#4a5568' : '#e2e8f0',
          color: isDark ? '#f7fafc' : '#2d3748'
        }}>
          Restaurer sauvegarde
          <input
            type="file"
            accept=".json"
            onChange={handleFileRestore}
            style={{ display: 'none' }}
            disabled={syncStatus === 'creating' || syncStatus === 'restoring'}
          />
        </label>
      </div>

      {/* Modal setup cloud */}
      {showCloudSetup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: isDark ? '#2d3748' : 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{
              marginBottom: '20px',
              color: isDark ? '#f7fafc' : '#2d3748'
            }}>
              Configuration Cloud Firebase
            </h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="radio"
                  checked={!isNewAccount}
                  onChange={() => setIsNewAccount(false)}
                />
                <span style={{ color: isDark ? '#f7fafc' : '#2d3748' }}>Se connecter</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  checked={isNewAccount}
                  onChange={() => setIsNewAccount(true)}
                />
                <span style={{ color: isDark ? '#f7fafc' : '#2d3748' }}>Créer un compte</span>
              </label>
            </div>

            <input
              type="email"
              placeholder="Email"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Mot de passe (min 6 caractères)"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              style={styles.input}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowCloudSetup(false)}
                style={{
                  ...styles.button,
                  flex: 1,
                  background: '#64748b',
                  color: 'white',
                  justifyContent: 'center'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleEnableCloud}
                disabled={!credentials.email || !credentials.password || credentials.password.length < 6}
                style={{
                  ...styles.button,
                  flex: 1,
                  background: credentials.email && credentials.password.length >= 6 ? '#3b82f6' : '#94a3b8',
                  color: 'white',
                  justifyContent: 'center'
                }}
              >
                {isNewAccount ? 'Créer' : 'Connecter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
