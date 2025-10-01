const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const product = await prisma.product.update({
        where: { id },
        data: req.body
      });
      res.status(200).json(product);
    } catch (error) {
      console.error('Erreur PUT product:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.product.delete({
        where: { id }
      });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erreur DELETE product:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
