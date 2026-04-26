import { test, expect } from "@playwright/test";

test.describe("Notion 連接設定頁面", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile/notion-settings");
  });

  test("顯示頁面標題", async ({ page }) => {
    await expect(page.getByText("Notion 連接設定")).toBeVisible();
  });

  test("顯示六個輸入欄位", async ({ page }) => {
    await expect(page.getByLabel("Notion API Token")).toBeVisible();
    await expect(page.getByLabel("運動紀錄 DB ID")).toBeVisible();
    await expect(page.getByLabel("動作資料庫 DB ID")).toBeVisible();
    await expect(page.getByLabel("餐點紀錄 DB ID")).toBeVisible();
    await expect(page.getByLabel("食物資料庫 DB ID")).toBeVisible();
    await expect(page.getByLabel("身體指標 DB ID")).toBeVisible();
  });

  test("Token 欄位預設為 password 類型（隱藏）", async ({ page }) => {
    const tokenInput = page.locator('input[placeholder="secret_xxxx..."]');
    await expect(tokenInput).toHaveAttribute("type", "password");
  });

  test("點擊「顯示」按鈕可切換 Token 可見性", async ({ page }) => {
    const tokenInput = page.locator('input[placeholder="secret_xxxx..."]');
    const toggleBtn = page.getByRole("button", { name: "顯示" });
    await toggleBtn.click();
    await expect(tokenInput).toHaveAttribute("type", "text");
    await expect(page.getByRole("button", { name: "隱藏" })).toBeVisible();
  });

  test("點擊「隱藏」按鈕可再次隱藏 Token", async ({ page }) => {
    const tokenInput = page.locator('input[placeholder="secret_xxxx..."]');
    await page.getByRole("button", { name: "顯示" }).click();
    await page.getByRole("button", { name: "隱藏" }).click();
    await expect(tokenInput).toHaveAttribute("type", "password");
  });

  test("Token 未填寫時「測試連線」按鈕為禁用狀態", async ({ page }) => {
    const testBtn = page.getByRole("button", { name: "測試連線" });
    await expect(testBtn).toBeDisabled();
  });

  test("填寫 Token 後「測試連線」按鈕啟用", async ({ page }) => {
    await page.locator('input[placeholder="secret_xxxx..."]').fill("secret_test");
    const testBtn = page.getByRole("button", { name: "測試連線" });
    await expect(testBtn).toBeEnabled();
  });

  test("點擊「儲存設定」按鈕後顯示成功訊息", async ({ page }) => {
    await page.locator('input[placeholder="secret_xxxx..."]').fill("secret_test");
    await page.getByRole("button", { name: "儲存設定" }).click();
    await expect(page.getByText("✓ 設定已儲存，下次開啟 App 時自動套用")).toBeVisible();
  });

  test("測試連線成功時各欄位顯示「已連線」", async ({ page }) => {
    await page.route("**/api/notion/validate", (route) =>
      route.fulfill({
        json: {
          token: true,
          foodsDb: true,
          mealItemsDb: true,
          exerciseRecordsDb: true,
          exercisesDb: true,
          bodyIndexesDb: true,
        },
      })
    );

    await page.locator('input[placeholder="secret_xxxx..."]').fill("secret_test");
    await page.getByRole("button", { name: "測試連線" }).click();

    const connectedTexts = page.getByText("已連線");
    await expect(connectedTexts.first()).toBeVisible();
  });

  test("測試連線失敗時欄位顯示「無法連線」", async ({ page }) => {
    await page.route("**/api/notion/validate", (route) =>
      route.fulfill({
        json: {
          token: false,
          foodsDb: false,
          mealItemsDb: false,
          exerciseRecordsDb: false,
          exercisesDb: false,
          bodyIndexesDb: false,
        },
      })
    );

    await page.locator('input[placeholder="secret_xxxx..."]').fill("secret_invalid");
    await page.getByRole("button", { name: "測試連線" }).click();

    const failedTexts = page.getByText("無法連線");
    await expect(failedTexts.first()).toBeVisible();
  });

  test("測試中顯示「測試中...」文字", async ({ page }) => {
    await page.route("**/api/notion/validate", async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      route.fulfill({ json: {} });
    });

    await page.locator('input[placeholder="secret_xxxx..."]').fill("secret_test");
    await page.getByRole("button", { name: "測試連線" }).click();
    await expect(page.getByRole("button", { name: "測試中..." })).toBeVisible();
  });

  test("修改欄位後重置驗證結果", async ({ page }) => {
    await page.route("**/api/notion/validate", (route) =>
      route.fulfill({
        json: {
          token: true,
          foodsDb: true,
          mealItemsDb: true,
          exerciseRecordsDb: true,
          exercisesDb: true,
          bodyIndexesDb: true,
        },
      })
    );

    await page.locator('input[placeholder="secret_xxxx..."]').fill("secret_test");
    await page.getByRole("button", { name: "測試連線" }).click();
    await expect(page.getByText("已連線").first()).toBeVisible();

    // 修改欄位後驗證結果應消失
    await page.locator('input[placeholder="secret_xxxx..."]').fill("secret_other");
    await expect(page.getByText("已連線")).not.toBeVisible();
  });

  test("頁面底部顯示說明文字", async ({ page }) => {
    await expect(
      page.getByText("資料庫 ID 可從 Notion 資料庫 URL 中取得（32 位英數字）")
    ).toBeVisible();
  });
});

test.describe("Profile 頁面 - 設定入口", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile");
  });

  test("顯示個人設定標題", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "個人設定" })).toBeVisible();
  });

  test("顯示 Notion 連接設定入口", async ({ page }) => {
    await expect(page.getByText("Notion 連接設定")).toBeVisible();
  });

  test("顯示飲食目標入口", async ({ page }) => {
    await expect(page.getByText("飲食目標")).toBeVisible();
  });

  test("顯示身體指標入口", async ({ page }) => {
    await expect(page.getByText("身體指標")).toBeVisible();
  });

  test("點擊 Notion 連接設定前往對應頁面", async ({ page }) => {
    await page.getByText("Notion 連接設定").click();
    await expect(page).toHaveURL("/profile/notion-settings");
  });

  test("點擊飲食目標前往對應頁面", async ({ page }) => {
    await page.getByText("飲食目標").click();
    await expect(page).toHaveURL("/profile/nutrition-goals");
  });

  test("點擊身體指標前往對應頁面", async ({ page }) => {
    await page.getByText("身體指標").click();
    await expect(page).toHaveURL("/profile/body-index");
  });

  test("顯示關於區塊", async ({ page }) => {
    await expect(page.getByText("關於")).toBeVisible();
    await expect(page.getByText("運動紀錄 v1.0")).toBeVisible();
  });
});
