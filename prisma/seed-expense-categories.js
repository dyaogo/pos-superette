const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const expenseCategories = [
  {
    name: 'Salaires',
    description: 'Salaires et rémunérations du personnel',
    color: '#10b981',
    icon: 'Users',
  },
  {
    name: 'Loyer',
    description: 'Loyer des locaux commerciaux',
    color: '#3b82f6',
    icon: 'Home',
  },
  {
    name: 'Fournitures',
    description: 'Fournitures et consommables',
    color: '#8b5cf6',
    icon: 'Package',
  },
  {
    name: 'Gardiennage',
    description: 'Services de sécurité et gardiennage',
    color: '#f59e0b',
    icon: 'Shield',
  },
  {
    name: 'Électricité',
    description: 'Consommation électrique',
    color: '#eab308',
    icon: 'Zap',
  },
  {
    name: 'Internet',
    description: 'Abonnement internet et télécommunications',
    color: '#06b6d4',
    icon: 'Wifi',
  },
  {
    name: 'Transport',
    description: 'Frais de déplacement et transport',
    color: '#ef4444',
    icon: 'Truck',
  },
  {
    name: 'Autres',
    description: 'Autres dépenses diverses',
    color: '#6b7280',
    icon: 'Receipt',
  },
];

async function seedExpenseCategories() {
  console.log('🌱 Seeding expense categories...');

  try {
    for (const category of expenseCategories) {
      const existingCategory = await prisma.expenseCategory.findFirst({
        where: { name: category.name },
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
