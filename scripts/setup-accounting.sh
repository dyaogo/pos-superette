#!/bin/bash

echo "🔧 Configuration du module de comptabilité..."
echo ""

# Étape 1 : Générer le client Prisma
echo "📦 Étape 1/3 : Génération du client Prisma..."
npx prisma generate
if [ $? -eq 0 ]; then
  echo "✅ Client Prisma généré avec succès"
else
  echo "❌ Erreur lors de la génération du client Prisma"
  exit 1
fi
echo ""

# Étape 2 : Créer la migration
echo "🗄️ Étape 2/3 : Création de la migration..."
npx prisma migrate dev --name add_accounting_module
if [ $? -eq 0 ]; then
  echo "✅ Migration créée et appliquée avec succès"
else
  echo "❌ Erreur lors de la migration"
  exit 1
fi
echo ""

# Étape 3 : Seed des catégories
echo "🌱 Étape 3/3 : Seed des catégories de dépenses..."
node prisma/seed-expense-categories.js
if [ $? -eq 0 ]; then
  echo "✅ Catégories créées avec succès"
else
  echo "❌ Erreur lors du seed des catégories"
  exit 1
fi
echo ""

echo "🎉 Configuration terminée avec succès !"
echo ""
echo "Vous pouvez maintenant :"
echo "  1. Redémarrer le serveur : npm run dev"
echo "  2. Accéder au module de comptabilité"
echo ""
