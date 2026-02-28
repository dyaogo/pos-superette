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
          items: true,
          customer: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // ✅ FIX N+1 : Charger TOUS les produits en une seule requête IN
      // Avant : 1 requête par article (ex: 50 ventes × 5 articles = 251 requêtes)
      // Après : 3 requêtes fixes (count + sales + products)
      const productIds = [...new Set(
        sales.flatMap(sale => sale.items.map(item => item.productId))
      )];

      const products = productIds.length > 0
        ? await prisma.product.findMany({ where: { id: { in: productIds } } })
        : [];

      const productMap = Object.fromEntries(products.map(p => [p.id, p]));

      // Assembler les données en mémoire (pas de requêtes supplémentaires)
      const enrichedSales = sales.map(sale => ({
        ...sale,
        items: sale.items.map(item => ({
          ...item,
          product: productMap[item.productId] || { name: item.productName }
        }))
      }));
      
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
    // Les unitPrice (sellingPrice) sont des prix TTC (toutes taxes comprises)
    // Il faut donc EXTRAIRE la TVA du total TTC, pas l'ajouter par-dessus
    const totalTTC = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxRate = 0.18;
    const subtotal = Math.round((totalTTC / (1 + taxRate)) * 100) / 100; // Prix HT
    const tax = Math.round((totalTTC - subtotal) * 100) / 100;           // TVA extraite
    const totalAmount = totalTTC;                                          // Total TTC (= ce que le client paie)

    // 🛡️ FIX #5 — Vérification de stock côté serveur avant transaction
    const stockInsuffisant = [];
    for (const item of items) {
      const produit = await prisma.product.findUnique({ where: { id: item.productId } });
      if (produit && produit.stock < item.quantity) {
        stockInsuffisant.push({ name: item.name || item.productName, stock: produit.stock, demande: item.quantity });
      }
    }
    if (stockInsuffisant.length > 0) {
      const detail = stockInsuffisant.map(p => `${p.name} (stock: ${p.stock}, demandé: ${p.demande})`).join(', ');
      return res.status(409).json({ error: `Stock insuffisant : ${detail}` });
    }

    // 🛡️ FIX #5 — Transaction atomique : vente + décréments de stock en une seule opération
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Créer la vente
      const nouvellVente = await tx.sale.create({
        data: {
          storeId: finalStoreId,
          receiptNumber: `REC-${Date.now()}`,
          subtotal,
          tax,
          total: totalAmount,
          discount: 0,
          paymentMethod: paymentMethod || 'cash',
          cashReceived: cashReceived || null,
          change: change || null,
          customerId: customerId || null,
          cashier: req.body.cashier || 'Admin',
          items: {
            create: items.map(item => ({
              productId: item.productId,
              productName: item.name || item.productName || 'Produit',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.unitPrice * item.quantity
            }))
          }
        },
        include: { items: true }
      });

      // 2. Décrémenter le stock de chaque article (atomique — annulé si erreur)
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return nouvellVente;
    });

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
