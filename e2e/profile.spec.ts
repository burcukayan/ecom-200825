import { expect, test, type Page } from "@playwright/test";
import { USER_STATE, requireEnv } from "./helpers/auth";

test.use({ storageState: USER_STATE });

async function openProfile(page: Page) {
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "Profile", level: 1 }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");

  return {
    emailInput: page.locator('input[type="email"]'),
    nameInput: page.getByLabel("Name", { exact: true }),
    addressInput: page.getByLabel("Address", { exact: true }),
    saveButton: page.getByRole("button", { name: "Save" }),
    status: page.getByRole("status"),
  };
}

test.describe("profile", () => {
  test("shows the login email as read-only", async ({ page }) => {
    const { emailInput } = await openProfile(page);

    await expect(emailInput).toHaveValue(requireEnv("E2E_USER_EMAIL"));
    await expect(emailInput).toBeDisabled();
  });

  test("saves name and address changes", async ({ page }) => {
    const form = await openProfile(page);

    const originalName = await form.nameInput.inputValue();
    const originalAddress = await form.addressInput.inputValue();

    const stamp = Date.now();
    const newName = `E2E User ${stamp}`;
    const newAddress = `Test Street ${stamp}, Antalya`;

    await form.nameInput.fill(newName);
    await form.addressInput.fill(newAddress);
    await form.saveButton.click();

    await expect(form.status).toHaveText(
      "Your profile has been successfully updated.",
    );

    const reloaded = await openProfile(page);
    await expect(reloaded.nameInput).toHaveValue(newName);
    await expect(reloaded.addressInput).toHaveValue(newAddress);

    await reloaded.nameInput.fill(originalName);
    await reloaded.addressInput.fill(originalAddress);
    await reloaded.saveButton.click();
    await expect(reloaded.status).toHaveText(
      "Your profile has been successfully updated.",
    );
  });

  test("does not save an invalid name", async ({ page }) => {
    const form = await openProfile(page);
    const originalName = await form.nameInput.inputValue();

    await form.nameInput.fill("A");
    await form.saveButton.click();

    await expect(form.nameInput).toHaveAttribute("aria-invalid", "true");
    await expect(form.status).toHaveCount(0);

    const reloaded = await openProfile(page);
    await expect(reloaded.nameInput).toHaveValue(originalName);
  });
});
