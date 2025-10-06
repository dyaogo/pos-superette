export function validateProduct(product) {
  const errors = [];

  if (!product.name || product.name.trim().length === 0) {
    errors.push('Le nom du produit est requis');
  }

  if (!product.sellingPrice || product.sellingPrice <= 0) {
    errors.push('Le prix de vente doit être supérieur à 0');
  }

  if (product.costPrice && product.costPrice < 0) {
    errors.push('Le prix d\'achat ne peut pas être négatif');
  }

  if (product.stock && product.stock < 0) {
    errors.push('Le stock ne peut pas être négatif');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateCustomer(customer) {
  const errors = [];

  if (!customer.name || customer.name.trim().length === 0) {
    errors.push('Le nom du client est requis');
  }

  if (customer.phone && !/^\+?[0-9\s\-()]+$/.test(customer.phone)) {
    errors.push('Le numéro de téléphone n\'est pas valide');
  }

  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    errors.push('L\'adresse email n\'est pas valide');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateSale(sale) {
  const errors = [];

  if (!sale.items || sale.items.length === 0) {
    errors.push('La vente doit contenir au moins un article');
  }

  if (!sale.total || sale.total <= 0) {
    errors.push('Le montant total doit être supérieur à 0');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}