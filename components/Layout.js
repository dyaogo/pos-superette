import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../src/contexts/AuthContext";
import {
  Home,
  ShoppingCart,
  Package,
  FileText,
  Users,
  CreditCard,
  Settings,
  Menu,
  X,
  ClipboardList,
  Store as StoreIcon,
  ArrowRightLeft,
  BarChart3,
  UserCog,
  LogOut,
  User,
} from "lucide-react";
import StoreSelector from "./StoreSelector";
import OnlineStatusBadge from "./OnlineStatusBadge";

export default function Layout({ children }) {
  const router = useRouter();
  const { currentUser, logout, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Pages publiques (sans authentification requise)
  const publicPages = ["/", "/login", "/unauthorized"];
  const isPublicPage = publicPages.includes(router.pathname);

  // Si page publique, pas de layout
  if (isPublicPage) {
    return children;
  }

  const menuItems = [
    {
      path: "/dashboard",
      icon: Home,
      label: "Tableau de bord",
      permission: "view_dashboard",
    },
    {
      path: "/consolidated-dashboard",
      icon: BarChart3,
      label: "Dashboard Consolidé",
      permission: "view_consolidated_dashboard",
    },
    {
      path: "/pos",
      icon: ShoppingCart,
      label: "Caisse",
      permission: "manage_pos",
    },
    {
      path: "/inventory",
      icon: Package,
      label: "Inventaire",
      permission: "manage_inventory",
    },
    {
      path: "/reception",
      icon: Package,
      label: "Réception",
      permission: "manage_inventory",
    },
    {
      path: "/physical-inventory",
      icon: ClipboardList,
      label: "Inventaire Physique",
      permission: "manage_inventory",
    },
    {
      path: "/stores",
      icon: StoreIcon,
      label: "Magasins",
      permission: "view_stores",
    },
    {
      path: "/transfers",
      icon: ArrowRightLeft,
      label: "Transferts",
      permission: "manage_transfers",
    },
    {
      path: "/users",
      icon: UserCog,
      label: "Utilisateurs",
      permission: "manage_users",
    },
    {
      path: "/sales",
      icon: FileText,
      label: "Ventes",
      permission: "view_sales",
    },
    {
      path: "/customers",
      icon: Users,
      label: "Clients",
      permission: "manage_customers",
    },
    {
      path: "/credits",
      icon: CreditCard,
      label: "Crédits",
      permission: "manage_credits",
    },
    {
      path: "/returns",
      icon: Package,
      label: "Retours",
      permission: "view_returns",
    },
    {
      path: "/settings",
      icon: Settings,
      label: "Paramètres",
      permission: "view_settings",
    },
  ];

  // Filtrer les menus selon les permissions
  const visibleMenuItems = menuItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--color-bg)",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? "250px" : "70px",
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
          transition: "width 0.3s",
          position: "fixed",
          height: "100vh",
          overflowY: "auto",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {sidebarOpen && (
            <h2 style={{ margin: 0, color: "var(--color-primary)" }}>
              POS Superette
            </h2>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              color: "var(--color-text-primary)",
            }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu */}
        <nav style={{ padding: "20px 0", flex: 1 }}>
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.path;

            return (
              <Link key={item.path} href={item.path}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 20px",
                    cursor: "pointer",
                    background: isActive
                      ? "var(--color-primary)"
                      : "transparent",
                    color: isActive ? "white" : "var(--color-text-primary)",
                    transition: "all 0.2s",
                    borderLeft: isActive
                      ? "4px solid white"
                      : "4px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background =
                        "var(--color-surface-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Section utilisateur et déconnexion */}
        {currentUser && (
          <div
            style={{
              borderTop: "1px solid var(--color-border)",
              padding: "15px",
            }}
          >
            {sidebarOpen ? (
              <>
                <div
                  style={{
                    marginBottom: "15px",
                    padding: "12px",
                    background: "var(--color-bg)",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "var(--color-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "600",
                      }}
                    >
                      {currentUser.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          marginBottom: "2px",
                        }}
                      >
                        {currentUser.fullName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        {currentUser.role === "admin"
                          ? "Administrateur"
                          : currentUser.role === "manager"
                          ? "Gérant"
                          : "Caissier"}
                      </div>
                    </div>
                  </div>
                </div>

                <Link href="/profile">
                  <div
                    style={{
                      padding: "10px",
                      background: "var(--color-bg)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      marginBottom: "10px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--color-surface-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "var(--color-bg)")
                    }
                  >
                    <div style={{ fontSize: "14px", fontWeight: "500" }}>
                      Voir mon profil
                    </div>
                  </div>
                </Link>

                <button
                  onClick={logout}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#dc2626")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#ef4444")
                  }
                >
                  <LogOut size={18} />
                  Déconnexion
                </button>
              </>
            ) : (
              <button
                onClick={logout}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Déconnexion"
              >
                <LogOut size={20} />
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Main content */}
      <main
        style={{
          marginLeft: sidebarOpen ? "250px" : "70px",
          flex: 1,
          transition: "margin-left 0.3s",
          minHeight: "100vh",
        }}
      >
        {/* Store Selector & Online Status */}
        <div
          style={{
            padding: "15px 30px",
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
            position: "sticky",
            top: 0,
            zIndex: 50,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <StoreSelector />
          <OnlineStatusBadge />
        </div>

        {/* Page content */}
        <div>{children}</div>
      </main>
    </div>
  );
}
