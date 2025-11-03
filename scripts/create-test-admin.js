/**
 * Script pour créer un utilisateur admin de test
 * Usage: node scripts/create-test-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestAdmin() {
  console.log('🔧 Création d\'un utilisateur admin de test...\n');

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (existingUser) {
      console.log('⚠️  Un utilisateur "admin" existe déjà.');
      console.log('Détails:');
      console.log(`  - Email: ${existingUser.email}`);
      console.log(`  - Nom: ${existingUser.fullName}`);
      console.log(`  - Rôle: ${existingUser.role}`);
      console.log(`  - Actif: ${existingUser.isActive}`);
      console.log('\nVous pouvez utiliser cet utilisateur pour vous connecter.');
      return;
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Créer l'utilisateur
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@test.com',
        password: hashedPassword,
        fullName: 'Administrateur Test',
        role: 'admin',
        isActive: true,
      },
    });

    console.log('✅ Utilisateur admin créé avec succès!\n');
    console.log('Informations de connexion:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Nom d'utilisateur: admin`);
    console.log(`  Mot de passe:      admin123`);
    console.log(`  Email:             admin@test.com`);
    console.log(`  Rôle:              Administrateur`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🌐 Vous pouvez maintenant vous connecter sur http://localhost:3000/login\n');
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestAdmin()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
