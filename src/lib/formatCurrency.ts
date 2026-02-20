/**
 * Formats a number as Angolan Kwanza currency.
 * Example: formatAKZ(10000) => "Akz 10 000,00"
 */
export function formatAKZ(value: number): string {
  const formatted = value.toLocaleString("pt-AO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Akz ${formatted}`;
}

/**
 * Short format for compact display.
 * Example: formatAKZShort(10000) => "Akz 10 000"
 */
export function formatAKZShort(value: number): string {
  const formatted = value.toLocaleString("pt-AO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `Akz ${formatted}`;
}
