const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { sessionId, type, amount, reason, description, createdBy } = req.body;
      
      const operation = await prisma.cashOperation.create({
        data: {
          sessionId,
          type,
          amount: parseFloat(amount),
          reason,
          description: description || null,
          createdBy: createdBy || 'Admin'
        }
      });
      
      res.status(201).json(operation);
    } catch (error) {
      console.error('Erreur POST cash operation:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}