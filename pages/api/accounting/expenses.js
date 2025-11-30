import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { storeId } = req.query;

      const where = {};
      if (storeId && storeId !== 'all') {
        where.storeId = storeId;
      }

      const expenses = await prisma.expense.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          expenseDate: 'desc',
        },
        take: 50, // Limite à 50 dépenses récentes
      });

      res.status(200).json(expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ error: 'Failed to fetch expenses', details: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { storeId, categoryId, amount, description, expenseDate, createdBy } = req.body;

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
