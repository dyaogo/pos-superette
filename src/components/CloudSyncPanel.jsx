import React, { useState } from 'react';
import { useCloudSync } from '../hooks/useCloudSync';
import styles from './CloudSyncPanel.module.css';

export const CloudSyncPanel = () => {
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
  const [isCollapsed, setIsCollapsed] = useState(true);

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

  if (isCollapsed) {
    return (
      <div className={styles.collapsed} onClick={() => setIsCollapsed(false)}>
        <span className={styles.statusIcon}>☁️</span>
        <span className={styles.toggle}>⬇️</span>
      </div>
    );
  }

  return (
    <div className={styles.expanded}>
      <div className={styles.header}>
        <h3 className={styles.title}>Sauvegarde & Synchronisation Cloud</h3>
        <span className={styles.toggle} onClick={() => setIsCollapsed(true)}>⬆️</span>
      </div>

      {/* Status */}
      <div className={styles.status}>
        <span className={styles.statusIcon}>{getSyncStatusIcon()}</span>
        <div>
          <div className={styles.statusMain}>
            {isCloudEnabled ? `Cloud activé (${user?.email})` : 'Sauvegarde locale uniquement'}
          </div>
          {lastSync && (
            <div className={styles.statusSub}>
              Dernière sync: {new Date(lastSync).toLocaleString('fr-FR')}
            </div>
          )}
          <div className={styles.statusSub}>
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
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            Activer la synchronisation cloud
          </button>
        ) : (
          <>
            <button
              onClick={manualSync}
              disabled={syncStatus === 'syncing'}
              className={`${styles.button} ${styles.buttonSuccess}`}
            >
              Synchroniser maintenant
            </button>

            <button
              onClick={signOut}
              className={`${styles.button} ${styles.buttonDanger}`}
            >
              Déconnecter cloud
            </button>
          </>
        )}

        <button
          onClick={createBackup}
          disabled={syncStatus === 'creating' || syncStatus === 'restoring'}
          className={`${styles.button} ${styles.buttonWarning}`}
        >
          Télécharger sauvegarde
        </button>

        <label className={`${styles.button} ${styles.buttonNeutral}`}>
          Restaurer sauvegarde
          <input
            type="file"
            accept=".json"
            onChange={handleFileRestore}
            className={styles.hiddenInput}
            disabled={syncStatus === 'creating' || syncStatus === 'restoring'}
          />
        </label>
      </div>

      {/* Modal setup cloud */}
      {showCloudSetup && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Configuration Cloud Firebase</h3>

            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  checked={!isNewAccount}
                  onChange={() => setIsNewAccount(false)}
                />
                <span>Se connecter</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  checked={isNewAccount}
                  onChange={() => setIsNewAccount(true)}
                />
                <span>Créer un compte</span>
              </label>
            </div>

            <input
              type="email"
              placeholder="Email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className={styles.input}
            />

            <input
              type="password"
              placeholder="Mot de passe (min 6 caractères)"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className={styles.input}
            />

            <div className={styles.actionRow}>
              <button
                onClick={() => setShowCloudSetup(false)}
                className={`${styles.button} ${styles.buttonNeutral}`}
              >
                Annuler
              </button>
              <button
                onClick={handleEnableCloud}
                disabled={!credentials.email || !credentials.password || credentials.password.length < 6}
                className={`${styles.button} ${styles.buttonPrimary}`}
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
