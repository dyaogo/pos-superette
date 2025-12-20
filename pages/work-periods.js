import { useState, useEffect } from "react";
import { useApp } from "../src/contexts/AppContext";
import { useAuth } from "../src/contexts/AuthContext";
import PermissionGate from "../components/PermissionGate";
import {
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Filter,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
  Minus,
} from "lucide-react";

export default function WorkPeriodsPage() {
  const { currentStore } = useApp();
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [sales, setSales] = useState([]);
  const [cashOperations, setCashOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [operationForm, setOperationForm] = useState({
    type: "in",
    amount: "",
    reason: "",
    description: "",
  });

  useEffect(() => {
    loadSessions();
    loadSales();
    loadCashOperations();
  }, [currentStore]);

  const loadSessions = async () => {
    try {
      const params = new URLSearchParams();
      if (currentStore?.id) {
        params.append("storeId", currentStore.id);
      }

      const response = await fetch(`/api/cash-sessions?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log("📦 Sessions chargées:", data.length, data);
        setSessions(data);
      }
    } catch (error) {
      console.error("Erreur chargement sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      const response = await fetch("/api/sales");
      if (response.ok) {
        const result = await response.json();
        // L'API retourne {data: [...], pagination: {...}}
        const salesData = result.data || result;
        console.log("🛒 Ventes chargées:", salesData.length, salesData);
        console.log("🛒 Exemple de vente:", salesData[0]);
        setSales(salesData);
      }
    } catch (error) {
      console.error("Erreur chargement ventes:", error);
    }
  };

  const loadCashOperations = async () => {
    try {
      const response = await fetch("/api/cash-operations");
      if (response.ok) {
        const data = await response.json();
        setCashOperations(data);
      }
    } catch (error) {
      console.error("Erreur chargement opérations:", error);
    }
  };

  const handleCreateOperation = async () => {
    if (!selectedSession || !operationForm.amount || !operationForm.reason) {
      alert("Veuillez remplir tous les champs requis");
      return;
    }

    try {
      const response = await fetch("/api/cash-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          type: operationForm.type,
          amount: parseFloat(operationForm.amount),
          reason: operationForm.reason,
          description: operationForm.description,
          createdBy: currentUser?.fullName || currentUser?.email || "Utilisateur",
        }),
      });

      if (response.ok) {
        await loadCashOperations();
        setShowOperationModal(false);
        setOperationForm({
          type: "in",
          amount: "",
          reason: "",
          description: "",
        });
        alert("Opération enregistrée avec succès");
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la création de l'opération");
    }
  };

  const getSessionSales = (session) => {
    if (!Array.isArray(sales)) return [];

    console.log(`🔍 Filtrage ventes pour session ${session.sessionNumber}:`, {
      sessionId: session.id,
      sessionStart: session.openedAt,
      sessionEnd: session.closedAt,
      storeId: session.storeId,
      totalSales: sales.length,
    });

    // Filtrer les ventes par session
    const filtered = sales.filter((sale) => {
      // Vérifier d'abord si la vente a un cashSessionId correspondant
      if (sale.cashSessionId && sale.cashSessionId === session.id) {
        return true;
      }

      // Sinon, filtrer par date (ventes entre ouverture et fermeture de la session)
      const saleDate = new Date(sale.createdAt);
      const sessionStart = new Date(session.openedAt);
      const sessionEnd = session.closedAt ? new Date(session.closedAt) : new Date();

      // Vérifier aussi que la vente appartient au même magasin
      const sameStore = !sale.storeId || sale.storeId === session.storeId;

      return saleDate >= sessionStart && saleDate <= sessionEnd && sameStore;
    });

    console.log(`✅ Ventes trouvées pour ${session.sessionNumber}:`, filtered.length, filtered);

    return filtered;
  };

  const getSessionOperations = (session) => {
    if (!Array.isArray(cashOperations)) return [];
    return cashOperations.filter((op) => op.sessionId === session.id);
  };

  const calculateSessionStats = (session) => {
    const sessionSales = getSessionSales(session);
    const sessionOps = getSessionOperations(session);

    const cashSales = sessionSales
      .filter((s) => s.paymentMethod === "cash")
      .reduce((sum, s) => sum + (s.total || 0), 0);

    const cardSales = sessionSales
      .filter((s) => s.paymentMethod === "card")
      .reduce((sum, s) => sum + (s.total || 0), 0);

    const creditSales = sessionSales
      .filter((s) => s.paymentMethod === "credit")
      .reduce((sum, s) => sum + (s.total || 0), 0);

    const totalSales = sessionSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const transactionCount = sessionSales.length;

    // Calculer les entrées et sorties d'argent
    const cashIn = sessionOps
      .filter((op) => op.type === "in")
      .reduce((sum, op) => sum + op.amount, 0);

    const cashOut = sessionOps
      .filter((op) => op.type === "out")
      .reduce((sum, op) => sum + op.amount, 0);

    // Debug: afficher les stats calculées
    if (sessionSales.length > 0) {
      console.log(`Session ${session.sessionNumber}:`, {
        salesCount: sessionSales.length,
        totalSales,
        cashSales,
        cardSales,
        creditSales,
        cashIn,
        cashOut,
      });
    }

    const expectedCash = session.openingAmount + cashSales + cashIn - cashOut;
    const actualCash = session.closingAmount || 0;
    const difference = session.status === "closed" ? actualCash - expectedCash : 0;

    return {
      cashSales,
      cardSales,
      creditSales,
      totalSales,
      transactionCount,
      cashIn,
      cashOut,
      expectedCash,
      actualCash,
      difference,
    };
  };

  const filteredSessions = Array.isArray(sessions) ? sessions.filter((session) => {
    if (filterStatus !== "all" && session.status !== filterStatus) return false;

    if (filterDate !== "all") {
      const sessionDate = new Date(session.openedAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filterDate === "today") {
        return sessionDate >= today;
      } else if (filterDate === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sessionDate >= weekAgo;
      } else if (filterDate === "month") {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return sessionDate >= monthAgo;
      }
    }

    return true;
  }) : [];

  const formatDuration = (openedAt, closedAt) => {
    if (!closedAt) return "En cours...";

    const duration = new Date(closedAt) - new Date(openedAt);
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}min`;
  };

  const SessionCard = ({ session }) => {
    const stats = calculateSessionStats(session);
    const isExpanded = selectedSession?.id === session.id;

    return (
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid var(--color-border)",
          transition: "all 0.2s",
        }}
      >
        {/* Header */}
        <div
          onClick={() => {
            setSelectedSession(isExpanded ? null : session);
            setShowDetails(isExpanded ? false : true);
          }}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            marginBottom: isExpanded ? "20px" : "0",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                {session.sessionNumber}
              </h3>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  background:
                    session.status === "open"
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(107, 114, 128, 0.1)",
                  color: session.status === "open" ? "#10b981" : "#6b7280",
                }}
              >
                {session.status === "open" ? "🟢 Ouverte" : "⚫ Fermée"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: "20px",
                fontSize: "14px",
                color: "var(--color-text-secondary)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <User size={16} />
                {session.openedBy}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={16} />
                {new Date(session.openedAt).toLocaleDateString("fr-FR")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={16} />
                {formatDuration(session.openedAt, session.closedAt)}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                Ventes totales
              </div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#10b981" }}>
                {stats.totalSales.toLocaleString()} F
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                Transactions
              </div>
              <div style={{ fontSize: "20px", fontWeight: "700" }}>
                {stats.transactionCount}
              </div>
            </div>

            {session.status === "closed" && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                  Écart
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color:
                      stats.difference === 0
                        ? "#10b981"
                        : stats.difference > 0
                          ? "#f59e0b"
                          : "#ef4444",
                  }}
                >
                  {stats.difference === 0
                    ? "✓ Parfait"
                    : stats.difference > 0
                      ? `+${stats.difference.toLocaleString()}`
                      : stats.difference.toLocaleString()}{" "}
                  F
                </div>
              </div>
            )}

            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div
            style={{
              paddingTop: "20px",
              borderTop: "1px solid var(--color-border)",
              animation: "slideDown 0.3s ease-out",
            }}
          >
            {/* Statistics Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <StatCard
                icon={<DollarSign size={20} />}
                label="Fond initial"
                value={`${session.openingAmount.toLocaleString()} F`}
                color="#3b82f6"
              />
              <StatCard
                icon={<DollarSign size={20} />}
                label="Espèces"
                value={`${stats.cashSales.toLocaleString()} F`}
                color="#10b981"
              />
              <StatCard
                icon={<DollarSign size={20} />}
                label="Carte"
                value={`${stats.cardSales.toLocaleString()} F`}
                color="#8b5cf6"
              />
              <StatCard
                icon={<DollarSign size={20} />}
                label="Crédit"
                value={`${stats.creditSales.toLocaleString()} F`}
                color="#f59e0b"
              />
            </div>

            {/* Cash Operations */}
            <div
              style={{
                background: "var(--color-bg)",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
                  Entrées / Sorties d'argent
                </h4>
                {session.status === "open" && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => {
                        setSelectedSession(session);
                        setOperationForm({ ...operationForm, type: "in" });
                        setShowOperationModal(true);
                      }}
                      style={{
                        padding: "8px 16px",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      <Plus size={16} />
                      Entrée
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSession(session);
                        setOperationForm({ ...operationForm, type: "out" });
                        setShowOperationModal(true);
                      }}
                      style={{
                        padding: "8px 16px",
                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      <Minus size={16} />
                      Sortie
                    </button>
                  </div>
                )}
              </div>

              {getSessionOperations(session).length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--color-text-secondary)", fontSize: "14px" }}>
                  Aucune opération pour cette session
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {getSessionOperations(session).map((op) => (
                    <div
                      key={op.id}
                      style={{
                        padding: "12px",
                        background: "var(--color-surface)",
                        borderRadius: "8px",
                        border: `2px solid ${op.type === "in" ? "#10b981" : "#ef4444"}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          {op.type === "in" ? (
                            <TrendingUp size={16} color="#10b981" />
                          ) : (
                            <TrendingDown size={16} color="#ef4444" />
                          )}
                          <span style={{ fontWeight: "600", fontSize: "14px" }}>{op.reason}</span>
                        </div>
                        {op.description && (
                          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginLeft: "24px" }}>
                            {op.description}
                          </div>
                        )}
                        <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginLeft: "24px", marginTop: "4px" }}>
                          {new Date(op.createdAt).toLocaleString("fr-FR")} • {op.createdBy}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: op.type === "in" ? "#10b981" : "#ef4444",
                        }}
                      >
                        {op.type === "in" ? "+" : "-"} {op.amount.toLocaleString()} F
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Résumé des opérations */}
              {(stats.cashIn > 0 || stats.cashOut > 0) && (
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--color-border)", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                  <div style={{ textAlign: "center", padding: "12px", background: "#f0fdf4", borderRadius: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#059669", marginBottom: "4px" }}>Total Entrées</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#10b981" }}>
                      + {stats.cashIn.toLocaleString()} F
                    </div>
                  </div>
                  <div style={{ textAlign: "center", padding: "12px", background: "#fef2f2", borderRadius: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#dc2626", marginBottom: "4px" }}>Total Sorties</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#ef4444" }}>
                      - {stats.cashOut.toLocaleString()} F
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Closing Info */}
            {session.status === "closed" && (
              <div
                style={{
                  background: "var(--color-bg)",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                }}
              >
                <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>
                  Clôture de session
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                      Fermée par
                    </div>
                    <div style={{ fontWeight: "600" }}>{session.closedBy}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                      Date de clôture
                    </div>
                    <div style={{ fontWeight: "600" }}>
                      {new Date(session.closedAt).toLocaleString("fr-FR")}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                      Attendu en caisse
                    </div>
                    <div style={{ fontWeight: "600" }}>
                      {stats.expectedCash.toLocaleString()} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                      Montant compté
                    </div>
                    <div style={{ fontWeight: "600" }}>
                      {stats.actualCash.toLocaleString()} FCFA
                    </div>
                  </div>
                </div>

                {session.notes && (
                  <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--color-border)" }}>
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                      Notes
                    </div>
                    <div style={{ fontSize: "14px" }}>{session.notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* Sales List */}
            <div>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>
                Ventes ({stats.transactionCount})
              </h4>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {getSessionSales(session).map((sale) => (
                  <div
                    key={sale.id}
                    style={{
                      padding: "12px",
                      background: "var(--color-bg)",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "600" }}>{sale.receiptNumber}</div>
                      <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        {new Date(sale.createdAt).toLocaleTimeString("fr-FR")}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          background:
                            sale.paymentMethod === "cash"
                              ? "#e0f2fe"
                              : sale.paymentMethod === "card"
                                ? "#f3e8ff"
                                : "#fef3c7",
                          color:
                            sale.paymentMethod === "cash"
                              ? "#0369a1"
                              : sale.paymentMethod === "card"
                                ? "#7c3aed"
                                : "#b45309",
                        }}
                      >
                        {sale.paymentMethod === "cash"
                          ? "💵 Espèces"
                          : sale.paymentMethod === "card"
                            ? "💳 Carte"
                            : "📋 Crédit"}
                      </span>
                      <div style={{ fontWeight: "700", fontSize: "16px" }}>
                        {sale.total.toLocaleString()} F
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const StatCard = ({ icon, label, value, color }) => (
    <div
      style={{
        padding: "16px",
        background: "var(--color-bg)",
        borderRadius: "10px",
        border: `2px solid ${color}20`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color }}>
        {icon}
        <span style={{ fontSize: "12px", fontWeight: "600" }}>{label}</span>
      </div>
      <div style={{ fontSize: "18px", fontWeight: "700" }}>{value}</div>
    </div>
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <PermissionGate requiredPermission="view_reports">
      <div style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ margin: "0 0 10px 0", fontSize: "28px", fontWeight: "700" }}>
            📊 Périodes de travail
          </h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "16px" }}>
            Historique et statistiques des sessions de caisse
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <Filter size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "2px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <option value="all">Tous les statuts</option>
              <option value="open">Ouvertes</option>
              <option value="closed">Fermées</option>
            </select>

            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "2px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>

            <div style={{ marginLeft: "auto", fontSize: "14px", color: "var(--color-text-secondary)" }}>
              {filteredSessions.length} session(s)
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              padding: "20px",
              borderRadius: "12px",
              color: "white",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Clock size={24} />
              <span style={{ fontSize: "14px", opacity: 0.9 }}>Sessions totales</span>
            </div>
            <div style={{ fontSize: "32px", fontWeight: "700" }}>{filteredSessions.length}</div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              padding: "20px",
              borderRadius: "12px",
              color: "white",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <TrendingUp size={24} />
              <span style={{ fontSize: "14px", opacity: 0.9 }}>Ventes totales</span>
            </div>
            <div style={{ fontSize: "32px", fontWeight: "700" }}>
              {filteredSessions
                .reduce((sum, s) => sum + calculateSessionStats(s).totalSales, 0)
                .toLocaleString()}{" "}
              F
            </div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              padding: "20px",
              borderRadius: "12px",
              color: "white",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <CheckCircle size={24} />
              <span style={{ fontSize: "14px", opacity: 0.9 }}>Sessions fermées</span>
            </div>
            <div style={{ fontSize: "32px", fontWeight: "700" }}>
              {filteredSessions.filter((s) => s.status === "closed").length}
            </div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              padding: "20px",
              borderRadius: "12px",
              color: "white",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <DollarSign size={24} />
              <span style={{ fontSize: "14px", opacity: 0.9 }}>Moyenne / session</span>
            </div>
            <div style={{ fontSize: "32px", fontWeight: "700" }}>
              {filteredSessions.length > 0
                ? Math.round(
                    filteredSessions.reduce((sum, s) => sum + calculateSessionStats(s).totalSales, 0) /
                      filteredSessions.length
                  ).toLocaleString()
                : 0}{" "}
              F
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div>
          {filteredSessions.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "var(--color-surface)",
                borderRadius: "12px",
                border: "1px solid var(--color-border)",
              }}
            >
              <AlertCircle size={48} style={{ color: "var(--color-text-secondary)", marginBottom: "16px" }} />
              <p style={{ fontSize: "16px", color: "var(--color-text-secondary)" }}>
                Aucune période de travail trouvée
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => <SessionCard key={session.id} session={session} />)
          )}
        </div>
      </div>

      {/* Modal Création Opération */}
      {showOperationModal && (
        <div
          onClick={() => setShowOperationModal(false)}
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
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-surface)",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ margin: "0 0 24px 0", fontSize: "24px", fontWeight: "700" }}>
              {operationForm.type === "in" ? "Entrée d'argent" : "Sortie d'argent"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                  Montant (FCFA) *
                </label>
                <input
                  type="number"
                  value={operationForm.amount}
                  onChange={(e) => setOperationForm({ ...operationForm, amount: e.target.value })}
                  placeholder="Entrez le montant"
                  min="0"
                  step="1"
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "16px",
                    background: "var(--color-bg)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                  Raison *
                </label>
                <select
                  value={operationForm.reason}
                  onChange={(e) => setOperationForm({ ...operationForm, reason: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "var(--color-bg)",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Sélectionner une raison</option>
                  {operationForm.type === "in" ? (
                    <>
                      <option value="Apport initial">Apport initial</option>
                      <option value="Virement bancaire">Virement bancaire</option>
                      <option value="Remboursement">Remboursement</option>
                      <option value="Autre entrée">Autre entrée</option>
                    </>
                  ) : (
                    <>
                      <option value="Achat fournitures">Achat fournitures</option>
                      <option value="Paiement fournisseur">Paiement fournisseur</option>
                      <option value="Dépenses diverses">Dépenses diverses</option>
                      <option value="Retrait">Retrait</option>
                      <option value="Autre sortie">Autre sortie</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                  Description (optionnel)
                </label>
                <textarea
                  value={operationForm.description}
                  onChange={(e) => setOperationForm({ ...operationForm, description: e.target.value })}
                  placeholder="Ajouter des détails..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "var(--color-bg)",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  onClick={() => setShowOperationModal(false)}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "var(--color-bg)",
                    color: "var(--color-text-primary)",
                    border: "2px solid var(--color-border)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateOperation}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: operationForm.type === "in"
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </PermissionGate>
  );
}
