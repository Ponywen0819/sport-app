import { test, expect } from "@playwright/test";

test.describe("底部導航列", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("顯示四個導航項目", async ({ page }) => {
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "首頁" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "運動" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "營養" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "我的" })).toBeVisible();
  });

  test("點擊運動導航連結前往 /workouts", async ({ page }) => {
    await page.getByRole("link", { name: "運動" }).click();
    await expect(page).toHaveURL("/workouts");
  });

  test("點擊營養導航連結前往 /nutrition", async ({ page }) => {
    await page.getByRole("link", { name: "營養" }).click();
    await expect(page).toHaveURL("/nutrition");
  });

  test("點擊我的導航連結前往 /profile", async ({ page }) => {
    await page.getByRole("link", { name: "我的" }).click();
    await expect(page).toHaveURL("/profile");
  });

  test("點擊首頁導航連結回到首頁", async ({ page }) => {
    await page.goto("/profile");
    await page.getByRole("link", { name: "首頁" }).click();
    await expect(page).toHaveURL("/");
  });

  test("在 /workouts 時運動導航項目為啟用狀態（藍色）", async ({ page }) => {
    await page.goto("/workouts");
    const workoutsLink = page
      .locator("nav")
      .getByRole("link", { name: "運動" });
    await expect(workoutsLink).toHaveClass(/text-blue-400/);
  });

  test("在 /nutrition 時營養導航項目為啟用狀態（藍色）", async ({ page }) => {
    await page.goto("/nutrition");
    const nutritionLink = page
      .locator("nav")
      .getByRole("link", { name: "營養" });
    await expect(nutritionLink).toHaveClass(/text-blue-400/);
  });

  test("在 /profile 時我的導航項目為啟用狀態（藍色）", async ({ page }) => {
    await page.goto("/profile");
    const profileLink = page.locator("nav").getByRole("link", { name: "我的" });
    await expect(profileLink).toHaveClass(/text-blue-400/);
  });
});
