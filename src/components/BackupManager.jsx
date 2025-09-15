// 📁 Créer nouveau fichier : src/components/BackupManager.jsx

import React, { useState, useEffect } from 'react';
import { 
  Download, Upload, RotateCcw, Settings, Clock, 
  CheckCircle, AlertCircle, Database, Calendar 
} from 'lucide-react';
import BackupService from '../services/BackupService';

const BackupManager = ({ isDark = false }) => {
  const [backupService] = useState(() => new BackupService());
  const [backupStatus, setBackupStatus] = useState(null);
  const [availableBackups, setAvailableBackups] = useState([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadBackupInfo();
  }, []);

  const loadBackupInfo = () => {
    setBackupStatus(backupService.getBackupStatus());
    setAvailableBackups(backupService.getAvailableBackups());
  };

  const handleDownloadBackup = () => {
    const success = backupService.downloadBackup();
    if (success) {
      showMessage('Backup téléchargé avec succès !', 'success');
    } else {
      showMessage('Erreur lors du téléchargement', 'error');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsRestoring(true);
    
    backupService.restoreFromFile(file)
      .then(result => {
        if (result.success) {
          showMessage('Données restaurées ! Rechargez la page.', 'success');
          setTimeout(() => window.location.reload(), 2000);
        } else {
          showMessage(result.message, 'error');
        }
      })
      .finally(() => {
        setIsRestoring(false);
        event.target.value = ''; // Reset input
      });
  };

  const handleRestoreAutoBackup = (backupKey) => {
    if (!window.confirm('Restaurer ce backup ? Les données actuelles seront remplacées.')) {
      return;
    }

    setIsRestoring(true);
    const result = backupService.restoreAutoBackup(backupKey);
    
    if (result.success) {
      showMessage('Backup restauré ! Rechargement...', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showMessage(result.message, 'error');
    }
    
    setIsRestoring(false);
  };

  const handleToggleAutoBackup = () => {
    const newState = !backupStatus.enabled;
    backupService.setBackupEnabled(newState);
    setBackupStatus(prev => ({ ...prev, enabled: newState }));
    showMessage(
      newState ? 'Backup automatique activé' : 'Backup automatique désactivé',
      'success'
    );
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('fr-FR');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  if (!backupStatus) return <div>Chargement...</div>;

  return (
    <div style={{
      background: isDark ? '#2d3748' : 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      color: isDark ? '#f7fafc' : '#2d3748'
    }}>
      {/* En-tête */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '24px' 
      }}>
        <Database size={24} color={isDark ? '#63b3ed' : '#3182ce'} />
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
          Sauvegarde & Restauration
        </h2>
      </div>

      {/* Message de notification */}
      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          background: message.type === 'success' 
            ? (isDark ? '#2d5a27' : '#f0fff4')
            : (isDark ? '#5a2d2d' : '#fff5f5'),
          border: `1px solid ${message.type === 'success' ? '#68d391' : '#f56565'}`,
          color: message.type === 'success' ? '#68d391' : '#f56565',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Statut du backup automatique */}
      <div style={{
        background: isDark ? '#4a5568' : '#f7fafc',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px' 
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            Backup Automatique
          </h3>
          <button
            onClick={handleToggleAutoBackup}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: backupStatus.enabled ? '#48bb78' : '#a0aec0',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {backupStatus.enabled ? 'Activé' : 'Désactivé'}
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#718096' }}>
          <Clock size={14} />
          <span style={{ fontSize: '14px' }}>
            {backupStatus.lastBackup 
              ? `Dernier backup : ${formatDate(backupStatus.lastBackup)}`
              : 'Aucun backup automatique encore créé'
            }
          </span>
        </div>
        
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#a0aec0' }}>
          💡 Backup automatique toutes les 30 minutes (quand l'app est ouverte)
        </div>
      </div>

      {/* Actions principales */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Télécharger backup */}
        <button
          onClick={handleDownloadBackup}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <Download size={16} />
          Télécharger Backup
        </button>

        {/* Restaurer depuis fichier */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          background: isDark ? '#4a5568' : '#e2e8f0',
          color: isDark ? '#f7fafc' : '#2d3748',
          border: 'none',
          borderRadius: '8px',
          cursor: isRestoring ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          opacity: isRestoring ? 0.6 : 1
        }}>
          <Upload size={16} />
          {isRestoring ? 'Restauration...' : 'Restaurer Fichier'}
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            disabled={isRestoring}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Liste des backups automatiques */}
      {availableBackups.length > 0 && (
        <div>
          <h3 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '16px', 
            fontWeight: '600' 
          }}>
            Backups Automatiques ({availableBackups.length})
          </h3>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {availableBackups.map((backup, index) => (
              <div
                key={backup.key}
                style={{
                  background: isDark ? '#4a5568' : '#f7fafc',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>
                    {backup.type} - {formatDate(backup.date)}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#718096',
                    marginTop: '4px' 
                  }}>
                    {backup.stats?.totalProducts || 0} produits • {' '}
                    {backup.stats?.totalSales || 0} ventes • {' '}
                    {formatFileSize(backup.size)}
                  </div>
                </div>
                
                <button
                  onClick={() => handleRestoreAutoBackup(backup.key)}
                  disabled={isRestoring}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: '#ed8936',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isRestoring ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    opacity: isRestoring ? 0.6 : 1
                  }}
                >
                  <RotateCcw size={12} />
                  Restaurer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info utiles */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: isDark ? '#1a365d' : '#ebf8ff',
        borderRadius: '8px',
        fontSize: '12px',
        color: isDark ? '#63b3ed' : '#3182ce'
      }}>
        💡 <strong>Conseils :</strong>
        <ul style={{ margin: '8px 0 0 16px', paddingLeft: 0 }}>
          <li>Téléchargez un backup manuel avant les mises à jour importantes</li>
          <li>Les backups automatiques se font en arrière-plan toutes les 30 minutes</li>
          <li>Seuls les 5 derniers backups automatiques sont conservés</li>
          <li>Utilisez "Restaurer" pour revenir à un état antérieur</li>
        </ul>
      </div>
    </div>
  );
};

export default BackupManager;
