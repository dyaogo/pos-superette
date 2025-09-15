// 📁 Créer nouveau fichier : src/services/BackupService.js

class BackupService {
  constructor() {
    this.isBackupEnabled = true;
    this.lastBackupTime = localStorage.getItem('pos_last_backup_time');
    
    // Démarrer les backups automatiques
    this.startAutoBackup();
  }

  /**
   * 🔄 Démarre le backup automatique toutes les 30 minutes
   */
  startAutoBackup() {
    // Backup immédiat si pas fait depuis 2 heures
    if (this.shouldCreateBackup()) {
      this.createAutoBackup();
    }

    // Backup toutes les 30 minutes
    setInterval(() => {
      if (this.isBackupEnabled && this.shouldCreateBackup()) {
        this.createAutoBackup();
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  /**
   * ⏰ Vérifie s'il faut créer un backup
   */
  shouldCreateBackup() {
    if (!this.lastBackupTime) return true;
    
    const lastBackup = new Date(this.lastBackupTime);
    const now = new Date();
    const diffHours = (now - lastBackup) / (1000 * 60 * 60);
    
    return diffHours >= 2; // Backup si plus de 2h
  }

  /**
   * 💾 Collecte toutes les données du POS
   */
  collectAllData() {
    const data = {
      // Métadonnées
      backupDate: new Date().toISOString(),
      version: '1.0',
      appName: 'POS Superette',
      
      // Données métier
      products: this.getStorageData('pos_products_catalog', []),
      sales: this.getStorageData('pos_sales', []),
      customers: this.getStorageData('pos_customers', []),
      credits: this.getStorageData('pos_credits', []),
      employees: this.getStorageData('pos_employees', []),
      returns: this.getStorageData('pos_returns', []),
      
      // Paramètres
      settings: this.getStorageData('pos_settings', {}),
      
      // Données par magasin (si multi-magasin)
      storeData: this.collectStoreData(),
      
      // Statistiques
      stats: {
        totalProducts: this.getStorageData('pos_products_catalog', []).length,
        totalSales: this.getStorageData('pos_sales', []).length,
        totalCustomers: this.getStorageData('pos_customers', []).length,
        lastSaleDate: this.getLastSaleDate()
      }
    };

    return data;
  }

  /**
   * 🏪 Collecte les données spécifiques par magasin
   */
  collectStoreData() {
    const storeData = {};
    const currentStore = localStorage.getItem('pos_current_store');
    
    if (currentStore) {
      storeData[currentStore] = {
        products: this.getStorageData(`pos_${currentStore}_products_catalog`, []),
        sales: this.getStorageData(`pos_${currentStore}_sales`, []),
        customers: this.getStorageData(`pos_${currentStore}_customers`, []),
        credits: this.getStorageData(`pos_${currentStore}_credits`, []),
        employees: this.getStorageData(`pos_${currentStore}_employees`, []),
        returns: this.getStorageData(`pos_${currentStore}_returns`, []),
        settings: this.getStorageData(`pos_${currentStore}_settings`, {})
      };
    }
    
    return storeData;
  }

  /**
   * 📊 Utilitaire pour récupérer les données du localStorage
   */
  getStorageData(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.warn(`Erreur lecture ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * 📅 Récupère la date de la dernière vente
   */
  getLastSaleDate() {
    const sales = this.getStorageData('pos_sales', []);
    if (sales.length === 0) return null;
    
    return sales[0]?.date || null; // Les ventes sont triées par date desc
  }

  /**
   * 🔄 Crée un backup automatique en arrière-plan
   */
  createAutoBackup() {
    try {
      const data = this.collectAllData();
      const backupKey = `pos_auto_backup_${Date.now()}`;
      
      // Sauvegarder dans localStorage
      localStorage.setItem(backupKey, JSON.stringify(data));
      localStorage.setItem('pos_last_backup_time', new Date().toISOString());
      
      // Nettoyer les anciens backups (garder seulement les 5 derniers)
      this.cleanOldBackups();
      
      console.log('✅ Backup automatique créé:', new Date().toLocaleTimeString());
      
      // Notification discrète (optionnel)
      this.showBackupNotification('success');
      
    } catch (error) {
      console.error('❌ Erreur backup automatique:', error);
      this.showBackupNotification('error');
    }
  }

  /**
   * 🧹 Nettoie les anciens backups automatiques
   */
  cleanOldBackups() {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('pos_auto_backup_'))
        .sort()
        .reverse(); // Les plus récents en premier

      // Supprimer les backups au-delà des 5 derniers
      if (backupKeys.length > 5) {
        const toDelete = backupKeys.slice(5);
        toDelete.forEach(key => localStorage.removeItem(key));
        console.log(`🧹 ${toDelete.length} anciens backups supprimés`);
      }
    } catch (error) {
      console.warn('Erreur nettoyage backups:', error);
    }
  }

  /**
   * 📥 Télécharge un backup manuel
   */
  downloadBackup() {
    try {
      const data = this.collectAllData();
      const fileName = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      
      // Créer le lien de téléchargement
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showBackupNotification('download');
      return true;
    } catch (error) {
      console.error('Erreur téléchargement backup:', error);
      this.showBackupNotification('error');
      return false;
    }
  }

  /**
   * 📤 Restaure depuis un fichier backup
   */
  async restoreFromFile(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Vérifier la validité du backup
      if (!this.isValidBackup(data)) {
        throw new Error('Fichier de backup invalide');
      }

      // Créer un backup de sécurité avant restauration
      this.createSecurityBackup();
      
      // Restaurer les données
      this.restoreData(data);
      
      this.showBackupNotification('restore');
      return { success: true, message: 'Données restaurées avec succès' };
      
    } catch (error) {
      console.error('Erreur restauration:', error);
      return { 
        success: false, 
        message: `Erreur: ${error.message}` 
      };
    }
  }

  /**
   * ✅ Vérifie si un backup est valide
   */
  isValidBackup(data) {
    return data && 
           data.version && 
           data.backupDate && 
           Array.isArray(data.products) &&
           Array.isArray(data.sales);
  }

  /**
   * 🛡️ Crée un backup de sécurité avant restauration
   */
  createSecurityBackup() {
    const data = this.collectAllData();
    const securityKey = `pos_security_backup_${Date.now()}`;
    localStorage.setItem(securityKey, JSON.stringify(data));
  }

  /**
   * 📥 Restaure les données depuis un backup
   */
  restoreData(backupData) {
    // Restaurer données principales
    if (backupData.products) {
      localStorage.setItem('pos_products_catalog', JSON.stringify(backupData.products));
    }
    if (backupData.sales) {
      localStorage.setItem('pos_sales', JSON.stringify(backupData.sales));
    }
    if (backupData.customers) {
      localStorage.setItem('pos_customers', JSON.stringify(backupData.customers));
    }
    if (backupData.credits) {
      localStorage.setItem('pos_credits', JSON.stringify(backupData.credits));
    }
    if (backupData.settings) {
      localStorage.setItem('pos_settings', JSON.stringify(backupData.settings));
    }

    // Restaurer données par magasin si présentes
    if (backupData.storeData) {
      Object.entries(backupData.storeData).forEach(([storeId, storeData]) => {
        Object.entries(storeData).forEach(([dataType, data]) => {
          const key = `pos_${storeId}_${dataType}`;
          localStorage.setItem(key, JSON.stringify(data));
        });
      });
    }
  }

  /**
   * 📋 Liste les backups disponibles
   */
  getAvailableBackups() {
    const backups = [];
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('pos_auto_backup_') || key.startsWith('pos_security_backup_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          backups.push({
            key,
            date: data.backupDate,
            type: key.includes('auto') ? 'Automatique' : 'Sécurité',
            size: new Blob([localStorage.getItem(key)]).size,
            stats: data.stats
          });
        } catch (error) {
          console.warn(`Backup corrompu: ${key}`);
        }
      }
    });
    
    return backups.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * 🔄 Restaure depuis un backup automatique
   */
  restoreAutoBackup(backupKey) {
    try {
      const backupData = JSON.parse(localStorage.getItem(backupKey));
      if (!backupData) {
        throw new Error('Backup introuvable');
      }
      
      this.createSecurityBackup();
      this.restoreData(backupData);
      
      return { success: true, message: 'Backup restauré avec succès' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 🔔 Affiche une notification de backup
   */
  showBackupNotification(type) {
    const messages = {
      success: '✅ Backup automatique créé',
      error: '❌ Erreur lors du backup',
      download: '📥 Backup téléchargé',
      restore: '📤 Données restaurées'
    };

    // Notification simple (vous pouvez l'améliorer)
    if (window.toast) {
      window.toast(messages[type]);
    } else {
      console.log(messages[type]);
    }
  }

  /**
   * ⚙️ Configuration du backup
   */
  setBackupEnabled(enabled) {
    this.isBackupEnabled = enabled;
    localStorage.setItem('pos_backup_enabled', enabled.toString());
  }

  getBackupStatus() {
    return {
      enabled: this.isBackupEnabled,
      lastBackup: this.lastBackupTime,
      availableBackups: this.getAvailableBackups().length
    };
  }
}

export default BackupService;
