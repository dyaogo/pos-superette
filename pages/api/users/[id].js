const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true,
          storeId: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      const { fullName, role, storeId, isActive, password } = req.body;

      const updateData = {
        fullName,
        role,
        storeId: storeId || null,
        isActive,
        updatedAt: new Date(),
      };

      // Si nouveau mot de passe fourni
      if (password && password.length >= 6) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true,
          storeId: true,
          isActive: true,
          updatedAt: true,
        },
      });

      res.status(200).json(user);
    } catch (error) {
      console.error("Erreur PUT user:", error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      // Ne pas supprimer, juste désactiver
      const user = await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
