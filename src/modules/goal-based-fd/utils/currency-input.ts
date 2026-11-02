/**
 * Keeps the editable part of a currency field deliberately boring: digits.
 *
 * Business logic receives the returned digits, never a formatted currency
 * string. The display helpers below preserve the number of typed digits before
 * the caret, so inserting or deleting a comma cannot move the cursor.
 */
export function normaliseCurrencyDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 12);
}

export function formatCurrencyDigits(digits: string): string {
  if (digits === '') return '';
  return new Intl.NumberFormat('en-IN').format(Number(digits));
}

/** Finds the position after the same count of numeric characters in formatted text. */
export function currencyCaretPosition(formatted: string, digitCount: number): number {
  if (digitCount <= 0) return 0;

  let seen = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (/\d/.test(formatted[index] ?? '')) seen += 1;
    if (seen === digitCount) return index + 1;
  }

  return formatted.length;
}
