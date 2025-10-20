import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { useApp } from "../src/contexts/AppContext";
import {
  Store,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  ArrowRightLeft,
  AlertTriangle,
  BarChart3,
  TrendingDown,
  Activity,
} from "lucide-react";

function ConsolidatedDashboard() {
  const { stores, loading } = useApp();
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState("month");
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/consolidated-stats?period=${period}`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Trier les magasins par performance
  const rankedStores = useMemo(() => {
    if (!stats) return [];
    return [...stats.storeStats].sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );
  }, [stats]);

  // Trouver le meilleur et le pire magasin
  const bestStore = rankedStores[0];
  const worstStore = rankedStores[rankedStores.length - 1];

  if (loading || loadingStats || !stats) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "5px solid var(--color-border)",
              borderTopColor: "var(--color-primary)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }}
          />
          <p>Chargement des statistiques...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1600px", margin: "0 auto" }}>
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
              fontSize: "32px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <BarChart3 size={36} color="var(--color-primary)" />
            Dashboard Consolidé
          </h1>
          <p
            style={{
              margin: "8px 0 0 0",
              color: "var(--color-text-secondary)",
              fontSize: "16px",
            }}
          >
            Vue d'ensemble de tous vos magasins ({stores.length} magasins)
          </p>
        </div>

        {/* Sélecteur de période */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { value: "today", label: "Aujourd'hui" },
            { value: "week", label: "7 jours" },
            { value: "month", label: "30 jours" },
            { value: "year", label: "1 an" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              style={{
                padding: "10px 20px",
                background:
                  period === value
                    ? "var(--color-primary)"
                    : "var(--color-surface)",
                color: period === value ? "white" : "var(--color-text-primary)",
                border: `2px solid ${
                  period === value
                    ? "var(--color-primary)"
                    : "var(--color-border)"
                }`,
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.2s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Statistiques globales */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            padding: "25px",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <DollarSign size={28} />
            <div style={{ fontSize: "14px", opacity: 0.9 }}>
              Chiffre d'affaires total
            </div>
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {stats.globalStats.totalRevenue.toLocaleString()} FCFA
          </div>
          <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "8px" }}>
            {stores.length} magasins actifs
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            padding: "25px",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <ShoppingCart size={28} />
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Ventes totales</div>
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {stats.globalStats.totalSales}
          </div>
          <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "8px" }}>
            Ticket moyen: {stats.globalStats.averageTicket.toLocaleString()}{" "}
            FCFA
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            padding: "25px",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <Package size={28} />
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Stock total</div>
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {stats.globalStats.totalStock.toLocaleString()}
          </div>
          <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "8px" }}>
            Valeur: {stats.globalStats.totalStockValue.toLocaleString()} FCFA
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            padding: "25px",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <ArrowRightLeft size={28} />
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Transferts</div>
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {stats.transfers.length}
          </div>
          <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "8px" }}>
            Dernière période
          </div>
        </div>
      </div>

      {/* Comparaison des magasins */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* Meilleur magasin */}
        {bestStore && (
          <div
            style={{
              background: "var(--color-surface)",
              padding: "25px",
              borderRadius: "12px",
              border: "2px solid #10b981",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "15px",
              }}
            >
              <TrendingUp size={28} color="#10b981" />
              <div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#10b981",
                  }}
                >
                  🏆 Meilleur magasin
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Performance la plus élevée
                </div>
              </div>
            </div>

            <div
              style={{
                background: "var(--color-bg)",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                {bestStore.store.name}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    CA
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "var(--color-primary)",
                    }}
                  >
                    {bestStore.totalRevenue.toLocaleString()} FCFA
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Ventes
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "var(--color-primary)",
                    }}
                  >
                    {bestStore.totalSales}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Stock
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "var(--color-primary)",
                    }}
                  >
                    {bestStore.totalStock}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Ticket moy.
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "var(--color-primary)",
                    }}
                  >
                    {bestStore.averageTicket.toLocaleString()} FCFA
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pire magasin (nécessite attention) */}
        {worstStore && stores.length > 1 && (
          <div
            style={{
              background: "var(--color-surface)",
              padding: "25px",
              borderRadius: "12px",
              border: "2px solid #f59e0b",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "15px",
              }}
            >
              <TrendingDown size={28} color="#f59e0b" />
              <div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#f59e0b",
                  }}
                >
                  ⚠️ À améliorer
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Nécessite attention
                </div>
              </div>
            </div>

            <div
              style={{
                background: "var(--color-bg)",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                {worstStore.store.name}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    CA
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "var(--color-primary)",
                    }}
                  >
                    {worstStore.totalRevenue.toLocaleString()} FCFA
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Ventes
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "var(--color-primary)",
                    }}
                  >
                    {worstStore.totalSales}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Stock
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "var(--color-primary)",
                    }}
                  >
                    {worstStore.totalStock}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Ticket moy.
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "var(--color-primary)",
                    }}
                  >
                    {worstStore.averageTicket.toLocaleString()} FCFA
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tableau détaillé par magasin */}
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderBottom: "2px solid var(--color-border)",
            background: "var(--color-bg)",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Store size={24} />
            Performance par magasin
          </h2>
        </div>

        <div style={{ overflowX: "auto" }}>
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
                  Rang
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
                    textAlign: "right",
                    fontWeight: "600",
                  }}
                >
                  CA
                </th>
                <th
                  style={{
                    padding: "15px",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  Ventes
                </th>
                <th
                  style={{
                    padding: "15px",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  Ticket moyen
                </th>
                <th
                  style={{
                    padding: "15px",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  Stock
                </th>
                <th
                  style={{
                    padding: "15px",
                    textAlign: "right",
                    fontWeight: "600",
                  }}
                >
                  Valeur stock
                </th>
                <th
                  style={{
                    padding: "15px",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  Part du CA
                </th>
              </tr>
            </thead>
            <tbody>
              {rankedStores.map((storeData, index) => {
                const caShare = (
                  (storeData.totalRevenue / stats.globalStats.totalRevenue) *
                  100
                ).toFixed(1);

                return (
                  <tr
                    key={storeData.store.id}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      background:
                        index === 0
                          ? "rgba(16, 185, 129, 0.05)"
                          : index === rankedStores.length - 1
                          ? "rgba(245, 158, 11, 0.05)"
                          : "transparent",
                    }}
                  >
                    <td style={{ padding: "15px" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background:
                            index === 0
                              ? "#10b981"
                              : index === 1
                              ? "#3b82f6"
                              : index === 2
                              ? "#f59e0b"
                              : "var(--color-border)",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          fontSize: "14px",
                        }}
                      >
                        {index + 1}
                      </div>
                    </td>
                    <td style={{ padding: "15px" }}>
                      <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                        {storeData.store.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {storeData.products} produits
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "15px",
                        textAlign: "right",
                        fontWeight: "bold",
                        color: "var(--color-primary)",
                      }}
                    >
                      {storeData.totalRevenue.toLocaleString()} FCFA
                    </td>
                    <td
                      style={{
                        padding: "15px",
                        textAlign: "center",
                        fontWeight: "600",
                      }}
                    >
                      {storeData.totalSales}
                    </td>
                    <td style={{ padding: "15px", textAlign: "center" }}>
                      {storeData.averageTicket.toLocaleString()} FCFA
                    </td>
                    <td style={{ padding: "15px", textAlign: "center" }}>
                      <div style={{ fontWeight: "600" }}>
                        {storeData.totalStock.toLocaleString()}
                      </div>
                      {storeData.lowStock > 0 && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#ef4444",
                            marginTop: "2px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                          }}
                        >
                          <AlertTriangle size={12} />
                          {storeData.lowStock} bas
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "15px", textAlign: "right" }}>
                      {storeData.stockValue.toLocaleString()} FCFA
                    </td>
                    <td style={{ padding: "15px", textAlign: "center" }}>
                      <div
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "12px",
                          background: `rgba(59, 130, 246, ${
                            parseFloat(caShare) / 100
                          })`,
                          color:
                            parseFloat(caShare) > 50
                              ? "white"
                              : "var(--color-primary)",
                          fontWeight: "bold",
                          fontSize: "14px",
                        }}
                      >
                        {caShare}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Derniers transferts */}
      {stats.transfers.length > 0 && (
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px",
              borderBottom: "2px solid var(--color-border)",
              background: "var(--color-bg)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <ArrowRightLeft size={24} />
              Derniers transferts de stock
            </h2>
          </div>

          <div style={{ overflowX: "auto" }}>
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
                </tr>
              </thead>
              <tbody>
                {stats.transfers.map((transfer) => {
                  const fromStore = stores.find(
                    (s) => s.id === transfer.fromStoreId
                  );
                  const toStore = stores.find(
                    (s) => s.id === transfer.toStoreId
                  );

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
                          <ArrowRightLeft size={14} color="#6b7280" />
                          <span>{toStore?.name || "Inconnu"}</span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "15px",
                          textAlign: "center",
                          fontWeight: "bold",
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
function ConsolidatedDashboardProtected() {
  return (
    <ProtectedRoute requiredRoles={["admin", "manager"]}>
      <ConsolidatedDashboard />
    </ProtectedRoute>
  );
}

export default ConsolidatedDashboardProtected;
