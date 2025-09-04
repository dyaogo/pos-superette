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

// Stock par magasin { [productId]: quantity }
export const loadInventory = (storeId) => {
  if (!storeId) return {};
  try {
    const data = localStorage.getItem(`pos_${storeId}_stock`);
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.warn("Erreur de chargement de l'inventaire:", err);
    return {};
  }
};

export const saveInventory = (storeId, stock) => {
  if (!storeId) return;
  try {
    localStorage.setItem(`pos_${storeId}_stock`, JSON.stringify(stock));
  } catch (err) {
    console.warn("Erreur de sauvegarde de l'inventaire:", err);
  }
};
