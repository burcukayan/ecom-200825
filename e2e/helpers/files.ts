const PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export const TEST_IMAGE = {
  name: "e2e-product.png",
  mimeType: "image/png",
  buffer: Buffer.from(PIXEL_PNG_BASE64, "base64"),
};