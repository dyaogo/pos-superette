const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const sessions = await prisma.inventorySession.findMany({
        include: {
          counts: true,
          adjustments: true
        },
        orderBy: { startedAt: 'desc' }
      });
      res.status(200).json(sessions);
    } catch (error) {
      console.error('Erreur GET sessions:', error);
      res.status(200).json([]);
    }
  } else if (req.method === 'POST') {
    try {
      const { name, type, startedBy, notes } = req.body;
      
      const session = await prisma.inventorySession.create({
        data: {
          name,
          type: type || 'physical',
          startedBy,
          notes: notes || null,
          status: 'in_progress'
        }
      });
      
      res.status(201).json(session);
    } catch (error) {
      console.error('Erreur POST session:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}