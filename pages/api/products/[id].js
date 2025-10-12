const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
  try {
    const { name, category, barcode, costPrice, sellingPrice, stock, image } = req.body;
    
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        barcode: barcode || null,
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        stock: parseInt(stock),
        image: image || null  // NOUVEAU
      },
      include: {
        store: true
      }
    });
    
    res.status(200).json(product);
  } catch (error) {
    console.error('Erreur modification produit:', error);
    res.status(500).json({ error: error.message });
  }
} else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
