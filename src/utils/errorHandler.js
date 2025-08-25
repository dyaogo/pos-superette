// src/utils/errorHandler.js
import { toast } from 'react-hot-toast';

/**
 * Système de gestion d'erreurs centralisé
 */

// Types d'erreurs
export const ERROR_TYPES = {
  VALIDATION: 'VALIDATION',
  STORAGE: 'STORAGE',
  NETWORK: 'NETWORK',
  BUSINESS: 'BUSINESS',
  SYSTEM: 'SYSTEM'
};

// Niveaux de gravité
export const ERROR_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Classe pour créer des erreurs personnalisées
 */
export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.SYSTEM, level = ERROR_LEVELS.MEDIUM, context = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.level = level;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Gestionnaire d'erreurs principal
 */
export class ErrorHandler {
  static instance = null;
  errors = [];
  maxErrors = 100;

  constructor() {
    if (ErrorHandler.instance) {
      return ErrorHandler.instance;
    }
    ErrorHandler.instance = this;
    this.setupGlobalHandlers();
  }

  /**
   * Configuration des gestionnaires globaux
   */
  setupGlobalHandlers() {
    // Erreurs JavaScript non gérées
    window.addEventListener('error', (event) => {
      this.handleError(new AppError(
        `Erreur JavaScript: ${event.message}`,
        ERROR_TYPES.SYSTEM,
        ERROR_LEVELS.HIGH,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      ));
    });

    // Promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new AppError(
        `Promise rejetée: ${event.reason}`,
        ERROR_TYPES.SYSTEM,
        ERROR_LEVELS.HIGH,
        { reason: event.reason }
      ));
    });
  }

  /**
   * Gestion centralisée des erreurs
   */
  handleError(error, showToUser = true) {
    try {
      // Enregistrer l'erreur
      this.logError(error);

      // Afficher à l'utilisateur selon le niveau
      if (showToUser) {
        this.displayError(error);
      }

      // Actions selon le type d'erreur
      this.processErrorByType(error);

      // Nettoyer les anciennes erreurs
      this.cleanupErrors();

    } catch (handlingError) {
      console.error('Erreur lors de la gestion d\'erreur:', handlingError);
    }
  }

  /**
   * Enregistrement des erreurs
   */
  logError(error) {
    const errorLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      message: error.message,
      type: error.type || ERROR_TYPES.SYSTEM,
      level: error.level || ERROR_LEVELS.MEDIUM,
      context: error.context || {},
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Ajouter à la liste des erreurs
    this.errors.unshift(errorLog);

    // Logger en console selon le niveau
    switch (error.level) {
      case ERROR_LEVELS.CRITICAL:
        console.error('🚨 ERREUR CRITIQUE:', errorLog);
        break;
      case ERROR_LEVELS.HIGH:
        console.error('❌ ERREUR IMPORTANTE:', errorLog);
        break;
      case ERROR_LEVELS.MEDIUM:
        console.warn('⚠️ ERREUR MOYENNE:', errorLog);
        break;
      default:
        console.info('ℹ️ ERREUR MINEURE:', errorLog);
    }

    // Sauvegarder dans localStorage (avec gestion d'erreur)
    this.saveErrorsToStorage();
  }

  /**
   * Affichage des erreurs à l'utilisateur
   */
  displayError(error) {
    const userMessage = this.getUserFriendlyMessage(error);

    switch (error.level) {
      case ERROR_LEVELS.CRITICAL:
        toast.error(userMessage, {
          duration: 10000,
          style: {
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fecaca'
          }
        });
        break;
      case ERROR_LEVELS.HIGH:
        toast.error(userMessage, { duration: 6000 });
        break;
      case ERROR_LEVELS.MEDIUM:
        toast.error(userMessage, { duration: 4000 });
        break;
      default:
        toast(userMessage, { duration: 3000 });
    }
  }

  /**
   * Messages conviviaux pour l'utilisateur
   */
  getUserFriendlyMessage(error) {
    switch (error.type) {
      case ERROR_TYPES.VALIDATION:
        return `Données invalides: ${error.message}`;
      case ERROR_TYPES.STORAGE:
        return 'Erreur de sauvegarde. Vos données pourraient ne pas être conservées.';
      case ERROR_TYPES.NETWORK:
        return 'Problème de connexion. Vérifiez votre réseau.';
      case ERROR_TYPES.BUSINESS:
        return error.message; // Messages métier déjà conviviaux
      default:
        return 'Une erreur inattendue s\'est produite. L\'équipe technique a été notifiée.';
    }
  }

  /**
   * Actions spécifiques selon le type d'erreur
   */
  processErrorByType(error) {
    switch (error.type) {
      case ERROR_TYPES.STORAGE:
        this.handleStorageError(error);
        break;
      case ERROR_TYPES.VALIDATION:
        this.handleValidationError(error);
        break;
      case ERROR_TYPES.CRITICAL:
        this.handleCriticalError(error);
        break;
    }
  }

  /**
   * Gestion des erreurs de stockage
   */
  handleStorageError(error) {
    // Tenter de libérer de l'espace
    try {
      const keys = Object.keys(localStorage);
      const oldKeys = keys.filter(key => 
        key.startsWith('pos_old_') || 
        key.startsWith('pos_temp_')
      );
      
      oldKeys.forEach(key => localStorage.removeItem(key));
      
      toast.success('Espace de stockage libéré', { duration: 2000 });
    } catch (cleanupError) {
      console.error('Impossible de nettoyer le stockage:', cleanupError);
    }
  }

  /**
   * Gestion des erreurs de validation
   */
  handleValidationError(error) {
    // Marquer les champs en erreur si contexte fourni
    if (error.context.fieldId) {
      const field = document.getElementById(error.context.fieldId);
      if (field) {
        field.style.borderColor = '#ef4444';
        field.focus();
      }
    }
  }

  /**
   * Gestion des erreurs critiques
   */
  handleCriticalError(error) {
    // Proposer un rafraîchissement de page
    const shouldReload = window.confirm(
      'Une erreur critique s\'est produite. Souhaitez-vous recharger l\'application ?'
    );
    
    if (shouldReload) {
      window.location.reload();
    }
  }

  /**
   * Sauvegarde des erreurs dans localStorage
   */
  saveErrorsToStorage() {
    try {
      const errorsToSave = this.errors.slice(0, 50); // Garder seulement les 50 dernières
      localStorage.setItem('pos_error_logs', JSON.stringify(errorsToSave));
    } catch (storageError) {
      console.warn('Impossible de sauvegarder les erreurs:', storageError);
    }
  }

  /**
   * Nettoyage des anciennes erreurs
   */
  cleanupErrors() {
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
  }

  /**
   * Récupération des erreurs sauvegardées
   */
  loadErrorsFromStorage() {
    try {
      const savedErrors = localStorage.getItem('pos_error_logs');
      if (savedErrors) {
        this.errors = JSON.parse(savedErrors);
      }
    } catch (error) {
      console.warn('Impossible de charger les erreurs sauvegardées:', error);
    }
  }

  /**
   * Export des erreurs pour debug
   */
  exportErrors() {
    const errorData = {
      timestamp: new Date().toISOString(),
      errors: this.errors,
      appVersion: process.env.REACT_APP_VERSION || '2.0.0',
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const blob = new Blob([JSON.stringify(errorData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-errors-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Rapport d\'erreurs exporté', { duration: 3000 });
  }

  /**
   * Statistiques des erreurs
   */
  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      byLevel: {},
      recent: this.errors.filter(error => 
        new Date(error.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length
    };

    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.byLevel[error.level] = (stats.byLevel[error.level] || 0) + 1;
    });

    return stats;
  }
}

