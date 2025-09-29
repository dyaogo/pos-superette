const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const products = await prisma.product.findMany({
        include: {
          store: true
        }
      });
      res.status(200).json(products || []);
    } catch (error) {
      console.error('Erreur API products:', error);
      res.status(200).json([]);
    }
    
  } else if (req.method === 'POST') {
    try {
      const { name, category, barcode, costPrice, sellingPrice, stock } = req.body;
      
      // Récupérer le premier magasin (ou créer si n'existe pas)
      let store = await prisma.store.findFirst();
      
      if (!store) {
        store = await prisma.store.create({
          data: {
            code: 'MAG001',
            name: 'Superette Centre',
            currency: 'FCFA',
            taxRate: 18
          }
        });
      }
      
      // Créer le produit avec son stock
      const product = await prisma.product.create({
        data: {
          storeId: store.id,
          name,
          category,
          barcode,
          costPrice: parseFloat(costPrice),
          sellingPrice: parseFloat(sellingPrice),
          stockItems: {
            create: {
              storeId: store.id,
              quantity: parseInt(stock) || 0
            }
          }
        },
        include: {
          store: true,
          stockItems: true
        }
      });
      
      res.status(201).json(product);
    } catch (error) {
      console.error('Erreur création produit:', error);
      res.status(500).json({ error: 'Erreur lors de la création du produit' });
    }
    
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}