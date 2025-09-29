const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Ajouter gestion d'erreur et retour vide par défaut
  if (req.method === 'GET') {
    try {
      const products = await prisma.product.findMany({
        include: {
          store: true
        }
      });
      
      // IMPORTANT : Toujours retourner un tableau
      res.status(200).json(products || []);
    } catch (error) {
      console.error('Erreur API products:', error);
      // Retourner un tableau vide en cas d'erreur
      res.status(200).json([]);
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}