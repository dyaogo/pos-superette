import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../src/contexts/AuthContext";
import { User, Lock, AlertCircle, Eye, EyeOff, ShoppingCart, Package, BarChart3, Users } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Animation d'entrée
  useEffect(() => {
    setMounted(true);
    // Charger le nom d'utilisateur mémorisé
    const savedUsername = localStorage.getItem("pos_remember_username");
    if (savedUsername) {
      setFormData((prev) => ({ ...prev, username: savedUsername }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Gérer "se souvenir du nom d'utilisateur"
    if (rememberMe) {
      localStorage.setItem("pos_remember_username", formData.username);
    } else {
      localStorage.removeItem("pos_remember_username");
    }

    const result = await login(formData.username, formData.password);

    if (result.success) {
      router.push("/dashboards");
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  const features = [
    { icon: ShoppingCart, label: "Caisse rapide", desc: "Ventes en quelques clics" },
    { icon: Package, label: "Gestion des stocks", desc: "Inventaire en temps réel" },
    { icon: BarChart3, label: "Rapports détaillés", desc: "Suivi de vos performances" },
    { icon: Users, label: "Multi-utilisateurs", desc: "Rôles et permissions" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ═══ PANNEAU GAUCHE — Branding ═══ */}
      <div
        style={{
          flex: "0 0 45%",
          background: "linear-gradient(145deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "60px 48px",
          position: "relative",
          overflow: "hidden",
        }}
        className="login-left-panel"
      >
        {/* Cercles décoratifs en arrière-plan */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "240px",
            height: "240px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "-40px",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            width: "90px",
            height: "90px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "32px",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <ShoppingCart size={44} color="white" />
        </div>

        {/* Titre app */}
        <h1
          style={{
            color: "white",
            fontSize: "32px",
            fontWeight: "800",
            margin: "0 0 8px 0",
            textAlign: "center",
            letterSpacing: "-0.5px",
          }}
        >
          POS Superette
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: "16px",
            margin: "0 0 56px 0",
            textAlign: "center",
          }}
        >
          Système de gestion de point de vente
        </p>

        {/* Fonctionnalités */}
        <div style={{ width: "100%", maxWidth: "320px" }}>
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={20} color="white" />
              </div>
              <div>
                <div style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>
                  {label}
                </div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Version en bas */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            color: "rgba(255,255,255,0.4)",
            fontSize: "12px",
          }}
        >
          v1.0 — Bissa Gold
        </div>
      </div>

      {/* ═══ PANNEAU DROIT — Formulaire ═══ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.4s ease",
          }}
        >
          {/* En-tête formulaire */}
          <div style={{ marginBottom: "40px" }}>
            <h2
              style={{
                margin: "0 0 8px 0",
                fontSize: "28px",
                fontWeight: "800",
                color: "#111827",
                letterSpacing: "-0.5px",
              }}
            >
              Connexion
            </h2>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "15px" }}>
              Entrez vos identifiants pour accéder à votre espace
            </p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#dc2626",
                fontSize: "14px",
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Champ nom d'utilisateur */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#374151",
                  fontSize: "14px",
                }}
              >
                Nom d'utilisateur
              </label>
              <div style={{ position: "relative" }}>
                <User
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="Votre identifiant"
                  style={{
                    width: "100%",
                    padding: "13px 14px 13px 44px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "15px",
                    background: "white",
                    color: "#111827",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
            </div>

            {/* Champ mot de passe */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#374151",
                  fontSize: "14px",
                }}
              >
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "13px 48px 13px 44px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "15px",
                    background: "white",
                    color: "#111827",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
                {/* Bouton œil */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px",
                    color: "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Se souvenir du nom d'utilisateur */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "28px",
              }}
            >
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "#7c3aed",
                }}
              />
              <label
                htmlFor="rememberMe"
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                Se souvenir de mon nom d'utilisateur
              </label>
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: loading
                  ? "#a5b4fc"
                  : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                letterSpacing: "0.3px",
                boxShadow: loading ? "none" : "0 4px 14px rgba(124, 58, 237, 0.35)",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  Connexion en cours…
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* Note de bas de page */}
          <p
            style={{
              marginTop: "28px",
              textAlign: "center",
              fontSize: "13px",
              color: "#9ca3af",
              lineHeight: "1.5",
            }}
          >
            Première connexion ? Contactez votre administrateur.
          </p>
        </div>
      </div>

      {/* ═══ Styles globaux (animations + responsive) ═══ */}
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .login-left-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
