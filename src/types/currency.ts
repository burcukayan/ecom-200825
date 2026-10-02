export enum Currency {
  EUR = "EUR",
  USD = "USD",
  TRY = "TRY",
}

export const EU_CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: Currency.EUR, label: "Euro (€)" },
  { value: Currency.USD, label: "US dollar ($)" },
  { value: Currency.TRY, label: "Turkish lira (₺)" },
];

export function isCurrency(value: string): value is Currency {
  return Object.values(Currency).includes(value as Currency);
}

export function formatPrice(priceCents: number, currency: Currency): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(
    priceCents / 100,
  );
}

export function priceStringToCents(price: string): number {
  const [whole, fraction = ""] = price.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}
