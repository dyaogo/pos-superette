import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { storeId, startDate, endDate } = req.query;

      const where = {};

      if (storeId && storeId !== 'all') {
        where.storeId = storeId;
      }

      if (startDate && endDate) {
        where.expenseDate = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      const expenses = await prisma.expense.findMany({
        where,
        include: {
          category: true,
          store: {
            select: {
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          expenseDate: 'desc',
        },
      });

      res.status(200).json(expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  } else if (req.method === 'POST') {
    try {
      const { storeId, categoryId, amount, description, expenseDate, createdBy } = req.body;

      // Validation
      if (!storeId || !categoryId || !amount || !description || !createdBy) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const expense = await prisma.expense.create({
        data: {
          storeId,
          categoryId,
          amount: parseFloat(amount),
          description,
          expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
          createdBy,
        },
        include: {
          category: true,
          store: {
            select: {
              name: true,
            },
          },
        },
      });

      res.status(201).json(expense);
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ error: 'Failed to create expense' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Expense ID required' });
      }

      await prisma.expense.delete({
        where: { id },
      });

      res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ error: 'Failed to delete expense' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
