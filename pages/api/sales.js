const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const sales = await prisma.sale.findMany({
        include: {
          items: true,
          store: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Limiter à 50 dernières ventes
      });
      
      res.status(200).json(sales);
    } catch (error) {
      console.error('Erreur récupération ventes:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
    
  } else if (req.method === 'POST') {
    try {
      const { 
        storeId, 
        items, 
        paymentMethod, 
        cashReceived,
        customerId,
        discount = 0
      } = req.body;
      
      // Calculer les totaux
      const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const tax = subtotal * 0.18; // 18% TVA
      const total = subtotal + tax - discount;
      const change = cashReceived ? cashReceived - total : 0;
      
      // Créer la vente avec les items
      const sale = await prisma.sale.create({
        data: {
          storeId: storeId || 'default',
          receiptNumber: `REC-${Date.now()}`,
          subtotal,
          tax,
          discount,
          total,
          paymentMethod,
          cashReceived,
          change,
          customerId,
          cashier: 'Admin', // À récupérer de la session
          items: {
            create: items.map(item => ({
              productId: item.productId,
              productName: item.productName,
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
      
      // Mettre à jour le stock pour chaque produit
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
      console.error('Erreur création vente:', error);
      res.status(500).json({ error: 'Erreur lors de la création de la vente' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}