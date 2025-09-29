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
    console.log('Données reçues:', req.body);
    
    const { name, category, barcode, costPrice, sellingPrice, stock } = req.body;
    
    // Validation
    if (!name || !category || !costPrice || !sellingPrice) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }
    
    // Récupérer le premier magasin
    let store = await prisma.store.findFirst();
    
    if (!store) {
      console.log('Aucun magasin trouvé, création...');
      store = await prisma.store.create({
        data: {
          code: 'MAG001',
          name: 'Superette Centre',
          currency: 'FCFA',
          taxRate: 18
        }
      });
    }
    
    // Créer le produit (avec le champ stock direct s'il existe dans le schema)
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name: name,
        category: category,
        barcode: barcode || null,
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        stock: parseInt(stock) || 0  // Utiliser le champ stock directement
      }
    });
    
    console.log('Produit créé:', product.id);
    
    // Récupérer le produit avec ses relations
    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        store: true
      }
    });
    
    res.status(201).json(fullProduct);
  } catch (error) {
    console.error('Erreur détaillée création produit:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création du produit',
      details: error.message
    });
  }
} else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}