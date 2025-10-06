import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  hasNext, 
  hasPrev 
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      marginTop: '20px',
      padding: '20px'
    }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev}
        style={{
          padding: '8px 12px',
          background: hasPrev ? 'var(--color-surface)' : 'var(--color-surface-hover)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          cursor: hasPrev ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: 'var(--color-text-primary)'
        }}
      >
        <ChevronLeft size={16} />
        Précédent
      </button>

      <span style={{ 
        padding: '8px 16px',
        color: 'var(--color-text-secondary)',
        fontWeight: '500'
      }}>
        Page {currentPage} sur {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        style={{
          padding: '8px 12px',
          background: hasNext ? 'var(--color-surface)' : 'var(--color-surface-hover)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          cursor: hasNext ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: 'var(--color-text-primary)'
        }}
      >
        Suivant
        <ChevronRight size={16} />
      </button>
    </div>
  );
}