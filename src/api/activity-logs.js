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
  } else if (req.method === "POST") {
    // ✨ AJOUTEZ CETTE PARTIE
    try {
      const { userId, action, entity, entityId, details } = req.body;

      if (!userId || !action) {
        return res.status(400).json({ error: "userId et action requis" });
      }

      const log = await prisma.activityLog.create({
        data: {
          userId,
          action,
          entity: entity || null,
          entityId: entityId || null,
          details: details || null,
          ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"],
        },
      });

      res.status(201).json(log);
    } catch (error) {
      console.error("Erreur POST activity log:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
