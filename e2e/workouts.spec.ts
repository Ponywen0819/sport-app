import { test, expect } from "@playwright/test";

const NOTION_COOKIES = [
  { name: "notion_token", value: "secret_test", path: "/" },
  { name: "notion_exercise_records_db_id", value: "test_db_id", path: "/" },
  { name: "notion_exercises_db_id", value: "test_exercises_db_id", path: "/" },
];

const MOCK_EXERCISES = [
  {
    id: "ex-1",
    name: "臥推",
    equipment: "槓鈴",
    muscleGroups: ["胸"],
  },
  {
    id: "ex-2",
    name: "深蹲",
    equipment: "槓鈴",
    muscleGroups: ["腿", "臀"],
  },
  {
    id: "ex-3",
    name: "引體向上",
    equipment: "徒手",
    muscleGroups: ["背", "二頭"],
  },
];

const MOCK_RECORDS = [
  {
    id: "rec-1",
    exerciseId: "ex-1",
    exerciseName: "臥推",
    date: "2026-04-11",
    weightKg: 80,
    sets: 3,
    reps: 8,
    dropWeightKg: null,
    dropReps: null,
  },
];

test.describe("運動紀錄頁面 - 未設定 Notion", () => {
  test("未設定時顯示未設定提示", async ({ page }) => {
    await page.goto("/workouts");
    await expect(page.getByText("尚未設定 Notion 連接")).toBeVisible();
    await expect(page.getByRole("link", { name: "前往設定" })).toBeVisible();
  });

  test("點擊「前往設定」前往 /profile", async ({ page }) => {
    await page.goto("/workouts");
    await page.getByRole("link", { name: "前往設定" }).click();
    await expect(page).toHaveURL("/profile");
  });
});

test.describe("運動紀錄頁面 - 已設定 Notion", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies(NOTION_COOKIES);

    await page.route("**/api/notion/exercise/dates**", (route) =>
      route.fulfill({ json: [] })
    );
    await page.route("**/api/notion/exercise/records**", (route) =>
      route.fulfill({ json: MOCK_RECORDS })
    );
    await page.route("**/api/notion/exercise/exercises**", (route) =>
      route.fulfill({ json: MOCK_EXERCISES })
    );

    await page.goto("/workouts");
  });

  test("顯示運動紀錄標題", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "運動紀錄" })).toBeVisible();
  });

  test("顯示日期選擇器", async ({ page }) => {
    const calendar = page.locator(".bg-stone-800").first();
    await expect(calendar).toBeVisible();
  });

  test("顯示今日訓練區塊", async ({ page }) => {
    await expect(page.getByText("今日訓練")).toBeVisible();
  });

  test("有紀錄時顯示動作列表", async ({ page }) => {
    await expect(page.getByText("臥推")).toBeVisible();
  });

  test("有紀錄時顯示動作數量統計", async ({ page }) => {
    await expect(page.getByText(/共.*個動作/)).toBeVisible();
    await expect(page.getByText(/組/)).toBeVisible();
  });

  test("有紀錄時顯示重量單位切換按鈕", async ({ page }) => {
    const kgBtn = page.locator("button", { hasText: "kg" }).first();
    const lbsBtn = page.locator("button", { hasText: "磅" }).first();
    await expect(kgBtn).toBeVisible();
    await expect(lbsBtn).toBeVisible();
  });

  test("顯示新增動作按鈕（+）", async ({ page }) => {
    const addBtn = page.getByText("今日訓練").locator("..").locator("button");
    await expect(addBtn).toBeVisible();
  });

  test("點擊新增按鈕開啟動作選擇 Modal", async ({ page }) => {
    await page.route("**/api/notion/exercise/exercises**", (route) =>
      route.fulfill({ json: MOCK_EXERCISES })
    );

    const addBtn = page.getByText("今日訓練").locator("..").locator("button");
    await addBtn.click();

    await expect(page.getByText("選擇動作")).toBeVisible();
  });
});

test.describe("新增動作 Modal - 第一步（選擇動作）", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies(NOTION_COOKIES);

    await page.route("**/api/notion/exercise/dates**", (route) =>
      route.fulfill({ json: [] })
    );
    await page.route("**/api/notion/exercise/records**", (route) =>
      route.fulfill({ json: [] })
    );
    await page.route("**/api/notion/exercise/exercises**", (route) =>
      route.fulfill({ json: MOCK_EXERCISES })
    );

    await page.goto("/workouts");

    // 點擊新增按鈕開啟 modal
    await page.getByText("今日訓練").locator("..").locator("button").click();
    await expect(page.getByText("選擇動作")).toBeVisible();
  });

  test("顯示搜尋框", async ({ page }) => {
    await expect(page.getByPlaceholder("搜尋動作...")).toBeVisible();
  });

  test("顯示器具篩選標籤", async ({ page }) => {
    await expect(page.getByRole("button", { name: "徒手" })).toBeVisible();
    await expect(page.getByRole("button", { name: "啞鈴" })).toBeVisible();
    await expect(page.getByRole("button", { name: "槓鈴" })).toBeVisible();
  });

  test("顯示部位篩選標籤", async ({ page }) => {
    await expect(page.getByRole("button", { name: "胸" })).toBeVisible();
    await expect(page.getByRole("button", { name: "背" })).toBeVisible();
    await expect(page.getByRole("button", { name: "腿" })).toBeVisible();
  });

  test("顯示動作列表", async ({ page }) => {
    await expect(page.getByText("臥推")).toBeVisible();
    await expect(page.getByText("深蹲")).toBeVisible();
    await expect(page.getByText("引體向上")).toBeVisible();
  });

  test("點擊關閉按鈕關閉 Modal", async ({ page }) => {
    const closeBtn = page.locator(".fixed button").filter({ has: page.locator("svg") }).first();
    await closeBtn.click();
    await expect(page.getByText("選擇動作")).not.toBeVisible();
  });

  test("選擇動作後進入第二步設定重量", async ({ page }) => {
    await page.getByText("臥推").first().click();
    await expect(page.getByText("臥推")).toBeVisible();
    await expect(page.getByText("新增")).toBeVisible();
  });
});

