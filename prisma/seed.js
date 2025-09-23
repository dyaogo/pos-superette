const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Créer un magasin
  const store = await prisma.store.create({
    data: {
      code: 'MAG001',
      name: 'Superette Centre',
      currency: 'FCFA',
      taxRate: 18
    }
  });

  console.log('✅ Magasin créé:', store.name);

  // Créer quelques produits
  const products = [
    { name: 'Coca Cola', category: 'Boissons', costPrice: 500, sellingPrice: 800, stock: 50 },
    { name: 'Sprite', category: 'Boissons', costPrice: 500, sellingPrice: 800, stock: 30 },
    { name: 'Chips', category: 'Snacks', costPrice: 300, sellingPrice: 500, stock: 40 },
    { name: 'Savon', category: 'Hygiène', costPrice: 400, sellingPrice: 700, stock: 25 }
  ];

  for (const product of products) {
    await prisma.product.create({
      data: {
        ...product,
        storeId: store.id,
        barcode: Math.random().toString().slice(2, 12)
      }
    });
    console.log(`  ✅ Produit créé: ${product.name}`);
  }

  console.log('🎉 Base de données initialisée!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());