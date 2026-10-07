import { expect, test as setup } from "@playwright/test";
import {
  ADMIN_STATE,
  USER_STATE,
  loginWithAuth0,
  requireEnv,
} from "./helpers/auth";

setup("log in as admin", async ({ page }) => {
  await loginWithAuth0(
    page,
    requireEnv("E2E_ADMIN_EMAIL"),
    requireEnv("E2E_ADMIN_PASSWORD"),
  );

  await expect(
    page.getByRole("link", { name: "Admin", exact: true }),
  ).toBeVisible();

  await page.context().storageState({ path: ADMIN_STATE });
});

setup("log in as standard user", async ({ page }) => {
  await loginWithAuth0(
    page,
    requireEnv("E2E_USER_EMAIL"),
    requireEnv("E2E_USER_PASSWORD"),
  );

  await expect(
    page.getByRole("link", { name: "Admin", exact: true }),
  ).toHaveCount(0);

  await page.context().storageState({ path: USER_STATE });
});
