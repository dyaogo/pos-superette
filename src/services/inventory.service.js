import api from './api';

const INVENTORY_KEY = 'pos_inventory_history';

export function getInventoryHistory() {
  return JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]');
}

export function saveInventoryHistory(history) {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(history));
}

export async function addInventoryRecord(record) {
  const history = getInventoryHistory();
  history.push(record);
  saveInventoryHistory(history);
  try {
    await api.post('/inventory', record);
  } catch (e) {
    console.warn('API addInventoryRecord failed', e);
  }
  return record;
}

