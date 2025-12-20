import prisma from '../../../../lib/prisma';

const defaultCategories = [
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Créer les catégories par défaut
    const createdCategories = [];

    for (const category of defaultCategories) {
      // Vérifier si la catégorie existe déjà
      const existing = await prisma.expenseCategory.findFirst({
        where: { name: category.name },
      });

      if (!existing) {
        const created = await prisma.expenseCategory.create({
          data: category,
        });
        createdCategories.push(created);
      }
    }

    res.status(200).json({
      message: `${createdCategories.length} catégories créées`,
      categories: createdCategories,
    });
  } catch (error) {
    console.error('Error initializing categories:', error);
    res.status(500).json({ error: 'Failed to initialize categories', details: error.message });
  }
}
