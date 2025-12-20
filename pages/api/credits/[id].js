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
      const { paymentAmount, sessionId, createdBy } = req.body;

      // Récupérer le crédit actuel
      const credit = await prisma.credit.findUnique({
        where: { id }
      });

      if (!credit) {
        return res.status(404).json({ error: 'Crédit non trouvé' });
      }

      // Récupérer le client séparément
      const customer = await prisma.customer.findUnique({
        where: { id: credit.customerId }
      });

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

      // Créer une opération de caisse si une session est fournie
      if (sessionId) {
        try {
          await prisma.cashOperation.create({
            data: {
              sessionId,
              type: 'in',
              amount: Math.round(parseFloat(paymentAmount)), // Arrondir pour FCFA
              reason: 'Remboursement de crédit',
              description: `Client: ${customer?.name || 'Inconnu'} - Crédit #${(id || '').slice(-6) || 'inconnu'}`,
              createdBy: createdBy || 'Système'
            }
          });
        } catch (opError) {
          console.error('Erreur création CashOperation:', opError);
          // Continue même si l'opération de caisse échoue
        }
      }

      res.status(200).json(updatedCredit);
    } catch (error) {
      console.error('Erreur PUT credit:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.credit.delete({
        where: { id }
      });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erreur DELETE credit:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}