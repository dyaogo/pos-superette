const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: { store: true }
      });
      
      if (!product) {
        return res.status(404).json({ error: 'Produit non trouvé' });
      }
      
      res.status(200).json(product);
    } catch (error) {
      console.error('Erreur GET product:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { name, category, barcode, costPrice, sellingPrice, stock, image } = req.body;
      
      // Validation
      if (!name || !category) {
        return res.status(400).json({ error: 'Nom et catégorie requis' });
      }
      
      // Préparer les données à mettre à jour
      const updateData = {
        name,
        category,
        barcode: barcode || null,
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        stock: parseInt(stock)
      };
      
      // Ajouter l'image seulement si elle est fournie
      if (image !== undefined) {
        updateData.image = image || null;
      }
      
      const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          store: true
        }
      });
      
      res.status(200).json(product);
    } catch (error) {
      console.error('Erreur PUT product:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la modification',
        details: error.message 
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.product.delete({
        where: { id }
      });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erreur DELETE product:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}