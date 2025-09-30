const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const customers = await prisma.customer.findMany({
        orderBy: { name: 'asc' }
      });
      res.status(200).json(customers);
    } catch (error) {
      console.error('Erreur GET customers:', error);
      res.status(200).json([]);
    }
  } else if (req.method === 'POST') {
    try {
      const { name, phone, email } = req.body;
      
      const customer = await prisma.customer.create({
        data: {
          name,
          phone: phone || null,
          email: email || null
        }
      });
      
      res.status(201).json(customer);
    } catch (error) {
      console.error('Erreur POST customer:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
