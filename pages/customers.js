import ProtectedRoute from "../components/ProtectedRoute";
import PermissionGate from "../components/PermissionGate"; // ✨ AJOUTÉ
import { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useApp } from "../src/contexts/AppContext";
import { useAuth } from "../src/contexts/AuthContext"; // ✨ AJOUTÉ
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Phone,
  Mail,
} from "lucide-react";

function CustomersPage() {
  const { customers, addCustomer, updateCustomer, loading } = useApp();
  const { currentUser, hasRole } = useAuth(); // ✨ AJOUTÉ
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Filtrer les clients
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.email &&
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const customerData = {
      name: formData.get("name"),
      phone: formData.get("phone") || null,
      email: formData.get("email") || null,
    };

    if (editingCustomer) {
      // Modification
      const result = await updateCustomer(editingCustomer.id, customerData);
      if (result.success) {
        alert("Client modifié avec succès");
        setEditingCustomer(null);
      } else {
        alert("Erreur lors de la modification");
      }
    } else {
      // Ajout
      const result = await addCustomer(customerData);
      if (result.success) {
        alert("Client ajouté avec succès");
        setShowAddModal(false);
        e.target.reset();
      } else {
        alert("Erreur lors de l'ajout");
      }
    }
  };

  const handleDelete = async (customerId, customerName) => {
    if (!confirm(`Supprimer le client "${customerName}" ?`)) return;

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Client supprimé");
        window.location.reload();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      alert("Erreur: " + error.message);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* En-tête */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h1
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Users size={32} />
          Gestion des Clients
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "12px 24px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
          }}
        >
          <Plus size={20} />
          Ajouter un client
        </button>
      </div>

      {/* Barre de recherche */}
      <div style={{ position: "relative", marginBottom: "20px" }}>
        <Search
          size={20}
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-text-muted)",
          }}
        />
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 12px 12px 45px",
            border: "2px solid var(--color-border)",
            borderRadius: "8px",
            background: "var(--color-surface)",
            color: "var(--color-text-primary)",
          }}
        />
      </div>

      {/* Liste des clients */}
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
        }}
      >
        {filteredCustomers.length === 0 ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            {searchTerm ? "Aucun client trouvé" : "Aucun client enregistré"}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <th style={{ padding: "15px", textAlign: "left" }}>Nom</th>
                <th style={{ padding: "15px", textAlign: "left" }}>
                  Téléphone
                </th>
                <th style={{ padding: "15px", textAlign: "left" }}>Email</th>
                <th style={{ padding: "15px", textAlign: "center" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <td style={{ padding: "15px" }}>
                    <div style={{ fontWeight: "600" }}>{customer.name}</div>
                  </td>
                  <td style={{ padding: "15px" }}>
                    {customer.phone ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        <Phone size={16} />
                        {customer.phone}
                      </div>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)" }}>
                        -
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "15px" }}>
                    {customer.email ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        <Mail size={16} />
                        {customer.email}
                      </div>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)" }}>
                        -
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={() => setEditingCustomer(customer)}
                        style={{
                          padding: "8px 12px",
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        <Edit size={16} />
                        Modifier
                      </button>

                      {/* ✨ MODIFIÉ - Bouton Supprimer visible seulement pour Admin */}
                      <PermissionGate roles={["admin"]}>
                        <button
                          onClick={() =>
                            handleDelete(customer.id, customer.name)
                          }
                          style={{
                            padding: "8px 12px",
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                          title="Supprimer (Admin uniquement)"
                        >
                          <Trash2 size={16} />
                          Supprimer
                        </button>
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Ajouter/Modifier */}
      {(showAddModal || editingCustomer) && (
        <div
          onClick={() => {
            setShowAddModal(false);
            setEditingCustomer(null);
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
              borderRadius: "12px",
              padding: "30px",
              width: "500px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Users size={24} />
                {editingCustomer ? "Modifier le client" : "Ajouter un client"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCustomer(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  Nom <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCustomer?.name || ""}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid var(--color-border)",
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
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={editingCustomer?.phone || ""}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid var(--color-border)",
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
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingCustomer?.email || ""}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid var(--color-border)",
                    borderRadius: "8px",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCustomer(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "var(--color-border)",
                    color: "var(--color-text-primary)",
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
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Save size={20} />
                  {editingCustomer ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersPageProtected() {
  return (
    <ProtectedRoute>
      <CustomersPage />
    </ProtectedRoute>
  );
}

export default CustomersPageProtected;
