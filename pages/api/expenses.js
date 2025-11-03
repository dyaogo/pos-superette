import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { storeId, status, startDate, endDate, categoryId } = req.query;

      const where = {};

      if (storeId) {
        where.storeId = storeId;
      }

      if (status) {
        where.status = status;
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      const expenses = await prisma.expense.findMany({
        where,
        include: {
          category: true,
          store: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json(expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des dépenses' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        storeId,
        categoryId,
        amount,
        description,
        invoiceNumber,
        supplier,
        paymentMethod,
        dueDate,
        notes,
        createdBy,
      } = req.body;

      if (!storeId || !categoryId || !amount || !description || !createdBy) {
        return res.status(400).json({ error: 'Champs requis manquants' });
      }

      const expense = await prisma.expense.create({
        data: {
          storeId,
          categoryId,
          amount: parseFloat(amount),
          description,
          invoiceNumber,
          supplier,
          paymentMethod: paymentMethod || 'cash',
          status: 'pending',
          dueDate: dueDate ? new Date(dueDate) : null,
          notes,
          createdBy,
        },
        include: {
          category: true,
          store: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      return res.status(201).json(expense);
    } catch (error) {
      console.error('Error creating expense:', error);
      return res.status(500).json({ error: 'Erreur lors de la création de la dépense' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
