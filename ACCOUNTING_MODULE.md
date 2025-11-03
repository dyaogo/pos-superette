# Module de Comptabilité - Installation et Utilisation

## 📦 Installation

### 1. Mise à jour de la base de données

Le schéma Prisma a été mis à jour avec les nouveaux modèles :
- `ExpenseCategory` : Catégories de dépenses
- `Expense` : Dépenses avec workflow d'approbation

**Commandes à exécuter :**

```bash
# Générer le client Prisma
npx prisma generate

# Pousser le schéma vers la base de données
npx prisma db push

# Seed les catégories de dépenses
node prisma/seed-expense-categories.js
```

Si vous rencontrez des erreurs avec Prisma, essayez :

```bash
# Option 1 : Ignorer les checksums
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma db push

# Option 2 : Utiliser npm au lieu de npx
npm run db:push
node prisma/seed-expense-categories.js
```

### 2. Catégories de dépenses par défaut

Le script de seed crée automatiquement les catégories suivantes :
- 💚 **Salaires** (SAL) - Salaires et rémunérations du personnel
- 🔵 **Loyer** (RNT) - Loyer des locaux commerciaux
- 🟣 **Fournitures** (FRN) - Fournitures et consommables
- 🟠 **Gardiennage** (GRD) - Services de sécurité et gardiennage
- 🟡 **Facture Électricité** (ELEC) - Consommation électrique
- 🔷 **Facture Internet** (NET) - Abonnement internet et télécommunications

---

## 🎯 Fonctionnalités

### 1. Gestion des Dépenses

**Accès :** `/accounting` (onglet "Dépenses")

**Fonctionnalités :**
- ✅ Création de dépenses avec catégories
- ✅ Workflow d'approbation (En attente → Approuvée → Payée)
- ✅ Filtrage par statut et catégorie
- ✅ Support multi-magasin
- ✅ Champs détaillés : fournisseur, numéro de facture, mode de paiement, etc.
- ✅ Statistiques en temps réel

**Workflow des dépenses :**
1. **Pending** (En attente) : Dépense créée, en attente d'approbation
2. **Approved** (Approuvée) : Dépense approuvée par un manager/admin
3. **Paid** (Payée) : Dépense effectivement payée
4. **Rejected** (Rejetée) : Dépense refusée

**Modes de paiement :**
- Espèces (cash)
- Virement bancaire (bank_transfer)
- Chèque (check)
- Carte (card)

### 2. Compte de Résultat (Profit & Loss)

**Accès :** `/accounting` (onglet "Compte de Résultat")

**Métriques calculées :**
- 📊 **Revenus** : Total des ventes sur la période
- 💚 **Marge Brute** : Revenus - Coût des marchandises vendues (COGS)
- 🔴 **Dépenses** : Total des dépenses approuvées/payées
- 💰 **Résultat Net** : Marge brute - Dépenses

**Détails fournis :**
- Chiffre d'affaires HT
- TVA collectée
- Coût des marchandises vendues (calculé depuis `Product.costPrice`)
- Dépenses par catégorie
- Profit par produit (Top 10)
- Taux de marge brute et nette
- Ratio dépenses/revenus

**Filtres disponibles :**
- Sélection de période (date de début - date de fin)
- Filtrage par magasin

---

## 🔐 Permissions

Le module de comptabilité utilise la permission `view_accounting` :

**Rôles avec accès :**
- ✅ **Admin** : Accès complet (création, approbation, suppression)
- ✅ **Manager** : Accès complet au magasin assigné
- ❌ **Cashier** : Pas d'accès

Pour ajouter d'autres rôles, modifiez `/src/contexts/AuthContext.jsx` :

```javascript
manager: [
  // ... autres permissions
  'view_accounting'
],
```

---

## 🗂️ Structure des Fichiers

### Backend (API)
```
pages/api/
├── expense-categories.js       # GET/POST catégories
├── expenses.js                 # GET/POST dépenses
├── expenses/[id].js           # GET/PUT/DELETE dépense individuelle
└── accounting/
    └── profit-loss.js         # GET compte de résultat
```

### Frontend (Modules)
```
src/modules/accounting/
├── AccountingModule.jsx        # Module principal avec onglets
├── ExpensesModule.jsx          # Gestion des dépenses
└── ProfitLossStatement.jsx    # Compte de résultat
```

### Base de données
```
prisma/
├── schema.prisma              # Schéma mis à jour
└── seed-expense-categories.js # Seed des catégories
```

---

## 📊 Modèles de Données

### ExpenseCategory

```javascript
{
  id: String (cuid)
  code: String (unique)          // Ex: "SAL", "RNT"
  name: String                   // Ex: "Salaires", "Loyer"
  description: String?
  color: String?                 // Code couleur hex
  icon: String?                  // Nom de l'icône Lucide
  isActive: Boolean
  createdAt: DateTime
}
```

### Expense

```javascript
{
  id: String (cuid)
  storeId: String                // Magasin concerné
  categoryId: String             // Catégorie de dépense
  amount: Float                  // Montant en FCFA
  description: String            // Description de la dépense
  invoiceNumber: String?         // Numéro de facture
  supplier: String?              // Fournisseur
  paymentMethod: String          // cash, bank_transfer, check, card
  status: String                 // pending, approved, paid, rejected
  dueDate: DateTime?             // Date d'échéance
  paidDate: DateTime?            // Date de paiement
  receipt: String? (Text)        // URL ou base64 du justificatif
  notes: String?                 // Notes additionnelles
  createdBy: String              // Créateur
  approvedBy: String?            // Approbateur
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

## 🔧 Utilisation API

### Créer une dépense

```javascript
POST /api/expenses

