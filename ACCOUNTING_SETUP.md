# 📊 Module de Comptabilité - Guide d'Installation

## ✨ Vue d'ensemble

Module de comptabilité ultra-moderne pour gérer vos finances simplement :
- 💰 Suivi des dépenses par catégorie
- 📈 Compte de résultat (semaine/mois/année)
- 🎨 Interface moderne avec gradients et animations
- ⚡ Rapide et simple d'utilisation

## 🚀 Installation

### Étape 1 : Générer le client Prisma

```bash
npx prisma generate
```

### Étape 2 : Créer les tables en base de données

```bash
npx prisma migrate dev --name add_accounting_module
```

### Étape 3 : Insérer les catégories par défaut

```bash
node prisma/seed-expense-categories.js
```

### Étape 4 : Redémarrer l'application

```bash
npm run dev
```

## 📋 Catégories par défaut

8 catégories sont automatiquement créées :
1. 💼 Salaires
2. 🏠 Loyer
3. 📦 Fournitures
4. 🛡️ Gardiennage
5. ⚡ Électricité
6. 📡 Internet
7. 🚚 Transport
8. 📝 Autres

## 🎯 Fonctionnalités

### Compte de Résultat
- Filtres par période (semaine, mois, année)
- 3 cartes principales : Revenus, Dépenses, Bénéfice Net
- Dépenses groupées par catégorie
- Barres de progression visuelles

### Gestion des Dépenses
- Formulaire simple d'ajout
- Liste des dépenses récentes
- Suppression rapide
- Catégories colorées

## 🎨 Design

- Gradients modernes (violet, purple, fuchsia)
- Cartes glassmorphism avec backdrop blur
- Animations smooth
- Responsive design
- Pas de duplication de layout

## 🔐 Permissions

Le module est accessible aux rôles :
- ✅ Admin (toutes les permissions)
- ✅ Manager (permission `view_accounting`)
- ❌ Cashier (non autorisé)

## 📡 APIs

### GET `/api/accounting/categories`
Récupère les catégories de dépenses actives

### GET `/api/accounting/expenses?storeId={id}`
Récupère les 50 dépenses les plus récentes

### POST `/api/accounting/expenses`
Crée une nouvelle dépense
```json
{
  "storeId": "...",
  "categoryId": "...",
  "amount": 5000,
  "description": "Loyer du mois",
  "expenseDate": "2025-11-30",
  "createdBy": "John Doe"
}
```

### DELETE `/api/accounting/expenses?id={id}`
Supprime une dépense

### GET `/api/accounting/report?storeId={id}&period={week|month|year}`
Génère le compte de résultat pour la période donnée

## 🛠️ Dépannage

### Erreur "Failed to fetch..."
- Vérifier que les migrations sont appliquées
- Vérifier que les catégories sont créées
- Redémarrer le serveur Next.js

### Pas de données affichées
- Créer au moins une dépense
- Vérifier que le magasin est sélectionné

## 📞 Support

Pour toute question ou problème, consulter la documentation ou contacter l'équipe de développement.

---

**Version:** 1.0.0
**Date:** 30 Novembre 2025
