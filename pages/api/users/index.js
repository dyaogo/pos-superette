const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const users = await prisma.user.findMany({
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
          // Ne pas inclure le password
        },
        orderBy: { createdAt: "desc" },
      });

      res.status(200).json(users);
    } catch (error) {
      console.error("Erreur GET users:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
