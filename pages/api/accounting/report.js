import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { storeId, period = 'week', startDate: startDateParam, endDate: endDateParam } = req.query;

    // Calculer les dates selon la période
    const now = new Date();
    let startDate;
    let endDate;

    // Si startDate et endDate sont fournis, les utiliser
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else {
      // Sinon, calculer selon la période (backward compatibility)
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
      endDate = now;
    }

    const whereStore = storeId && storeId !== 'all' ? { storeId } : {};

    // Récupérer les ventes avec leurs items et produits pour calculer le COGS
    const sales = await prisma.sale.findMany({
      where: {
        ...whereStore,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        total: true,
        subtotal: true,
        tax: true,
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            productId: true,
          }
        }
      },
    });

    // Récupérer les dépenses
    const expenses = await prisma.expense.findMany({
      where: {
        ...whereStore,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    // Calculer les totaux de revenus
    const revenue = {
      total: sales.reduce((sum, s) => sum + s.total, 0),
      subtotal: sales.reduce((sum, s) => sum + s.subtotal, 0),
      tax: sales.reduce((sum, s) => sum + s.tax, 0),
    };

    // Récupérer tous les productIds uniques des ventes
    const productIds = [...new Set(
      sales.flatMap(sale => sale.items.map(item => item.productId))
    )];

    // Récupérer les informations de coût des produits
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      select: {
        id: true,
        costPrice: true
      }
    });

    // Créer un map pour un accès rapide au costPrice
    const productCostMap = {};
    products.forEach(p => {
      productCostMap[p.id] = p.costPrice || 0;
    });

    // Calculer le COGS (Coût des Marchandises Vendues)
    let totalCOGS = 0;
    let totalItemsSold = 0;

    sales.forEach(sale => {
      (sale.items || []).forEach(item => {
        const costPrice = productCostMap[item.productId] || 0;
        totalCOGS += costPrice * item.quantity;
        totalItemsSold += item.quantity;
      });
    });

    // Calculer les dépenses d'exploitation
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

    // Calculs financiers corrects (arrondis à l'entier pour FCFA)
    const totalRevenue = Math.round(revenue.total);
    const totalCOGSRounded = Math.round(totalCOGS);
    const grossProfit = Math.round(totalRevenue - totalCOGSRounded);  // Marge brute
    const totalExpensesRounded = Math.round(totalExpenses);
    const netProfit = Math.round(grossProfit - totalExpensesRounded);  // Bénéfice net
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

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
      // Métriques principales (arrondies à l'entier)
      revenue: totalRevenue,
      cogs: totalCOGSRounded,
      grossProfit,
      expenses: totalExpensesRounded,
      netProfit,
      // Marges (en pourcentage, gardent les décimales)
      grossMargin,
      netMargin,
      profitMargin: netMargin, // Alias pour compatibilité
      // Statistiques
      salesCount: sales.length,
      itemsSold: totalItemsSold,
      averageBasket: sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0,
      averageItemPrice: totalItemsSold > 0 ? Math.round(totalRevenue / totalItemsSold) : 0,
      // Détails par catégorie
      expensesByCategory: expensesByCategory.map(cat => ({
        ...cat,
        total: Math.round(cat.total)
      })),
      // Données détaillées supplémentaires
      revenueDetails: {
        total: Math.round(revenue.total),
        subtotal: Math.round(revenue.subtotal),
        tax: Math.round(revenue.tax)
      },
      expensesDetails: {
        byCategory: Object.values(byCategory).map(cat => ({
          ...cat,
          total: Math.round(cat.total)
        })),
        count: expenses.length,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
}
