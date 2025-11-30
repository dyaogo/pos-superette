import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { active } = req.query;

      const where = {};

      if (active === 'true') {
        where.isActive = true;
      }

      const categories = await prisma.expenseCategory.findMany({
        where,
        orderBy: {
          name: 'asc',
        },
      });

      res.status(200).json(categories);
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      res.status(500).json({ error: 'Failed to fetch expense categories' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
