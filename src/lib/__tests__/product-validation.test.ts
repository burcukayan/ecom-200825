import {
  createProductDataSchema,
  createProductFormSchema,
  createProductImagesSchema,
  productImageFileSchema,
} from "@/lib/validation/product";
import { MAX_IMAGE_BYTES } from "@/lib/product-images";
import { Currency } from "@/types/currency";
import { ProductCategory } from "@/types/product";

const CATEGORY = Object.values(ProductCategory)[0];

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "Test product",
    description: "A product used in tests",
    price: "19.99",
    currency: Currency.EUR,
    category: CATEGORY,
    stock: "10",
    isActive: true,
    ...overrides,
  };
}

function errorFor(field: string, overrides: Record<string, unknown>) {
  const result = createProductFormSchema.safeParse(validInput(overrides));
  if (result.success) return undefined;
  return result.error.flatten().fieldErrors[
    field as keyof ReturnType<typeof result.error.flatten>["fieldErrors"]
  ]?.[0];
}

function makeFile(size: number, type = "image/png", name = "photo.png") {
  return new File([new Uint8Array(size)], name, { type });
}

describe("createProductDataSchema", () => {
  it("converts valid form values to database types", () => {
    const result = createProductDataSchema.parse(
      validInput({ name: "  Lamp  ", price: " 19.99 ", stock: " 10 " }),
    );

    expect(result).toEqual({
      name: "Lamp",
      description: "A product used in tests",
      priceCents: 1999,
      currency: Currency.EUR,
      category: CATEGORY,
      stock: 10,
      isActive: true,
    });
  });
});

describe("createProductFormSchema", () => {
  it.each([
    ["name", { name: "   " }, "Name is required"],
    ["description", { description: "" }, "Description is required"],
    ["price", { price: "" }, "Price is required"],
    ["stock", { stock: "" }, "Stock is required"],
  ])("requires %s", (field, overrides, message) => {
    expect(errorFor(field, overrides)).toBe(message);
  });

  it.each(["19,99", "19.999", "-5", "abc", "1e3", ".99"])(
    "rejects the invalid price %p",
    (price) => {
      expect(errorFor("price", { price })).toBe(
        "Enter a valid price (e.g. 19.99)",
      );
    },
  );

  it.each(["0", "0.00"])("rejects a zero price %p", (price) => {
    expect(errorFor("price", { price })).toBe("Price must be greater than 0");
  });

  it.each(["-1", "2.5", "ten"])("rejects the invalid stock %p", (stock) => {
    expect(errorFor("stock", { stock })).toBe("Stock must be a whole number");
  });

  it("accepts zero stock", () => {
    expect(errorFor("stock", { stock: "0" })).toBeUndefined();
  });

  it("rejects a stock value that does not fit in the database", () => {
    expect(errorFor("stock", { stock: "3000000000" })).toBe(
      "Stock is too large",
    );
  });

  it("rejects an unsupported currency", () => {
    expect(errorFor("currency", { currency: "GBP" })).toBeDefined();
  });

  it("rejects an unknown category", () => {
    expect(errorFor("category", { category: "FOOD" })).toBeDefined();
  });
});

describe("productImageFileSchema", () => {
  it.each(["image/jpeg", "image/png", "image/webp", "image/gif"])(
    "accepts %s images",
    (type) => {
      expect(
        productImageFileSchema.safeParse(makeFile(1024, type)).success,
      ).toBe(true);
    },
  );

  it("accepts an image exactly at the size limit", () => {
    expect(
      productImageFileSchema.safeParse(makeFile(MAX_IMAGE_BYTES)).success,
    ).toBe(true);
  });

  it("rejects an image over the size limit", () => {
    const result = productImageFileSchema.safeParse(
      makeFile(MAX_IMAGE_BYTES + 1),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Each image must be 4.5 MB or smaller",
    );
  });

  it("rejects an empty file", () => {
    const result = productImageFileSchema.safeParse(makeFile(0));
    expect(result.error?.issues[0]?.message).toBe("Image file is empty");
  });

  it.each([
    ["image/svg+xml", "logo.svg"],
    ["application/pdf", "file.pdf"],
    ["", "photo.png"],
  ])("rejects the file type %p", (type, name) => {
    const result = productImageFileSchema.safeParse(makeFile(1024, type, name));
    expect(result.error?.issues[0]?.message).toBe(
      "Only JPEG, PNG, WebP, and GIF images are allowed",
    );
  });

  it("rejects values that are not files", () => {
    expect(productImageFileSchema.safeParse("photo.png").success).toBe(false);
  });
});

describe("createProductImagesSchema", () => {
  it("requires at least one image", () => {
    const result = createProductImagesSchema.safeParse([]);
    expect(result.error?.issues[0]?.message).toBe(
      "At least one product image is required",
    );
  });

  it("rejects the list when one of the images is invalid", () => {
    expect(
      createProductImagesSchema.safeParse([makeFile(1024), makeFile(0)])
        .success,
    ).toBe(false);
  });
});
