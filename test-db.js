const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Test de connexion à la base de données...\n');
  
  try {
    // 1. Récupérer tous les magasins
    console.log('📍 Récupération des magasins...');
    const stores = await prisma.store.findMany();
    console.log(`✅ ${stores.length} magasin(s) trouvé(s):`);
    stores.forEach(store => {
      console.log(`   - ${store.name} (${store.code})`);
    });
    
    // 2. Récupérer tous les produits
    console.log('\n📦 Récupération des produits...');
    const products = await prisma.product.findMany();
    console.log(`✅ ${products.length} produit(s) trouvé(s):`);
    products.forEach(product => {
      console.log(`   - ${product.name}: ${product.sellingPrice} ${product.stock} en stock`);
    });
    
    // 3. Créer une vente test
    console.log('\n💰 Création d\'une vente test...');
    const sale = await prisma.sale.create({
      data: {
        storeId: stores[0].id,
        receiptNumber: `TEST-${Date.now()}`,
        total: 1500,
        paymentMethod: 'CASH'
      }
    });
    console.log(`✅ Vente créée: ${sale.receiptNumber}`);
    
    // 4. Compter les ventes
    const salesCount = await prisma.sale.count();
    console.log(`📊 Total des ventes: ${salesCount}`);
    
    console.log('\n🎉 Tous les tests sont passés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
