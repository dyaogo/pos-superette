const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "POST") {
    try {
      const transfer = await prisma.stockTransfer.findUnique({
        where: { id },
      });

      if (!transfer) {
        return res.status(404).json({ error: "Transfert non trouvé" });
      }

      if (transfer.status !== "pending") {
        return res
          .status(400)
          .json({
            error: "Seuls les transferts en attente peuvent être annulés",
          });
      }

      const updatedTransfer = await prisma.stockTransfer.update({
        where: { id },
        data: {
          status: "cancelled",
          completedAt: new Date(),
        },
      });

      res.status(200).json(updatedTransfer);
    } catch (error) {
      console.error("Erreur annulation transfer:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
