import { useAuth } from "../src/contexts/AuthContext";
import { User, Shield, Mail, Calendar, Store } from "lucide-react";
import { useApp } from "../src/contexts/AppContext";

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const { stores } = useApp();

  if (!currentUser) {
    return <div>Chargement...</div>;
  }

  const userStore = stores.find((s) => s.id === currentUser.storeId);

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

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          marginBottom: "30px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <User size={32} />
        Mon Profil
      </h1>

      {/* Carte utilisateur */}
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          padding: "30px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${getRoleColor(
                currentUser.role
              )}, ${getRoleColor(currentUser.role)}dd)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "32px",
              fontWeight: "bold",
            }}
          >
            {currentUser.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
              {currentUser.fullName}
            </h2>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "8px",
                padding: "6px 12px",
                borderRadius: "20px",
                background: `${getRoleColor(currentUser.role)}20`,
                color: getRoleColor(currentUser.role),
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              <Shield size={16} />
              {getRoleLabel(currentUser.role)}
            </div>
          </div>
        </div>

        {/* Informations */}
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <User size={20} color="var(--color-text-muted)" />
            <div>
              <div
                style={{ fontSize: "12px", color: "var(--color-text-muted)" }}
              >
                Nom d'utilisateur
              </div>
              <div style={{ fontWeight: "600" }}>@{currentUser.username}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Mail size={20} color="var(--color-text-muted)" />
            <div>
              <div
                style={{ fontSize: "12px", color: "var(--color-text-muted)" }}
              >
                Email
              </div>
              <div style={{ fontWeight: "600" }}>{currentUser.email}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Store size={20} color="var(--color-text-muted)" />
            <div>
              <div
                style={{ fontSize: "12px", color: "var(--color-text-muted)" }}
              >
                Magasin assigné
              </div>
              <div style={{ fontWeight: "600" }}>
                {userStore ? userStore.name : "Tous les magasins"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Calendar size={20} color="var(--color-text-muted)" />
            <div>
              <div
                style={{ fontSize: "12px", color: "var(--color-text-muted)" }}
              >
                Dernière connexion
              </div>
              <div style={{ fontWeight: "600" }}>
                {currentUser.lastLogin
                  ? new Date(currentUser.lastLogin).toLocaleString("fr-FR")
                  : "Jamais"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          padding: "30px",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: "20px",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          Mes permissions
        </h3>

        {currentUser.role === "admin" ? (
          <div
            style={{
              padding: "15px",
              background: "#d1fae5",
              border: "2px solid #10b981",
              borderRadius: "8px",
              color: "#065f46",
              fontWeight: "600",
            }}
          >
            ✅ Vous avez accès à toutes les fonctionnalités
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            {getPermissionsList(currentUser.role).map((perm) => (
              <div
                key={perm}
                style={{
                  padding: "10px",
                  background: "var(--color-bg)",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                ✓ {getPermissionLabel(perm)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getPermissionsList(role) {
  const permissions = {
    manager: [
      "view_dashboard",
      "view_consolidated_dashboard",
      "manage_pos",
      "manage_inventory",
      "view_stores",
      "manage_transfers",
      "view_sales",
      "manage_customers",
      "manage_credits",
      "view_returns",
    ],
    cashier: [
      "view_dashboard",
      "manage_pos",
      "view_inventory",
      "view_sales",
      "view_customers",
    ],
  };
  return permissions[role] || [];
}

function getPermissionLabel(permission) {
  const labels = {
    view_dashboard: "Voir le tableau de bord",
    view_consolidated_dashboard: "Dashboard consolidé",
    manage_pos: "Point de vente",
    manage_inventory: "Gérer l'inventaire",
    view_stores: "Voir les magasins",
    manage_transfers: "Gérer les transferts",
    view_sales: "Voir les ventes",
    manage_customers: "Gérer les clients",
    manage_credits: "Gérer les crédits",
    view_returns: "Voir les retours",
  };
  return labels[permission] || permission;
}
