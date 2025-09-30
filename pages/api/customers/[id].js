const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const customer = await prisma.customer.update({
        where: { id },
        data: req.body
      });
      res.status(200).json(customer);
    } catch (error) {
      console.error('Erreur PUT customer:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.customer.delete({
        where: { id }
      });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erreur DELETE customer:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
