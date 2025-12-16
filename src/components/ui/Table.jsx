// Composant Table standardisé avec styles cohérents

export function Table({ children, className = '' }) {
  return (
    <div className={`table-container ${className}`}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }) {
  return (
    <thead>
      <tr className="bg-hover border">
        {children}
      </tr>
    </thead>
  );
}

export function TableHeaderCell({ children, align = 'left', className = '' }) {
  return (
    <th className={`table-header ${className}`} style={{ textAlign: align }}>
      {children}
    </th>
  );
}

export function TableBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children, className = '', onClick }) {
  return (
    <tr
      className={`table-row ${className} ${onClick ? 'cursor-pointer transition' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, align = 'left', className = '' }) {
  return (
    <td className={`table-cell ${className}`} style={{ textAlign: align }}>
      {children}
    </td>
  );
}

// Export par défaut avec sous-composants
const TableComponent = Table;
TableComponent.Header = TableHeader;
TableComponent.HeaderCell = TableHeaderCell;
TableComponent.Body = TableBody;
TableComponent.Row = TableRow;
TableComponent.Cell = TableCell;

export default TableComponent;
