import { useState } from 'react';
import { Upload, X, Camera, Loader2 } from 'lucide-react';

export default function ImageUpload({ value, onChange, label = "Image du produit" }) {
  const [preview, setPreview] = useState(value || '');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier la taille (max 5MB pour Vercel Blob)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image est trop grande. Maximum 5MB.');
        return;
      }

      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        alert('Le fichier doit être une image.');
        return;
      }

      setUploading(true);

      try {
        // Convertir en base64 pour l'aperçu ET l'upload
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result;
          setPreview(base64String); // Aperçu immédiat

          try {
            // Upload vers Vercel Blob
            const response = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                file: base64String,
                filename: file.name
              })
            });

            if (!response.ok) {
              let errorMessage = `Erreur ${response.status}`;
              try {
                const error = await response.json();
                errorMessage = error.details || error.error || errorMessage;
              } catch (e) {
                // Si la réponse n'est pas du JSON, lire le texte brut
                try {
                  const text = await response.text();
                  errorMessage = text.substring(0, 200); // Limiter à 200 caractères
                } catch (e2) {
                  errorMessage = `Erreur HTTP ${response.status}`;
                }
              }
              console.error('❌ Erreur upload API:', errorMessage);
              throw new Error(errorMessage);
            }

            const data = await response.json();

            // Retourner l'URL Vercel Blob au lieu du base64
            onChange(data.url);
            console.log('✅ Image uploadée:', data.url);

          } catch (error) {
            console.error('❌ Erreur upload:', error);
            alert(`Erreur lors de l'upload: ${error.message}`);
            setPreview('');
          } finally {
            setUploading(false);
          }
        };
        reader.readAsDataURL(file);

      } catch (error) {
        console.error('❌ Erreur lecture fichier:', error);
        alert('Erreur lors de la lecture du fichier');
        setUploading(false);
      }
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
        {label}
      </label>

      {preview ? (
        <div style={{ position: 'relative', width: '200px' }}>
          <img
            src={preview}
            alt="Aperçu"
            style={{
              width: '200px',
              height: '200px',
              objectFit: 'cover',
              borderRadius: '12px',
              border: '2px solid var(--color-border)',
              opacity: uploading ? 0.5 : 1
            }}
          />
          {uploading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '14px' }}>Upload...</span>
            </div>
          )}
          {!uploading && (
            <button
              onClick={handleRemove}
              type="button"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>
      ) : (
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '200px',
            height: '200px',
            border: '2px dashed var(--color-border)',
            borderRadius: '12px',
            cursor: 'pointer',
            background: 'var(--color-surface-hover)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.background = 'var(--color-surface)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.background = 'var(--color-surface-hover)';
          }}
        >
          <Camera size={48} style={{ color: 'var(--color-text-secondary)', marginBottom: '12px' }} />
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            Cliquez pour ajouter<br />une image
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Max 2MB
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
      )}
    </div>
  );
}