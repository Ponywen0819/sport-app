import { test, expect } from "@playwright/test";

const NOTION_COOKIES = [
  { name: "notion_token", value: "secret_test", path: "/" },
  { name: "notion_meal_items_db_id", value: "test_meal_db_id", path: "/" },
  { name: "notion_foods_db_id", value: "test_foods_db_id", path: "/" },
];

const MOCK_FOODS = [
  {
    id: "food-1",
    name: "雞胸肉",
    calories: 165,
    protein: 31,
    fat: 3.6,
    carbs: 0,
    sugar: 0,
    fiber: 0,
    sodium: 74,
  },
  {
    id: "food-2",
    name: "白米飯",
    calories: 130,
    protein: 2.7,
    fat: 0.3,
    carbs: 28.2,
    sugar: 0,
    fiber: 0.4,
    sodium: 1,
  },
];

const MOCK_MEAL_ITEMS = [
  {
    id: "item-1",
    foodId: "food-1",
    foodName: "雞胸肉",
    mealType: "Lunch",
    date: "2026-04-11",
    grams: 150,
    calories: 247.5,
    protein: 46.5,
    fat: 5.4,
    carbs: 0,
    sugar: 0,
    fiber: 0,
    sodium: 111,
  },
];

const MOCK_OVERVIEW = {
  calories: 247.5,
  protein: 46.5,
  fat: 5.4,
  carbs: 0,
};


test.describe("今日飲食頁面 - 未設定 Notion", () => {
  test("未設定時顯示未設定提示", async ({ page }) => {
    await page.goto("/nutrition");
    await expect(page.getByText("尚未設定 Notion 連接")).toBeVisible();
    await expect(page.getByRole("link", { name: "前往設定" })).toBeVisible();
  });

  test("點擊「前往設定」前往 /profile", async ({ page }) => {
    await page.goto("/nutrition");
    await page.getByRole("link", { name: "前往設定" }).click();
    await expect(page).toHaveURL("/profile");
  });
});

test.describe("今日飲食頁面 - 已設定 Notion", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies(NOTION_COOKIES);

    await page.route("**/api/notion/nutrition/meals**", (route) => {
      if (route.request().method() === "GET") {
        const url = new URL(route.request().url());
        const mealType = url.searchParams.get("mealType");
        route.fulfill({
          json: mealType === "Lunch" ? MOCK_MEAL_ITEMS : [],
        });
      } else {
        route.continue();
      }
    });
    await page.route("**/api/notion/nutrition/overview**", (route) =>
      route.fulfill({ json: MOCK_OVERVIEW })
    );
    await page.route("**/api/notion/nutrition/foods**", (route) =>
      route.fulfill({ json: MOCK_FOODS })
    );
    await page.route("**/api/notion/nutrition/weekly-summary**", (route) =>
      route.fulfill({ json: [] })
    );

    await page.goto("/nutrition");
  });

  test("顯示今日飲食標題", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "今日飲食" })).toBeVisible();
  });

  test("顯示四種餐別區塊", async ({ page }) => {
    await expect(page.getByText("早餐")).toBeVisible();
    await expect(page.getByText("午餐")).toBeVisible();
    await expect(page.getByText("晚餐")).toBeVisible();
    await expect(page.getByText("點心")).toBeVisible();
  });

  test("有資料的午餐顯示食物名稱", async ({ page }) => {
    await expect(page.getByText("雞胸肉")).toBeVisible();
  });

  test("午餐顯示卡路里", async ({ page }) => {
    await expect(page.getByText(/247|248/).first()).toBeVisible();
  });

  test("每個餐別旁邊有新增按鈕（+）", async ({ page }) => {
    // 找午餐區塊的新增按鈕
    const lunchSection = page.getByText("午餐").locator("..").locator("..");
    const addBtn = lunchSection.locator("button").last();
    await expect(addBtn).toBeVisible();
  });
});

test.describe("新增餐點 Modal - 搜尋食物", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies(NOTION_COOKIES);

    await page.route("**/api/notion/nutrition/meals**", (route) =>
      route.fulfill({ json: [] })
    );
    await page.route("**/api/notion/nutrition/overview**", (route) =>
      route.fulfill({ json: { calories: 0, protein: 0, fat: 0, carbs: 0 } })
    );
    await page.route("**/api/notion/nutrition/foods**", (route) =>
      route.fulfill({ json: MOCK_FOODS })
    );
    await page.route("**/api/notion/nutrition/weekly-summary**", (route) =>
      route.fulfill({ json: [] })
    );

    await page.goto("/nutrition");

    // 點擊早餐的新增按鈕
    const breakfastSection = page.getByText("早餐").locator("..").locator("..");
    await breakfastSection.locator("button").last().click();
  });

  test("顯示新增餐點標題", async ({ page }) => {
    await expect(page.getByText("新增餐點")).toBeVisible();
  });

  test("顯示食物搜尋框", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/搜尋食物/);
    await expect(searchInput).toBeVisible();
  });

  test("顯示食物列表", async ({ page }) => {
    await expect(page.getByText("雞胸肉")).toBeVisible();
    await expect(page.getByText("白米飯")).toBeVisible();
  });

  test("食物列表顯示卡路里資訊", async ({ page }) => {
    await expect(page.getByText(/165.*kcal/).first()).toBeVisible();
  });

  test("點擊關閉按鈕關閉 Modal", async ({ page }) => {
    const closeBtn = page.locator(".fixed").getByRole("button").filter({ has: page.locator("svg") }).first();
    await closeBtn.click();
    await expect(page.getByText("新增餐點")).not.toBeVisible();
  });
});

test.describe("新增餐點 Modal - 設定份量", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies(NOTION_COOKIES);

    await page.route("**/api/notion/nutrition/meals**", (route) =>
      route.fulfill({ json: [] })
    );
    await page.route("**/api/notion/nutrition/overview**", (route) =>
      route.fulfill({ json: { calories: 0, protein: 0, fat: 0, carbs: 0 } })
    );
    await page.route("**/api/notion/nutrition/foods**", (route) =>
      route.fulfill({ json: MOCK_FOODS })
    );
    await page.route("**/api/notion/nutrition/weekly-summary**", (route) =>
      route.fulfill({ json: [] })
    );

    await page.goto("/nutrition");

    const breakfastSection = page.getByText("早餐").locator("..").locator("..");
    await breakfastSection.locator("button").last().click();

    // 等食物列表出現後點選雞胸肉
    await expect(page.getByText("雞胸肉")).toBeVisible();
    await page.getByText("雞胸肉").first().click();
  });

  test("顯示選擇的食物名稱", async ({ page }) => {
    await expect(page.getByText("雞胸肉")).toBeVisible();
  });

  test("顯示份量輸入欄位（g）", async ({ page }) => {
    const gramsInput = page.getByLabel(/份量|克|g/i);
    await expect(gramsInput).toBeVisible();
  });

  test("顯示新增按鈕", async ({ page }) => {
    await expect(page.getByRole("button", { name: /新增|加入/ })).toBeVisible();
  });
});

test.describe("體重 / 身體指標頁面 - 未設定", () => {
  test("未設定 Notion 時顯示提示", async ({ page }) => {
    await page.goto("/profile/body-index");
    await expect(page.getByText("尚未設定 Notion 連接")).toBeVisible();
  });
});
