const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const credit = await prisma.credit.findUnique({
        where: { id }
      });
      res.status(200).json(credit);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { paymentAmount } = req.body;
      
      // Récupérer le crédit actuel
      const credit = await prisma.credit.findUnique({
        where: { id }
      });
      
      if (!credit) {
        return res.status(404).json({ error: 'Crédit non trouvé' });
      }
      
      // Calculer le nouveau montant restant
      const newRemainingAmount = credit.remainingAmount - parseFloat(paymentAmount);
      
      // Déterminer le nouveau statut
      let newStatus = 'pending';
      if (newRemainingAmount === 0) {
        newStatus = 'paid';
      } else if (newRemainingAmount < credit.amount) {
        newStatus = 'partial';
      }
      
      // Mettre à jour le crédit
      const updatedCredit = await prisma.credit.update({
        where: { id },
        data: {
          remainingAmount: newRemainingAmount,
          status: newStatus
        }
      });
      
      res.status(200).json(updatedCredit);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}