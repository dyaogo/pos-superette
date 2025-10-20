import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
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
} from "lucide-react";
import StoreSelector from "./StoreSelector"; // NOUVEAU

export default function Layout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: "/dashboard", icon: Home, label: "Tableau de bord" },
    {
      path: "/consolidated-dashboard",
      icon: BarChart3,
      label: "Dashboard Consolidé",
    }, // ✨ AJOUTEZ CETTE LIGNE
    { path: "/pos", icon: ShoppingCart, label: "Caisse" },
    { path: "/inventory", icon: Package, label: "Inventaire" },
    {
      path: "/physical-inventory",
      icon: ClipboardList,
      label: "Inventaire Physique",
    },
    { path: "/stores", icon: StoreIcon, label: "Magasins" },
    { path: "/transfers", icon: ArrowRightLeft, label: "Transferts" }, // ✨ AJOUTEZ CETTE LIGNE

    { path: "/sales", icon: FileText, label: "Ventes" },
    { path: "/customers", icon: Users, label: "Clients" },
    { path: "/credits", icon: CreditCard, label: "Crédits" },
    { path: "/returns", icon: Package, label: "Retours" },
    { path: "/settings", icon: Settings, label: "Paramètres" },
  ];

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
        <nav style={{ padding: "20px 0" }}>
          {menuItems.map((item) => {
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
                    marginBottom: "4px",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background =
                        "var(--color-surface-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          marginLeft: sidebarOpen ? "250px" : "70px",
          transition: "margin-left 0.3s",
        }}
      >
        {/* Header avec sélecteur de magasin */}
        <header
          style={{
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
            padding: "16px 30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "var(--color-text-primary)",
            }}
          >
            {menuItems.find((item) => item.path === router.pathname)?.label ||
              "POS Superette"}
          </div>

          {/* NOUVEAU : Sélecteur de magasin */}
          <StoreSelector />
        </header>

        {/* Page Content */}
        <div>{children}</div>
      </main>
    </div>
  );
}
