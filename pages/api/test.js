export default function handler(req, res) {
  res.status(200).json({ message: 'API fonctionne!', method: req.method });
}