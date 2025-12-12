<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
// This file configures the initialization of Sentry for edge features (middleware, edge functions, etc.).
=======
// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
>>>>>>> Stashed changes
=======
// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
>>>>>>> Stashed changes
=======
// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
>>>>>>> Stashed changes
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  dsn: "https://d73c3e24a1652c084f4376cecbcba450@o4510472792834048.ingest.de.sentry.io/4510472809021520",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
});
