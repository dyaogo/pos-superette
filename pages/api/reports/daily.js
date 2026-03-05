import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Exécute une requête Prisma et renvoie un fallback en cas d'erreur
async function safeQuery(queryFn, fallback) {
  try {
    return await queryFn();
  } catch (err) {
    console.warn('safeQuery fallback:', err?.message);
    return fallback;
  }
}

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
        safeQuery(() => prisma.store.findUnique({ where: { id: storeId } }), null),

        // Ventes du jour avec articles
        safeQuery(() => prisma.sale.findMany({
          where: {
            storeId,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
          include: { items: true, customer: true },
          orderBy: { createdAt: 'desc' },
        }), []),

        // Session de caisse du jour (la plus récente)
        safeQuery(() => prisma.cashSession.findFirst({
          where: {
            storeId,
            openedAt: { gte: startOfDay, lte: endOfDay },
          },
          include: { operations: { orderBy: { createdAt: 'asc' } } },
          orderBy: { openedAt: 'desc' },
        }), null),

        // Crédits accordés ce jour
        safeQuery(() => prisma.credit.findMany({
          where: {
            storeId,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
          include: { customer: true },
        }), []),

        // Remboursements reçus ce jour (via relation Credit → storeId)
        safeQuery(() => prisma.creditPayment.findMany({
          where: {
            createdAt: { gte: startOfDay, lte: endOfDay },
            credit: { storeId },
          },
          include: { credit: { include: { customer: true } } },
        }), []),

        // Retours traités ce jour
        safeQuery(() => prisma.return.findMany({
          where: {
            storeId,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
          include: { items: true },
        }), []),

        // Dépenses du jour
        safeQuery(() => prisma.expense.findMany({
          where: {
            storeId,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        }), []),
      ]);

    // ─── Agrégation des ventes ─────────────────────────────────────────────

    // ✅ FIX: Lire le vrai taux TVA du magasin ; 0 || 18 serait faux si taux = 0%
    const storeTaxRate = store?.taxRate ?? 0;  // ex. 0, 18, 19.6…
    const storeTaxMultiplier = storeTaxRate > 0 ? (1 + storeTaxRate / 100) : 1;

    const salesTotal = sales.reduce((sum, s) => sum + s.total, 0);

    // ✅ FIX: Recalculer sous-total et TVA à partir du taux actuel du magasin.
    // On ne lit PAS s.tax depuis la DB car les anciennes ventes ont pu être
    // enregistrées avec un taux incorrect (bug antérieur hardcodé à 18%).
    const salesSubtotal = storeTaxRate === 0
      ? salesTotal  // Pas de TVA → subtotal = total
      : Math.round((salesTotal / storeTaxMultiplier) * 100) / 100;
    const salesTax = Math.round((salesTotal - salesSubtotal) * 100) / 100;

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
        ? { id: store.id, name: store.name, currency: store.currency || 'FCFA', taxRate: store.taxRate ?? 0 }  // ✅ FIX: ?? pas || (0% est valide)
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
