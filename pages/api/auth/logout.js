/**
 * 🔐 FIX #1 & #2 — Endpoint de déconnexion
 *
 * Supprime le cookie de session sécurisé (HttpOnly) côté serveur.
 * Comme le cookie est HttpOnly, il ne peut pas être supprimé directement
 * par JavaScript côté client — seul le serveur peut le faire.
 */

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Expirer le cookie de session (Max-Age=0 = suppression immédiate)
  res.setHeader("Set-Cookie", [
    "pos_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict",
  ]);

  return res.status(200).json({ success: true });
}
