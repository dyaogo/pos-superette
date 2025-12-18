import { useState, useEffect } from "react";
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
  Calculator,
  Clock,
} from "lucide-react";
import StoreSelector from "./StoreSelector";
import OnlineStatusBadge from "./OnlineStatusBadge";

export default function Layout({ children }) {
  const router = useRouter();
  const { currentUser, logout, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [router.pathname, isMobile]);

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
      path: "/accounting",
      icon: Calculator,
      label: "Comptabilité",
      permission: "view_accounting",
    },
    {
      path: "/reports",
      icon: BarChart3,
      label: "Rapports Avancés",
      permission: "view_accounting",
    },
    {
      path: "/work-periods",
      icon: Clock,
      label: "Périodes de travail",
      permission: "view_reports",
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
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 99,
            animation: "fadeIn 0.2s",
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: isMobile ? "250px" : (sidebarOpen ? "250px" : "70px"),
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
          transition: isMobile ? "transform 0.3s" : "width 0.3s",
          position: "fixed",
          height: "100vh",
          overflowY: "auto",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
          left: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: isMobile ? "space-between" : (sidebarOpen ? "space-between" : "center"),
          }}
        >
          {(isMobile || sidebarOpen) && (
            <h2 style={{ margin: 0, color: "var(--color-primary)", fontSize: isMobile ? "18px" : "24px" }}>
              POS Superette
            </h2>
          )}
          {!isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                color: "var(--color-text-primary)",
              }}
              aria-label={sidebarOpen ? "Réduire le menu" : "Ouvrir le menu"}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                color: "var(--color-text-primary)",
              }}
              aria-label="Fermer le menu"
            >
              <X size={20} />
            </button>
          )}
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
          marginLeft: isMobile ? "0" : (sidebarOpen ? "250px" : "70px"),
          flex: 1,
          transition: isMobile ? "none" : "margin-left 0.3s",
          minHeight: "100vh",
          width: isMobile ? "100%" : "auto",
        }}
      >
        {/* Store Selector & Online Status */}
        <div
          style={{
            padding: isMobile ? "12px 15px" : "15px 30px",
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
            position: "sticky",
            top: 0,
            zIndex: 50,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                color: "var(--color-text-primary)",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Ouvrir le menu"
            >
              <Menu size={24} />
            </button>
          )}
          <StoreSelector />
          <OnlineStatusBadge />
        </div>

        {/* Page content */}
        <div>{children}</div>
      </main>
    </div>
  );
}
