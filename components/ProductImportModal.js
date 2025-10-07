import { useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle, X, ArrowRight } from 'lucide-react';

export default function ProductImportModal({ isOpen, onClose, onImportSuccess, productCatalog, addProduct }) {
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importResults, setImportResults] = useState({ success: 0, errors: 0 });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const downloadTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      
      const templateData = [
        {
          'Nom': 'Coca-Cola 33cl',
          'Catégorie': 'Boissons',
          'Code-barres': '5449000000996',
          'Prix Achat (FCFA)': 300,
          'Prix Vente (FCFA)': 500,
          'Stock Initial': 50
        },
        {
          'Nom': 'Pain blanc',
          'Catégorie': 'Alimentaire',
          'Code-barres': '1234567890123',
          'Prix Achat (FCFA)': 150,
          'Prix Vente (FCFA)': 250,
          'Stock Initial': 30
        },
        {
          'Nom': 'Savon Lux',
          'Catégorie': 'Hygiène',
          'Code-barres': '8901030789458',
          'Prix Achat (FCFA)': 400,
          'Prix Vente (FCFA)': 650,
          'Stock Initial': 25
        }
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData);

      worksheet['!cols'] = [
        { wch: 25 }, { wch: 15 }, { wch: 18 }, 
        { wch: 18 }, { wch: 18 }, { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits');

      const instructions = [
        ['INSTRUCTIONS POUR L\'IMPORT DE PRODUITS'],
        [''],
        ['Colonnes requises:', ''],
        ['1. Nom', 'Nom du produit (obligatoire)'],
        ['2. Catégorie', 'Catégorie du produit (obligatoire)'],
        ['3. Code-barres', 'Code-barres (optionnel)'],
        ['4. Prix Achat (FCFA)', 'Prix d\'achat en FCFA (obligatoire)'],
        ['5. Prix Vente (FCFA)', 'Prix de vente en FCFA (obligatoire)'],
        ['6. Stock Initial', 'Quantité en stock (optionnel, défaut: 0)'],
        [''],
        ['RÈGLES:'],
        ['- Le prix de vente doit être supérieur au prix d\'achat'],
        ['- Les prix doivent être des nombres positifs'],
        ['- Le nom et la catégorie sont obligatoires'],
        ['- Les codes-barres doivent être uniques']
      ];

      const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
      instructionsSheet['!cols'] = [{ wch: 25 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

      XLSX.writeFile(workbook, 'template_import_produits.xlsx');
    } catch (error) {
      alert('Erreur : ' + error.message);
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);
    setErrors([]);

    try {
      const XLSX = await import('xlsx');
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const validationErrors = [];
      const validData = [];

      jsonData.forEach((row, index) => {
        const rowNumber = index + 2;
        const rowErrors = [];

        if (!row['Nom'] || row['Nom'].toString().trim() === '') {
          rowErrors.push(`Ligne ${rowNumber}: Nom manquant`);
        }

        if (!row['Catégorie'] || row['Catégorie'].toString().trim() === '') {
          rowErrors.push(`Ligne ${rowNumber}: Catégorie manquante`);
        }

        const prixAchat = parseFloat(row['Prix Achat (FCFA)']);
        const prixVente = parseFloat(row['Prix Vente (FCFA)']);

        if (!prixAchat || prixAchat <= 0) {
          rowErrors.push(`Ligne ${rowNumber}: Prix d'achat invalide`);
        }

        if (!prixVente || prixVente <= 0) {
          rowErrors.push(`Ligne ${rowNumber}: Prix de vente invalide`);
        }

        if (prixVente && prixAchat && prixVente <= prixAchat) {
          rowErrors.push(`Ligne ${rowNumber}: Prix de vente doit être supérieur au prix d'achat`);
        }

        if (row['Code-barres']) {
          const barcode = row['Code-barres'].toString();
          const existingProduct = productCatalog.find(p => p.barcode === barcode);
          if (existingProduct) {
            rowErrors.push(`Ligne ${rowNumber}: Code-barres déjà existant (${existingProduct.name})`);
          }
          
          const duplicateInFile = validData.find(p => p.barcode === barcode);
          if (duplicateInFile) {
            rowErrors.push(`Ligne ${rowNumber}: Code-barres dupliqué dans le fichier`);
          }
        }

        if (rowErrors.length > 0) {
          validationErrors.push(...rowErrors);
        } else {
          validData.push({
            name: row['Nom'].toString().trim(),
            category: row['Catégorie'].toString().trim(),
            barcode: row['Code-barres'] ? row['Code-barres'].toString() : null,
            costPrice: prixAchat,
            sellingPrice: prixVente,
            stock: parseInt(row['Stock Initial']) || 0
          });
        }
      });

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setStep('upload');
      } else {
        setPreviewData(validData);
        setStep('preview');
      }
    } catch (error) {
      alert('Erreur lecture du fichier : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setStep('importing');
    setLoading(true);

    let successCount = 0;
    let errorCount = 0;

    for (const product of previewData) {
      try {
        const result = await addProduct(product);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    setImportResults({ success: successCount, errors: errorCount });
    setStep('success');
    setLoading(false);
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setImportResults({ success: 0, errors: 0 });
  };

  const handleClose = () => {
    if (step === 'success' && importResults.success > 0) {
      onImportSuccess();
    }
    reset();
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          padding: '30px',
          width: '90%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Upload size={24} />
            Import Excel
          </h2>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Contenu selon l'étape */}
        {step === 'upload' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Téléchargez le template, remplissez-le, puis importez-le
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              <button
                onClick={downloadTemplate}
                style={{
                  padding: '12px 24px',
                  background: 'var(--color-success)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600'
                }}
              >
                <Download size={20} />
                Télécharger le Template
              </button>

              <div style={{ width: '100%', height: '1px', background: 'var(--color-border)', margin: '10px 0' }} />

              <div style={{ width: '100%' }}>
                <label
                  style={{
                    display: 'block',
                    padding: '40px',
                    border: '2px dashed var(--color-border)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'var(--color-bg)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.background = 'var(--color-bg)';
                  }}
                >
                  <Upload size={40} color="var(--color-primary)" style={{ marginBottom: '10px' }} />
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '5px' }}>
                    {file ? file.name : 'Choisir un fichier Excel'}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    .xlsx ou .xls
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {errors.length > 0 && (
                <div style={{
                  width: '100%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <AlertTriangle size={20} color="var(--color-danger)" />
                    <strong style={{ color: 'var(--color-danger)' }}>
                      {errors.length} erreur(s) détectée(s)
                    </strong>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-danger)', fontSize: '14px' }}>
                    {errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {errors.length > 5 && (
                      <li style={{ fontStyle: 'italic' }}>... et {errors.length - 5} autre(s)</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {previewData.length} produit(s) prêt(s) à être importé(s)
              </p>
            </div>

            <div style={{ 
              maxHeight: '400px', 
              overflow: 'auto',
              marginBottom: '20px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--color-bg)', zIndex: 1 }}>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '14px' }}>Nom</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '14px' }}>Catégorie</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>Prix Achat</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>Prix Vente</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontSize: '14px' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((product, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px', fontSize: '14px' }}>{product.name}</td>
                      <td style={{ padding: '10px', fontSize: '14px' }}>{product.category}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>
                        {product.costPrice.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>
                        {product.sellingPrice.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', fontSize: '14px' }}>
                        {product.stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={reset}
                style={{
                  padding: '10px 20px',
                  background: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Retour
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600'
                }}
              >
                Importer {previewData.length} produit(s)
                <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}

        {step === 'importing' && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="skeleton" style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%',
              margin: '0 auto 20px'
            }} />
            <h3>Import en cours...</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>Veuillez patienter</p>
          </div>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <CheckCircle size={60} color="var(--color-success)" style={{ marginBottom: '20px' }} />
            <h3 style={{ marginBottom: '15px' }}>Import terminé !</h3>
            
            <div style={{ 
              display: 'inline-block',
              background: 'var(--color-bg)',
              padding: '15px 30px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '16px' }}>
                ✅ <strong>{importResults.success}</strong> produit(s) importé(s)
              </div>
              {importResults.errors > 0 && (
                <div style={{ fontSize: '16px', color: 'var(--color-danger)', marginTop: '5px' }}>
                  ❌ <strong>{importResults.errors}</strong> erreur(s)
                </div>
              )}
            </div>

            <div>
              <button
                onClick={handleClose}
                style={{
                  padding: '12px 24px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Terminer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}