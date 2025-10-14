const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const store = await prisma.store.findUnique({
        where: { id },
        include: {
          products: true,
          sales: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: { products: true, sales: true }
          }
        }
      });
      res.status(200).json(store);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { code, name, address, phone, currency, taxRate } = req.body;
      
      // Validation
      if (!code || !name) {
        return res.status(400).json({ error: 'Code et nom requis' });
      }

      // Préparer les données avec gestion des champs vides
      const updateData = {
        code: code.trim(),
        name: name.trim(),
        address: address && address.trim() !== '' ? address.trim() : null,
        phone: phone && phone.trim() !== '' ? phone.trim() : null,
        currency: currency || 'FCFA',
        taxRate: parseFloat(taxRate) || 18
      };

      const store = await prisma.store.update({
        where: { id },
        data: updateData
      });
      
      res.status(200).json(store);
    } catch (error) {
      console.error('Erreur PUT store:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Vérifier s'il y a des produits ou ventes
      const store = await prisma.store.findUnique({
        where: { id },
        include: {
          _count: {
            select: { products: true, sales: true }
          }
        }
      });

      if (store._count.products > 0 || store._count.sales > 0) {
        return res.status(400).json({ 
          error: 'Impossible de supprimer un magasin avec des produits ou des ventes' 
        });
      }

      await prisma.store.delete({
        where: { id }
      });
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}