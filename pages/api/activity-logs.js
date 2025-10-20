const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { userId, limit = 50 } = req.query;

      const where = userId ? { userId } : {};

      const logs = await prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              username: true,
              fullName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: parseInt(limit),
      });

      res.status(200).json(logs);
    } catch (error) {
      console.error("Erreur GET activity logs:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
