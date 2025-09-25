import prisma from '../../src/lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { storeId } = req.query;
      
      const products = await prisma.product.findMany({
        where: storeId ? { storeId } : {},
        orderBy: { name: 'asc' }
      });
      
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: 'Erreur récupération produits' });
    }
  } else if (req.method === 'POST') {
    try {
      const product = await prisma.product.create({
        data: req.body
      });
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ error: 'Erreur création produit' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}