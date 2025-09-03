export function getSuggestedAmounts(total) {
  const base = Math.ceil(total / 500) * 500; // arrondi au prochain 500
  return [base, base + 500, base + 1000, base + 2000];
}
