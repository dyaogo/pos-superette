import React, { useEffect, useRef, useState } from 'react';

const BarcodeScanner = ({ onDetected, onClose }) => {
  const videoRef = useRef(null);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let stream;
    const startScan = async () => {
      try {
        if (!('BarcodeDetector' in window)) {
          setError('Scanner non supporté');
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new window.BarcodeDetector({ formats: ['ean_13', 'code_128', 'upc_e', 'ean_8'] });
        const scan = async () => {
          if (!videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              onDetected(barcodes[0].rawValue);
            } else {
              requestAnimationFrame(scan);
            }
          } catch (err) {
            setError('Erreur de lecture');
          }
        };
        requestAnimationFrame(scan);
      } catch (err) {
        setError('Accès caméra refusé');
      }
    };

    startScan();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [onDetected]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      {error ? (
        <p style={{ color: '#fff', marginBottom: '10px' }}>{error}</p>
      ) : (
        <video ref={videoRef} style={{ width: '80%', maxWidth: '400px' }} />
      )}
      <input
        type="text"
        placeholder="Entrer le code manuellement"
        value={manualCode}
        onChange={(e) => setManualCode(e.target.value)}
        style={{ marginTop: '10px', padding: '8px', width: '80%', maxWidth: '300px' }}
      />
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => manualCode && onDetected(manualCode)}
          style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Valider
        </button>
        <button
          onClick={onClose}
          style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;

