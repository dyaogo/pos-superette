const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "POST") {
    try {
      // Récupérer le transfert
      const transfer = await prisma.stockTransfer.findUnique({
        where: { id },
      });

      if (!transfer) {
        return res.status(404).json({ error: "Transfert non trouvé" });
      }

      if (transfer.status !== "pending") {
        return res.status(400).json({ error: "Transfert déjà traité" });
      }

      // Déduire du stock source
      const sourceProduct = await prisma.product.findFirst({
        where: {
          id: transfer.productId,
          storeId: transfer.fromStoreId,
        },
      });

      if (!sourceProduct || sourceProduct.stock < transfer.quantity) {
        return res.status(400).json({ error: "Stock source insuffisant" });
      }

      await prisma.product.update({
        where: { id: sourceProduct.id },
        data: { stock: sourceProduct.stock - transfer.quantity },
      });

      // Ajouter au stock destination (ou créer le produit s'il n'existe pas)
      const destProduct = await prisma.product.findFirst({
        where: {
          barcode: sourceProduct.barcode,
          storeId: transfer.toStoreId,
        },
      });

      if (destProduct) {
        await prisma.product.update({
          where: { id: destProduct.id },
          data: { stock: destProduct.stock + transfer.quantity },
        });
      } else {
        // Créer le produit dans le magasin destination
        await prisma.product.create({
          data: {
            storeId: transfer.toStoreId,
            barcode: sourceProduct.barcode,
            name: sourceProduct.name,
            category: sourceProduct.category,
            costPrice: sourceProduct.costPrice,
            sellingPrice: sourceProduct.sellingPrice,
            stock: transfer.quantity,
            image: sourceProduct.image,
          },
        });
      }

      // Marquer le transfert comme complété
      const updatedTransfer = await prisma.stockTransfer.update({
        where: { id },
        data: {
          status: "completed",
          completedAt: new Date(),
          completedBy: req.body.completedBy || "Admin",
        },
      });

      res.status(200).json(updatedTransfer);
    } catch (error) {
      console.error("Erreur completion transfer:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