test.describe("新增動作 Modal - 第二步（設定重量）", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies(NOTION_COOKIES);

    await page.route("**/api/notion/exercise/dates**", (route) =>
      route.fulfill({ json: [] })
    );
    await page.route("**/api/notion/exercise/records**", (route) =>
      route.fulfill({ json: [] })
    );
    await page.route("**/api/notion/exercise/exercises**", (route) =>
      route.fulfill({ json: MOCK_EXERCISES })
    );
    await page.route("**/api/notion/exercise/records/last**", (route) =>
      route.fulfill({ status: 404, json: null })
    );
    await page.route("**/api/notion/exercise/records/pr**", (route) =>
      route.fulfill({ status: 404, json: null })
    );

    await page.goto("/workouts");
    await page.getByText("今日訓練").locator("..").locator("button").click();
    await expect(page.getByText("選擇動作")).toBeVisible();
    await page.getByText("臥推").first().click();
  });

  test("顯示動作名稱作為 Modal 標題", async ({ page }) => {
    const header = page.locator(".fixed h3");
    await expect(header).toContainText("臥推");
  });

  test("顯示重量輸入框", async ({ page }) => {
    await expect(page.getByLabel("重量")).toBeVisible();
  });

  test("顯示組數與次數輸入框", async ({ page }) => {
    await expect(page.getByLabel("組數")).toBeVisible();
    await expect(page.getByLabel("次數／組")).toBeVisible();
  });

  test("初始組數為 3、次數為 12", async ({ page }) => {
    await expect(page.getByLabel("組數")).toHaveValue("3");
    await expect(page.getByLabel("次數／組")).toHaveValue("12");
  });

  test("顯示 Drop Set 切換按鈕", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Drop Set/ })).toBeVisible();
  });

  test("顯示返回按鈕（←）", async ({ page }) => {
    await expect(page.getByRole("button", { name: "←" })).toBeVisible();
  });

  test("點擊返回按鈕回到第一步", async ({ page }) => {
    await page.getByRole("button", { name: "←" }).click();
    await expect(page.getByText("選擇動作")).toBeVisible();
  });

  test("未填次數時新增按鈕為禁用狀態", async ({ page }) => {
    await page.getByLabel("次數／組").fill("0");
    const addBtn = page.getByRole("button", { name: "新增" });
    await expect(addBtn).toBeDisabled();
  });

  test("填入有效資料後新增按鈕啟用", async ({ page }) => {
    await page.getByLabel("組數").fill("4");
    await page.getByLabel("次數／組").fill("10");
    const addBtn = page.getByRole("button", { name: "新增" });
    await expect(addBtn).toBeEnabled();
  });

  test("成功新增後 Modal 關閉", async ({ page }) => {
    await page.route("**/api/notion/exercise/records", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({ json: { id: "new-rec" } });
      } else {
        route.fulfill({ json: [] });
      }
    });

    await page.getByLabel("組數").fill("3");
    await page.getByLabel("次數／組").fill("10");
    await page.getByRole("button", { name: "新增" }).click();

    await expect(page.getByText("選擇動作")).not.toBeVisible({ timeout: 5000 });
  });

  test("開啟 Drop Set 模式後顯示第一段與第二段輸入", async ({ page }) => {
    await page.getByRole("button", { name: /Drop Set/ }).click();
    await expect(page.getByText("第一段")).toBeVisible();
    await expect(page.getByText("第二段（降重）")).toBeVisible();
  });
});

test.describe("運動紀錄 - 刪除功能", () => {
  test("點擊刪除按鈕呼叫刪除 API", async ({ page, context }) => {
    await context.addCookies(NOTION_COOKIES);

    await page.route("**/api/notion/exercise/dates**", (route) =>
      route.fulfill({ json: [] })
    );
    await page.route("**/api/notion/exercise/records", (route) => {
      if (route.request().method() === "GET") {
        route.fulfill({ json: MOCK_RECORDS });
      } else {
        route.continue();
      }
    });
    await page.route("**/api/notion/exercise/exercises**", (route) =>
      route.fulfill({ json: MOCK_EXERCISES })
    );

    let deleteCalled = false;
    await page.route("**/api/notion/exercise/records/rec-1", (route) => {
      if (route.request().method() === "DELETE") {
        deleteCalled = true;
        route.fulfill({ json: { success: true } });
      } else {
        route.continue();
      }
    });

    await page.goto("/workouts");
    await expect(page.getByText("臥推")).toBeVisible();

    const deleteBtn = page.locator('[data-testid="delete-record"]').first()
      ?? page.getByText("臥推").locator("..").locator("..").getByRole("button").last();
    await deleteBtn.click();

    await expect(async () => {
      expect(deleteCalled).toBe(true);
    }).toPass({ timeout: 3000 });
  });
});
