import { PrismaClient } from '@prisma/client';
import { SaleSchema, validate } from '../../lib/validations';
import { withRateLimit, RATE_LIMITS } from '../../lib/rateLimit';

const prisma = new PrismaClient();

async function handler(req, res) {
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
          items: true,  // ⚠️ Ceci ne charge que les SaleItem, pas les Product
          customer: true  // ✅ Inclure les données du client
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
    // Log pour debug
    console.log('📥 req.body reçu:', JSON.stringify(req.body, null, 2));

    // 🛡️ VALIDATION ZOD : Valider les données avant traitement
    const validation = validate(SaleSchema, req.body);

    if (!validation.success) {
      console.error('❌ Validation échouée:', validation.errors);
      return res.status(400).json({
        error: 'Données invalides',
        details: validation.errors
      });
    }

    console.log('✅ Validation réussie:', JSON.stringify(validation.data, null, 2));

    // Utiliser req.body.items directement car Zod peut ne pas le copier dans .data
    const { storeId, customerId, total, paymentMethod, cashReceived, change } = validation.data;
    const items = req.body.items; // ✅ FIX: Utiliser req.body.items

    // Vérification de sécurité
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Aucun article dans la vente' });
    }

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

// 🚦 RATE LIMITING : 30 ventes par minute
export default withRateLimit(handler, RATE_LIMITS.write);
