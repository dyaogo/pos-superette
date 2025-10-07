const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { sessionId, productId, expectedQty, countedQty, notes, countedBy } = req.body;
      
      const count = await prisma.inventoryCount.create({
        data: {
          sessionId,
          productId,
          expectedQty: parseInt(expectedQty),
          countedQty: parseInt(countedQty),
          difference: parseInt(countedQty) - parseInt(expectedQty),
          notes: notes || null,
          countedBy: countedBy || null
        }
      });
      
      res.status(201).json(count);
    } catch (error) {
      console.error('Erreur POST count:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}