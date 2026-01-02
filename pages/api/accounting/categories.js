import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const categories = await prisma.expenseCategory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      res.status(200).json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, description, color } = req.body;

      // Validation
      if (!name || !color) {
        return res.status(400).json({ error: 'Le nom et la couleur sont requis' });
      }

      // Vérifier si la catégorie existe déjà
      const existingCategory = await prisma.expenseCategory.findFirst({
        where: { name }
      });

      if (existingCategory) {
        return res.status(400).json({ error: 'Une catégorie avec ce nom existe déjà' });
      }

      // Créer la catégorie
      const category = await prisma.expenseCategory.create({
        data: {
          name,
          description: description || null,
          color,
          icon: 'Receipt',
          isActive: true
        }
      });

      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Failed to create category', details: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
