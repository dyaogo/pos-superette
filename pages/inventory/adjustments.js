const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { sessionId, productId, quantity, reason, type } = req.body;
      
      const adjustment = await prisma.stockAdjustment.create({
        data: {
          sessionId: sessionId || null,
          productId,
          quantity: parseInt(quantity),
          reason,
          type: type || 'adjustment',
          createdBy: 'Admin'
        }
      });
      
      res.status(201).json(adjustment);
    } catch (error) {
      console.error('Erreur POST adjustment:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}