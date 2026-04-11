import { test, expect } from "@playwright/test";

test.describe("首頁", () => {
  test.beforeEach(async ({ page }) => {
    // 攔截 API 請求，避免真實 Notion 呼叫
    await page.route("**/api/notion/exercise/dates**", (route) =>
      route.fulfill({ json: [] })
    );
    await page.route("**/api/notion/nutrition/overview**", (route) =>
      route.fulfill({ json: { calories: 0, protein: 0, fat: 0, carbs: 0 } })
    );
    await page.route("**/api/notion/body-index/latest**", (route) =>
      route.fulfill({ status: 404, json: null })
    );
    await page.goto("/");
  });

  test("顯示頁面標題「運動紀錄」", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "運動紀錄" })).toBeVisible();
  });

  test("顯示本週訓練區塊", async ({ page }) => {
    await expect(page.getByText("本週訓練")).toBeVisible();
  });

  test("本週訓練顯示 7 個日期格子", async ({ page }) => {
    const dayLabels = ["一", "二", "三", "四", "五", "六", "日"];
    for (const label of dayLabels) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("本週訓練初始顯示 0 / 7 天", async ({ page }) => {
    await expect(page.getByText("0")).toBeVisible();
    await expect(page.getByText("/ 7 天")).toBeVisible();
  });

  test("顯示快速導航區塊，包含今日營養與運動記錄連結", async ({ page }) => {
    await expect(page.getByText("快速導航")).toBeVisible();
    await expect(page.getByRole("link", { name: /今日營養/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /運動記錄/ })).toBeVisible();
  });

  test("點擊快速導航「今日營養」連結前往 /nutrition", async ({ page }) => {
    await page.getByRole("link", { name: /今日營養/ }).first().click();
    await expect(page).toHaveURL("/nutrition");
  });

  test("點擊快速導航「運動記錄」連結前往 /workouts", async ({ page }) => {
    await page.getByRole("link", { name: /運動記錄/ }).click();
    await expect(page).toHaveURL("/workouts");
  });
});

test.describe("首頁 - 有訓練紀錄時", () => {
  test("本週有訓練紀錄時顯示訓練天數", async ({ page }) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    await page.route("**/api/notion/exercise/dates**", (route) =>
      route.fulfill({ json: [todayStr] })
    );
    await page.route("**/api/notion/nutrition/overview**", (route) =>
      route.fulfill({ json: { calories: 0, protein: 0, fat: 0, carbs: 0 } })
    );
    await page.route("**/api/notion/body-index/latest**", (route) =>
      route.fulfill({ status: 404, json: null })
    );

    await page.goto("/");
    await expect(page.getByText("1")).toBeVisible();
    await expect(page.getByText("/ 7 天")).toBeVisible();
  });
});

test.describe("首頁 - 有身體指標資料時", () => {
  test("顯示最新身體指標卡片", async ({ page }) => {
    await page.route("**/api/notion/exercise/dates**", (route) =>
      route.fulfill({ json: [] })
    );
    await page.route("**/api/notion/nutrition/overview**", (route) =>
      route.fulfill({ json: { calories: 0, protein: 0, fat: 0, carbs: 0 } })
    );
    await page.route("**/api/notion/body-index/latest**", (route) =>
      route.fulfill({
        json: {
          id: "test-id",
          date: "2026-04-10",
          weight: 70.5,
          bodyFatPercentage: 15.2,
          skeletalMuscleWeight: 32.1,
          bmr: 1750,
          proteinPercentage: 17.5,
          bodyWaterPercentage: 55.3,
          visceralFat: 8,
          boneMineralWeight: 2.8,
        },
      })
    );

    await page.goto("/");
    await expect(page.getByText("身體指標")).toBeVisible();
    await expect(page.getByText("70.5")).toBeVisible();
    await expect(page.getByText("15.2")).toBeVisible();
    await expect(page.getByText("32.1")).toBeVisible();
  });
});
