/**
 * Reusable Currency Formatter for Pakistani Rupees (Rs)
 */

export function formatPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rs 0';
  }
  
  // Format with thousands separators (e.g., 2,499)
  const isWhole = Number.isInteger(amount);
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: isWhole ? 0 : (amount % 1 === 0 ? 0 : 2),
    maximumFractionDigits: 2,
  });

  return `Rs ${formatted}`;
}

export const formatCurrency = formatPrice;
