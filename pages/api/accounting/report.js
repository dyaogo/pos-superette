import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { storeId, period = 'week' } = req.query;

    // Calculer les dates selon la période
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const whereStore = storeId && storeId !== 'all' ? { storeId } : {};

    // Récupérer les ventes
    const sales = await prisma.sale.findMany({
      where: {
        ...whereStore,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        total: true,
        subtotal: true,
        tax: true,
      },
    });

    // Récupérer les dépenses
    const expenses = await prisma.expense.findMany({
      where: {
        ...whereStore,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        category: true,
      },
    });

    // Calculer les totaux
    const revenue = {
      total: sales.reduce((sum, s) => sum + s.total, 0),
      subtotal: sales.reduce((sum, s) => sum + s.subtotal, 0),
      tax: sales.reduce((sum, s) => sum + s.tax, 0),
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Grouper les dépenses par catégorie
    const byCategory = expenses.reduce((acc, expense) => {
      const key = expense.category.name;
      if (!acc[key]) {
        acc[key] = {
          name: expense.category.name,
          color: expense.category.color,
          total: 0,
        };
      }
      acc[key].total += expense.amount;
      return acc;
    }, {});

    const totalRevenue = revenue.total;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Format pour le frontend
    const expensesByCategory = expenses.reduce((acc, expense) => {
      const existing = acc.find(item => item.categoryId === expense.categoryId);
      if (existing) {
        existing.total += expense.amount;
      } else {
        acc.push({
          categoryId: expense.categoryId,
          total: expense.amount
        });
      }
      return acc;
    }, []);

    res.status(200).json({
      period,
      revenue: totalRevenue,
      expenses: totalExpenses,
      netProfit,
      profitMargin,
      salesCount: sales.length,
      expensesByCategory,
      // Données détaillées supplémentaires
      revenueDetails: revenue,
      expensesDetails: {
        byCategory: Object.values(byCategory),
        count: expenses.length,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
}
