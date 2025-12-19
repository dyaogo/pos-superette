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

    // Récupérer les ventes avec leurs items et produits pour calculer le COGS
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
          lte: now,
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

    // Calculs financiers corrects
    const totalRevenue = revenue.total;
    const grossProfit = totalRevenue - totalCOGS;  // Marge brute
    const netProfit = grossProfit - totalExpenses;  // Bénéfice net
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
      // Métriques principales
      revenue: totalRevenue,
      cogs: totalCOGS,
      grossProfit,
      expenses: totalExpenses,
      netProfit,
      // Marges
      grossMargin,
      netMargin,
      profitMargin: netMargin, // Alias pour compatibilité
      // Statistiques
      salesCount: sales.length,
      itemsSold: totalItemsSold,
      averageBasket: sales.length > 0 ? totalRevenue / sales.length : 0,
      averageItemPrice: totalItemsSold > 0 ? totalRevenue / totalItemsSold : 0,
      // Détails par catégorie
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
