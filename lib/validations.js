import { z } from 'zod';

/**
 * Schémas de validation Zod pour l'application POS
 * Utilisés pour valider les données avant insertion en base de données
 */

// ====================================
// PRODUITS
// ====================================

export const ProductSchema = z.object({
  name: z.string()
    .min(1, "Le nom du produit est requis")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),

  category: z.string()
    .min(1, "La catégorie est requise"),

  barcode: z.string()
    .optional()
    .nullable(),

  costPrice: z.number()
    .positive("Le prix d'achat doit être positif")
    .finite("Le prix d'achat doit être un nombre valide"),

  sellingPrice: z.number()
    .positive("Le prix de vente doit être positif")
    .finite("Le prix de vente doit être un nombre valide"),

  stock: z.number()
    .int("Le stock doit être un nombre entier")
    .nonnegative("Le stock ne peut pas être négatif"),

  image: z.string()
    .optional()
    .nullable(),

  storeId: z.string()
    .optional()
}).refine(
  (data) => data.sellingPrice >= data.costPrice,
  {
    message: "Le prix de vente doit être supérieur ou égal au prix d'achat",
    path: ["sellingPrice"]
  }
);

// ====================================
// CLIENTS
// ====================================

export const CustomerSchema = z.object({
  name: z.string()
    .min(1, "Le nom du client est requis")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),

  phone: z.string()
    .regex(/^[0-9+\s()-]{8,}$/, "Numéro de téléphone invalide")
    .optional()
    .nullable()
    .or(z.literal('')),

  email: z.string()
    .email("Adresse email invalide")
    .optional()
    .nullable()
    .or(z.literal(''))
});

// ====================================
// VENTES
// ====================================

export const SaleItemSchema = z.object({
  productId: z.string()
    .min(1, "L'ID du produit est requis"),

  productName: z.string()
    .min(1, "Le nom du produit est requis")
    .optional(),

  name: z.string()
    .min(1, "Le nom du produit est requis")
    .optional(),

  quantity: z.number()
    .int("La quantité doit être un nombre entier")
    .positive("La quantité doit être positive"),

  unitPrice: z.number()
    .positive("Le prix unitaire doit être positif")
    .finite("Le prix unitaire doit être un nombre valide"),

  // Champ calculé envoyé par le frontend
  total: z.number()
    .optional()
});

export const SaleSchema = z.object({
  storeId: z.string()
    .optional(),

  customerId: z.string()
    .optional()
    .nullable(),

  total: z.number()
    .positive("Le total doit être positif")
    .finite("Le total doit être un nombre valide")
    .optional(),

  paymentMethod: z.enum(['cash', 'card', 'mobile', 'credit'], {
    errorMap: () => ({ message: "Méthode de paiement invalide" })
  }),

  items: z.array(SaleItemSchema)
    .min(1, "Au moins un article est requis"),

  cashReceived: z.number()
    .positive()
    .finite()
    .optional()
    .nullable(),

  change: z.number()
    .nonnegative()
    .finite()
    .optional()
    .nullable(),

  // Champs additionnels envoyés par le frontend
  receiptNumber: z.string().optional(),
  cashSessionId: z.string().optional(),
  userId: z.string().optional()
}).refine(
  (data) => {
    // Si paiement en espèces, cashReceived doit être fourni
    if (data.paymentMethod === 'cash' && data.cashReceived) {
      return data.cashReceived >= (data.total || 0);
    }
    return true;
  },
  {
    message: "Le montant reçu doit être supérieur ou égal au total",
    path: ["cashReceived"]
  }
);

// ====================================
// DÉPENSES
// ====================================

export const ExpenseSchema = z.object({
  storeId: z.string()
    .min(1, "L'ID du magasin est requis"),

  categoryId: z.string()
    .min(1, "La catégorie est requise"),

  amount: z.number()
    .positive("Le montant doit être positif")
    .finite("Le montant doit être un nombre valide"),

  description: z.string()
    .min(1, "La description est requise")
    .max(1000, "La description ne peut pas dépasser 1000 caractères"),

  expenseDate: z.string()
    .optional()
    .nullable(),

  createdBy: z.string()
    .min(1, "Le créateur est requis")
});

// ====================================
// CRÉDITS CLIENTS
// ====================================

export const CreditSchema = z.object({
  customerId: z.string()
    .min(1, "Le client est requis"),

  amount: z.number()
    .positive("Le montant du crédit doit être positif")
    .finite("Le montant doit être un nombre valide"),

  remainingAmount: z.number()
    .nonnegative("Le montant restant ne peut pas être négatif")
    .finite("Le montant restant doit être un nombre valide")
    .optional(),

  dueDate: z.string()
    .optional()
    .nullable(),

  notes: z.string()
    .max(500, "Les notes ne peuvent pas dépasser 500 caractères")
    .optional()
    .nullable()
});

// ====================================
// TRANSFERTS
// ====================================

export const TransferSchema = z.object({
  productId: z.string()
    .min(1, "Le produit est requis"),

  fromStoreId: z.string()
    .min(1, "Le magasin source est requis"),

  toStoreId: z.string()
    .min(1, "Le magasin destination est requis"),

  quantity: z.number()
    .int("La quantité doit être un nombre entier")
    .positive("La quantité doit être positive"),

  notes: z.string()
    .max(500, "Les notes ne peuvent pas dépasser 500 caractères")
    .optional()
    .nullable()
}).refine(
  (data) => data.fromStoreId !== data.toStoreId,
  {
    message: "Le magasin source et destination doivent être différents",
    path: ["toStoreId"]
  }
);

// ====================================
// UTILISATEURS
// ====================================

export const UserSchema = z.object({
  email: z.string()
    .email("Adresse email invalide"),

  username: z.string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
    .max(50, "Le nom d'utilisateur ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-Z0-9_-]+$/, "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores"),

  password: z.string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),

  role: z.enum(['admin', 'manager', 'cashier'], {
    errorMap: () => ({ message: "Rôle invalide" })
  }),

  storeId: z.string()
    .optional()
    .nullable()
});

// ====================================
// HELPER FUNCTIONS
// ====================================

/**
 * Valide des données avec un schéma Zod
 * @param {z.ZodSchema} schema - Le schéma Zod à utiliser
 * @param {any} data - Les données à valider
 * @returns {{ success: boolean, data?: any, errors?: string[] }}
 */
export function validate(schema, data) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Erreur de validation inconnue'] };
  }
}

/**
 * Middleware de validation pour Next.js API routes
 * @param {z.ZodSchema} schema - Le schéma Zod à utiliser
 * @returns {Function} Middleware function
 */
export function validateRequest(schema) {
  return (req, res, next) => {
    const result = validate(schema, req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Données invalides',
        details: result.errors
      });
    }

    req.validatedData = result.data;
    if (next) next();
  };
}
