import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Hook pour gérer les erreurs d'API de manière cohérente
 *
 * @param {Object} options - Options de configuration
 * @param {boolean} options.showToast - Afficher un toast en cas d'erreur (défaut: true)
 * @param {Function} options.onError - Callback personnalisé en cas d'erreur
 * @returns {Object} - Objet contenant error, setError, handleError, clearError
 */
export function useApiError(options = {}) {
  const { showToast = true, onError } = options;
  const [error, setError] = useState(null);

  const handleError = useCallback((err, context = {}) => {
    const errorMessage = extractErrorMessage(err);
    const errorDetails = {
      message: errorMessage,
      status: err.status || err.response?.status,
      context,
      timestamp: new Date().toISOString(),
    };

    setError(errorDetails);

    // Log à Sentry si disponible
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(err, {
        contexts: {
          api: context,
        },
        tags: {
          api_error: true,
        },
      });
    }

    // Afficher toast si demandé
    if (showToast) {
      toast.error(errorMessage, {
        duration: 5000,
        id: `api-error-${Date.now()}`, // Évite les duplicates
      });
    }

    // Callback personnalisé
    if (onError) {
      onError(errorDetails);
    }

    // Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', errorDetails);
    }

    return errorDetails;
  }, [showToast, onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    setError,
    handleError,
    clearError,
  };
}

/**
 * Extrait un message d'erreur lisible depuis différents formats d'erreur
 */
function extractErrorMessage(error) {
  // Erreur réseau
  if (!navigator.onLine) {
    return 'Pas de connexion internet. Vérifiez votre connexion.';
  }

  // Erreur avec message custom
  if (error.message) {
    return error.message;
  }

  // Erreur API avec détails
  if (error.response?.data) {
    const data = error.response.data;
    return data.message || data.error || data.details || 'Une erreur est survenue';
  }

  // Erreur HTTP standard
  if (error.status) {
    const statusMessages = {
      400: 'Requête invalide',
      401: 'Non autorisé - Veuillez vous reconnecter',
      403: 'Accès interdit',
      404: 'Ressource non trouvée',
      408: 'Délai de connexion dépassé',
      429: 'Trop de requêtes - Veuillez réessayer plus tard',
      500: 'Erreur serveur - Veuillez réessayer',
      502: 'Service temporairement indisponible',
      503: 'Service en maintenance',
    };
    return statusMessages[error.status] || `Erreur ${error.status}`;
  }

  // Timeout
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'La requête a pris trop de temps. Veuillez réessayer.';
  }

  // Message par défaut
  return 'Une erreur inattendue est survenue';
}

/**
 * Wrapper fetch avec gestion d'erreur automatique
 *
 * @param {string} url - URL de la requête
 * @param {Object} options - Options fetch
 * @param {Object} errorOptions - Options de gestion d'erreur
 * @returns {Promise} - Promesse avec la réponse ou erreur
 */
export async function fetchWithErrorHandling(url, options = {}, errorOptions = {}) {
  const { showToast = true, onError } = errorOptions;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: errorData.message || errorData.error || response.statusText,
        response: { data: errorData },
      };
    }

    return await response.json();
  } catch (error) {
    const errorMessage = extractErrorMessage(error);

    if (showToast) {
      toast.error(errorMessage);
    }

    if (onError) {
      onError(error);
    }

    // Log à Sentry
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          api: {
            url,
            method: options.method || 'GET',
          },
        },
      });
    }

    throw error;
  }
}
