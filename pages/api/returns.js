const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const returns = await prisma.return.findMany({
        include: {
          items: true
        },
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json(returns);
    } catch (error) {
      console.error('Erreur GET returns:', error);
      res.status(200).json([]);
    }
  } else if (req.method === 'POST') {
    try {
      const { saleId, reason, refundMethod, items } = req.body;
      
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      
      const returnRecord = await prisma.return.create({
        data: {
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