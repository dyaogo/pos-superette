import { createContext, useContext, useState, useEffect } from "react";
import { offlineDB } from "../utils/offlineDB";

const OnlineContext = createContext();

export function OnlineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Détecter les changements de connexion
  useEffect(() => {
    const handleOnline = () => {
      console.log("✅ Connexion rétablie");
      setIsOnline(true);
      // Démarrer la synchronisation automatique
      setTimeout(() => syncPendingData(), 1000);
    };

    const handleOffline = () => {
      console.log("❌ Connexion perdue");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Vérifier le nombre d'éléments en attente
    updatePendingCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Mettre à jour le compteur d'éléments en attente
  const updatePendingCount = async () => {
    const sales = await offlineDB.getPendingSales();
    const queue = await offlineDB.getSyncQueue();
    setPendingCount(sales.length + queue.length);
  };

  // Synchroniser les données en attente
  const syncPendingData = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    console.log("🔄 Début de la synchronisation...");

    try {
      // 1. Synchroniser les ventes en attente
      const pendingSales = await offlineDB.getPendingSales();
      console.log(`📊 ${pendingSales.length} vente(s) à synchroniser`);

      for (const sale of pendingSales) {
        try {
          // Nettoyer les données avant envoi (retirer les champs IndexedDB)
          const {
            id: dbId,  // Retirer l'ID d'IndexedDB
            synced,    // Retirer le flag synced
            ...saleData
          } = sale;

          console.log("📤 Envoi vente:", sale.receiptNumber, saleData);

          const response = await fetch("/api/sales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(saleData),
          });

          if (response.ok) {
            const result = await response.json();
            await offlineDB.markSaleAsSynced(dbId);
            console.log(`✅ Vente ${sale.receiptNumber} synchronisée`);
          } else {
            const errorText = await response.text();
            console.error(`❌ Erreur sync vente ${sale.receiptNumber}:`, response.status, errorText);
          }
        } catch (error) {
          console.error("Erreur lors de la sync:", error);
        }
      }

      // 2. Synchroniser la queue générale
      const syncQueue = await offlineDB.getSyncQueue();
      console.log(`📤 ${syncQueue.length} action(s) à synchroniser`);

      for (const item of syncQueue) {
        try {
          const response = await fetch(item.endpoint, {
            method: item.method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.data),
          });

          if (response.ok) {
            await offlineDB.removeSyncItem(item.id);
            console.log(`✅ Action ${item.action} synchronisée`);
          } else if (item.retries < 3) {
            await offlineDB.incrementRetries(item.id);
            console.log(`⚠️ Retry ${item.retries + 1}/3 pour ${item.action}`);
          } else {
            console.error(`❌ Échec après 3 tentatives: ${item.action}`);
            await offlineDB.removeSyncItem(item.id);
          }
        } catch (error) {
          console.error("Erreur lors de la sync:", error);
        }
      }

      await updatePendingCount();
      console.log("✅ Synchronisation terminée");

      // ✨ Recharger la page après 1 seconde
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }, 1000);

      // ✨ AJOUTER - Déclencher un événement pour recharger les données
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("syncCompleted", {
            detail: {
              salesSynced: pendingSales.length,
              actionsSynced: syncQueue.length,
            },
          })
        );
      }

      // ✨ AJOUTER - Notification de succès
      const totalSynced = pendingSales.length + syncQueue.length;
      if (
        totalSynced > 0 &&
        typeof window !== "undefined" &&
        window.showToast
      ) {
        window.showToast(
          `✅ ${totalSynced} élément(s) synchronisé(s)`,
          "success"
        );
      }
    } catch (error) {
      console.error("Erreur globale de synchronisation:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sauvegarder les données pour utilisation hors ligne
  const cacheData = async (data) => {
    try {
      if (data.products) {
        await offlineDB.saveProducts(data.products);
      }
      if (data.customers) {
        await offlineDB.saveCustomers(data.customers);
      }
      if (data.credits) {
        await offlineDB.saveCredits(data.credits);
      }
      console.log("💾 Données mises en cache");
    } catch (error) {
      console.error("Erreur lors de la mise en cache:", error);
    }
  };

  // Enregistrer une vente hors ligne
  const saveSaleOffline = async (sale) => {
    const id = await offlineDB.addPendingSale(sale);
    await updatePendingCount();
    return id;
  };

  // Ajouter une action à la queue de sync
  const queueAction = async (action, endpoint, method, data, priority = 5) => {
    await offlineDB.addToSyncQueue({
      action,
      endpoint,
      method,
      data,
      priority,
    });
    await updatePendingCount();
  };

  const value = {
    isOnline,
    isSyncing,
    pendingCount,
    syncPendingData,
    cacheData,
    saveSaleOffline,
    queueAction,
    updatePendingCount,
  };

  return (
    <OnlineContext.Provider value={value}>{children}</OnlineContext.Provider>
  );
}

export function useOnline() {
  const context = useContext(OnlineContext);
  if (!context) {
    throw new Error("useOnline must be used within OnlineProvider");
  }
  return context;
}
