import { test, expect } from "@playwright/test";

test.describe("飲食目標設定頁面", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile/nutrition-goals");
  });

  test("顯示頁面標題「飲食目標」", async ({ page }) => {
    await expect(page.getByText("飲食目標")).toBeVisible();
  });

  test("顯示四個輸入欄位", async ({ page }) => {
    await expect(page.getByLabel(/熱量目標/)).toBeVisible();
    await expect(page.getByLabel(/蛋白質目標/)).toBeVisible();
    await expect(page.getByLabel(/碳水目標/)).toBeVisible();
    await expect(page.getByLabel(/脂肪目標/)).toBeVisible();
  });

  test("欄位類型為數字", async ({ page }) => {
    const caloriesInput = page.getByLabel(/熱量目標/);
    await expect(caloriesInput).toHaveAttribute("type", "number");
  });

  test("欄位最小值為 0", async ({ page }) => {
    const caloriesInput = page.getByLabel(/熱量目標/);
    await expect(caloriesInput).toHaveAttribute("min", "0");
  });

  test("顯示說明文字「設為 0 表示不追蹤該項目」", async ({ page }) => {
    await expect(page.getByText("設為 0 表示不追蹤該項目")).toBeVisible();
  });

  test("顯示儲存按鈕", async ({ page }) => {
    await expect(page.getByRole("button", { name: "儲存目標" })).toBeVisible();
  });

  test("填寫數值並儲存後顯示「已儲存 ✓」", async ({ page }) => {
    await page.getByLabel(/熱量目標/).fill("2000");
    await page.getByLabel(/蛋白質目標/).fill("150");
    await page.getByLabel(/碳水目標/).fill("200");
    await page.getByLabel(/脂肪目標/).fill("60");

    await page.getByRole("button", { name: "儲存目標" }).click();

    await expect(page.getByRole("button", { name: /已儲存/ })).toBeVisible();
  });

  test("顯示欄位的單位（kcal, g）", async ({ page }) => {
    await expect(page.getByText("(kcal)")).toBeVisible();
    const gTexts = page.getByText("(g)");
    await expect(gTexts).toHaveCount(3);
  });

  test("輸入值持久化到 localStorage 後重新整理仍保留", async ({ page }) => {
    await page.getByLabel(/熱量目標/).fill("2500");
    await page.getByRole("button", { name: "儲存目標" }).click();
    await expect(page.getByRole("button", { name: /已儲存/ })).toBeVisible();

    await page.reload();
    await expect(page.getByLabel(/熱量目標/)).toHaveValue("2500");
  });
});
