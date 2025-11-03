#!/usr/bin/env node

/**
 * Script de diagnostic pour le module de comptabilité
 * Vérifie si la base de données est correctement configurée
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseDatabase() {
  console.log('🔍 DIAGNOSTIC DU MODULE DE COMPTABILITÉ\n');
  console.log('═'.repeat(50) + '\n');

  try {
    // Test 1: Connexion à la base de données
    console.log('1️⃣  Test de connexion à la base de données...');
    await prisma.$connect();
    console.log('   ✅ Connexion réussie\n');

    // Test 2: Vérifier si la table ExpenseCategory existe
    console.log('2️⃣  Vérification de la table ExpenseCategory...');
    try {
      const categoryCount = await prisma.expenseCategory.count();
      console.log(`   ✅ Table ExpenseCategory existe (${categoryCount} catégories)\n`);

      if (categoryCount === 0) {
        console.log('   ⚠️  ATTENTION: Aucune catégorie trouvée !');
        console.log('   📝 Exécutez: node prisma/seed-expense-categories.js\n');
      } else {
        // Afficher les catégories
        const categories = await prisma.expenseCategory.findMany();
        console.log('   📋 Catégories disponibles:');
        categories.forEach(cat => {
          console.log(`      - ${cat.name} (${cat.code})`);
        });
        console.log('');
      }
    } catch (error) {
      console.log('   ❌ La table ExpenseCategory n\'existe pas !');
      console.log('   📝 Solution: Exécutez "npx prisma db push"\n');
      console.log('   Erreur:', error.message, '\n');
    }

    // Test 3: Vérifier si la table Expense existe
    console.log('3️⃣  Vérification de la table Expense...');
    try {
      const expenseCount = await prisma.expense.count();
      console.log(`   ✅ Table Expense existe (${expenseCount} dépenses)\n`);
    } catch (error) {
      console.log('   ❌ La table Expense n\'existe pas !');
      console.log('   📝 Solution: Exécutez "npx prisma db push"\n');
      console.log('   Erreur:', error.message, '\n');
    }

    // Test 4: Vérifier si la relation Store -> Expense existe
    console.log('4️⃣  Vérification de la relation Store -> Expense...');
    try {
      const stores = await prisma.store.findMany({
        select: {
          id: true,
          name: true,
        },
      });

      if (stores.length === 0) {
        console.log('   ⚠️  Aucun magasin trouvé !');
        console.log('   📝 Créez un magasin d\'abord\n');
      } else {
        console.log(`   ✅ ${stores.length} magasin(s) trouvé(s):`);
        stores.forEach(store => {
          console.log(`      - ${store.name} (${store.id})`);
        });
        console.log('');
      }
    } catch (error) {
      console.log('   ❌ Erreur lors de la vérification des magasins');
      console.log('   Erreur:', error.message, '\n');
    }

    // Test 5: Tester les routes API
    console.log('5️⃣  Recommandations pour les routes API:');
    console.log('   📝 Démarrez le serveur: npm run dev');
    console.log('   📝 Testez: http://localhost:3000/api/expense-categories');
    console.log('   📝 Testez: http://localhost:3000/api/expenses\n');

    // Résumé
    console.log('═'.repeat(50));
    console.log('📊 RÉSUMÉ\n');

    const categoryCount = await prisma.expenseCategory.count().catch(() => 0);
    const expenseCount = await prisma.expense.count().catch(() => 0);
    const storeCount = await prisma.store.count().catch(() => 0);

    if (categoryCount === 0) {
      console.log('❌ PROBLÈME: Aucune catégorie de dépense');
      console.log('   Solution: node prisma/seed-expense-categories.js\n');
    }

    if (storeCount === 0) {
      console.log('❌ PROBLÈME: Aucun magasin');
      console.log('   Solution: Créez un magasin via l\'interface ou Prisma Studio\n');
    }

    if (categoryCount > 0 && storeCount > 0) {
      console.log('✅ La base de données est correctement configurée !');
      console.log('   Vous pouvez maintenant utiliser le module de comptabilité.\n');
    }

    console.log('═'.repeat(50) + '\n');

  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    console.error('\nStack trace:', error.stack);

    console.log('\n📝 SOLUTIONS POSSIBLES:');
    console.log('1. Vérifiez votre fichier .env (DATABASE_URL)');
    console.log('2. Exécutez: npx prisma generate');
    console.log('3. Exécutez: npx prisma db push');
    console.log('4. Exécutez: node prisma/seed-expense-categories.js\n');
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le diagnostic
diagnoseDatabase()
  .catch((error) => {
    console.error('Erreur:', error);
    process.exit(1);
  });
