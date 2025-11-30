const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // 🔥 PAGINATION : Récupération des paramètres
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      // Compter le total pour la pagination
      const total = await prisma.sale.count();

      const sales = await prisma.sale.findMany({
        skip,
        take: limit,
        include: {
          items: true  // ⚠️ Ceci ne charge que les SaleItem, pas les Product
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      // Enrichir chaque vente avec les infos produits
      const enrichedSales = await Promise.all(
        sales.map(async (sale) => {
          const enrichedItems = await Promise.all(
            sale.items.map(async (item) => {
              // Récupérer le produit pour avoir son nom actuel
              const product = await prisma.product.findUnique({
                where: { id: item.productId }
              });
              
              return {
                ...item,
                product: product || { name: item.productName } // Utiliser le nom sauvegardé si produit supprimé
              };
            })
          );
          
          return {
            ...sale,
            items: enrichedItems
          };
        })
      );
      
      // 🔥 PAGINATION : Métadonnées
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        data: enrichedSales,
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
      console.error('Erreur GET sales:', error);
      res.status(200).json({ data: [], pagination: null });
    }
    
  } else if (req.method === 'POST') {
  try {
    const { storeId, customerId, total, paymentMethod, items, cashReceived, change } = req.body;
    
    // CORRECTION : Utiliser le storeId fourni, sinon chercher/créer un magasin
    let finalStoreId = storeId;
    
    if (!finalStoreId) {
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
      
      finalStoreId = store.id;
    }
    
    // Vérifier que les items sont valides
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Aucun article dans la vente' });
    }
    
    // Calculer les montants
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxRate = 0.18; // À récupérer du magasin si nécessaire
    const tax = subtotal * taxRate;
    const totalAmount = subtotal + tax;
    
    // Créer la vente
    const sale = await prisma.sale.create({
      data: {
        storeId: finalStoreId,
        receiptNumber: `REC-${Date.now()}`,
        subtotal: subtotal,
        tax: tax,
        total: totalAmount,
        discount: 0,
        paymentMethod: paymentMethod || 'cash',
        cashReceived: cashReceived || null,
        change: change || null,
        customerId: customerId || null,
        cashier: 'Admin', // À remplacer par l'utilisateur connecté
        items: {
  create: items.map(item => ({
    productId: item.productId,
    productName: item.name || item.productName || 'Produit',  // Accepter les deux formats
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.unitPrice * item.quantity
  }))
}
      },
      include: {
        items: true
      }
    });
    
    // Mettre à jour les stocks
    for (const item of items) {
      try {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      } catch (error) {
        console.warn(`Erreur mise à jour stock produit ${item.productId}:`, error);
      }
    }
    
    res.status(201).json(sale);
  } catch (error) {
    console.error('Erreur POST sale:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de la vente',
      details: error.message 
    });
  }
    
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
