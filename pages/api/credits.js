const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
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
      const { customerId, amount, description, dueDate } = req.body;
      
      if (!customerId || !amount || !dueDate) {
        return res.status(400).json({ error: 'Données manquantes' });
      }
      
      const credit = await prisma.credit.create({
        data: {
          customerId: customerId,
          amount: parseFloat(amount),
          remainingAmount: parseFloat(amount),
          description: description || null,
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