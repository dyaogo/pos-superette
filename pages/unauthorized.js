import { useRouter } from "next/router";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        padding: "20px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: "500px",
        }}
      >
        <div
          style={{
            width: "120px",
            height: "120px",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 30px",
            boxShadow: "0 20px 60px rgba(239, 68, 68, 0.3)",
          }}
        >
          <ShieldAlert size={60} color="white" />
        </div>

        <h1
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            marginBottom: "15px",
            color: "var(--color-text-primary)",
          }}
        >
          Accès refusé
        </h1>

        <p
          style={{
            fontSize: "16px",
            color: "var(--color-text-secondary)",
            marginBottom: "30px",
            lineHeight: "1.6",
          }}
        >
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          Contactez votre administrateur si vous pensez qu'il s'agit d'une
          erreur.
        </p>

        <button
          onClick={() => router.push("/dashboard")}
          style={{
            padding: "12px 30px",
            background: "var(--color-primary)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "16px",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "translateY(-2px)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = "translateY(0)")
          }
        >
          <ArrowLeft size={20} />
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
}
