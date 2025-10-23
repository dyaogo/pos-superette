const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: { store: true },
      });

      if (!product) {
        return res.status(404).json({ error: "Produit non trouvé" });
      }

      res.status(200).json(product);
    } catch (error) {
      console.error("Erreur GET product:", error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      // Récupérer le produit existant
      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return res.status(404).json({ error: "Produit non trouvé" });
      }

      // Extraire les données du body
      const { name, category, barcode, costPrice, sellingPrice, stock, image } =
        req.body;

      // ✅ NOUVEAU : Construire l'objet de mise à jour dynamiquement
      // Ne mettre à jour QUE les champs fournis
      const updateData = {};

      if (name !== undefined) updateData.name = name;
      if (category !== undefined) updateData.category = category;
      if (barcode !== undefined) updateData.barcode = barcode || null;
      if (costPrice !== undefined) updateData.costPrice = parseFloat(costPrice);
      if (sellingPrice !== undefined)
        updateData.sellingPrice = parseFloat(sellingPrice);
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (image !== undefined) updateData.image = image || null;

      // Validation minimale : au moins un champ à mettre à jour
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "Aucune donnée à mettre à jour" });
      }

      // ✅ Validation : si name et category sont fournis, ils ne doivent pas être vides
      if (updateData.name !== undefined && !updateData.name) {
        return res.status(400).json({ error: "Le nom ne peut pas être vide" });
      }
      if (updateData.category !== undefined && !updateData.category) {
        return res
          .status(400)
          .json({ error: "La catégorie ne peut pas être vide" });
      }

      // Mettre à jour le produit
      const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          store: true,
        },
      });

      console.log(`✅ Produit ${id} mis à jour:`, updateData);
      res.status(200).json(product);
    } catch (error) {
      console.error("Erreur PUT product:", error);
      res.status(500).json({
        error: "Erreur lors de la modification",
        details: error.message,
      });
    }
  } else if (req.method === "DELETE") {
    try {
      await prisma.product.delete({
        where: { id },
      });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Erreur DELETE product:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
