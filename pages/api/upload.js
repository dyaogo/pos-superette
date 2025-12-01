import { put } from '@vercel/blob';
import { withRateLimit, RATE_LIMITS } from '../../lib/rateLimit';

// ⚙️ Configuration Next.js pour accepter les fichiers
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb', // Limite de 5MB par fichier
    },
  },
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vérifier que le token Vercel Blob est configuré
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN non configuré');
      return res.status(500).json({
        error: 'Configuration manquante',
        details: 'Le token Vercel Blob n\'est pas configuré'
      });
    }

    const { file, filename } = req.body;

    // Validation du fichier
    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    if (!filename) {
      return res.status(400).json({ error: 'Nom de fichier manquant' });
    }

    // Vérifier que c'est une image en base64
    if (!file.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Le fichier doit être une image' });
    }

    // Extraire le type MIME et les données base64
    const matches = file.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Format de fichier invalide' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Convertir base64 en Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Vérifier la taille (max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        error: 'Fichier trop volumineux',
        details: 'La taille maximale est de 5MB'
      });
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobFilename = `products/${timestamp}-${sanitizedFilename}`;

    console.log(`📤 Upload vers Vercel Blob: ${blobFilename} (${(buffer.length / 1024).toFixed(2)} KB)`);

    // Upload vers Vercel Blob
    const blob = await put(blobFilename, buffer, {
      access: 'public',
      contentType: mimeType,
    });

    console.log(`✅ Image uploadée: ${blob.url}`);

    res.status(200).json({
      url: blob.url,
      size: buffer.length,
      contentType: mimeType
    });

  } catch (error) {
    console.error('❌ Erreur upload:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'upload',
      details: error.message
    });
  }
}

// 🚦 RATE LIMITING : 30 uploads par minute
export default withRateLimit(handler, RATE_LIMITS.write);
