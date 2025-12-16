// Utilitaires pour enrichir le contexte Sentry avec les données utilisateur

/**
 * Configure le contexte utilisateur dans Sentry
 * @param {Object} user - Objet utilisateur depuis AuthContext
 */
export function setSentryUserContext(user) {
  if (typeof window === 'undefined' || !window.Sentry) return;

  if (!user) {
    window.Sentry.setUser(null);
    return;
  }

  window.Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.fullName || user.email?.split('@')[0],
    role: user.role,
    storeId: user.storeId,
  });

  // Ajouter des tags pour faciliter le filtrage
  window.Sentry.setTag('user_role', user.role);
  window.Sentry.setTag('store_id', user.storeId);
}

/**
 * Ajoute un contexte de breadcrumb pour tracker les actions utilisateur
 * @param {string} category - Catégorie de l'action (ex: 'navigation', 'api', 'user_action')
 * @param {string} message - Message descriptif
 * @param {Object} data - Données additionnelles
 * @param {string} level - Niveau de gravité (info, warning, error)
 */
export function addSentryBreadcrumb(category, message, data = {}, level = 'info') {
  if (typeof window === 'undefined' || !window.Sentry) return;

  window.Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture une erreur métier avec contexte enrichi
 * @param {Error|string} error - Erreur à capturer
 * @param {Object} context - Contexte additionnel
 */
export function captureSentryError(error, context = {}) {
  if (typeof window === 'undefined' || !window.Sentry) return;

  const errorToCapture = typeof error === 'string' ? new Error(error) : error;

  window.Sentry.captureException(errorToCapture, {
    contexts: {
      business: context,
    },
    tags: {
      error_type: context.type || 'business_error',
    },
  });
}

/**
 * Configure le contexte de la page actuelle
 * @param {string} pageName - Nom de la page
 * @param {Object} pageData - Données de la page
 */
export function setSentryPageContext(pageName, pageData = {}) {
  if (typeof window === 'undefined' || !window.Sentry) return;

  window.Sentry.setContext('page', {
    name: pageName,
    ...pageData,
    url: window.location.href,
    pathname: window.location.pathname,
  });

  // Ajouter un breadcrumb de navigation
  addSentryBreadcrumb('navigation', `Navigated to ${pageName}`, {
    page: pageName,
    ...pageData,
  });
}

/**
 * Track une transaction métier importante
 * @param {string} name - Nom de la transaction
 * @param {Function} operation - Fonction à exécuter
 * @param {Object} context - Contexte additionnel
 */
export async function trackSentryTransaction(name, operation, context = {}) {
  if (typeof window === 'undefined' || !window.Sentry) {
    return await operation();
  }

  const transaction = window.Sentry.startTransaction({
    name,
    data: context,
  });

  try {
    const result = await operation();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    captureSentryError(error, { transaction: name, ...context });
    throw error;
  } finally {
    transaction.finish();
  }
}
