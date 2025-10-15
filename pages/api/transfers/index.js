const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const transfers = await prisma.stockTransfer.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json(transfers);
    } catch (error) {
      console.error("Erreur GET transfers:", error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      const {
        fromStoreId,
        toStoreId,
        productId,
        productName,
        quantity,
        notes,
      } = req.body;

      if (!fromStoreId || !toStoreId || !productId || !quantity) {
        return res.status(400).json({ error: "Données manquantes" });
      }

      // Vérifier le stock disponible
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          storeId: fromStoreId,
        },
      });

      if (!product) {
        return res
          .status(404)
          .json({ error: "Produit non trouvé dans le magasin source" });
      }

      if (product.stock < quantity) {
        return res.status(400).json({ error: "Stock insuffisant" });
      }

      // Créer le transfert
      const transfer = await prisma.stockTransfer.create({
        data: {
          fromStoreId,
          toStoreId,
          productId,
          productName,
          quantity: parseInt(quantity),
          notes: notes || null,
          status: "pending",
        },
      });

      res.status(201).json(transfer);
    } catch (error) {
      console.error("Erreur POST transfer:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
