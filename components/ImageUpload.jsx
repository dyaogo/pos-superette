import { useState } from 'react';
import { Upload, X, Camera } from 'lucide-react';

// Component for uploading product images (uses base64 storage)
// TODO: Migrate to Vercel Blob Storage for better performance
export default function ImageUpload({ value, onChange, label = "Image du produit" }) {
  const [preview, setPreview] = useState(value || '');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('L\'image est trop grande. Maximum 2MB.');
        return;
      }

      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        alert('Le fichier doit être une image.');
        return;
      }

      // Convertir en base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setPreview(base64String);
        onChange(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
  };

  return (
    <div style={{ marginBottom: '15px' }}>
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
              border: '2px solid var(--color-border)'
            }}
          />
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