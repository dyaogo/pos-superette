// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Ignore des erreurs communes qui ne sont pas critiques
  ignoreErrors: [
    // Erreurs de réseau
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    // Erreurs Prisma communes
    'Invalid `prisma',
    // Erreurs de parsing
    'SyntaxError',
  ],

  // Filtrage des événements avant envoi
  beforeSend(event, hint) {
    // Ne pas envoyer en développement local
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },

  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
});
