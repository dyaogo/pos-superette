import Dexie from "dexie";

// Création de la base de données IndexedDB
const db = new Dexie("POSSuperetteDB");

// ✅ Définition corrigée des tables et indexes
// ✅ NOUVEAU - Version 2
db.version(1).stores({
  products: "id, barcode, storeId",
  customers: "id",
  credits: "id, customerId, status",
  pendingSales: "++id, synced",
  syncQueue: "++id, priority",
});

// ✨ Migration vers version 2 - Correction du schéma
db.version(2).stores({
  products: "id, barcode, storeId",
  customers: "id",
  credits: "id, customerId, status",
  pendingSales: "++id", // Suppression de l'index synced
  syncQueue: "++id, priority",
});

// Fonctions utilitaires
export const offlineDB = {
  // ===== PRODUITS =====
  async saveProducts(products) {
    try {
      await db.products.clear();
      // Filtrer pour ne garder que des données valides
      const validProducts = products.filter((p) => p && p.id);
      await db.products.bulkAdd(validProducts);
      console.log(`✅ ${validProducts.length} produits sauvegardés localement`);
      return validProducts.length;
    } catch (error) {
      console.error("Erreur saveProducts:", error);
      return 0;
    }
  },

  async getProducts() {
    try {
      return await db.products.toArray();
    } catch (error) {
      console.error("Erreur getProducts:", error);
      return [];
    }
  },

  async getProductById(id) {
    try {
      return await db.products.get(id);
    } catch (error) {
      console.error("Erreur getProductById:", error);
      return null;
    }
  },

  async updateProductStock(productId, newStock) {
    try {
      await db.products.update(productId, { stock: newStock });
      return true;
    } catch (error) {
      console.error("Erreur updateProductStock:", error);
      return false;
    }
  },

  // ===== CLIENTS =====
  async saveCustomers(customers) {
    try {
      await db.customers.clear();
      const validCustomers = customers.filter((c) => c && c.id);
      await db.customers.bulkAdd(validCustomers);
      console.log(`✅ ${validCustomers.length} clients sauvegardés localement`);
      return validCustomers.length;
    } catch (error) {
      console.error("Erreur saveCustomers:", error);
      return 0;
    }
  },

  async getCustomers() {
    try {
      return await db.customers.toArray();
    } catch (error) {
      console.error("Erreur getCustomers:", error);
      return [];
    }
  },

  // ===== CRÉDITS =====
  async saveCredits(credits) {
    try {
      await db.credits.clear();
      const validCredits = credits.filter((c) => c && c.id);
      await db.credits.bulkAdd(validCredits);
      console.log(`✅ ${validCredits.length} crédits sauvegardés localement`);
      return validCredits.length;
    } catch (error) {
      console.error("Erreur saveCredits:", error);
      return 0;
    }
  },

  async getCredits() {
    try {
      return await db.credits.toArray();
    } catch (error) {
      console.error("Erreur getCredits:", error);
      return [];
    }
  },

  // ===== VENTES HORS LIGNE =====
  async addPendingSale(sale) {
    try {
      const id = await db.pendingSales.add({
        ...sale,
        createdAt: new Date().toISOString(),
        synced: false,
      });
      console.log(`💾 Vente enregistrée hors ligne (ID: ${id})`);
      return id;
    } catch (error) {
      console.error("Erreur addPendingSale:", error);
      return null;
    }
  },

  async getPendingSales() {
    try {
      // ✅ Récupérer toutes les ventes et filtrer en JS
      const allSales = await db.pendingSales.toArray();
      return allSales.filter((sale) => sale.synced === false);
    } catch (error) {
      console.error("Erreur getPendingSales:", error);
      return [];
    }
  },

  async markSaleAsSynced(id) {
    try {
      await db.pendingSales.update(id, { synced: true });
      return true;
    } catch (error) {
      console.error("Erreur markSaleAsSynced:", error);
      return false;
    }
  },

  async deletePendingSale(id) {
    try {
      await db.pendingSales.delete(id);
      return true;
    } catch (error) {
      console.error("Erreur deletePendingSale:", error);
      return false;
    }
  },

  // ===== QUEUE DE SYNCHRONISATION =====
  async addToSyncQueue(action) {
    try {
      const id = await db.syncQueue.add({
        action: action.action,
        endpoint: action.endpoint,
        method: action.method,
        data: JSON.stringify(action.data), // Sérialiser les données complexes
        createdAt: new Date().toISOString(),
        priority: action.priority || 5,
        retries: 0,
      });
      console.log(`📤 Action ajoutée à la queue de sync: ${action.action}`);
      return id;
    } catch (error) {
      console.error("Erreur addToSyncQueue:", error);
      return null;
    }
  },

  async getSyncQueue() {
    try {
      const items = await db.syncQueue.orderBy("priority").reverse().toArray();
      // Désérialiser les données
      return items.map((item) => ({
        ...item,
        data: JSON.parse(item.data),
      }));
    } catch (error) {
      console.error("Erreur getSyncQueue:", error);
      return [];
    }
  },

  async removeSyncItem(id) {
    try {
      await db.syncQueue.delete(id);
      return true;
    } catch (error) {
      console.error("Erreur removeSyncItem:", error);
      return false;
    }
  },

  async incrementRetries(id) {
    try {
      const item = await db.syncQueue.get(id);
      if (item) {
        await db.syncQueue.update(id, { retries: (item.retries || 0) + 1 });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erreur incrementRetries:", error);
      return false;
    }
  },

  // ===== UTILITAIRES =====
  async clearAll() {
    try {
      await db.products.clear();
      await db.customers.clear();
      await db.credits.clear();
      await db.pendingSales.clear();
      await db.syncQueue.clear();
      console.log("🗑️ Cache local vidé");
      return true;
    } catch (error) {
      console.error("Erreur clearAll:", error);
      return false;
    }
  },

  async getStats() {
    try {
      return {
        products: await db.products.count(),
        customers: await db.customers.count(),
        credits: await db.credits.count(),
        pendingSales: await db.pendingSales.count(),
        syncQueue: await db.syncQueue.count(),
      };
    } catch (error) {
      console.error("Erreur getStats:", error);
      return {
        products: 0,
        customers: 0,
        credits: 0,
        pendingSales: 0,
        syncQueue: 0,
      };
    }
  },

  // Méthode pour vérifier si la DB est prête
  async isReady() {
    try {
      await db.open();
      return true;
    } catch (error) {
      console.error("Erreur DB initialization:", error);
      return false;
    }
  },

  // ✨ AJOUTER À LA FIN DE L'OBJET offlineDB
  async resetDatabase() {
    try {
      await db.delete();
      console.log("🗑️ Base de données supprimée");
      // Recréer en rechargeant
      window.location.reload();
    } catch (error) {
      console.error("Erreur reset DB:", error);
    }
  },
};

export default db;
