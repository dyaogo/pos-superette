const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Récupérer les opérations d'une session
    try {
      const { sessionId } = req.query;

      const where = sessionId ? { sessionId } : {};

      const operations = await prisma.cashOperation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json(operations);
    } catch (error) {
      console.error('Error fetching cash operations:', error);
      res.status(500).json({ error: 'Failed to fetch operations' });
    }
  } else if (req.method === 'POST') {
    try {
      const { sessionId, type, amount, reason, description, createdBy } = req.body;

      // Validation
      if (!sessionId || !type || !amount || !reason) {
        return res.status(400).json({ error: 'Champs requis manquants' });
      }

      if (!['in', 'out'].includes(type)) {
        return res.status(400).json({ error: 'Type invalide (in ou out)' });
      }

      if (amount <= 0) {
        return res.status(400).json({ error: 'Le montant doit être positif' });
      }

      // Vérifier que la session existe et est ouverte
      const session = await prisma.cashSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      if (session.status === 'closed') {
        return res.status(400).json({ error: 'Impossible d\'ajouter des opérations à une session fermée' });
      }

      const operation = await prisma.cashOperation.create({
        data: {
          sessionId,
          type,
          amount: Math.round(parseFloat(amount)), // Arrondir pour FCFA
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