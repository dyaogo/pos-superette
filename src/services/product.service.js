import api from './api';

const STORAGE_KEY = 'pos_products';

export function getProducts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

export function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export async function fetchProducts() {
  const products = await api.get('/products');
  saveProducts(products);
  return products;
}

export async function addProduct(product) {
  const products = getProducts();
  products.push(product);
  saveProducts(products);
  try {
    await api.post('/products', product);
  } catch (e) {
    console.warn('API addProduct failed', e);
  }
  return product;
}

export async function updateProduct(product) {
  const products = getProducts().map(p => (p.id === product.id ? product : p));
  saveProducts(products);
  try {
    await api.put(`/products/${product.id}`, product);
  } catch (e) {
    console.warn('API updateProduct failed', e);
  }
  return product;
}

export async function deleteProduct(id) {
  const products = getProducts().filter(p => p.id !== id);
  saveProducts(products);
  try {
    await api.delete(`/products/${id}`);
  } catch (e) {
    console.warn('API deleteProduct failed', e);
  }
}

