import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../src/contexts/AuthContext";
import { useTheme } from "../src/contexts/ThemeContext";
import {
  Home,
  ShoppingCart,
  Package,
  FileText,
  Users,
  CreditCard,
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
  Sun,
  Moon,
} from "lucide-react";
import StoreSelector from "./StoreSelector";
import OnlineStatusBadge from "./OnlineStatusBadge";

export default function Layout({ children }) {
  const router = useRouter();
  const { currentUser, logout, hasPermission, loading: authLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Detect screen size (mobile/tablet/desktop)
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;

      setIsMobile(mobile);
      setIsTablet(tablet);

      // Auto-close sidebar on mobile
      if (mobile) {
        setSidebarOpen(false);
      }
      // Auto-collapse sidebar on tablet for more content space
      else if (tablet) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 🔐 Rediriger vers /login si non authentifié
  useEffect(() => {
    const pagesPubliques = ["/", "/login", "/unauthorized"];
    if (!authLoading && !currentUser && !pagesPubliques.includes(router.pathname)) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router.pathname]);

  // Close sidebar when route changes on mobile/tablet
  useEffect(() => {
    if (isMobile || isTablet) {
      setSidebarOpen(false);
    }
  }, [router.pathname, isMobile, isTablet]);

  // Pages publiques (sans authentification requise)
  const publicPages = ["/", "/login", "/unauthorized"];
  const isPublicPage = publicPages.includes(router.pathname);

  // Si page publique, pas de layout
  if (isPublicPage) {
    return children;
  }

  const menuItems = [
    {
      path: "/dashboards",
      icon: Home,
      label: "Tableau de bord",
      permission: "view_dashboard",
    },
    {
      path: "/pos",
      icon: ShoppingCart,
      label: "Caisse",
      permission: "manage_pos",
    },
    {
      path: "/stocks",
      icon: Package,
      label: "Stocks",
      permission: "manage_inventory",
    },
    {
      path: "/sales-customers",
      icon: FileText,
      label: "Ventes & Clients",
      permission: "view_sales",
    },
    {
      path: "/stores",
      icon: StoreIcon,
      label: "Magasins",
      permission: "view_stores",
    },
    {
      path: "/users",
      icon: UserCog,
      label: "Utilisateurs",
      permission: "manage_users",
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
      label: "Rapports",
      permission: "view_reports",
    },
    {
      path: "/work-periods",
      icon: Clock,
      label: "Périodes de travail",
      permission: "view_reports",
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
          width: isMobile
            ? "250px"
            : isTablet
              ? (sidebarOpen ? "200px" : "60px")
              : (sidebarOpen ? "250px" : "70px"),
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
            <h2 style={{ margin: 0, color: "var(--color-primary)", fontSize: isMobile ? "18px" : isTablet ? "20px" : "24px" }}>
              POS Superette
            </h2>
          )}
          {!isMobile && !isTablet && (
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

                {/* Toggle thème */}
                <button
                  onClick={toggleTheme}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "var(--color-bg)",
                    color: "var(--color-text-primary)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginBottom: "10px",
                    fontSize: "14px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-bg)")}
                  title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {isDark ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#6366f1" />}
                    {isDark ? "Mode clair" : "Mode sombre"}
                  </span>
                  {/* Toggle pill */}
                  <div style={{
                    width: "36px", height: "20px",
                    borderRadius: "10px",
                    background: isDark ? "#6366f1" : "#cbd5e1",
                    position: "relative",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}>
                    <div style={{
                      position: "absolute",
                      top: "2px",
                      left: isDark ? "18px" : "2px",
                      width: "16px", height: "16px",
                      borderRadius: "50%",
                      background: "white",
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }} />
                  </div>
                </button>

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
              <>
                {/* Toggle thème — icône seule */}
                <button
                  onClick={toggleTheme}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "var(--color-bg)",
                    color: "var(--color-text-primary)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "8px",
                  }}
                  title={isDark ? "Mode clair" : "Mode sombre"}
                >
                  {isDark ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} color="#6366f1" />}
                </button>

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
              </>
            )}
          </div>
        )}
      </aside>

      {/* Main content */}
      <main
        style={{
          marginLeft: isMobile
            ? "0"
            : isTablet
              ? (sidebarOpen ? "200px" : "60px")
              : (sidebarOpen ? "250px" : "70px"),
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
          {(isMobile || isTablet) && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: isTablet ? "12px" : "8px",
                color: "var(--color-text-primary)",
                display: "flex",
                alignItems: "center",
                minWidth: "44px",
                minHeight: "44px",
                justifyContent: "center",
                touchAction: "manipulation",
              }}
              aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
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
