declare const centsBrand: unique symbol;

export type Cents = number & { readonly [centsBrand]: true };

export const CURRENCY = "MXN";
export const LOCALE = "es-MX";

export function toCents(value: number): Cents {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Cents must be a safe integer, received ${value}`);
  }
  return value as Cents;
}

const AMOUNT_PATTERN = /^-?\d{1,9}(\.\d{0,2})?$/;

export function parseAmount(input: string): Cents | null {
  const normalized = input.trim().replace(/[\s,$]/g, "");
  if (!AMOUNT_PATTERN.test(normalized)) return null;

  const negative = normalized.startsWith("-");
  const [integerPart, decimalPart = ""] = normalized.replace("-", "").split(".");
  const cents = Number(integerPart) * 100 + Number(decimalPart.padEnd(2, "0"));

  return toCents(negative ? -cents : cents);
}

const formatter = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY });

export function formatMoney(amount: Cents): string {
  return formatter.format(amount / 100);
}

export function subtractCents(a: Cents, b: Cents): Cents {
  return toCents(a - b);
}
