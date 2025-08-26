import React from 'react';

/**
 * Minimal data table component.
 */
const DataTable = ({ columns = [], data = [] }) => {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col} style={styles.th}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={col} style={styles.td}>
                {row[col]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const styles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    border: '1px solid #e5e7eb',
    padding: '0.5rem',
    textAlign: 'left',
    background: '#f1f5f9'
  },
  td: {
    border: '1px solid #e5e7eb',
    padding: '0.5rem'
  }
};

export default DataTable;

