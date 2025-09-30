const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const sales = await prisma.sale.findMany({
        include: {
          items: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100
      });
      
      res.status(200).json(sales);
    } catch (error) {
      console.error('Erreur GET sales:', error);
      res.status(200).json([]);
    }
    
  } else if (req.method === 'POST') {
    try {
      const { customerId, total, paymentMethod, items } = req.body;
      
      // Récupérer le magasin
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
      
      // Calculer les totaux
      const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const tax = subtotal * 0.18;
      const totalAmount = subtotal + tax;
      
      // Créer la vente
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
              productName: item.name,
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
