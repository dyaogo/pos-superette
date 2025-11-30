/**
 * Rate Limiting Middleware pour Next.js API Routes
 * Protège contre les abus et les attaques DoS
 */

// Map pour stocker les requêtes par IP (en mémoire)
const requestMap = new Map();

/**
 * Nettoie les anciennes entrées toutes les minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestMap.entries()) {
    if (now - value.resetTime > 60000) {
      requestMap.delete(key);
    }
  }
}, 60000);

/**
 * Configuration par défaut du rate limiter
 */
const DEFAULT_CONFIG = {
  interval: 60000, // 1 minute (en millisecondes)
  maxRequests: 60, // 60 requêtes par minute
};

/**
 * Rate Limiter Middleware
 * @param {Object} config - Configuration { interval, maxRequests }
 * @returns {Function} Middleware function
 */
export function rateLimit(config = DEFAULT_CONFIG) {
  const { interval, maxRequests } = { ...DEFAULT_CONFIG, ...config };

  return async (req, res) => {
    // Obtenir l'IP du client
    const ip = getClientIp(req);

    if (!ip) {
      // Si on ne peut pas obtenir l'IP, on laisse passer (dev mode)
      return { success: true };
    }

    const now = Date.now();
    const key = `${ip}:${req.url}`;

    // Récupérer ou créer l'entrée pour cette IP
    let requestData = requestMap.get(key);

    if (!requestData) {
      // Première requête de cette IP
      requestData = {
        count: 0,
        resetTime: now + interval,
      };
      requestMap.set(key, requestData);
    }

    // Vérifier si la fenêtre de temps est expirée
    if (now > requestData.resetTime) {
      // Réinitialiser le compteur
      requestData.count = 0;
      requestData.resetTime = now + interval;
    }

    // Incrémenter le compteur
    requestData.count++;

    // Vérifier si la limite est dépassée
    if (requestData.count > maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: requestData.resetTime,
      };
    }

    // Requête autorisée
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - requestData.count,
      reset: requestData.resetTime,
    };
  };
}

/**
 * Obtenir l'IP du client
 * @param {Object} req - Next.js request object
 * @returns {string|null} IP address
 */
function getClientIp(req) {
  // Essayer différentes méthodes pour obtenir l'IP
  const forwarded = req.headers['x-forwarded-for'];
  const real = req.headers['x-real-ip'];
  const cloudflare = req.headers['cf-connecting-ip'];

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (real) {
    return real;
  }

  if (cloudflare) {
    return cloudflare;
  }

  // Fallback sur l'IP de connexion (dev)
  return req.socket?.remoteAddress || null;
}

/**
 * Wrapper pour appliquer le rate limiting à une route API
 * @param {Function} handler - Next.js API handler
 * @param {Object} config - Rate limit config
 * @returns {Function} Wrapped handler
 */
export function withRateLimit(handler, config = DEFAULT_CONFIG) {
  const limiter = rateLimit(config);

  return async (req, res) => {
    // Appliquer le rate limiting
    const rateLimitResult = await limiter(req, res);

    // Ajouter les headers de rate limit
    res.setHeader('X-RateLimit-Limit', rateLimitResult.limit || DEFAULT_CONFIG.maxRequests);
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining || 0);

    if (rateLimitResult.reset) {
      res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.reset).toISOString());
    }

    // Si la limite est dépassée, retourner 429
    if (!rateLimitResult.success) {
      return res.status(429).json({
        error: 'Trop de requêtes',
        message: `Limite dépassée. Réessayez après ${new Date(rateLimitResult.reset).toLocaleTimeString('fr-FR')}`,
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      });
    }

    // Continuer avec le handler normal
    return handler(req, res);
  };
}

/**
 * Configurations prédéfinies pour différents types d'endpoints
 */
export const RATE_LIMITS = {
  // Très strict - Auth, login, register
  auth: {
    interval: 900000, // 15 minutes
    maxRequests: 5,   // 5 tentatives par 15 min
  },

  // Strict - Création, modification, suppression
  write: {
    interval: 60000,  // 1 minute
    maxRequests: 30,  // 30 requêtes par minute
  },

  // Normal - Lecture de données
  read: {
    interval: 60000,  // 1 minute
    maxRequests: 100, // 100 requêtes par minute
  },

  // Souple - Assets publics
  public: {
    interval: 60000,  // 1 minute
    maxRequests: 200, // 200 requêtes par minute
  },
};
