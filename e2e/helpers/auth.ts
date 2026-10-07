import { expect, type Page } from "@playwright/test";

export const ADMIN_STATE = "playwright/.auth/admin.json";
export const USER_STATE = "playwright/.auth/user.json";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing. Add it to .env.e2e`);
  }
  return value;
}

export async function loginWithAuth0(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/auth/login");
  await expect(page).toHaveURL(/auth0\.com/);

  await page.locator('input[name="username"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  const acceptButton = page.getByRole("button", { name: "Accept" });
  const storeHeader = page.getByText("Ecommerce Store").first();
  await expect(acceptButton.or(storeHeader)).toBeVisible();
  if (await acceptButton.isVisible()) {
    await acceptButton.click();
  }

  await expect(storeHeader).toBeVisible();
}
