const integerFormatter = new Intl.NumberFormat("es-EC");

const percentFormatter = new Intl.NumberFormat("es-EC", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const currencyFormatters = new Map<string, Intl.NumberFormat>();
const currencyPreciseFormatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("es-EC", { style: "currency", currency, maximumFractionDigits: 0 });
    currencyFormatters.set(currency, formatter);
  }
  return formatter;
}

function getCurrencyPreciseFormatter(currency: string): Intl.NumberFormat {
  let formatter = currencyPreciseFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("es-EC", { style: "currency", currency, maximumFractionDigits: 2 });
    currencyPreciseFormatters.set(currency, formatter);
  }
  return formatter;
}

/**
 * `currency` es el código ISO de 3 letras (USD, COP, PEN, ...) de la cuenta
 * publicitaria dueña del dato que se está mostrando — nunca asumir USD para
 * todo el dashboard, cada cuenta de Meta tiene su propia moneda configurada.
 */
export function formatCurrency(value: number, currency = "USD"): string {
  try {
    return getCurrencyFormatter(currency).format(value);
  } catch {
    return getCurrencyFormatter("USD").format(value);
  }
}

export function formatCurrencyPrecise(value: number, currency = "USD"): string {
  try {
    return getCurrencyPreciseFormatter(currency).format(value);
  } catch {
    return getCurrencyPreciseFormatter("USD").format(value);
  }
}

export function formatInteger(value: number): string {
  return integerFormatter.format(Math.round(value));
}

export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return integerFormatter.format(Math.round(value));
}

export function formatDelta(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDateShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("es-EC", { day: "numeric", month: "short" });
}

export function formatDateLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" });
}
