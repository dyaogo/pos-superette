import api from './api';

const SALES_KEY = 'pos_sales';
const CREDITS_KEY = 'pos_credits';

export function getSales() {
  return JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
}

export function saveSales(sales) {
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
}

export async function fetchSales() {
  const sales = await api.get('/sales');
  saveSales(sales);
  return sales;
}

export async function recordSale(sale) {
  const sales = getSales();
  sales.push(sale);
  saveSales(sales);
  try {
    await api.post('/sales', sale);
  } catch (e) {
    console.warn('API recordSale failed', e);
  }
  return sale;
}

export function getCredits() {
  return JSON.parse(localStorage.getItem(CREDITS_KEY) || '[]');
}

export function saveCredits(credits) {
  localStorage.setItem(CREDITS_KEY, JSON.stringify(credits));
}

export async function addCredit(credit) {
  const credits = getCredits();
  credits.push(credit);
  saveCredits(credits);
  try {
    await api.post('/credits', credit);
  } catch (e) {
    console.warn('API addCredit failed', e);
  }
  return credit;
}

export async function updateCredit(credit) {
  const credits = getCredits().map(c => (c.id === credit.id ? credit : c));
  saveCredits(credits);
  try {
    await api.put(`/credits/${credit.id}`, credit);
  } catch (e) {
    console.warn('API updateCredit failed', e);
  }
  return credit;
}

