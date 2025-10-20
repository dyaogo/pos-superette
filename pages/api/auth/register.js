const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { email, username, password, fullName, role, storeId, createdBy } =
        req.body;

      // Validation
      if (!email || !username || !password || !fullName) {
        return res.status(400).json({ error: "Tous les champs requis" });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Mot de passe trop court (min 6 caractères)" });
      }

      // Vérifier si l'email ou username existe déjà
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return res
          .status(400)
          .json({ error: "Email ou nom d'utilisateur déjà utilisé" });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          fullName,
          role: role || "cashier",
          storeId: storeId || null,
          createdBy: createdBy || "system",
        },
      });

      // Ne pas renvoyer le mot de passe
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Erreur création utilisateur:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
