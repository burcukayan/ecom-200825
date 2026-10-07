import {
  Currency,
  EU_CURRENCY_OPTIONS,
  formatPrice,
  isCurrency,
  priceStringToCents,
} from "@/types/currency";

describe("priceStringToCents", () => {
  it.each([
    ["19.99", 1999],
    ["19.9", 1990],
    ["19", 1900],
    ["0.5", 50],
    ["0.01", 1],
    ["007.50", 750],
  ])("converts %s to %i cents", (price, cents) => {
    expect(priceStringToCents(price)).toBe(cents);
  });

  it.each([
    ["19.99", 1999],
    ["1.15", 115],
    ["4.35", 435],
  ])("has no floating point error for %s", (price, cents) => {
    expect(Number(price) * 100).not.toBe(cents);
    expect(priceStringToCents(price)).toBe(cents);
    expect(Number.isInteger(priceStringToCents(price))).toBe(true);
  });
});

describe("formatPrice", () => {
  it("formats euro prices", () => {
    expect(formatPrice(1999, Currency.EUR)).toBe("€19.99");
  });

  it("formats US dollar prices", () => {
    expect(formatPrice(1999, Currency.USD)).toBe("US$19.99");
  });

  it("formats Turkish lira prices", () => {
    expect(formatPrice(1999, Currency.TRY)).toMatch(/^TRY\s19\.99$/);
  });

  it("always shows two decimals", () => {
    expect(formatPrice(1900, Currency.EUR)).toBe("€19.00");
    expect(formatPrice(5, Currency.EUR)).toBe("€0.05");
  });
});

describe("isCurrency", () => {
  it.each(Object.values(Currency))("accepts %s", (value) => {
    expect(isCurrency(value)).toBe(true);
  });

  it.each(["GBP", "eur", "", "€"])("rejects %p", (value) => {
    expect(isCurrency(value)).toBe(false);
  });
});

describe("EU_CURRENCY_OPTIONS", () => {
  it("offers every supported currency exactly once", () => {
    const values = EU_CURRENCY_OPTIONS.map((option) => option.value);
    expect(values.sort()).toEqual(Object.values(Currency).sort());
  });
});
