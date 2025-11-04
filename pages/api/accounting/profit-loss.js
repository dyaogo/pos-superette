import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { storeId, startDate, endDate } = req.query;

    // Définir les dates par défaut (début et fin du mois en cours)
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

    const where = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    if (storeId) {
      where.storeId = storeId;
    }

    // 1. Récupérer toutes les ventes de la période
    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: true,
      },
    });

    // 2. Calculer le revenu total
    const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const subtotal = sales.reduce((sum, sale) => sum + (sale.subtotal || 0), 0);
    const taxCollected = sales.reduce((sum, sale) => sum + (sale.tax || 0), 0);

    // 3. Calculer le coût des marchandises vendues (COGS)
    let cogs = 0;
    const productCosts = {};

    for (const sale of sales) {
      for (const item of sale.items) {
        // Récupérer le prix de revient du produit
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { costPrice: true },
        });

        if (product) {
          const itemCost = product.costPrice * item.quantity;
          cogs += itemCost;

          if (!productCosts[item.productId]) {
            productCosts[item.productId] = {
              name: item.productName,
              quantity: 0,
              costPrice: product.costPrice,
              totalCost: 0,
              revenue: 0,
              profit: 0,
            };
          }

          productCosts[item.productId].quantity += item.quantity;
          productCosts[item.productId].totalCost += itemCost;
          productCosts[item.productId].revenue += item.total;
          productCosts[item.productId].profit += item.total - itemCost;
        }
      }
    }

    // 4. Calculer la marge brute
    const grossProfit = subtotal - cogs;
    const grossMarginPercent = subtotal > 0 ? (grossProfit / subtotal) * 100 : 0;

    // 5. Récupérer toutes les dépenses approuvées de la période
    const expenses = await prisma.expense.findMany({
      where: {
        ...where,
        status: {
          in: ['approved', 'paid'],
        },
      },
      include: {
        category: true,
      },
    });

    // Log pour débogage
    console.log('[Profit-Loss] Sales count:', sales.length);
    console.log('[Profit-Loss] Expenses count:', expenses.length);
    console.log('[Profit-Loss] Revenue:', revenue);
    console.log('[Profit-Loss] COGS:', cogs);

    // 6. Calculer le total des dépenses par catégorie
    const expensesByCategory = {};
    let totalExpenses = 0;

    for (const expense of expenses) {
      totalExpenses += expense.amount;

      const catName = expense.category.name;
      if (!expensesByCategory[catName]) {
        expensesByCategory[catName] = {
          categoryId: expense.category.id,
          categoryCode: expense.category.code,
          color: expense.category.color,
          amount: 0,
          count: 0,
        };
      }

      expensesByCategory[catName].amount += expense.amount;
      expensesByCategory[catName].count += 1;
    }

    console.log('[Profit-Loss] Total Expenses:', totalExpenses);

    // 7. Calculer le résultat opérationnel et net
    const operatingProfit = grossProfit - totalExpenses;
    const netProfit = operatingProfit; // Dans une version simple, sans éléments financiers/exceptionnels
    const netMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // 8. Récupérer les retours de la période
    // Note: Return model n'a pas storeId, on doit filtrer par les saleIds
    const saleIds = sales.map(s => s.id);
    const returns = await prisma.return.findMany({
      where: {
        saleId: {
          in: saleIds,
        },
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalReturns = returns.reduce((sum, ret) => sum + ret.amount, 0);

    // 9. Construire le rapport
    const profitLoss = {
      period: {
        startDate: start,
        endDate: end,
      },
      storeId: storeId || 'all',
      revenue: {
        total: revenue,
        subtotal: subtotal,
        taxCollected: taxCollected,
        returns: totalReturns,
        netRevenue: revenue - totalReturns,
      },
      cogs: {
        total: cogs,
        byProduct: Object.entries(productCosts).map(([id, data]) => ({
          productId: id,
          ...data,
        })),
      },
      grossProfit: {
        amount: grossProfit,
        margin: grossMarginPercent,
      },
      expenses: {
        total: totalExpenses,
        byCategory: Object.entries(expensesByCategory).map(([name, data]) => ({
          name,
          ...data,
          percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        })),
      },
      operatingProfit: {
        amount: operatingProfit,
      },
      netProfit: {
        amount: netProfit,
        margin: netMarginPercent,
      },
      metrics: {
        transactionCount: sales.length,
        averageBasket: sales.length > 0 ? revenue / sales.length : 0,
        expenseRatio: revenue > 0 ? (totalExpenses / revenue) * 100 : 0,
      },
    };

    return res.status(200).json(profitLoss);
  } catch (error) {
    console.error('Error generating profit & loss statement:', error);
    return res.status(500).json({ error: 'Erreur lors de la génération du compte de résultat' });
  }
}
