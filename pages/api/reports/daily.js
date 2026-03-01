import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { storeId, date } = req.query;

  if (!storeId) {
    return res.status(400).json({ error: 'storeId est requis' });
  }

  // Plage horaire pour le jour ciblé
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const [store, sales, cashSession, credits, creditPayments, returns, expenses] =
      await Promise.all([

        // Infos du magasin
        prisma.store.findUnique({ where: { id: storeId } }),

        // Ventes du jour avec articles
        prisma.sale.findMany({
          where: {
            storeId,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
          include: { items: true, customer: true },
          orderBy: { createdAt: 'desc' },
        }),

        // Session de caisse du jour (la plus récente)
        prisma.cashSession.findFirst({
          where: {
            storeId,
            openedAt: { gte: startOfDay, lte: endOfDay },
          },
          include: { operations: { orderBy: { createdAt: 'asc' } } },
          orderBy: { openedAt: 'desc' },
        }),

        // Crédits accordés ce jour
        prisma.credit.findMany({
          where: {
            storeId,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
          include: { customer: true },
        }),

        // Remboursements reçus ce jour (via relation Credit → storeId)
        prisma.creditPayment.findMany({
          where: {
            createdAt: { gte: startOfDay, lte: endOfDay },
            credit: { storeId },
          },
          include: { credit: { include: { customer: true } } },
        }),

        // Retours traités ce jour
        prisma.return.findMany({
          where: {
            storeId,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
          include: { items: true },
        }),

        // Dépenses du jour
        prisma.expense.findMany({
          where: {
            storeId,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    // ─── Agrégation des ventes ─────────────────────────────────────────────

    const salesTotal    = sales.reduce((sum, s) => sum + s.total, 0);
    const salesSubtotal = sales.reduce((sum, s) => sum + (s.subtotal || s.total / 1.18), 0);
    const salesTax      = sales.reduce((sum, s) => sum + (s.tax || s.total - s.total / 1.18), 0);

    // Ventilation par mode de paiement
    const byPaymentMethod = {};
    for (const sale of sales) {
      const m = sale.paymentMethod || 'cash';
      if (!byPaymentMethod[m]) byPaymentMethod[m] = { count: 0, total: 0 };
      byPaymentMethod[m].count++;
      byPaymentMethod[m].total += sale.total;
    }

    // Top produits du jour
    const productMap = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        if (!productMap[item.productName]) {
          productMap[item.productName] = { name: item.productName, quantity: 0, total: 0 };
        }
        productMap[item.productName].quantity += item.quantity;
        productMap[item.productName].total    += item.total;
      }
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // ─── Réponse ──────────────────────────────────────────────────────────

    return res.status(200).json({
      date:  targetDate.toISOString().split('T')[0],
      store: store
        ? { id: store.id, name: store.name, currency: store.currency || 'FCFA', taxRate: store.taxRate || 18 }
        : null,

      sales: {
        count:         sales.length,
        total:         salesTotal,
        subtotal:      salesSubtotal,
        tax:           salesTax,
        averageTicket: sales.length > 0 ? salesTotal / sales.length : 0,
        byPaymentMethod,
        topProducts,
      },

      cashSession: cashSession
        ? {
            sessionNumber:  cashSession.sessionNumber,
            openedAt:       cashSession.openedAt,
            closedAt:       cashSession.closedAt,
            openedBy:       cashSession.openedBy,
            closedBy:       cashSession.closedBy,
            openingAmount:  cashSession.openingAmount,
            closingAmount:  cashSession.closingAmount,
            expectedAmount: cashSession.expectedAmount,
            difference:     cashSession.difference,
            status:         cashSession.status,
            notes:          cashSession.notes,
            operations:     cashSession.operations,
          }
        : null,

      credits: {
        issued: {
          count: credits.length,
          total: credits.reduce((sum, c) => sum + c.amount, 0),
          items: credits.map(c => ({
            customer:   c.customer?.name || 'N/A',
            amount:     c.amount,
            dueDate:    c.dueDate,
            createdBy:  c.createdBy,
            createdAt:  c.createdAt,
          })),
        },
        repaid: {
          count: creditPayments.length,
          total: creditPayments.reduce((sum, p) => sum + p.amount, 0),
          items: creditPayments.map(p => ({
            customer: p.credit?.customer?.name || 'N/A',
            amount:   p.amount,
            paidBy:   p.paidBy,
            createdAt: p.createdAt,
          })),
        },
      },

      returns: {
        count: returns.length,
        total: returns.reduce((sum, r) => sum + r.amount, 0),
        items: returns.map(r => ({
          reason:      r.reason,
          amount:      r.amount,
          refundMethod: r.refundMethod,
          processedBy: r.processedBy,
          createdAt:   r.createdAt,
        })),
      },

      expenses: {
        count: expenses.length,
        total: expenses.reduce((sum, e) => sum + e.amount, 0),
        items: expenses.map(e => ({
          category:    e.category?.name || 'Autre',
          amount:      e.amount,
          description: e.description,
          createdBy:   e.createdBy,
          createdAt:   e.createdAt,
        })),
      },
    });

  } catch (error) {
    console.error('Erreur rapport journalier:', error?.message || error, error?.stack);
    return res.status(500).json({
      error: 'Erreur lors de la génération du rapport',
      detail: error?.message || String(error),
    });
  } finally {
    await prisma.$disconnect();
  }
}
