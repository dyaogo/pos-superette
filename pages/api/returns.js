const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // ✅ FIX: Filtrer par storeId si fourni
      const { storeId } = req.query;
      const where = {};
      if (storeId) where.storeId = storeId;

      const returns = await prisma.return.findMany({
        where,
        include: {
          items: true
        },
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json(returns);
    } catch (error) {
      console.error('Erreur GET returns:', error);
      // En cas d'erreur, vérifier si c'est une erreur de modèle
      if (error.code === 'P2021' || error.message.includes('does not exist')) {
        // Le modèle n'existe pas encore dans la DB
        res.status(200).json([]);
      } else {
        res.status(500).json({ error: error.message, returns: [] });
      }
    }
  } else if (req.method === 'POST') {
    try {
      const { storeId, saleId, reason, refundMethod, items } = req.body;

      // ✅ FIX: Récupérer le storeId de la vente si non fourni
      let finalStoreId = storeId;
      if (!finalStoreId && saleId && saleId !== 'DIRECT_RETURN') {
        const sale = await prisma.sale.findUnique({
          where: { id: saleId },
          select: { storeId: true }
        });
        finalStoreId = sale?.storeId;
      }

      // Si toujours pas de storeId, utiliser le premier magasin
      if (!finalStoreId) {
        const store = await prisma.store.findFirst();
        finalStoreId = store?.id;
      }

      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      const returnRecord = await prisma.return.create({
        data: {
          storeId: finalStoreId, // ✅ FIX: Enregistrer le storeId
          saleId,
          reason,
          amount: totalAmount,
          refundMethod,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total
            }))
          }
        },
        include: {
          items: true
        }
      });
      
      // Remettre les produits en stock
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }
      
      res.status(201).json(returnRecord);
    } catch (error) {
      console.error('Erreur POST return:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}