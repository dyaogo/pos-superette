import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { storeId, startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const where = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };

      if (storeId && storeId !== 'all') {
        where.storeId = storeId;
      }

      // Récupérer les ventes (revenus)
      const sales = await prisma.sale.findMany({
        where,
        select: {
          total: true,
          subtotal: true,
          tax: true,
        },
      });

      // Récupérer les dépenses
      const expenses = await prisma.expense.findMany({
        where: {
          expenseDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          ...(storeId && storeId !== 'all' ? { storeId } : {}),
        },
        include: {
          category: true,
        },
      });

      // Calculer les totaux
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalSubtotal = sales.reduce((sum, sale) => sum + sale.subtotal, 0);
      const totalTax = sales.reduce((sum, sale) => sum + sale.tax, 0);

      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Grouper les dépenses par catégorie
      const expensesByCategory = expenses.reduce((acc, expense) => {
        const categoryName = expense.category.name;
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            color: expense.category.color,
            icon: expense.category.icon,
            total: 0,
          };
        }
        acc[categoryName].total += expense.amount;
        return acc;
      }, {});

      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      res.status(200).json({
        revenue: {
          total: totalRevenue,
          subtotal: totalSubtotal,
          tax: totalTax,
        },
        expenses: {
          total: totalExpenses,
          byCategory: Object.values(expensesByCategory),
        },
        netProfit,
        profitMargin,
        salesCount: sales.length,
        expensesCount: expenses.length,
      });
    } catch (error) {
      console.error('Error calculating profit/loss:', error);
      res.status(500).json({ error: 'Failed to calculate profit/loss' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
