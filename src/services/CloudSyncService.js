import { db, auth } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export class CloudSyncService {
  constructor() {
    if (typeof window !== 'undefined') {
      this.storeId = localStorage.getItem('pos_store_id') || this.generateStoreId();
      this.syncEnabled = localStorage.getItem('pos_cloud_sync') === 'true';
    } else {
      this.storeId = null;
      this.syncEnabled = false;
    }
    this.user = null;
  }

  generateStoreId() {
    const id = 'store_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_store_id', id);
    }
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_cloud_sync', 'true');
      }
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

      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_last_sync', new Date().toISOString());
      }

      return { success: true, message: 'Synchronisation réussie' };
    } catch (error) {
      console.error('Erreur sync:', error);
      return { success: false, message: 'Erreur de synchronisation' };
    }
  }

  gatherLocalData() {
    if (typeof window === 'undefined') {
      return {
        products: [],
        sales: [],
        customers: [],
        credits: [],
        settings: {},
        cashReports: []
      };
    }
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_cloud_sync', 'false');
    }
    this.syncEnabled = false;
    this.user = null;
  }

  // Méthodes de sauvegarde locale (inchangées)
  async createBackup() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
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
    if (typeof window === 'undefined') {
      return { success: false, message: 'Restauration non disponible hors navigateur' };
    }
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      
      if (!backup.version || !backup.data) {
        throw new Error('Format de sauvegarde invalide');
      }
      
      const confirmMessage =
        `Restaurer la sauvegarde de "${backup.storeName}" du ${new Date(backup.createdAt).toLocaleDateString('fr-FR')} ?\n\nCeci remplacera toutes les données actuelles.`;
      
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
