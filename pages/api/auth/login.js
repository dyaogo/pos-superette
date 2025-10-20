const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

export default async function handler(req, res) {
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

      // Ne pas renvoyer le mot de passe
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Erreur login:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
