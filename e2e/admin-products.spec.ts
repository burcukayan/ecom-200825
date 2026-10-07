import { expect, test, type Page } from "@playwright/test";
import { ADMIN_STATE } from "./helpers/auth";
import { TEST_IMAGE } from "./helpers/files";

test.use({ storageState: ADMIN_STATE });

test.describe.configure({ mode: "serial", timeout: 90_000 });

const stamp = Date.now();
const productName = `E2E Product ${stamp}`;
const updatedName = `E2E Product ${stamp} updated`;

let productId: string | undefined;
let deleted = false;

function waitForFormPost(page: Page) {
  return page.waitForResponse(
    (response) => response.request().method() === "POST",
  );
}

function productRow(page: Page, name: string) {
  return page.getByRole("row").filter({ hasText: name });
}

async function fillCreateForm(page: Page, price: string) {
  await page.goto("/admin/products/new");
  await expect(
    page.getByRole("heading", { name: "Create product", level: 1 }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Name", { exact: true }).fill(productName);
  await page
    .getByLabel("Description", { exact: true })
    .fill("Created by a Playwright test.");
  await page.getByLabel("Price", { exact: true }).fill(price);
  await page.getByLabel("Currency", { exact: true }).selectOption("EUR");
  await page.getByLabel("Stock", { exact: true }).fill("5");
  await page.getByLabel("Product images").setInputFiles(TEST_IMAGE);
}

test.describe("admin product management", () => {
  test("shows a validation error for a zero price", async ({ page }) => {
    await fillCreateForm(page, "0");

    await Promise.all([
      waitForFormPost(page),
      page.getByRole("button", { name: "Create product", exact: true }).click(),
    ]);

    await expect(page.locator("#price-error")).toHaveText(
      "Price must be greater than 0",
    );
    await expect(page).not.toHaveURL(/created=/);
  });

  test("creates a product", async ({ page }) => {
    await fillCreateForm(page, "19.99");

    await page
      .getByRole("button", { name: "Create product", exact: true })
      .click();

    await expect(page).toHaveURL(/created=[a-f0-9]{24}/, { timeout: 30_000 });
    productId = new URL(page.url()).searchParams.get("created") ?? undefined;
    expect(productId).toBeDefined();
  });

  test("lists the new product in the admin table", async ({ page }) => {
    await page.goto("/admin/products");

    const row = productRow(page, productName);
    await expect(row).toBeVisible();
    await expect(row).toContainText("€19.99");
  });

  test("updates the product", async ({ page }) => {
    await page.goto(`/admin/products/${productId}/edit`);
    await expect(
      page.getByRole("heading", { name: "Edit product", level: 1 }),
    ).toBeVisible();
    await page.waitForLoadState("networkidle");

    const nameInput = page.getByLabel("Name", { exact: true });
    await expect(nameInput).toHaveValue(productName);
    await expect(page.getByLabel("Price", { exact: true })).toHaveValue(
      "19.99",
    );

    await nameInput.fill(updatedName);
    await page.getByLabel("Price", { exact: true }).fill("24.5");
    await page.getByLabel("Stock", { exact: true }).fill("7");

    await Promise.all([
      waitForFormPost(page),
      page.getByRole("button", { name: "Save changes" }).click(),
    ]);
    await page.waitForLoadState("networkidle");

    await page.goto(`/admin/products/${productId}/edit`);
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
      updatedName,
    );
    await expect(page.getByLabel("Price", { exact: true })).toHaveValue("24.5");
    await expect(page.getByLabel("Stock", { exact: true })).toHaveValue("7");

    await page.goto("/admin/products");
    const row = productRow(page, updatedName);
    await expect(row).toBeVisible();
    await expect(row).toContainText("€24.50");
  });

  test("deletes the product", async ({ page }) => {
    await page.goto(`/admin/products/${productId}/delete`);
    await expect(
      page.getByRole("heading", { name: "Delete product", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText(updatedName).filter({ visible: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Delete product" }).click();

    await expect(page).toHaveURL(/\/admin\/products$/, { timeout: 30_000 });
    deleted = true;
    await expect(productRow(page, updatedName)).toHaveCount(0);

    await page.goto(`/admin/products/${productId}/edit`);
    await expect(
      page.getByRole("heading", { name: "Product not found" }),
    ).toBeVisible();
  });
});

test.afterAll(async ({ browser }, testInfo) => {
  if (!productId || deleted) return;

  const context = await browser.newContext({
    storageState: ADMIN_STATE,
    baseURL: testInfo.project.use.baseURL,
  });
  const page = await context.newPage();
  try {
    await page.goto(`/admin/products/${productId}/delete`);
    await page
      .getByRole("button", { name: "Delete product" })
      .click({ timeout: 15_000 });
    await page.waitForURL(/\/admin\/products$/, { timeout: 30_000 });
  } catch {
    console.warn(`Cleanup failed: delete product ${productId} manually`);
  } finally {
    await context.close();
  }
});
