const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const sales = await prisma.sale.findMany({
        include: {
          items: true  // ⚠️ Ceci ne charge que les SaleItem, pas les Product
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100
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
      
      res.status(200).json(enrichedSales);
    } catch (error) {
      console.error('Erreur GET sales:', error);
      res.status(200).json([]);
    }
    
  } else if (req.method === 'POST') {
    try {
      const { customerId, total, paymentMethod, items } = req.body;
      
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
      
      const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const tax = subtotal * 0.18;
      const totalAmount = subtotal + tax;
      
      const sale = await prisma.sale.create({
        data: {
          storeId: store.id,
          receiptNumber: `REC-${Date.now()}`,
          subtotal: subtotal,
          tax: tax,
          total: totalAmount,
          paymentMethod: paymentMethod || 'cash',
          customerId: customerId || null,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              productName: item.name, // Sauvegarder le nom du produit au moment de la vente
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
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
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
