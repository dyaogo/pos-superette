import prisma from '../../../lib/prisma';
import { ExpenseSchema, validate } from '../../../lib/validations';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { storeId, page: pageQuery, limit: limitQuery } = req.query;

      // 🔥 PAGINATION : Récupération des paramètres
      const page = parseInt(pageQuery) || 1;
      const limit = parseInt(limitQuery) || 50;
      const skip = (page - 1) * limit;

      const where = {};
      if (storeId && storeId !== 'all') {
        where.storeId = storeId;
      }

      // Compter le total pour la pagination
      const total = await prisma.expense.count({ where });

      const expenses = await prisma.expense.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
        },
        orderBy: {
          expenseDate: 'desc',
        },
      });

      // 🔥 PAGINATION : Métadonnées
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        data: expenses,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ error: 'Failed to fetch expenses', details: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      // 🛡️ VALIDATION ZOD : Valider les données avant traitement
      const validation = validate(ExpenseSchema, {
        ...req.body,
        amount: parseFloat(req.body.amount)
      });

      if (!validation.success) {
        return res.status(400).json({
          error: 'Données invalides',
          details: validation.errors
        });
      }

      const { storeId, categoryId, amount, description, expenseDate, createdBy } = validation.data;

      const expense = await prisma.expense.create({
        data: {
          storeId,
          categoryId,
          amount,
          description,
          expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
          createdBy,
        },
        include: {
          category: true,
        },
      });

      res.status(201).json(expense);
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ error: 'Failed to create expense', details: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'ID required' });
      }

      await prisma.expense.delete({
        where: { id },
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ error: 'Failed to delete expense', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
