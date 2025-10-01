const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Création des clients de test...');
  
  const customers = [
    { name: 'Amadou Traoré', phone: '70123456', email: 'amadou@example.com' },
    { name: 'Fatou Diallo', phone: '75234567', email: 'fatou@example.com' },
    { name: 'Ibrahim Kaboré', phone: '76345678', email: 'ibrahim@example.com' },
    { name: 'Aïcha Ouédraogo', phone: '77456789', email: null },
    { name: 'Moussa Sawadogo', phone: '78567890', email: 'moussa@example.com' }
  ];

  for (const customer of customers) {
    await prisma.customer.create({ data: customer });
    console.log(`✅ Client créé: ${customer.name}`);
  }

  console.log('🎉 Clients créés avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