Body:
{
  "storeId": "store_id",
  "categoryId": "category_id",
  "amount": 50000,
  "description": "Salaire du mois de novembre",
  "supplier": "Nom Employé",
  "paymentMethod": "bank_transfer",
  "dueDate": "2025-11-30",
  "notes": "Paiement effectué via compte entreprise",
  "createdBy": "Admin"
}

Response: 201 Created
{
  id: "expense_id",
  ...expense data,
  category: { ... },
  store: { ... }
}
```

### Approuver une dépense

```javascript
PUT /api/expenses/[id]

Body:
{
  "status": "approved",
  "approvedBy": "Manager Name"
}
```

### Marquer comme payée

```javascript
PUT /api/expenses/[id]

Body:
{
  "status": "paid",
  "paidDate": "2025-11-03T10:00:00Z"
}
```

### Récupérer le compte de résultat

```javascript
GET /api/accounting/profit-loss?storeId=xxx&startDate=2025-11-01&endDate=2025-11-30

Response:
{
  period: { startDate, endDate },
  revenue: { total, subtotal, taxCollected, returns, netRevenue },
  cogs: { total, byProduct: [...] },
  grossProfit: { amount, margin },
  expenses: { total, byCategory: [...] },
  operatingProfit: { amount },
  netProfit: { amount, margin },
  metrics: { transactionCount, averageBasket, expenseRatio }
}
```

---

## 📈 Formules de Calcul

### Revenus
- **Chiffre d'affaires HT** = Σ(Sale.subtotal)
- **TVA collectée** = Σ(Sale.tax)
- **Revenu total** = Σ(Sale.total)

### Coût des marchandises vendues (COGS)
```
Pour chaque SaleItem:
  COGS += SaleItem.quantity × Product.costPrice
```

### Marge Brute
```
Marge Brute = Chiffre d'affaires HT - COGS
Taux de marge = (Marge Brute / CA HT) × 100
```

### Dépenses
```
Total Dépenses = Σ(Expense.amount)
  WHERE status IN ('approved', 'paid')
```

### Résultat Net
```
Résultat Net = Marge Brute - Total Dépenses
Marge Nette = (Résultat Net / Revenu Total) × 100
```

---

## 🎨 Personnalisation

### Ajouter une catégorie de dépense

```javascript
POST /api/expense-categories

Body:
{
  "code": "MKT",
  "name": "Marketing",
  "description": "Dépenses marketing et publicité",
  "color": "#ec4899",
  "icon": "Megaphone"
}
```

### Modifier les permissions

Fichier : `/src/contexts/AuthContext.jsx`

```javascript
manager: [
  'view_accounting',      // Voir la comptabilité
  'approve_expenses',     // Approuver les dépenses
  'manage_expense_categories' // Gérer les catégories
]
```

---

## 🚀 Prochaines Étapes (Améliorations futures)

### Version 1.1 (Court terme)
- [ ] Export Excel/PDF du compte de résultat
- [ ] Graphiques d'évolution des dépenses
- [ ] Notifications pour dépenses en attente
- [ ] Upload de justificatifs (scan factures)

### Version 1.2 (Moyen terme)
- [ ] Budget prévisionnel par catégorie
- [ ] Alertes de dépassement de budget
- [ ] Réconciliation bancaire
- [ ] Tableau de trésorerie prévisionnel

### Version 2.0 (Long terme)
- [ ] Écritures comptables doubles
- [ ] Plan comptable complet
- [ ] Bilan comptable
- [ ] Export comptable pour expert-comptable
- [ ] Gestion des fournisseurs
- [ ] Paiements récurrents

---

## ❓ FAQ

**Q: Comment calculer le COGS si je n'ai pas de prix de revient pour certains produits ?**
R: Le système ignore les produits sans prix de revient dans le calcul du COGS. Assurez-vous de renseigner le champ `costPrice` pour tous vos produits.

**Q: Puis-je supprimer une dépense payée ?**
R: Oui, mais cela est déconseillé pour l'audit. Préférez marquer la dépense comme "rejected" avec une note explicative.

**Q: Les dépenses en attente apparaissent-elles dans le compte de résultat ?**
R: Non, seules les dépenses avec statut "approved" ou "paid" sont incluses dans les calculs.

**Q: Comment gérer les dépenses globales (non liées à un magasin) ?**
R: Actuellement, toutes les dépenses doivent être liées à un magasin. Pour les dépenses globales (siège), créez un magasin virtuel "Siège" ou assignez-les au magasin principal.

**Q: Le module gère-t-il plusieurs devises ?**
R: Non, actuellement seul le FCFA est supporté (configuré dans Store.currency).

---

## 📞 Support

Pour toute question ou problème :
1. Vérifiez que le schéma Prisma est bien synchronisé
2. Vérifiez que les catégories sont bien créées (seed)
3. Vérifiez les permissions de l'utilisateur
4. Consultez les logs de la console pour les erreurs API

---

**Version du module** : 1.0.0
**Date de création** : 3 Novembre 2025
**Auteur** : Claude Code
