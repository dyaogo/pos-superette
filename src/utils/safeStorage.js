// src/utils/safeStorage.js
import { AppError, ERROR_TYPES, ERROR_LEVELS, errorHandler } from './errorHandler';

/**
 * Gestionnaire de stockage sécurisé pour localStorage
 */

export class SafeStorage {
  static instance = null;
  quotaWarningThreshold = 0.8; // 80% du quota
  compressionEnabled = true;
  backupEnabled = true;
  maxBackups = 5;

  constructor() {
    if (SafeStorage.instance) {
      return SafeStorage.instance;
    }
    SafeStorage.instance = this;
    this.initializeStorage();
  }

  /**
   * Initialisation du système de stockage
   */
  initializeStorage() {
    // Vérifier la disponibilité de localStorage
    if (!this.isStorageAvailable()) {
      throw new AppError(
        'LocalStorage n\'est pas disponible dans ce navigateur',
        ERROR_TYPES.STORAGE,
        ERROR_LEVELS.CRITICAL,
        { feature: 'localStorage' }
      );
    }

    // Nettoyer les données corrompues au démarrage
    this.cleanupCorruptedData();

    // Surveiller l'espace de stockage
    this.monitorStorageUsage();
  }

  /**
   * Vérifier la disponibilité de localStorage
   */
  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Obtenir la taille utilisée du localStorage
   */
  getStorageUsage() {
    let total = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
    } catch (error) {
      errorHandler.handleError(new AppError(
        'Erreur lors du calcul de l\'utilisation du stockage',
        ERROR_TYPES.STORAGE,
        ERROR_LEVELS.MEDIUM,
        { error: error.message }
      ));
    }
    return total;
  }

  /**
   * Estimer l'espace disponible
   */
  async estimateQuota() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota - estimate.usage,
          usagePercentage: (estimate.usage / estimate.quota) * 100
        };
      }
    } catch (error) {
      // Fallback: estimation basique
      const usage = this.getStorageUsage();
      const estimatedQuota = 5 * 1024 * 1024; // 5MB estimation
      return {
        quota: estimatedQuota,
        usage: usage,
        available: estimatedQuota - usage,
        usagePercentage: (usage / estimatedQuota) * 100
      };
    }
  }

  /**
   * Surveiller l'utilisation du stockage
   */
  async monitorStorageUsage() {
    try {
      const quota = await this.estimateQuota();
      
      if (quota.usagePercentage > this.quotaWarningThreshold * 100) {
        errorHandler.handleError(new AppError(
          `Espace de stockage faible: ${quota.usagePercentage.toFixed(1)}% utilisé`,
          ERROR_TYPES.STORAGE,
          ERROR_LEVELS.MEDIUM,
          { quota }
        ));

        // Déclencher un nettoyage automatique
        this.autoCleanup();
      }
    } catch (error) {
      console.warn('Impossible de surveiller l\'utilisation du stockage:', error);
    }
  }

  /**
   * Compresser les données (simulation - en réalité utiliserait pako.js ou similaire)
   */
  compress(data) {
    if (!this.compressionEnabled) return data;
    
    try {
      // Simulation de compression simple (en production, utiliser pako.js)
      const compressed = JSON.stringify(data);
      return compressed;
    } catch (error) {
      throw new AppError(
        'Erreur lors de la compression des données',
        ERROR_TYPES.STORAGE,
        ERROR_LEVELS.HIGH,
        { error: error.message }
      );
    }
  }

  /**
   * Décompresser les données
   */
  decompress(compressedData) {
    if (!this.compressionEnabled) return compressedData;
    
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      throw new AppError(
        'Erreur lors de la décompression des données',
        ERROR_TYPES.STORAGE,
        ERROR_LEVELS.HIGH,
        { error: error.message }
      );
    }
  }

  /**
   * Sauvegarder des données avec gestion d'erreurs complète
   */
  async setItem(key, value, options = {}) {
    const {
      backup = this.backupEnabled,
      validate = true,
      compress = this.compressionEnabled,
      retries = 3
    } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Validation des données
        if (validate) {
          this.validateData(key, value);
        }

        // Créer une sauvegarde si demandé
        if (backup) {
          this.createBackup(key);
        }

        // Préparer les données
        let dataToStore = value;
        if (compress) {
          dataToStore = this.compress(value);
        }

        // Ajouter des métadonnées
        const envelope = {
          data: dataToStore,
          timestamp: new Date().toISOString(),
          version: '2.0.0',
          compressed: compress,
          checksum: this.generateChecksum(dataToStore)
        };

        // Tenter la sauvegarde
        localStorage.setItem(key, JSON.stringify(envelope));
        
        // Vérifier que la sauvegarde a réussi
        this.verifyStorage(key, envelope);

        return true;

      } catch (error) {
        if (attempt === retries) {
          // Dernière tentative échouée
          this.handleStorageError(error, key, value, attempt);
          return false;
        }

        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }

    return false;
  }

  /**
   * Récupérer des données avec validation
   */
  getItem(key, defaultValue = null, options = {}) {
    const {
      validate = true,
      fallbackToBackup = true,
      decompress = this.compressionEnabled
    } = options;

    try {
      const storedData = localStorage.getItem(key);
      
      if (!storedData) {
        return defaultValue;
      }

      // Parser l'enveloppe
      let envelope;
      try {
        envelope = JSON.parse(storedData);
      } catch (parseError) {
        // Données corrompues, essayer la sauvegarde
        if (fallbackToBackup) {
          return this.restoreFromBackup(key, defaultValue);
        }
        throw parseError;
      }

      // Vérifier l'intégrité
      if (validate && envelope.checksum) {
        const calculatedChecksum = this.generateChecksum(envelope.data);
        if (calculatedChecksum !== envelope.checksum) {
          throw new AppError(
            `Données corrompues détectées pour la clé "${key}"`,
            ERROR_TYPES.STORAGE,
            ERROR_LEVELS.HIGH,
            { key, expectedChecksum: envelope.checksum, calculatedChecksum }
          );
        }
      }

      // Décompresser si nécessaire
      let data = envelope.data;
      if (envelope.compressed && decompress) {
        data = this.decompress(data);
      }

      return data;

    } catch (error) {
      errorHandler.handleError(new AppError(
        `Erreur lors de la lecture de "${key}": ${error.message}`,
        ERROR_TYPES.STORAGE,
        ERROR_LEVELS.MEDIUM,
        { key, error: error.message }
      ));

      // Essayer la sauvegarde
      if (fallbackToBackup) {
        return this.restoreFromBackup(key, defaultValue);
      }

      return defaultValue;
    }
  }

  /**
   * Supprimer un élément avec sauvegarde
   */
  removeItem(key, options = {}) {
    const { backup = true } = options;

    try {
      // Créer une sauvegarde avant suppression
      if (backup) {
        this.createBackup(key);
      }

      localStorage.removeItem(key);
      return true;

    } catch (error) {
      errorHandler.handleError(new AppError(
        `Erreur lors de la suppression de "${key}": ${error.message}`,
        ERROR_TYPES.STORAGE,
        ERROR_LEVELS.MEDIUM,
        { key, error: error.message }
      ));
      return false;
    }
  }

  /**
   * Créer une sauvegarde
   */
  createBackup(key) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const backupKey = `${key}_backup_${Date.now()}`;
        localStorage.setItem(backupKey, data);

        // Nettoyer les anciennes sauvegardes
        this.cleanupOldBackups(key);
      }
    } catch (error) {
      console.warn(`Impossible de créer une sauvegarde pour "${key}":`, error);
    }
  }

  /**
   * Restaurer depuis une sauvegarde
   */
  restoreFromBackup(key, defaultValue = null) {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter(k => k.startsWith(`${key}_backup_`))
        .sort((a, b) => {
          const timeA = parseInt(a.split('_backup_')[1]);
          const timeB = parseInt(b.split('_backup_')[1]);
          return timeB - timeA; // Plus récent en premier
        });

      if (backupKeys.length > 0) {
        const latestBackup = localStorage.getItem(backupKeys[0]);
        if (latestBackup) {
          // Restaurer la sauvegarde
          localStorage.setItem(key, latestBackup);
          
          errorHandler.handleError(new AppError(
            `Données restaurées depuis la sauvegarde pour "${key}"`,
            ERROR_TYPES.STORAGE,
            ERROR_LEVELS.MEDIUM,
            { key, backupKey: backupKeys[0] }
          ));

          // Réessayer la lecture
          return this.getItem(key, defaultValue, { fallbackToBackup: false });
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la restauration de "${key}":`, error);
    }

    return defaultValue;
  }

  /**
   * Nettoyer les anciennes sauvegardes
   */
  cleanupOldBackups(key) {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter(k => k.startsWith(`${key}_backup_`))
        .sort((a, b) => {
          const timeA = parseInt(a.split('_backup_')[1]);
          const timeB = parseInt(b.split('_backup_')[1]);
          return timeB - timeA;
        });

      // Garder seulement les N dernières sauvegardes
      const toDelete = backupKeys.slice(this.maxBackups);
      toDelete.forEach(backupKey => {
        localStorage.removeItem(backupKey);
      });
    } catch (error) {
      console.warn('Erreur lors du nettoyage des sauvegardes:', error);
    }
  }

  /**
   * Valider les données avant sauvegarde
   */
  validateData(key, value) {
    // Vérifier la taille
    const serialized = JSON.stringify(value);
    const sizeInBytes = new Blob([serialized]).size;
    const maxSize = 1024 * 1024; // 1MB par élément

    if (sizeInBytes > maxSize) {
      throw new AppError(
        `Données trop volumineuses pour "${key}": ${sizeInBytes} bytes (max: ${maxSize})`,
        ERROR_TYPES.STORAGE,
        ERROR_LEVELS.HIGH,
        { key, size: sizeInBytes, maxSize }
      );
    }

    // Vérifier la structure pour les clés POS
    if (key.startsWith('pos_')) {
      this.validatePOSData(key, value);
    }
  }

  /**
   * Validation spécifique aux données POS
   */
  validatePOSData(key, value) {
    if (key.includes('_products')) {
      if (!Array.isArray(value)) {
        throw new AppError(
          'Les données de produits doivent être un tableau',
          ERROR_TYPES.VALIDATION,
          ERROR_LEVELS.HIGH,
          { key, type: typeof value }
        );
      }
    }

    if (key.includes('_sales')) {
      if (!Array.isArray(value)) {
        throw new AppError(
          'Les données de ventes doivent être un tableau',
          ERROR_TYPES.VALIDATION,
          ERROR_LEVELS.HIGH,
          { key, type: typeof value }
        );
      }
    }

    if (key.includes('_settings')) {
      if (typeof value !== 'object' || value === null) {
        throw new AppError(
          'Les paramètres doivent être un objet',
          ERROR_TYPES.VALIDATION,
          ERROR_LEVELS.HIGH,
          { key, type: typeof value }
        );
      }
    }
  }

  /**
   * Générer un checksum simple
   */
  generateChecksum(data) {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32bit
    }
    return hash.toString();
  }

  /**
   * Vérifier que la sauvegarde a réussi
   */
  verifyStorage(key, originalData) {
    try {
      const storedData = localStorage.getItem(key);
      const parsed = JSON.parse(storedData);
      
      if (parsed.checksum !== originalData.checksum) {
        throw new AppError(
          'Vérification de l\'intégrité échouée après sauvegarde',
          ERROR_TYPES.STORAGE,
          ERROR_LEVELS.HIGH,
          { key }
        );
      }
    } catch (error) {
      throw new AppError(
        'Impossible de vérifier la sauvegarde',
        ERROR_TYPES.STORAGE,
        ERROR_LEVELS.HIGH,
        { key, error: error.message }
      );
    }
  }

  /**
   * Nettoyer les données corrompues
   */
  cleanupCorruptedData() {
    const corruptedKeys = [];
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('pos_')) {
        try {
          const data = localStorage.getItem(key);
          JSON.parse(data);
        } catch (error) {
          corruptedKeys.push(key);
        }
      }
    }

    if (corruptedKeys.length > 0) {
      errorHandler.handleError(new AppError(
        `${corruptedKeys.length} clé(s) corrompue(s) détectée(s) et supprimée(s)`,
        ERROR_TYPES.STORAGE,
        ERROR_LEVELS.MEDIUM,
        { corruptedKeys }
      ));

      corruptedKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error(`Impossible de supprimer la clé corrompue "${key}":`, error);
        }
      });
    }
  }

  /**
   * Nettoyage automatique
   */
  async autoCleanup() {
    try {
      // Supprimer les données temporaires
      const tempKeys = Object.keys(localStorage).filter(key => 
        key.includes('_temp_') || key.includes('_cache_')
      );
      
      tempKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      // Nettoyer les anciennes sauvegardes
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes('_backup_')) {
          const mainKey = key.split('_backup_')[0];
          this.cleanupOldBackups(mainKey);
        }
      });

      errorHandler.handleError(new AppError(
        `Nettoyage automatique effectué: ${tempKeys.length} éléments supprimés`,
        ERROR_TYPES.STORAGE,
        ERROR_LEVELS.LOW,
        { tempKeys }
      ));

    } catch (error) {
      console.error('Erreur lors du nettoyage automatique:', error);
    }
  }

  /**
   * Gérer les erreurs de stockage
   */
  handleStorageError(error, key, value, attempt) {
    let errorType = ERROR_TYPES.STORAGE;
    let errorLevel = ERROR_LEVELS.MEDIUM;

    if (error.name === 'QuotaExceededError') {
      errorLevel = ERROR_LEVELS.HIGH;
      // Déclencher un nettoyage d'urgence
      this.emergencyCleanup();
    }

    errorHandler.handleError(new AppError(
      `Échec de sauvegarde pour "${key}" (tentative ${attempt}): ${error.message}`,
      errorType,
      errorLevel,
      { key, attempt, error: error.message, dataSize: JSON.stringify(value).length }
    ));
  }

  /**
   * Nettoyage d'urgence en cas de quota dépassé
   */
  emergencyCleanup() {
    try {
      const keysToRemove = [];
      
      // Identifier les clés les moins importantes
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          if (key.includes('_cache_') || 
              key.includes('_temp_') || 
              key.includes('_log_') ||
              key.includes('_backup_')) {
            keysToRemove.push(key);
          }
        }
      }

      // Supprimer les clés non essentielles
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      errorHandler.handleError(new AppError(
        `Nettoyage d'urgence: ${keysToRemove.length} éléments supprimés`,
        ERROR_TYPES.STORAGE,
        ERROR_LEVELS.MEDIUM,
        { removedKeys: keysToRemove }
      ));

    } catch (error) {
      console.error('Erreur lors du nettoyage d\'urgence:', error);
    }
  }

  /**
   * Obtenir des statistiques de stockage
   */
  async getStorageStats() {
    try {
      const quota = await this.estimateQuota();
      const keys = Object.keys(localStorage);
      const posKeys = keys.filter(key => key.startsWith('pos_'));
      const backupKeys = keys.filter(key => key.includes('_backup_'));

      return {
        quota: quota,
        totalKeys: keys.length,
        posKeys: posKeys.length,
        backupKeys: backupKeys.length,
        usage: this.getStorageUsage(),
        isHealthy: quota.usagePercentage < 80
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

// Instance singleton
export const safeStorage = new SafeStorage();

/**
 * API simplifiée pour utilisation dans les composants
 */
export const storage = {
  set: (key, value, options) => safeStorage.setItem(key, value, options),
  get: (key, defaultValue, options) => safeStorage.getItem(key, defaultValue, options),
  remove: (key, options) => safeStorage.removeItem(key, options),
  getStats: () => safeStorage.getStorageStats(),
  cleanup: () => safeStorage.autoCleanup()
};

export default SafeStorage;
