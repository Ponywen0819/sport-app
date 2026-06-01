# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

SwiftUI iOS App，用於記錄訓練、營養與身體數據。UI 與字串皆為繁體中文。目標 iOS 18.6+、Swift 5.0,主 target 僅支援 iPhone（`TARGETED_DEVICE_FAMILY = 1`），Bundle id 為 `net.ponygames.SportApp`。

## 建置 / 執行 / 測試

直接在 Xcode 開啟 `SportApp.xcodeproj` 並用 Cmd+R / Cmd+U,或從 CLI:

```bash
# 建置
xcodebuild -project SportApp.xcodeproj -scheme SportApp \
  -destination 'platform=iOS Simulator,name=iPhone 15' build

# 跑全部單元測試 + UI 測試
xcodebuild -project SportApp.xcodeproj -scheme SportApp \
  -destination 'platform=iOS Simulator,name=iPhone 15' test

# 只跑單一測試（單元測試使用 Swift Testing,不是 XCTest）
xcodebuild ... test -only-testing:SportAppTests/SportAppTests/example
```

`SportAppTests/` 使用 **Swift Testing** framework（`import Testing`、`@Test`、`#expect`），不是 XCTest。`SportAppUITests/` 仍使用 XCTest。

## 架構

### 資料持久化 — SwiftData 加上 Repository 包裝

所有持久化資料都走 SwiftData `@Model`（`Exercise`、`WorkoutBlock`、`WorkoutSet`、`BodyIndex`、`Food`、`MealRecord`）。`ModelContainer` 只在 `SportAppApp.init()` 建立一次,同一份 `mainContext` 被包進五個 `@Observable` repository：`ExerciseRepository`、`WorkoutRepository`、`BodyIndexRepository`、`FoodRepository`、`MealRepository`。Repository 透過 `.environment(...)` 注入到 root scene,View 端用 `@Environment(WorkoutRepository.self)` 讀取,不應該在 View 直接碰 `ModelContext`。新增資料操作時,優先擴充對應 repository,不要在 View 散落 `context.insert/save`。

`ExerciseRepository.seedIfNeeded()` 在啟動時執行,首次啟動會塞入預設動作清單。

以日期為 key 的欄位（`WorkoutBlock.date`、`MealRecord.date` 等)在 model 的 `init` 內統一用 `Calendar.current.startOfDay(...)` 正規化。不要直接存 `Date()` 當「今天」的欄位 — 傳入 date 由 model 自己正規化。

營養紀錄是 denormalized：`MealRecord` 在新增當下就把 `foodName`、`intake` 以及對應攝取量的 macros 存進去。改動 intake 時要呼叫 `MealRepository.update(record:newIntake:)`,它會用比例重新換算熱量與三大營養素。不要假設 `MealRecord` 還能回查 `Food`。

### 導覽結構

`ContentView` 是 4 個 tab 的 `TabView`（首頁 / 運動 / 營養 / 我的),分別包 `HomeView`、`WorkoutsView`、`NutritionView`、`ProfileView`。Tab bar 外觀在 `ContentView.init` 用 `UITabBarAppearance` 全域覆寫。Sheet、日期選擇與表單在 `Views/<Tab>/` 底下。

### Theme — `Theme/AppTheme.swift`

色板定義為 `Color.appBackground`、`Color.appCard`、`Color.appBlue` 等,對應 Tailwind 的 stone + accent 配色。Hex 字串透過同檔案的 `Color(hex:)` 初始化。請一律使用這些 token,不要寫死字面色值,才能跟 `docs/swiftui-ui-design.md` 的深色主題保持一致。

### 外部整合

- **LLM client**（`Services/LLMClient.swift`）對接任何 OpenAI 相容的 `/chat/completions` 端點。`LLMClient.fromStoredSettings()` 從 Keychain 讀 API key,從 `UserDefaults` 讀 `baseURL` / `model`（key 為 `llmEndpoint`、`llmModelName`),任一缺失就回 `nil`。`completeWithImage` 支援 vision（base64 data URL,可選傳 `LLMResponseSchema` 取得 JSON Schema 結構化輸出),目前用來從照片自動填入身體數據。
- **Notion 匯入**（`Services/NotionImportService.swift`）會分頁查詢 Notion database,匯入 Exercises / Foods / Meals / Workouts / BodyIndexes。各類的 database id 分別存在 `@AppStorage`（`notionImportExercisesDbId` 等),回傳 `ImportResult` 包含各類已匯入 / 已跳過的計數。
- **Keychain**（`Services/KeychainHelper.swift`）包了 Security framework。請使用命名好的 helper（Notion 用 `saveToken/loadToken`、LLM 用 `saveLLMKey/loadLLMKey`),不要直接用 `save(_:account:)`。Service identifier 寫死為 `com.sportapp`。

## 程式碼慣例

- View 內的字串直接寫繁體中文 inline,沒有用 `.strings` 表 — 比照現有風格即可。
- `@Model` 內的 enum 欄位都用 String 儲存（例：`WorkoutBlock.blockType: String` 搭配 `var type: BlockType { ... }`),因為 SwiftData 不直接支援 enum 欄位。新增 enum 欄位請沿用此寫法。
- Repository 用 `@Observable`（Observation framework),不是 `ObservableObject` — 注入用 `.environment(...)`,讀取用 `@Environment(Type.self)`。
