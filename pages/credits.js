import React from "react"; // ✨ AJOUTEZ CETTE LIGNE
import ProtectedRoute from "../components/ProtectedRoute";
import PermissionGate from "../components/PermissionGate"; // ✨ AJOUTÉ
import { useState, useEffect } from "react";
import { useApp } from "../src/contexts/AppContext";
import { useAuth } from "../src/contexts/AuthContext"; // ✨ AJOUTÉ
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
} from "lucide-react";
import Toast from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";

function CreditsPage() {
  const { customers, loading, salesHistory, currentStore } = useApp();
  const { currentUser, hasRole } = useAuth(); // ✨ AJOUTÉ
  const [credits, setCredits] = useState([]);
  const [filter, setFilter] = useState("all");
  const [expandedCredit, setExpandedCredit] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [toast, setToast] = useState(null);
  const [openCashSession, setOpenCashSession] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Charger les crédits et la session de caisse ouverte
  useEffect(() => {
    loadCredits();
    loadOpenCashSession();
  }, [currentStore]);

  const loadOpenCashSession = async () => {
    if (!currentStore?.id) return;

    try {
      const params = new URLSearchParams({ storeId: currentStore.id });
      const response = await fetch(`/api/cash-sessions?${params}`);
      if (response.ok) {
        const sessions = await response.json();
        const openSession = sessions.find((s) => s.status === "open");
        setOpenCashSession(openSession);
      }
    } catch (error) {
      console.error("Erreur chargement session caisse:", error);
    }
  };

  const loadCredits = async () => {
    try {
      const res = await fetch("/api/credits");
      const data = await res.json();
      setCredits(data);
    } catch (error) {
      console.error("Erreur chargement crédits:", error);
    }
  };

  // Filtrer les crédits
  const filteredCredits = credits.filter((credit) => {
    if (filter === "pending") return credit.status === "pending";
    if (filter === "partial") return credit.status === "partial";
    if (filter === "paid") return credit.status === "paid";
    if (filter === "overdue") {
      return credit.status !== "paid" && new Date(credit.dueDate) < new Date();
    }
    return true;
  });

  // Statistiques
  const totalCredits = credits.reduce((sum, c) => sum + c.remainingAmount, 0);
  const overdueCredits = credits.filter(
    (c) => c.status !== "paid" && new Date(c.dueDate) < new Date()
  );

  // Obtenir le nom du client
  const getCustomerName = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : "Client inconnu";
  };

  // Trouver la vente liée au crédit
  const findRelatedSale = (credit) => {
    const match = credit.description?.match(/REC[\w-]+/);
    if (match) {
      const receiptNumber = match[0];
      const sale = salesHistory.find((s) => s.receiptNumber === receiptNumber);
      return sale;
    }
    return null;
  };

  // Ajouter un paiement
  const handleAddPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      showToast("Montant invalide", "error");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount > selectedCredit.remainingAmount) {
      showToast("Le montant dépasse le restant à payer", "error");
      return;
    }

    try {
      const res = await fetch(`/api/credits/${selectedCredit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentAmount: amount,
          sessionId: openCashSession?.id,
          createdBy: currentUser?.fullName || currentUser?.email || "Utilisateur"
        }),
      });

      if (res.ok) {
        showToast("Paiement enregistré avec succès", "success");
        setShowPaymentModal(false);
        setPaymentAmount("");
        setSelectedCredit(null);
        loadCredits();
      } else {
        showToast("Erreur lors de l'enregistrement du paiement", "error");
      }
    } catch (error) {
      showToast("Erreur: " + error.message, "error");
    }
  };

  // Supprimer un crédit
  const handleDeleteCredit = async (creditId, customerName) => {
    if (!confirm(`Supprimer le crédit de "${customerName}" ?`)) return;

    try {
      const res = await fetch(`/api/credits/${creditId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Crédit supprimé avec succès", "success");
        loadCredits();
      } else {
        showToast("Erreur lors de la suppression", "error");
      }
    } catch (error) {
      showToast("Erreur: " + error.message, "error");
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* En-tête */}
      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CreditCard size={32} />
          Gestion des Crédits
        </h1>
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
            background: "var(--color-surface)",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              color: "var(--color-text-secondary)",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            Total crédits actifs
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#f59e0b",
            }}
          >
            {totalCredits.toLocaleString()} FCFA
          </div>
        </div>

        <div
          style={{
            background: "var(--color-surface)",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              color: "var(--color-text-secondary)",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            Crédits en retard
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#ef4444",
            }}
          >
            {overdueCredits.length}
          </div>
        </div>

        <div
          style={{
            background: "var(--color-surface)",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              color: "var(--color-text-secondary)",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            Total crédits
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#8b5cf6",
            }}
          >
            {credits.length}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ marginBottom: "20px" }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "12px",
            border: "2px solid var(--color-border)",
            borderRadius: "8px",
            minWidth: "200px",
            background: "var(--color-surface)",
            color: "var(--color-text-primary)",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          <option value="all">Tous les crédits</option>
          <option value="pending">En attente</option>
          <option value="partial">Partiellement payés</option>
          <option value="paid">Payés</option>
          <option value="overdue">En retard</option>
        </select>
      </div>

      {/* Liste des crédits */}
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
        }}
      >
        {filteredCredits.length === 0 ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            Aucun crédit trouvé
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "var(--color-bg)",
                  borderBottom: "2px solid var(--color-border)",
                }}
              >
                <th style={{ padding: "15px", textAlign: "left" }}>Client</th>
                <th style={{ padding: "15px", textAlign: "left" }}>
                  Description
                </th>
                <th style={{ padding: "15px", textAlign: "right" }}>Montant</th>
                <th style={{ padding: "15px", textAlign: "right" }}>Restant</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Caissier</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Créé le</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Échéance</th>
                <th style={{ padding: "15px", textAlign: "center" }}>Statut</th>
                <th style={{ padding: "15px", textAlign: "center" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCredits.map((credit) => {
                const isOverdue =
                  new Date(credit.dueDate) < new Date() &&
                  credit.status !== "paid";
                const relatedSale = findRelatedSale(credit);
                const isExpanded = expandedCredit === credit.id;

                return (
                  <React.Fragment key={credit.id}>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        background: isOverdue
                          ? "rgba(239, 68, 68, 0.1)"
                          : "transparent",
                      }}
                    >
                      <td style={{ padding: "15px", fontWeight: "600" }}>
                        {getCustomerName(credit.customerId)}
                      </td>
                      <td
                        style={{
                          padding: "15px",
                          fontSize: "14px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {credit.description}
                      </td>
                      <td
                        style={{
                          padding: "15px",
                          textAlign: "right",
                          fontWeight: "600",
                        }}
                      >
                        {credit.amount.toLocaleString()} FCFA
                      </td>
                      <td
                        style={{
                          padding: "15px",
                          textAlign: "right",
                          fontWeight: "600",
                          color:
                            credit.remainingAmount > 0 ? "#ef4444" : "#10b981",
                        }}
                      >
                        {credit.remainingAmount.toLocaleString()} FCFA
                      </td>
                      <td
                        style={{
                          padding: "15px",
                          fontSize: "14px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {credit.createdBy || "N/A"}
                      </td>
                      <td
                        style={{
                          padding: "15px",
                          fontSize: "14px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {new Date(credit.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td style={{ padding: "15px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            color: isOverdue
                              ? "#ef4444"
                              : "var(--color-text-secondary)",
                            fontSize: "14px",
                          }}
                        >
                          <Clock size={16} />
                          {new Date(credit.dueDate).toLocaleDateString("fr-FR")}
                        </div>
                      </td>
                      <td style={{ padding: "15px", textAlign: "center" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontSize: "13px",
                            fontWeight: "600",
                            background:
                              credit.status === "paid"
                                ? "#dcfce7"
                                : credit.status === "partial"
                                ? "#fef3c7"
                                : "#fee2e2",
                            color:
                              credit.status === "paid"
                                ? "#166534"
                                : credit.status === "partial"
                                ? "#92400e"
                                : "#991b1b",
                          }}
                        >
                          {credit.status === "paid"
                            ? "✅ Payé"
                            : credit.status === "partial"
                            ? "⏳ Partiel"
                            : "⏱️ En attente"}
                        </span>
                      </td>
                      <td style={{ padding: "15px", textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          {credit.status !== "paid" && (
                            <button
                              onClick={() => {
                                setSelectedCredit(credit);
                                setShowPaymentModal(true);
                              }}
                              style={{
                                padding: "8px 12px",
                                background: "#10b981",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <DollarSign size={16} />
                              Payer
                            </button>
                          )}

                          <button
                            onClick={() =>
                              setExpandedCredit(isExpanded ? null : credit.id)
                            }
                            style={{
                              padding: "8px 12px",
                              background: "#3b82f6",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp size={16} />
                                Masquer
                              </>
                            ) : (
                              <>
                                <Eye size={16} />
                                Voir
                              </>
                            )}
                          </button>

                          {/* ✨ MODIFIÉ - Bouton Supprimer visible seulement pour Admin */}
                          <PermissionGate roles={["admin"]}>
                            <button
                              onClick={() =>
                                handleDeleteCredit(
                                  credit.id,
                                  getCustomerName(credit.customerId)
                                )
                              }
                              style={{
                                padding: "8px 12px",
                                background: "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
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

                    {/* Détails étendus */}
                    {isExpanded && (
                      <tr>
                        <td
                          colSpan="8"
                          style={{
                            padding: "20px",
                            background: "var(--color-bg)",
                            borderBottom: "1px solid var(--color-border)",
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "20px",
                            }}
                          >
                            {/* Informations du crédit */}
                            <div>
                              <h4
                                style={{
                                  margin: "0 0 15px 0",
                                  fontSize: "16px",
                                  fontWeight: "600",
                                }}
                              >
                                Informations du crédit
                              </h4>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "10px",
                                }}
                              >
                                <div>
                                  <span
                                    style={{
                                      color: "var(--color-text-muted)",
                                      fontSize: "13px",
                                    }}
                                  >
                                    Client:
                                  </span>
                                  <div style={{ fontWeight: "600" }}>
                                    {getCustomerName(credit.customerId)}
                                  </div>
                                </div>
                                <div>
                                  <span
                                    style={{
                                      color: "var(--color-text-muted)",
                                      fontSize: "13px",
                                    }}
                                  >
                                    Montant initial:
                                  </span>
                                  <div style={{ fontWeight: "600" }}>
                                    {credit.amount.toLocaleString()} FCFA
                                  </div>
                                </div>
                                <div>
                                  <span
                                    style={{
                                      color: "var(--color-text-muted)",
                                      fontSize: "13px",
                                    }}
                                  >
                                    Montant payé:
                                  </span>
                                  <div
                                    style={{
                                      fontWeight: "600",
                                      color: "#10b981",
                                    }}
                                  >
                                    {(
                                      credit.amount - credit.remainingAmount
                                    ).toLocaleString()}{" "}
                                    FCFA
                                  </div>
                                </div>
                                <div>
                                  <span
                                    style={{
                                      color: "var(--color-text-muted)",
                                      fontSize: "13px",
                                    }}
                                  >
                                    Reste à payer:
                                  </span>
                                  <div
                                    style={{
                                      fontWeight: "600",
                                      color: "#ef4444",
                                    }}
                                  >
                                    {credit.remainingAmount.toLocaleString()}{" "}
                                    FCFA
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Vente liée */}
                            {relatedSale && (
                              <div>
                                <h4
                                  style={{
                                    margin: "0 0 15px 0",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                  }}
                                >
                                  Vente liée
                                </h4>
                                <div
                                  style={{
                                    padding: "15px",
                                    background: "var(--color-surface)",
                                    borderRadius: "8px",
                                    border: "1px solid var(--color-border)",
                                  }}
                                >
                                  <div
                                    style={{
                                      marginBottom: "10px",
                                      fontWeight: "600",
                                      color: "#3b82f6",
                                    }}
                                  >
                                    Reçu: {relatedSale.receiptNumber}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      color: "var(--color-text-secondary)",
                                    }}
                                  >
                                    {relatedSale.items?.length || 0} article(s)
                                  </div>
                                  <div
                                    style={{
                                      marginTop: "10px",
                                      fontSize: "13px",
                                      color: "var(--color-text-muted)",
                                    }}
                                  >
                                    {new Date(
                                      relatedSale.createdAt
                                    ).toLocaleString("fr-FR")}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de paiement */}
      {showPaymentModal && selectedCredit && (
        <div
          onClick={() => setShowPaymentModal(false)}
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
            }}
          >
            <h2
              style={{
                margin: "0 0 20px 0",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <DollarSign size={24} />
              Enregistrer un paiement
            </h2>

            <div
              style={{
                background: "var(--color-bg)",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <div style={{ marginBottom: "10px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>
                  Client:
                </span>
                <div style={{ fontWeight: "600" }}>
                  {getCustomerName(selectedCredit.customerId)}
                </div>
              </div>
              <div>
                <span style={{ color: "var(--color-text-muted)" }}>
                  Reste à payer:
                </span>
                <div style={{ fontWeight: "600", color: "#ef4444" }}>
                  {selectedCredit.remainingAmount.toLocaleString()} FCFA
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Montant du paiement (FCFA)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                max={selectedCredit.remainingAmount}
                placeholder="Entrez le montant"
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  textAlign: "right",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                }}
              />

              {/* Montants suggérés */}
              <div style={{ marginTop: "10px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                  }}
                >
                  {[
                    selectedCredit.remainingAmount / 4,
                    selectedCredit.remainingAmount / 2,
                    selectedCredit.remainingAmount,
                  ].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setPaymentAmount(amount.toString())}
                      style={{
                        padding: "8px",
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      {amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowPaymentModal(false)}
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
                onClick={handleAddPayment}
                disabled={
                  !paymentAmount ||
                  parseFloat(paymentAmount) <= 0 ||
                  parseFloat(paymentAmount) > selectedCredit.remainingAmount
                }
                style={{
                  flex: 1,
                  padding: "12px",
                  background:
                    !paymentAmount ||
                    parseFloat(paymentAmount) <= 0 ||
                    parseFloat(paymentAmount) > selectedCredit.remainingAmount
                      ? "var(--color-border)"
                      : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor:
                    !paymentAmount ||
                    parseFloat(paymentAmount) <= 0 ||
                    parseFloat(paymentAmount) > selectedCredit.remainingAmount
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "600",
                }}
              >
                Valider le paiement
              </button>
            </div>
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

function CreditsPageProtected() {
  return (
    <ProtectedRoute>
      <CreditsPage />
    </ProtectedRoute>
  );
}

export default CreditsPageProtected;
