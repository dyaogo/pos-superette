const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
import { CustomerSchema, validate } from '../../lib/validations';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // 🔥 PAGINATION : Récupération des paramètres
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const skip = (page - 1) * limit;

      // Compter le total pour la pagination
      const total = await prisma.customer.count();

      const customers = await prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      });

      // 🔥 PAGINATION : Métadonnées
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        data: customers,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Erreur GET customers:', error);
      res.status(200).json({ data: [], pagination: null });
    }
  } else if (req.method === 'POST') {
    try {
      // 🛡️ VALIDATION ZOD : Valider les données avant traitement
      const validation = validate(CustomerSchema, req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Données invalides',
          details: validation.errors
        });
      }

      const { name, phone, email } = validation.data;

      const customer = await prisma.customer.create({
        data: {
          name,
          phone: phone || null,
          email: email || null
        }
      });
      
      res.status(201).json(customer);
    } catch (error) {
      console.error('Erreur POST customer:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
