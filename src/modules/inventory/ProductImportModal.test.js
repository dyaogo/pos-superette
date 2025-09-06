import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import * as XLSX from 'xlsx';
import ProductImportModal from './ProductImportModal';

const mockAddProduct = jest.fn();
const mockAddStock = jest.fn();
const mockSetStockForStore = jest.fn();

let mockProductCatalog = [];
let mockStockByStore = {};

jest.mock('../../contexts/AppContext', () => ({
  useApp: () => ({
    addProduct: mockAddProduct,
    addStock: mockAddStock,
    setStockForStore: mockSetStockForStore,
    productCatalog: mockProductCatalog,
    stockByStore: mockStockByStore,
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
    mockSetStockForStore.mockClear();
    mockProductCatalog = [];
    mockStockByStore = {};
  });

  test('imports stocks for multiple stores', async () => {
    const headers = ['sku','name','category','price','costPrice','minStock','stock_WK001','stock_WY002'];
    const data = [
      headers,
      ['SKU001','Produit A','Cat','100','50','5','10','20']
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

  test('updates stock for existing product with same SKU', async () => {
    mockProductCatalog = [{ id: 1, sku: 'SKU001', name: 'Produit A' }];
    mockStockByStore = {
      'wend-kuuni': { 1: 0 },
      'wend-yam': { 1: 0 }
    };

    const headers = ['sku','name','category','price','costPrice','minStock','stock_WK001','stock_WY002'];
    const data = [
      headers,
      ['SKU001','','','','','','7','9']
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

    await waitFor(() => expect(mockSetStockForStore).toHaveBeenCalledTimes(2));
    expect(mockAddProduct).not.toHaveBeenCalled();
    expect(mockAddStock).not.toHaveBeenCalled();
    expect(mockSetStockForStore).toHaveBeenCalledWith('wend-kuuni', { 1: 7 });
    expect(mockSetStockForStore).toHaveBeenCalledWith('wend-yam', { 1: 9 });
  });

  test('refuses import when duplicate SKUs are present', async () => {
    window.alert = jest.fn();

    const headers = ['sku','name','category','price','costPrice','minStock','stock_WK001','stock_WY002'];
    const data = [
      headers,
      ['SKU001','Produit A','Cat','100','50','5','10','0'],
      ['SKU001','Produit B','Cat','100','50','5','5','0']
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

    await waitFor(() => expect(window.alert).toHaveBeenCalled());
    expect(mockAddProduct).not.toHaveBeenCalled();
    expect(mockAddStock).not.toHaveBeenCalled();
    expect(mockSetStockForStore).not.toHaveBeenCalled();
    expect(window.alert.mock.calls[0][0]).toMatch(/dupliqué/);
  });
});
