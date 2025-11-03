const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const expenseCategories = [
  {
    code: 'SAL',
    name: 'Salaires',
    description: 'Salaires et rémunérations du personnel',
    color: '#10b981',
    icon: 'Users',
  },
  {
    code: 'RNT',
    name: 'Loyer',
    description: 'Loyer des locaux commerciaux',
    color: '#3b82f6',
    icon: 'Home',
  },
  {
    code: 'FRN',
    name: 'Fournitures',
    description: 'Fournitures et consommables',
    color: '#8b5cf6',
    icon: 'Package',
  },
  {
    code: 'GRD',
    name: 'Gardiennage',
    description: 'Services de sécurité et gardiennage',
    color: '#f59e0b',
    icon: 'Shield',
  },
  {
    code: 'ELEC',
    name: 'Facture Électricité',
    description: 'Consommation électrique',
    color: '#eab308',
    icon: 'Zap',
  },
  {
    code: 'NET',
    name: 'Facture Internet',
    description: 'Abonnement internet et télécommunications',
    color: '#06b6d4',
    icon: 'Wifi',
  },
];

async function seedExpenseCategories() {
  console.log('🌱 Seeding expense categories...');

  try {
    for (const category of expenseCategories) {
      const existingCategory = await prisma.expenseCategory.findUnique({
        where: { code: category.code },
      });

      if (existingCategory) {
        console.log(`✓ Category "${category.name}" already exists`);
      } else {
        await prisma.expenseCategory.create({
          data: category,
        });
        console.log(`✓ Created category: ${category.name}`);
      }
    }

    console.log('✅ Expense categories seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding expense categories:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedExpenseCategories()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedExpenseCategories };
