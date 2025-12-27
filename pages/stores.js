import ProtectedRoute from "../components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useApp } from "../src/contexts/AppContext";
import {
  Store,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Phone,
  DollarSign,
} from "lucide-react";
import Toast from "../components/Toast";

function StoresPage() {
  // 1️⃣ TOUS LES HOOKS D'ABORD
  const {
    stores,
    currentStore,
    changeStore,
    loading,
    reloadData,
    updateStoreOptimistic, // ✨ NOUVEAU
    addStoreOptimistic, // ✨ NOUVEAU
    deleteStoreOptimistic, // ✨ NOUVEAU
  } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✨ NOUVEAU pour loader
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    address: "",
    phone: "",
    currency: "FCFA",
    taxRate: 18,
  });

  // 2️⃣ PUIS LE useEffect
  useEffect(() => {
    if (editingStore) {
      setFormData({
        code: editingStore.code,
        name: editingStore.name,
        address: editingStore.address || "",
        phone: editingStore.phone || "",
        currency: editingStore.currency || "FCFA",
        taxRate: editingStore.taxRate || 18,
      });
    } else if (!showAddModal) {
      setFormData({
        code: "",
        name: "",
        address: "",
        phone: "",
        currency: "FCFA",
        taxRate: 18,
      });
    }
  }, [editingStore, showAddModal]);

  // 3️⃣ ENSUITE LES FONCTIONS
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // ✨ Afficher le loader

    const storeData = {
      code: formData.code,
      name: formData.name,
      address: formData.address || null,
      phone: formData.phone || null,
      currency: formData.currency || "FCFA",
      taxRate: formData.taxRate !== "" ? parseFloat(formData.taxRate) : 18, // ✅ BON
    };

    console.log("📤 Données envoyées:", storeData);

    try {
      const url = editingStore
        ? `/api/stores/${editingStore.id}`
        : "/api/stores";
      const method = editingStore ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeData),
      });

      const responseData = await res.json();
      console.log("📥 Réponse API:", responseData);

      if (res.ok) {
        // ✨ MISE À JOUR OPTIMISTE - Instantanée !
        if (editingStore) {
          updateStoreOptimistic(editingStore.id, responseData);
        } else {
          addStoreOptimistic(responseData);
        }

        setShowAddModal(false);
        setEditingStore(null);
        showToast(
          editingStore ? "Magasin modifié ✓" : "Magasin créé ✓",
          "success"
        );
      } else {
        showToast("Erreur lors de l'opération", "error");
      }
    } catch (error) {
      console.error("Erreur:", error);
      showToast("Erreur lors de l'opération", "error");
    } finally {
      setIsSubmitting(false); // ✨ Cacher le loader
    }
  };

  const handleDelete = async (storeId, storeName) => {
    if (
      !confirm(
        `Supprimer le magasin "${storeName}" ?\n\nATTENTION : Toutes les données liées seront supprimées.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // ✨ MISE À JOUR OPTIMISTE
        deleteStoreOptimistic(storeId);
        showToast("Magasin supprimé", "success");
      } else {
        showToast("Erreur lors de la suppression", "error");
      }
    } catch (error) {
      console.error("Erreur:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  // 4️⃣ GESTION DU LOADING
  if (loading) {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

  // 5️⃣ LE RETURN AVEC LE JSX
  return (
    <div style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* En-tête */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Store size={32} />
          Gestion des Magasins
        </h1>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "12px 24px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Plus size={20} />
          Nouveau magasin
        </button>
      </div>

      {/* Statistiques */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Total magasins
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {stores.length}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Magasin actif
          </div>
          <div style={{ fontSize: "20px", fontWeight: "bold" }}>
            {currentStore?.name || "Aucun"}
          </div>
        </div>
      </div>

      {/* Liste des magasins */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {stores.map((store) => (
          <div
            key={store.id}
            style={{
              background: "var(--color-surface)",
              border:
                currentStore?.id === store.id
                  ? "3px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "20px",
              position: "relative",
              transition: "all 0.2s",
              boxShadow:
                currentStore?.id === store.id
                  ? "0 4px 12px rgba(59, 130, 246, 0.2)"
                  : "none",
            }}
          >
            {currentStore?.id === store.id && (
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "var(--color-primary)",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                ✓ ACTIF
              </div>
            )}

            <h3
              style={{
                margin: "0 0 15px 0",
                fontSize: "20px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Store size={24} color="var(--color-primary)" />
              {store.name}
            </h3>

            <div
              style={{
                marginBottom: "10px",
                padding: "8px 12px",
                background: "var(--color-bg)",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--color-primary)",
              }}
            >
              Code: {store.code}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "15px",
              }}
            >
              {store.address && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    fontSize: "14px",
                  }}
                >
                  <MapPin
                    size={16}
                    style={{
                      marginTop: "2px",
                      color: "var(--color-text-secondary)",
                    }}
                  />
                  <span>{store.address}</span>
                </div>
              )}

              {store.phone && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                  }}
                >
                  <Phone
                    size={16}
                    style={{ color: "var(--color-text-secondary)" }}
                  />
                  <span>{store.phone}</span>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                }}
              >
                <DollarSign
                  size={16}
                  style={{ color: "var(--color-text-secondary)" }}
                />
                <span>
                  {store.currency} • TVA: {store.taxRate}%
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              {currentStore?.id !== store.id && (
                <button
                  onClick={() => changeStore(store)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "var(--color-primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  Activer
                </button>
              )}

              <button
                onClick={() => {
                  setEditingStore(store);
                  setShowAddModal(true);
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "var(--color-surface-hover)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <Edit size={16} />
                Modifier
              </button>

              <button
                onClick={() => handleDelete(store.id, store.name)}
                disabled={stores.length === 1}
                style={{
                  padding: "10px 12px",
                  background:
                    stores.length === 1 ? "var(--color-border)" : "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: stores.length === 1 ? "not-allowed" : "pointer",
                  opacity: stores.length === 1 ? 0.5 : 1,
                }}
                title={
                  stores.length === 1
                    ? "Impossible de supprimer le dernier magasin"
                    : "Supprimer"
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div
          onClick={() => {
            setShowAddModal(false);
            setEditingStore(null);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-surface)",
              padding: "30px",
              borderRadius: "12px",
              width: "500px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {editingStore ? "Modifier le magasin" : "Nouveau magasin"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Code *
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="MAG001"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Nom du magasin *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Superette Centre"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Adresse
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="123 Rue de la Paix"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+226 XX XX XX XX"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "500",
                    }}
                  >
                    Devise
                  </label>
                  <input
                    type="text"
                    name="currency"
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      background: "var(--color-surface)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "500",
                    }}
                  >
                    Taux TVA (%)
                  </label>
                  <input
                    type="number"
                    name="taxRate"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.taxRate}
                    onChange={(e) =>
                      setFormData({ ...formData, taxRate: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      background: "var(--color-surface)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStore(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "var(--color-border)",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: isSubmitting ? "#9ca3af" : "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid white",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 0.6s linear infinite",
                        }}
                      />
                      Enregistrement...
                    </>
                  ) : editingStore ? (
                    "Modifier"
                  ) : (
                    "Créer"
                  )}
                </button>

                <style jsx>{`
                  @keyframes spin {
                    to {
                      transform: rotate(360deg);
                    }
                  }
                `}</style>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
function StoresPageProtected() {
  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <StoresPage />
    </ProtectedRoute>
  );
}

export default StoresPageProtected;
