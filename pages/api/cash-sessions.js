const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { storeId, status } = req.query;
      
      const where = {};
      if (storeId) where.storeId = storeId;
      if (status) where.status = status;
      
      const sessions = await prisma.cashSession.findMany({
        where,
        include: {
          operations: true
        },
        orderBy: { openedAt: 'desc' },
        take: 50
      });
      
      res.status(200).json(sessions);
    } catch (error) {
      console.error('Erreur GET cash sessions:', error);
      res.status(200).json([]);
    }
  } else if (req.method === 'POST') {
    try {
      const { storeId, openingAmount, openedBy } = req.body;
      
      // Vérifier qu'il n'y a pas déjà une session ouverte pour ce magasin
      const existingSession = await prisma.cashSession.findFirst({
        where: {
          storeId,
          status: 'open'
        }
      });
      
      if (existingSession) {
        return res.status(400).json({ 
          error: 'Une session de caisse est déjà ouverte pour ce magasin' 
        });
      }
      
      const sessionNumber = `CASH-${Date.now()}`;
      
      const session = await prisma.cashSession.create({
        data: {
          storeId,
          sessionNumber,
          openingAmount: parseFloat(openingAmount),
          openedBy: openedBy || 'Admin',
          status: 'open'
        }
      });
      
      res.status(201).json(session);
    } catch (error) {
      console.error('Erreur POST cash session:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}