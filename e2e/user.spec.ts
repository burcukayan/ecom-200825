import { expect, test } from "@playwright/test";
import { USER_STATE } from "./helpers/auth";

test.use({ storageState: USER_STATE });

test.describe("standard user", () => {
  test("can open the orders page", async ({ page }) => {
    await page.goto("/orders");

    await expect(page).toHaveURL(/\/orders$/);
    await expect(
      page.getByRole("heading", { name: "My Orders", level: 1 }),
    ).toBeVisible();

    const emptyState = page.getByText("You have no orders yet.");
    const firstOrder = page.getByText(/^Order #/).first();
    await expect(emptyState.or(firstOrder)).toBeVisible();
  });

  test("can open the details of an order", async ({ page }) => {
    await page.goto("/orders");

    const viewDetails = page.getByRole("link", { name: "View details" });
    test.skip(
      (await viewDetails.count()) === 0,
      "The test user has no orders yet",
    );

    const orderTitle = await page
      .getByText(/^Order #/)
      .first()
      .innerText();
    await viewDetails.first().click();

    await expect(page).toHaveURL(/\/orders\/[a-f0-9]{24}$/);
    await expect(
      page.getByRole("heading", { name: orderTitle, level: 1 }),
    ).toBeVisible();
  });

  test("cannot open an order that does not belong to them", async ({
    page,
  }) => {
    await page.goto("/orders/000000000000000000000000");

    await expect(
      page.getByRole("heading", { name: "Order not found" }),
    ).toBeVisible();
  });

  test("can open the profile page", async ({ page }) => {
    await page.goto("/profile");

    await expect(page).toHaveURL(/\/profile$/);
    await expect(
      page.getByRole("heading", { name: "Profile", level: 1 }),
    ).toBeVisible();
  });

  for (const path of [
    "/admin",
    "/admin/products",
    "/admin/products/new",
    "/admin/orders",
    "/admin/users",
  ]) {
    test(`is blocked from ${path}`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(/\/forbidden$/);
      await expect(
        page.getByRole("heading", { name: "Access denied" }),
      ).toBeVisible();
    });
  }
});
