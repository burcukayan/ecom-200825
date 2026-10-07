import { expect, test } from "@playwright/test";

test("home page shows the store header", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Ecommerce Store").first()).toBeVisible();
});

test("guest is sent to login when opening a protected page", async ({ page }) => {
  await page.goto("/orders");

  await expect(page).toHaveURL(/auth0\.com/);
});