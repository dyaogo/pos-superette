const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // 🔥 PAGINATION : Récupération des paramètres
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const skip = (page - 1) * limit;

      // Compter le total pour la pagination
      const total = await prisma.product.count();

      const products = await prisma.product.findMany({
        skip,
        take: limit,
        include: {
          store: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      // 🔥 PAGINATION : Métadonnées
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        data: products || [],
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Erreur API products:', error);
      res.status(200).json({ data: [], pagination: null });
    }
    
} else if (req.method === 'POST') {
  try {
    console.log('Données reçues:', req.body);
    
    const { name, category, barcode, costPrice, sellingPrice, stock, image } = req.body;
    
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
    
    // Créer le produit avec l'image
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name: name,
        category: category,
        barcode: barcode || null,
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        stock: parseInt(stock) || 0,
        image: image || null  // NOUVEAU
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