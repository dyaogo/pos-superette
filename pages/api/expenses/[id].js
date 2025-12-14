import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const expense = await prisma.expense.findUnique({
        where: { id },
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

      if (!expense) {
        return res.status(404).json({ error: 'Dépense non trouvée' });
      }

      return res.status(200).json(expense);
    } catch (error) {
      console.error('Error fetching expense:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération de la dépense' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const {
        categoryId,
        amount,
        description
      } = req.body;

      // Validation des champs requis
      if (!categoryId && !amount && !description) {
        return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
      }

      const updateData = {};

      if (categoryId) updateData.categoryId = categoryId;
      if (amount !== undefined) updateData.amount = parseFloat(amount);
      if (description) updateData.description = description;

      const expense = await prisma.expense.update({
        where: { id },
        data: updateData,
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

      return res.status(200).json(expense);
    } catch (error) {
      console.error('Error updating expense:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour de la dépense', details: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.expense.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Dépense supprimée avec succès' });
    } catch (error) {
      console.error('Error deleting expense:', error);
      return res.status(500).json({ error: 'Erreur lors de la suppression de la dépense' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
