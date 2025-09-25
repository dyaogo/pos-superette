import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const requiredVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
];

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[Firebase] Missing environment variables: ${missing.join(", ")}`
    );
  }
}

// Build config only if available
const firebaseConfig = !missing.length
  ? {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    }
  : null;

// Initialize app only once
let app = null;
let analytics = null;

if (firebaseConfig) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    if (typeof window !== "undefined") {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.warn("[Firebase] Analytics init failed:", e.message);
      }
    }
  }
}

export { app, analytics };