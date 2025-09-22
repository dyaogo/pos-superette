import prisma from '../lib/prisma';

export async function getProducts(storeId) {
  try {
    const products = await prisma.product.findMany({
      where: { storeId },
      orderBy: { name: 'asc' }
    });
    return products;
  } catch (error) {
    console.error('Erreur récupération produits:', error);
    return [];
  }
}

export async function createProduct(data) {
  try {
    const product = await prisma.product.create({
      data
    });
    return product;
  } catch (error) {
    console.error('Erreur création produit:', error);
    return null;
  }
}
