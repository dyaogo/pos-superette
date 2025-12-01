import { PrismaClient } from '@prisma/client';
import { CreditSchema, validate } from '../../lib/validations';
import { withRateLimit, RATE_LIMITS } from '../../lib/rateLimit';

const prisma = new PrismaClient();

async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const credits = await prisma.credit.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json(credits);
    } catch (error) {
      console.error('Erreur GET credits:', error);
      res.status(200).json([]);
    }
  } else if (req.method === 'POST') {
    try {
      // 🛡️ VALIDATION ZOD : Valider les données avant traitement
      const validation = validate(CreditSchema, {
        customerId: req.body.customerId,
        amount: parseFloat(req.body.amount),
        dueDate: req.body.dueDate,
        notes: req.body.description || req.body.notes // Accepter les deux
      });

      if (!validation.success) {
        return res.status(400).json({
          error: 'Données invalides',
          details: validation.errors
        });
      }

      const { customerId, amount, dueDate, notes } = validation.data;

      const credit = await prisma.credit.create({
        data: {
          customerId,
          amount,
          remainingAmount: amount,
          description: notes,
          dueDate: new Date(dueDate),
          status: 'pending'
        }
      });
      
      res.status(201).json(credit);
    } catch (error) {
      console.error('Erreur POST credit:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// 🚦 RATE LIMITING : 30 créations de crédit par minute
export default withRateLimit(handler, RATE_LIMITS.write);