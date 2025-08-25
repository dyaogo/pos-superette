import { db, auth } from '../config/firebase';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useState, useEffect } from 'react';

export class CloudSyncService {
  constructor() {
    this.storeId = localStorage.getItem('pos_store_id') || this.generateStoreId();
    this.syncEnabled = localStorage.getItem('pos_cloud_sync') === 'true';
    this.user = null;
  }

  generateStoreId() {
    const id = 'store_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('pos_store_id', id);
    return id;
  }

  async enableCloudSync(email, password, isNewAccount = false) {
    try {
      if (isNewAccount) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      this.user = auth.currentUser;
      localStorage.setItem('pos_cloud_sync', 'true');
      this.syncEnabled = true;
      
      // Synchronisation initiale
      await this.performFullSync();
      
      return { success: true, message: 'Synchronisation cloud activée' };
    } catch (error) {
      console.error('Erreur activation cloud:', error);
      return { success: false, message: this.getErrorMessage(error.code) };
    }
  }

  getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Utilisateur non trouvé. Créez un compte d\'abord.';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect.';
      case 'auth/email-already-in-use':
        return 'Cet email est déjà utilisé.';
      case 'auth/weak-password':
        return 'Le mot de passe doit contenir au moins 6 caractères.';
      case 'auth/invalid-email':
        return 'Email invalide.';
      default:
        return 'Erreur de connexion: ' + errorCode;
    }
  }

  async performFullSync() {
    if (!this.syncEnabled || !auth.currentUser) return;

    try {
      const localData = this.gatherLocalData();
      
      // Sauvegarder dans Firestore
      const storeDoc = doc(db, 'stores', this.storeId);
      await setDoc(storeDoc, {
        data: localData,
        lastUpdated: new Date(),
        userId: auth.currentUser.uid,
        storeName: localData.settings.storeName || 'Mon Magasin'
      });

      // Optionnel: récupérer les données cloud pour merge
      const cloudDoc = await getDoc(storeDoc);
      if (cloudDoc.exists()) {
        const cloudData = cloudDoc.data();
        // Ici vous pourriez implémenter un merge plus sophistiqué
        console.log('Données cloud disponibles:', cloudData.data);
      }

      localStorage.setItem('pos_last_sync', new Date().toISOString());
      
      return { success: true, message: 'Synchronisation réussie' };
    } catch (error) {
      console.error('Erreur sync:', error);
      return { success: false, message: 'Erreur de synchronisation' };
    }
  }

  gatherLocalData() {
    return {
      products: JSON.parse(localStorage.getItem('pos_products') || '[]'),
      sales: JSON.parse(localStorage.getItem('pos_sales') || '[]'),
      customers: JSON.parse(localStorage.getItem('pos_customers') || '[]'),
      credits: JSON.parse(localStorage.getItem('pos_credits') || '[]'),
      settings: JSON.parse(localStorage.getItem('pos_settings') || '{}'),
      cashReports: JSON.parse(localStorage.getItem('pos_cash_reports') || '[]')
    };
  }

  async signOut() {
    await auth.signOut();
    localStorage.setItem('pos_cloud_sync', 'false');
    this.syncEnabled = false;
    this.user = null;
  }

  // Méthodes de sauvegarde locale (inchangées)
  async createBackup() {
    const data = this.gatherLocalData();
    const backup = {
      version: '1.0',
      storeId: this.storeId,
      storeName: data.settings.storeName || 'Mon Magasin',
      createdAt: new Date().toISOString(),
      data: data
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${backup.storeName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async restoreBackup(file) {
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      
      if (!backup.version || !backup.data) {
        throw new Error('Format de sauvegarde invalide');
      }
      
      const confirmMessage = `Restaurer la sauvegarde de "${backup.storeName}" du ${new Date(backup.createdAt).toLocaleDateString('fr-FR')} ?\n\nCeci remplacera toutes les données actuelles.`;
      
      if (!window.confirm(confirmMessage)) {
        return { success: false, message: 'Restauration annulée' };
      }
      
      Object.entries(backup.data).forEach(([key, value]) => {
        localStorage.setItem(`pos_${key}`, JSON.stringify(value));
      });
      
      alert('Sauvegarde restaurée ! La page va se recharger.');
      window.location.reload();
      
      return { success: true, message: 'Sauvegarde restaurée avec succès' };
    } catch (error) {
      console.error('Erreur restauration:', error);
      return { success: false, message: 'Erreur lors de la restauration: ' + error.message };
    }
  }
}

export const useCloudSync = () => {
  const [cloudService] = useState(() => new CloudSyncService());
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const [isCloudEnabled, setIsCloudEnabled] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setIsCloudEnabled(localStorage.getItem('pos_cloud_sync') === 'true');
    setLastSync(localStorage.getItem('pos_last_sync'));
    
    // Écouter les changements d'authentification
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        setIsCloudEnabled(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const enableCloud = async (email, password, isNewAccount = false) => {
    setSyncStatus('syncing');
    const result = await cloudService.enableCloudSync(email, password, isNewAccount);
    setSyncStatus(result.success ? 'success' : 'error');
    if (result.success) {
      setIsCloudEnabled(true);
      setLastSync(new Date().toISOString());
    }
    return result;
  };

  const manualSync = async () => {
    setSyncStatus('syncing');
    const result = await cloudService.performFullSync();
    setSyncStatus(result.success ? 'success' : 'error');
    if (result.success) {
      setLastSync(new Date().toISOString());
    }
    return result;
  };

  const signOut = async () => {
    await cloudService.signOut();
    setIsCloudEnabled(false);
    setUser(null);
  };

  const createBackup = async () => {
    setSyncStatus('creating');
    try {
      await cloudService.createBackup();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const restoreBackup = async (file) => {
    setSyncStatus('restoring');
    const result = await cloudService.restoreBackup(file);
    setSyncStatus(result.success ? 'success' : 'error');
    return result;
  };

  return {
    syncStatus,
    lastSync,
    isCloudEnabled,
    user,
    enableCloud,
    manualSync,
    signOut,
    createBackup,
    restoreBackup
  };
};


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
