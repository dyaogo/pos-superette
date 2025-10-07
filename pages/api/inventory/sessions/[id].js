const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const session = await prisma.inventorySession.findUnique({
        where: { id },
        include: {
          counts: true,
          adjustments: true
        }
      });
      res.status(200).json(session);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const session = await prisma.inventorySession.update({
        where: { id },
        data: req.body
      });
      res.status(200).json(session);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.inventorySession.delete({
        where: { id }
      });
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}