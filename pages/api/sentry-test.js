export default function handler(req, res) {
  throw new Error("Test Sentry API");
  res.status(200).json({ success: true });
}
