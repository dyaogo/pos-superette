import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { withRateLimit, RATE_LIMITS } from '../../../lib/rateLimit';

const prisma = new PrismaClient();
const API_SECRET = process.env.API_SECRET || "pos-superette-key-2024";

/**
 * 🔐 FIX #1 & #2 — Génère un token de session signé HMAC-SHA256
 * Format : "userId.timestamp.signature_hex"
 */
function genererToken(userId) {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(`${userId}:${timestamp}`)
    .digest("hex");
  return `${userId}.${timestamp}.${signature}`;
}

async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Identifiants requis" });
      }

      // Trouver l'utilisateur
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email: username }],
        },
      });

      if (!user) {
        return res.status(401).json({ error: "Identifiants incorrects" });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Compte désactivé" });
      }

      // Vérifier le mot de passe
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return res.status(401).json({ error: "Identifiants incorrects" });
      }

      // Mettre à jour lastLogin
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Logger l'activité
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "login",
          details: `Connexion réussie`,
          ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"],
        },
      });

      // Générer le token de session signé
      const token = genererToken(user.id);

      // Poser le cookie de session sécurisé (httpOnly = inaccessible au JS côté client)
      res.setHeader("Set-Cookie", [
        `pos_session=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict`,
      ]);

      // Ne pas renvoyer le mot de passe
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({ ...userWithoutPassword, token });
    } catch (error) {
      console.error("Erreur login:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

// 🚦 RATE LIMITING : 5 tentatives par 15 minutes (protection brute force)
export default withRateLimit(handler, RATE_LIMITS.auth);
