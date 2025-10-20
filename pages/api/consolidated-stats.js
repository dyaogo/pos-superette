const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { period = "month" } = req.query;

      // Calculer la date de début selon la période
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setDate(now.getDate() - 30);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Récupérer tous les magasins
      const stores = await prisma.store.findMany();

      // Récupérer les ventes par magasin
      const storeStats = await Promise.all(
        stores.map(async (store) => {
          const sales = await prisma.sale.findMany({
            where: {
              storeId: store.id,
              createdAt: { gte: startDate },
            },
            include: {
              items: true,
            },
          });

          const products = await prisma.product.findMany({
            where: { storeId: store.id },
          });

          const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
          const totalSales = sales.length;
          const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
          const stockValue = products.reduce(
            (sum, p) => sum + p.sellingPrice * p.stock,
            0
          );
          const lowStock = products.filter((p) => p.stock < 10).length;

          return {
            store,
            totalRevenue,
            totalSales,
            totalStock,
            stockValue,
            lowStock,
            averageTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
            products: products.length,
          };
        })
      );

      // Statistiques globales
      const globalStats = {
        totalRevenue: storeStats.reduce((sum, s) => sum + s.totalRevenue, 0),
        totalSales: storeStats.reduce((sum, s) => sum + s.totalSales, 0),
        totalStores: stores.length,
        totalProducts: storeStats.reduce((sum, s) => sum + s.products, 0),
        totalStock: storeStats.reduce((sum, s) => sum + s.totalStock, 0),
        totalStockValue: storeStats.reduce((sum, s) => sum + s.stockValue, 0),
        averageTicket:
          storeStats.reduce((sum, s) => sum + s.totalRevenue, 0) /
          Math.max(
            1,
            storeStats.reduce((sum, s) => sum + s.totalSales, 0)
          ),
      };

      // Récupérer tous les transferts
      const transfers = await prisma.stockTransfer.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: "desc" },
      });

      res.status(200).json({
        globalStats,
        storeStats,
        transfers: transfers.slice(0, 10), // Les 10 derniers transferts
      });
    } catch (error) {
      console.error("Erreur consolidated stats:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
