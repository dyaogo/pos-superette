/**
 * Utilitaires pour le formatage des montants en FCFA
 * Le Franc CFA n'utilise pas de décimales
 */

/**
 * Formate un montant en FCFA (sans décimaux)
 * @param {number} amount - Montant à formater
 * @param {boolean} withCurrency - Inclure "FCFA" dans le résultat
 * @returns {string} Montant formaté
 */
export function formatCFA(amount, withCurrency = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return withCurrency ? '0 FCFA' : '0';
  }

  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('fr-FR');

  return withCurrency ? `${formatted} FCFA` : formatted;
}

/**
 * Formate un montant de manière compacte (K, M, B)
 * @param {number} amount - Montant à formater
 * @param {boolean} withCurrency - Inclure "FCFA" dans le résultat
 * @returns {string} Montant formaté de manière compacte
 */
export function formatCFACompact(amount, withCurrency = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return withCurrency ? '0 FCFA' : '0';
  }

  const rounded = Math.round(amount);
  let formatted;

  if (rounded >= 1000000000) {
    formatted = (rounded / 1000000000).toFixed(0) + 'B';
  } else if (rounded >= 1000000) {
    formatted = (rounded / 1000000).toFixed(0) + 'M';
  } else if (rounded >= 1000) {
    formatted = (rounded / 1000).toFixed(0) + 'K';
  } else {
    formatted = rounded.toString();
  }

  return withCurrency ? `${formatted} FCFA` : formatted;
}

/**
 * Parse un montant saisi par l'utilisateur
 * @param {string|number} value - Valeur à parser
 * @returns {number} Montant parsé (arrondi)
 */
export function parseCFA(value) {
  if (typeof value === 'number') {
    return Math.round(value);
  }

  if (typeof value === 'string') {
    // Enlever les espaces, les points et "FCFA"
    const cleaned = value.replace(/\s/g, '').replace(/\./g, '').replace(/FCFA/gi, '').replace(/,/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

/**
 * Formate un pourcentage
 * @param {number} value - Valeur du pourcentage
 * @param {number} decimals - Nombre de décimales (défaut: 1)
 * @returns {string} Pourcentage formaté
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${value.toFixed(decimals)}%`;
}

/**
 * Calcule un pourcentage
 * @param {number} part - Partie
 * @param {number} total - Total
 * @param {number} decimals - Nombre de décimales (défaut: 1)
 * @returns {string} Pourcentage formaté
 */
export function calculatePercent(part, total, decimals = 1) {
  if (!total || total === 0) {
    return '0%';
  }

  const percent = (part / total) * 100;
  return formatPercent(percent, decimals);
}
