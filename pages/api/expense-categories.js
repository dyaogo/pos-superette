import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { active } = req.query;

      const where = active === 'true' ? { isActive: true } : {};

      const categories = await prisma.expenseCategory.findMany({
        where,
        orderBy: {
          name: 'asc',
        },
      });

      return res.status(200).json(categories);
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { code, name, description, color, icon } = req.body;

      if (!code || !name) {
        return res.status(400).json({ error: 'Code et nom requis' });
      }

      const category = await prisma.expenseCategory.create({
        data: {
          code,
          name,
          description,
          color,
          icon,
        },
      });

      return res.status(201).json(category);
    } catch (error) {
      console.error('Error creating expense category:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Ce code existe déjà' });
      }
      return res.status(500).json({ error: 'Erreur lors de la création de la catégorie' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