// Instance singleton
export const errorHandler = new ErrorHandler();

/**
 * Hook React pour la gestion d'erreurs
 */
export const useErrorHandler = () => {
  const handleError = (error, context = {}) => {
    if (error instanceof AppError) {
      errorHandler.handleError(error);
    } else {
      errorHandler.handleError(new AppError(
        error.message || 'Erreur inconnue',
        ERROR_TYPES.SYSTEM,
        ERROR_LEVELS.MEDIUM,
        context
      ));
    }
  };

  const handleAsyncError = async (asyncFunction, context = {}) => {
    try {
      return await asyncFunction();
    } catch (error) {
      handleError(error, context);
      throw error; // Re-lancer pour permettre la gestion locale
    }
  };

  return { handleError, handleAsyncError };
};

/**
 * Utilitaires de validation avec gestion d'erreurs
 */
export const safeExecute = (fn, fallback = null, context = {}) => {
  try {
    return fn();
  } catch (error) {
    errorHandler.handleError(new AppError(
      `Erreur lors de l'exécution: ${error.message}`,
      ERROR_TYPES.SYSTEM,
      ERROR_LEVELS.MEDIUM,
      { ...context, originalError: error.message }
    ));
    return fallback;
  }
};

/**
 * Wrapper pour localStorage avec gestion d'erreurs
 */
export const safeLocalStorage = {
  setItem: (key, value, context = {}) => {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      errorHandler.handleError(new AppError(
        `Erreur de sauvegarde localStorage pour la clé "${key}"`,
        ERROR_TYPES.STORAGE,
        ERROR_LEVELS.HIGH,
        { key, error: error.message, ...context }
      ));
      return false;
    }
  },

  getItem: (key, defaultValue = null, context = {}) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      errorHandler.handleError(new AppError(
        `Erreur de lecture localStorage pour la clé "${key}"`,
        ERROR_TYPES.STORAGE,
        ERROR_LEVELS.MEDIUM,
        { key, error: error.message, ...context }
      ));
      return defaultValue;
    }
  },

  removeItem: (key, context = {}) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      errorHandler.handleError(new AppError(
        `Erreur de suppression localStorage pour la clé "${key}"`,
        ERROR_TYPES.STORAGE,
        ERROR_LEVELS.MEDIUM,
        { key, error: error.message, ...context }
      ));
      return false;
    }
  }
};

export default ErrorHandler;
