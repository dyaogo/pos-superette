import ProtectedRoute from "../components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useApp } from "../src/contexts/AppContext";
import {
  ArrowRightLeft,
  Plus,
  Check,
  X,
  Package,
  Store,
  Clock,
} from "lucide-react";
import Toast from "../components/Toast";

function TransfersPage() {
  const { stores, currentStore, loading } = useApp();
  const [transfers, setTransfers] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Tous les produits de tous les magasins
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fromStoreId: currentStore?.id || "",
    toStoreId: "",
    productId: "",
    quantity: 1,
    notes: "",
  });

  useEffect(() => {
    if (currentStore && !formData.fromStoreId) {
      setFormData((prev) => ({ ...prev, fromStoreId: currentStore.id }));
    }
  }, [currentStore]);

  useEffect(() => {
    loadTransfers();
    loadAllProducts();
  }, []);

  const loadAllProducts = async () => {
    try {
      const res = await fetch("/api/products?all=true");
      const data = await res.json();
      setAllProducts(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur chargement produits:", error);
    }
  };

  const loadTransfers = async () => {
    try {
      const res = await fetch("/api/transfers");
      const data = await res.json();
      setTransfers(data);
    } catch (error) {
      console.error("Erreur chargement transferts:", error);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const product = allProducts.find((p) => p.id === formData.productId);

      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          productName: product?.name || "Produit",
          quantity: parseInt(formData.quantity),
        }),
      });

      if (res.ok) {
        await loadTransfers();
        setShowAddModal(false);
        setFormData({
          fromStoreId: currentStore?.id || "",
          toStoreId: "",
          productId: "",
          quantity: 1,
          notes: "",
        });
        showToast("Transfert créé avec succès", "success");
      } else {
        const error = await res.json();
        showToast(error.error || "Erreur lors du transfert", "error");
      }
    } catch (error) {
      console.error("Erreur:", error);
      showToast("Erreur lors du transfert", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (transferId) => {
    if (!confirm("Valider ce transfert ?")) return;

    try {
      const res = await fetch(`/api/transfers/${transferId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedBy: "Admin" }),
      });

      if (res.ok) {
        await loadTransfers();
        showToast("Transfert complété", "success");
      } else {
        const error = await res.json();
        showToast(error.error || "Erreur", "error");
      }
    } catch (error) {
      console.error("Erreur:", error);
      showToast("Erreur lors de la validation", "error");
    }
  };

  const handleCancel = async (transferId) => {
    if (!confirm("Annuler ce transfert ?")) return;

    try {
      const res = await fetch(`/api/transfers/${transferId}/cancel`, {
        method: "POST",
      });

      if (res.ok) {
        await loadTransfers();
        showToast("Transfert annulé", "success");
      } else {
        showToast("Erreur lors de l'annulation", "error");
      }
    } catch (error) {
      console.error("Erreur:", error);
      showToast("Erreur lors de l'annulation", "error");
    }
  };

  // Produits disponibles dans le magasin source sélectionné
  const sourceProducts = allProducts.filter(
    (p) => p.storeId === formData.fromStoreId && p.stock > 0
  );

  if (loading) {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

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
          <ArrowRightLeft size={32} />
          Transferts de Stock
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
          Nouveau transfert
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
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            En attente
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {transfers.filter((t) => t.status === "pending").length}
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
            Complétés
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {transfers.filter((t) => t.status === "completed").length}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Annulés
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {transfers.filter((t) => t.status === "cancelled").length}
          </div>
        </div>
      </div>

      {/* Liste des transferts */}
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: "var(--color-bg)",
                borderBottom: "2px solid var(--color-border)",
              }}
            >
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                Date
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                Produit
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                De → Vers
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Quantité
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Statut
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {transfers.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Aucun transfert pour le moment
                </td>
              </tr>
            ) : (
              transfers.map((transfer) => {
                const fromStore = stores.find(
                  (s) => s.id === transfer.fromStoreId
                );
                const toStore = stores.find((s) => s.id === transfer.toStoreId);

                return (
                  <tr
                    key={transfer.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td style={{ padding: "15px" }}>
                      {new Date(transfer.createdAt).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </td>
                    <td style={{ padding: "15px", fontWeight: "500" }}>
                      {transfer.productName}
                    </td>
                    <td style={{ padding: "15px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span>{fromStore?.name || "Inconnu"}</span>
                        <ArrowRightLeft size={16} color="#6b7280" />
                        <span>{toStore?.name || "Inconnu"}</span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "15px",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "var(--color-primary)",
                      }}
                    >
                      {transfer.quantity}
                    </td>
                    <td style={{ padding: "15px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background:
                            transfer.status === "completed"
                              ? "#d1fae5"
                              : transfer.status === "pending"
                              ? "#fef3c7"
                              : "#fee2e2",
                          color:
                            transfer.status === "completed"
                              ? "#065f46"
                              : transfer.status === "pending"
                              ? "#92400e"
                              : "#991b1b",
                        }}
                      >
                        {transfer.status === "completed"
                          ? "Complété"
                          : transfer.status === "pending"
                          ? "En attente"
                          : "Annulé"}
                      </span>
                    </td>
                    <td style={{ padding: "15px", textAlign: "center" }}>
                      {transfer.status === "pending" && (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            onClick={() => handleComplete(transfer.id)}
                            style={{
                              padding: "6px 12px",
                              background: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "14px",
                            }}
                            title="Valider le transfert"
                          >
                            <Check size={16} />
                            Valider
                          </button>
                          <button
                            onClick={() => handleCancel(transfer.id)}
                            style={{
                              padding: "6px 12px",
                              background: "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "14px",
                            }}
                            title="Annuler le transfert"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nouveau transfert */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
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
            <h2 style={{ marginTop: 0 }}>Nouveau transfert de stock</h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Magasin source *
                </label>
                <select
                  value={formData.fromStoreId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fromStoreId: e.target.value,
                      productId: "",
                    })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <option value="">Choisir un magasin</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Magasin destination *
                </label>
                <select
                  value={formData.toStoreId}
                  onChange={(e) =>
                    setFormData({ ...formData, toStoreId: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <option value="">Choisir un magasin</option>
                  {stores
                    .filter((s) => s.id !== formData.fromStoreId)
                    .map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Produit *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) =>
                    setFormData({ ...formData, productId: e.target.value })
                  }
                  required
                  disabled={!formData.fromStoreId}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                    cursor: !formData.fromStoreId ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">Choisir un produit</option>
                  {sourceProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Stock: {product.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Quantité *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  required
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

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  {isSubmitting ? "Création..." : "Créer le transfert"}
                </button>
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
function TransfersPageProtected() {
  return (
    <ProtectedRoute requiredRoles={["admin", "manager"]}>
      <TransfersPage />
    </ProtectedRoute>
  );
}

export default TransfersPageProtected;
