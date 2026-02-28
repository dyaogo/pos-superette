const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const credit = await prisma.credit.findUnique({
        where: { id },
        include: {
          payments: { orderBy: { createdAt: 'asc' } } // ✅ Historique des remboursements
        }
      });
      res.status(200).json(credit);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }

  } else if (req.method === 'PUT') {
    try {
      const { paymentAmount, sessionId, createdBy } = req.body;

      const credit = await prisma.credit.findUnique({ where: { id } });

      if (!credit) {
        return res.status(404).json({ error: 'Crédit non trouvé' });
      }

      const amount = parseFloat(paymentAmount);

      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Montant invalide' });
      }

      if (amount > credit.remainingAmount + 0.01) { // tolérance float
        return res.status(400).json({ error: 'Montant supérieur au restant dû' });
      }

      const customer = await prisma.customer.findUnique({
        where: { id: credit.customerId }
      });

      const newRemainingAmount = Math.round((credit.remainingAmount - amount) * 100) / 100;
      let newStatus = 'pending';
      if (newRemainingAmount <= 0) {
        newStatus = 'paid';
      } else if (newRemainingAmount < credit.amount) {
        newStatus = 'partial';
      }

      // ✅ Transaction atomique : mise à jour crédit + historique paiement + caisse
      const result = await prisma.$transaction(async (tx) => {
        // 1. Mettre à jour le crédit
        const updatedCredit = await tx.credit.update({
          where: { id },
          data: {
            remainingAmount: Math.max(0, newRemainingAmount),
            status: newStatus
          },
          include: {
            payments: { orderBy: { createdAt: 'asc' } }
          }
        });

        // 2. ✅ Enregistrer le paiement dans l'historique
        await tx.creditPayment.create({
          data: {
            creditId: id,
            amount,
            paidBy: createdBy || 'Système',
            note: newRemainingAmount <= 0
              ? 'Crédit soldé'
              : `Restant : ${Math.max(0, newRemainingAmount).toLocaleString('fr-FR')} FCFA`
          }
        });

        // 3. Enregistrer dans la caisse si session ouverte
        if (sessionId) {
          await tx.cashOperation.create({
            data: {
              sessionId,
              type: 'in',
              amount: Math.round(amount),
              reason: 'Remboursement de crédit',
              description: `Client: ${customer?.name || 'Inconnu'} — Crédit #${id.slice(-6)}`,
              createdBy: createdBy || 'Système'
            }
          });
        }

        return updatedCredit;
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('Erreur PUT credit:', error);
      res.status(500).json({ error: error.message });
    }

  } else if (req.method === 'DELETE') {
    try {
      await prisma.credit.delete({ where: { id } });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erreur DELETE credit:', error);
      res.status(500).json({ error: error.message });
    }

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
