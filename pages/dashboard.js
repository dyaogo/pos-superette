// pages/dashboard.js - VERSION ULTRA MINIMALISTE POUR TEST
export async function getServerSideProps() {
  return {
    props: {
      timestamp: Date.now(),
      dateString: new Date().toISOString(),
    },
  };
}

export default function Dashboard({ timestamp, dateString }) {
  return (
    <div
      style={{
        padding: "50px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      {/* Badge ÉNORME en haut */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "40px",
          borderRadius: "20px",
          textAlign: "center",
          marginBottom: "40px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        }}
      >
        <h1 style={{ margin: "0 0 20px 0", fontSize: "48px" }}>🔥 TEST SSR</h1>
        <div
          style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "20px" }}
        >
          {new Date(timestamp).toLocaleTimeString("fr-FR")}
        </div>
        <div style={{ fontSize: "16px", opacity: 0.9 }}>
          Timestamp: {timestamp}
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          background: "#fff3cd",
          border: "2px solid #ffc107",
          padding: "30px",
          borderRadius: "15px",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ margin: "0 0 20px 0", color: "#856404" }}>
          📋 Instructions de Test
        </h2>
        <ol style={{ fontSize: "18px", lineHeight: "1.8", color: "#856404" }}>
          <li>
            <strong>Appuyez sur F5</strong> pour recharger la page
          </li>
          <li>
            <strong>L'heure ci-dessus DOIT changer</strong>
          </li>
          <li>
            <strong>Le timestamp DOIT changer</strong>
          </li>
        </ol>
      </div>

      {/* Détails */}
      <div
        style={{
          background: "#f8f9fa",
          padding: "30px",
          borderRadius: "15px",
          border: "1px solid #dee2e6",
        }}
      >
        <h3 style={{ margin: "0 0 20px 0" }}>Informations Techniques</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #dee2e6" }}>
              <td
                style={{ padding: "15px", fontWeight: "bold", width: "200px" }}
              >
                Date/Heure complète:
              </td>
              <td
                style={{
                  padding: "15px",
                  color: "#0066cc",
                  fontSize: "18px",
                  fontFamily: "monospace",
                }}
              >
                {new Date(dateString).toLocaleString("fr-FR")}
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #dee2e6" }}>
              <td style={{ padding: "15px", fontWeight: "bold" }}>
                Timestamp Unix:
              </td>
              <td
                style={{
                  padding: "15px",
                  color: "#0066cc",
                  fontSize: "18px",
                  fontFamily: "monospace",
                }}
              >
                {timestamp}
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #dee2e6" }}>
              <td style={{ padding: "15px", fontWeight: "bold" }}>
                ISO String:
              </td>
              <td
                style={{
                  padding: "15px",
                  color: "#0066cc",
                  fontSize: "14px",
                  fontFamily: "monospace",
                }}
              >
                {dateString}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "15px", fontWeight: "bold" }}>
                Statut SSR:
              </td>
              <td style={{ padding: "15px" }}>
                <span
                  style={{
                    background: "#28a745",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                  }}
                >
                  ✓ ACTIF
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Message final */}
      <div
        style={{
          marginTop: "40px",
          padding: "30px",
          background: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
          borderRadius: "15px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "18px",
            color: "#1a5a4a",
            fontWeight: "bold",
          }}
        >
          Si les valeurs ci-dessus changent à chaque F5, le SSR fonctionne ! 🎉
        </p>
      </div>
    </div>
  );
}
