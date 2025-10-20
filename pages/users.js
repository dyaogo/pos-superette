import { useState, useEffect } from "react";
import { useApp } from "../src/contexts/AppContext";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Search,
  UserCog,
  Activity,
} from "lucide-react";
import Toast from "../components/Toast";

export default function UsersPage() {
  const { stores } = useApp();
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    fullName: "",
    role: "cashier",
    storeId: "",
    isActive: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      // Vérifier que c'est bien un tableau
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error("Format de données incorrect:", data);
        setUsers([]);
        showToast("Erreur de format des données", "error");
      }
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
      setUsers([]);
      showToast("Erreur lors du chargement des utilisateurs", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLogs = async (userId) => {
    try {
      const res = await fetch(`/api/activity-logs?userId=${userId}&limit=20`);
      const data = await res.json();
      setActivityLogs(data);
    } catch (error) {
      console.error("Erreur chargement logs:", error);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await loadUsers();
        setShowAddModal(false);
        resetForm();
        showToast("Utilisateur créé avec succès", "success");
      } else {
        const error = await res.json();
        showToast(error.error || "Erreur lors de la création", "error");
      }
    } catch (error) {
      showToast("Erreur lors de la création", "error");
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await loadUsers();
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
        showToast("Utilisateur modifié avec succès", "success");
      } else {
        showToast("Erreur lors de la modification", "error");
      }
    } catch (error) {
      showToast("Erreur lors de la modification", "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Désactiver cet utilisateur ?")) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadUsers();
        showToast("Utilisateur désactivé", "success");
      } else {
        showToast("Erreur lors de la désactivation", "error");
      }
    } catch (error) {
      showToast("Erreur lors de la désactivation", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      username: "",
      password: "",
      fullName: "",
      role: "cashier",
      storeId: "",
      isActive: true,
    });
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      password: "",
      fullName: user.fullName,
      role: user.role,
      storeId: user.storeId || "",
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  const openLogsModal = async (user) => {
    setSelectedUser(user);
    await loadActivityLogs(user.id);
    setShowLogsModal(true);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <ShieldCheck size={20} color="#10b981" />;
      case "manager":
        return <Shield size={20} color="#3b82f6" />;
      case "cashier":
        return <ShieldAlert size={20} color="#f59e0b" />;
      default:
        return <Shield size={20} />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "manager":
        return "Gérant";
      case "cashier":
        return "Caissier";
      default:
        return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "#10b981";
      case "manager":
        return "#3b82f6";
      case "cashier":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div>
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
            <Users size={32} />
            Gestion des Utilisateurs
          </h1>
          <p
            style={{
              margin: "8px 0 0 0",
              color: "var(--color-text-secondary)",
            }}
          >
            {users.length} utilisateur{users.length > 1 ? "s" : ""} •{" "}
            {users.filter((u) => u.isActive).length} actif
            {users.filter((u) => u.isActive).length > 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
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
          Nouvel utilisateur
        </button>
      </div>

      {/* Barre de recherche */}
      <div
        style={{
          marginBottom: "20px",
          position: "relative",
          maxWidth: "400px",
        }}
      >
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
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          style={{
            width: "100%",
            padding: "12px 12px 12px 45px",
            border: "2px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "16px",
            background: "var(--color-surface)",
            color: "var(--color-text-primary)",
          }}
        />
      </div>

      {/* Statistiques */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Administrateurs
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {users.filter((u) => u.role === "admin" && u.isActive).length}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Gérants
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {users.filter((u) => u.role === "manager" && u.isActive).length}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Caissiers
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {users.filter((u) => u.role === "cashier" && u.isActive).length}
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
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
                Utilisateur
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                Rôle
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                Magasin
              </th>
              <th
                style={{
                  padding: "15px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Dernière connexion
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
            {filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const store = stores.find((s) => s.id === user.storeId);

                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      opacity: user.isActive ? 1 : 0.5,
                    }}
                  >
                    <td style={{ padding: "15px" }}>
                      <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                        {user.fullName}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        @{user.username} • {user.email}
                      </div>
                    </td>
                    <td style={{ padding: "15px" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          background: `${getRoleColor(user.role)}20`,
                          color: getRoleColor(user.role),
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      >
                        {getRoleIcon(user.role)}
                        {getRoleLabel(user.role)}
                      </div>
                    </td>
                    <td style={{ padding: "15px" }}>
                      {store ? store.name : "Tous les magasins"}
                    </td>
                    <td
                      style={{
                        padding: "15px",
                        textAlign: "center",
                        fontSize: "13px",
                      }}
                    >
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Jamais"}
                    </td>
                    <td style={{ padding: "15px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: user.isActive ? "#d1fae5" : "#fee2e2",
                          color: user.isActive ? "#065f46" : "#991b1b",
                        }}
                      >
                        {user.isActive ? "Actif" : "Inactif"}
                      </span>
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
                          onClick={() => openLogsModal(user)}
                          style={{
                            padding: "8px",
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Voir l'activité"
                        >
                          <Activity size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          style={{
                            padding: "8px",
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          style={{
                            padding: "8px",
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Désactiver"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Ajouter */}
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
            <h2 style={{ marginTop: 0 }}>Nouvel utilisateur</h2>

            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
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

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Nom d'utilisateur *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
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

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
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

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Mot de passe * (min. 6 caractères)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={6}
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
                  Rôle *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
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
                  <option value="cashier">Caissier</option>
                  <option value="manager">Gérant</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Magasin assigné
                </label>
                <select
                  value={formData.storeId}
                  onChange={(e) =>
                    setFormData({ ...formData, storeId: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <option value="">Tous les magasins</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
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
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modifier */}
      {showEditModal && selectedUser && (
        <div
          onClick={() => setShowEditModal(false)}
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
            <h2 style={{ marginTop: 0 }}>Modifier l'utilisateur</h2>

            <form onSubmit={handleEditUser}>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
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

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "500",
                  }}
                >
                  Nouveau mot de passe (laisser vide pour ne pas changer)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  minLength={6}
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
                  Rôle *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
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
                  <option value="cashier">Caissier</option>
                  <option value="manager">Gérant</option>
                  <option value="admin">Administrateur</option>
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
                  Magasin assigné
                </label>
                <select
                  value={formData.storeId}
                  onChange={(e) =>
                    setFormData({ ...formData, storeId: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <option value="">Tous les magasins</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    style={{ width: "18px", height: "18px" }}
                  />
                  <span style={{ fontWeight: "500" }}>Compte actif</span>
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Logs d'activité */}
      {showLogsModal && selectedUser && (
        <div
          onClick={() => setShowLogsModal(false)}
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
              width: "700px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Activity size={24} />
              Activité de {selectedUser.fullName}
            </h2>

            {activityLogs.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--color-text-secondary)",
                  padding: "40px",
                }}
              >
                Aucune activité enregistrée
              </p>
            ) : (
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: "15px",
                      background: "var(--color-bg)",
                      borderRadius: "8px",
                      marginBottom: "10px",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ color: "var(--color-primary)" }}>
                        {log.action}
                      </strong>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {new Date(log.createdAt).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    {log.details && (
                      <div
                        style={{
                          fontSize: "14px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {log.details}
                      </div>
                    )}
                    {log.ipAddress && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-muted)",
                          marginTop: "5px",
                        }}
                      >
                        IP: {log.ipAddress}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowLogsModal(false)}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--color-border)",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                marginTop: "20px",
              }}
            >
              Fermer
            </button>
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
