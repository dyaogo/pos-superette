const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const stores = await prisma.store.findMany({
        include: {
          _count: {
            select: { products: true, sales: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
      res.status(200).json(stores);
    } catch (error) {
      console.error("Erreur GET stores:", error);
      res.status(200).json([]);
    }
  } else if (req.method === "POST") {
    try {
      const { code, name, address, phone, currency, taxRate } = req.body;

      const store = await prisma.store.create({
        data: {
          code,
          name,
          address: address && address.trim() !== "" ? address : null, // Gérer le vide
          phone: phone && phone.trim() !== "" ? phone : null, // Gérer le vide
          currency: currency || "FCFA",
          taxRate:
            taxRate !== undefined && taxRate !== null
              ? parseFloat(taxRate)
              : 18, // ✅ BON
        },
      });

      res.status(201).json(store);
    } catch (error) {
      console.error("Erreur POST store:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
