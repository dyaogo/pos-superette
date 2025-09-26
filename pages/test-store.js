const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStore() {
  const stores = await prisma.store.findMany();
  console.log('Magasins:', stores);
  
  if (stores.length === 0) {
    console.log('Aucun magasin, création...');
    const store = await prisma.store.create({
      data: {
        code: 'MAG001',
        name: 'Superette Centre',
        currency: 'FCFA',
        taxRate: 18
      }
    });
    console.log('Magasin créé:', store);
  }
  
  await prisma.$disconnect();
}

checkStore();