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

  const emailInput = page.locator('input[name="username"]');
  const passwordInput = page.locator('input[name="password"]');

  await expect(async () => {
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await expect(emailInput).toHaveValue(email, { timeout: 1_000 });
    await expect(passwordInput).not.toHaveValue("", { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  await page.getByRole("button", { name: "Continue", exact: true }).click();

  const acceptButton = page.getByRole("button", { name: "Accept" });
  const storeHeader = page.getByText("Ecommerce Store").first();
  await expect(acceptButton.or(storeHeader)).toBeVisible({ timeout: 30_000 });
  if (await acceptButton.isVisible()) {
    await acceptButton.click();
  }

  await expect(storeHeader).toBeVisible({ timeout: 30_000 });
}
