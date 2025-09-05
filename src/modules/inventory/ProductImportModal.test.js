import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import * as XLSX from 'xlsx';
import ProductImportModal from './ProductImportModal';

const mockAddProduct = jest.fn();
const mockAddStock = jest.fn();

jest.mock('../../contexts/AppContext', () => ({
  useApp: () => ({
    addProduct: mockAddProduct,
    addStock: mockAddStock,
    appSettings: { darkMode: false },
    stores: [
      { id: 'wend-kuuni', code: 'WK001', name: 'Wend-Kuuni' },
      { id: 'wend-yam', code: 'WY002', name: 'Wend-Yam' }
    ],
    currentStoreId: 'wend-kuuni'
  })
}));

describe('ProductImportModal', () => {
  beforeEach(() => {
    mockAddProduct.mockClear();
    mockAddStock.mockClear();
  });

  test('imports stocks for multiple stores', async () => {
    const headers = ['name','category','price','costPrice','minStock','stock_WK001','stock_WY002'];
    const data = [
      headers,
      ['Produit A','Cat','100','50','5','10','20']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produits');
    const binary = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

    global.FileReader = class {
      constructor() { this.onload = null; }
      readAsBinaryString() { this.onload({ target: { result: binary } }); }
    };

    const file = new Blob(['']);
    file.name = 'import.xlsx';

    const { container, getByText } = render(<ProductImportModal isOpen={true} onClose={() => {}} />);
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(getByText('Importer'));

    await waitFor(() => expect(mockAddProduct).toHaveBeenCalledTimes(1));
    expect(mockAddProduct.mock.calls[0][1]).toBe(10);
    expect(mockAddStock).toHaveBeenCalledWith('wend-yam', expect.any(Number), 20, 'Import initial');
  });
});
