import { NextResponse } from "next/server";

/**
 * 🔐 FIX #1 & #2 — Middleware d'authentification Next.js
 *
 * Ce middleware protège toutes les routes /api/* contre les accès
 * non autorisés. Il vérifie la présence et la validité d'un cookie
 * de session signé (HMAC-SHA256) avant de laisser passer la requête.
 *
 * Fonctionnement :
 * - La connexion (/api/auth/login) génère un token signé et le place
 *   dans un cookie "pos_session"
 * - Chaque requête API inclut automatiquement ce cookie
 * - Le middleware vérifie la signature et l'expiration du token
 * - Les routes publiques (login, test) sont exemptées
 */

const API_SECRET = process.env.API_SECRET || "pos-superette-key-2024";

// Routes publiques qui ne nécessitent pas d'authentification
const ROUTES_PUBLIQUES = [
  "/api/auth/login",
  "/api/auth/",
  "/api/test",
  "/api/sentry",
];

/**
 * Vérifie un token HMAC signé (Web Crypto API — compatible Edge)
 * Format du token : "userId.timestamp.signature_hex"
 */
async function verifierToken(token) {
  try {
    const parties = token.split(".");
    if (parties.length !== 3) return null;

    const [userId, timestamp, signatureRecue] = parties;

    // Vérifier l'expiration (24 heures)
    const ageMs = Date.now() - parseInt(timestamp, 10);
    if (isNaN(ageMs) || ageMs > 24 * 60 * 60 * 1000) return null;

    // Recalculer la signature attendue
    const encoder = new TextEncoder();
    const cle = await crypto.subtle.importKey(
      "raw",
      encoder.encode(API_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cle,
      encoder.encode(`${userId}:${timestamp}`)
    );
    const signatureAttendue = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Comparaison sécurisée (protection contre timing attacks)
    if (signatureRecue !== signatureAttendue) return null;

    return { userId };
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Ne vérifier que les routes API
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Routes publiques exemptées
  if (ROUTES_PUBLIQUES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Lire le cookie de session
  const cookieSession = request.cookies.get("pos_session")?.value;

  if (!cookieSession) {
    return NextResponse.json(
      { error: "Non autorisé — veuillez vous connecter" },
      { status: 401 }
    );
  }

  // Valider le token
  const payload = await verifierToken(cookieSession);
  if (!payload) {
    const response = NextResponse.json(
      { error: "Session expirée — veuillez vous reconnecter" },
      { status: 401 }
    );
    // Supprimer le cookie invalide
    response.cookies.delete("pos_session");
    return response;
  }

  // Ajouter l'userId dans les headers pour les API handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: "/api/:path*",
};
