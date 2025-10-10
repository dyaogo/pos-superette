const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const session = await prisma.cashSession.findUnique({
        where: { id },
        include: {
          operations: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });
      res.status(200).json(session);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { closingAmount, closedBy, notes } = req.body;
      
      const session = await prisma.cashSession.findUnique({
        where: { id },
        include: { operations: true }
      });
      
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }
      
      // Calculer le montant attendu
      const cashIn = session.operations
        .filter(op => op.type === 'in')
        .reduce((sum, op) => sum + op.amount, 0);
      
      const cashOut = session.operations
        .filter(op => op.type === 'out')
        .reduce((sum, op) => sum + op.amount, 0);
      
      const expectedAmount = session.openingAmount + cashIn - cashOut;
      const difference = parseFloat(closingAmount) - expectedAmount;
      
      const updatedSession = await prisma.cashSession.update({
        where: { id },
        data: {
          closingAmount: parseFloat(closingAmount),
          expectedAmount,
          difference,
          closedBy: closedBy || 'Admin',
          closedAt: new Date(),
          status: 'closed',
          notes: notes || null
        }
      });
      
      res.status(200).json(updatedSession);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}