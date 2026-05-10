# 運動紀錄 App — SwiftUI 重構 UI 設計文件

## Context

此文件從現有 Next.js PWA (`src/`) 萃取出完整的頁面結構、視覺設計規格與互動行為，作為 SwiftUI 重構的參考規格。目標是讓 SwiftUI 開發者僅看此文件，就能還原所有畫面。

---

## 設計系統

### 色板

| Token | Tailwind | Hex | 用途 |
|-------|----------|-----|------|
| 背景 | `stone-900` | `#1c1917` | App 主背景 |
| 卡片 | `stone-800` | `#292524` | 卡片、輸入框背景 |
| 分隔線 / 次要控件 | `stone-700` | `#44403c` | Border、按鈕背景 |
| 主文字 | `stone-100` | `#f5f5f4` | 主要標題、重要數值 |
| 次要文字 | `stone-300` | `#d6d3d1` | 一般內容 |
| 輔助文字 | `stone-500` | `#78716c` | 標籤、說明、次要 |
| 隱藏文字 | `stone-600` | `#57534e` | 單位、日期 |
| 主色 (藍) | `blue-400/500` | `#60a5fa / #3b82f6` | 選中狀態、CTA |
| 成功 (綠) | `emerald-400/500` | `#34d399 / #10b981` | 訓練達成、蛋白質 |
| 警告 (橘) | `orange-400` | `#fb923c` | 體脂率、Drop Set |
| 危險 (紅) | `red-400` | `#f87171` | 熱量、超標 |
| 脂肪 (黃) | `yellow-400` | `#facc15` | 脂肪、PR |
| 碳水 (綠) | `green-400` | `#4ade80` | 碳水化合物 |

### 字體規格

| 用途 | 大小 | 粗細 |
|------|------|------|
| 主標題 | 24pt (text-2xl) | Bold |
| 副標題 | 20pt (text-xl) | Bold |
| 卡片標題 | 14pt (text-sm) | SemiBold |
| 一般內文 | 14–15pt (text-sm/[15px]) | Medium |
| 輔助說明 | 12pt (text-xs) | Medium |
| 細節 / 單位 | 10–11pt (text-[10px]/[11px]) | Medium |

### 尺寸 & 間距

| 元素 | 規格 |
|------|------|
| 圓角卡片 | `cornerRadius: 16` (rounded-2xl) |
| 按鈕圓角 | `cornerRadius: 12` (rounded-xl) |
| 圓形圖示按鈕 | `cornerRadius: .infinity` (rounded-full) |
| 卡片 Padding | `16pt` 四邊 |
| 列表列間距 | `12pt` (gap-3) |
| Tab bar 高度 | `64pt` |
| 輸入框高度 | `48pt` |
| 小圖示按鈕 | `32×32pt` (w-8 h-8) |
| 大圖示按鈕 | `40×40pt` (w-10 h-10) |

### 互動動畫

- **底部彈出 Sheet**：Y 軸從 100% 滑入，spring(damping: 25, stiffness: 300)
- **進場淡入**：opacity 0→1，y offset 4pt→0
- **按鈕回饋**：active 時背景加深一階（stone-700 → stone-600 → stone-500）
- **進度條**：`animation(.linear, duration: 0.3)`

---

## 全域版面

### Tab Bar 導航 (BottomNav)
`src/components/bottom-nav.tsx`

- 固定在底部，高度 64pt
- 背景：stone-900；頂部邊線：stone-700
- 4 個 tab，等寬排列

| Tab | 中文標籤 | 路由 |
|-----|----------|------|
| 首頁 | 首頁 | `/` |
| 運動 | 運動 | `/workouts` |
| 營養 | 營養 | `/nutrition` |
| 我的 | 我的 | `/profile` |

- 選中：填滿圖示 + `blue-400` 文字
- 未選中：線框圖示 + `stone-500` 文字
- 圖示大小：22pt

### App 版面結構

- 最大寬度：448pt（iPhone 滿版）
- 底部留 64pt 空間給 Tab Bar
- 所有頁面 padding：`px-4`（水平 16pt）
- 支援 Safe Area

---

## 畫面規格

---

### 1. 首頁 (Home)
`src/app/page.tsx`

**版面（由上到下）：**

```
pt-6 px-4
┌─ 標題區 ──────────────────────┐
│ "運動紀錄" [24pt bold stone-100]│
└────────────────────────────────┘

┌─ 本週訓練卡片 ─────────────────────────────────────┐
│ [stone-800 rounded-2xl p-4]                          │
│ 標題："本週訓練"  右側："X / 7 天"（X = emerald-400）│
│                                                       │
│  一  二  三  四  五  六  日   ← 7 欄 grid            │
│  ○  ●  ○  ●  ○  ○  ○     ● = 有訓練（emerald）    │
│                                                       │
│  今天的圓圈加上 ring-2 blue-400 外框                 │
└──────────────────────────────────────────────────────┘
```

**7 日格圓圈規格：**
- 大小：32×32pt (w-8 h-8)
- 有訓練：`emerald-500/20` 背景 + `emerald-500/50` border + 10pt 綠點
- 今天：額外 ring-2 blue-400（含 2pt offset）
- 星期標籤：12pt，today = stone-200，其他 = stone-500

---

**今日營養摘要卡片（有設定目標時才顯示）：**
```
┌─ 今日營養卡片 ──────────────────────┐
│ [stone-800 rounded-2xl p-4 → /nutrition]│
│ 標題："今日營養"                        │
│                                          │
│ 熱量 [stone-500]     XYZ / 2000 kcal   │
│ ████████░░░░░░  [red-400 進度條 h-1.5] │
│                                          │
│ 蛋白質 [stone-500]   XXX / 150 g        │
│ ██████░░░░░░░░  [blue-400 進度條]       │
└──────────────────────────────────────────┘
```
- 整張卡片可點，導航到 /nutrition
- 進度條：石色軌道 + 彩色填充，高 6pt，圓角

---

**最新身體指標卡片（有資料時才顯示）：**
```
┌─ 身體指標卡片 ──────────────────────┐
│ [stone-800 rounded-2xl p-4 → /profile/body-index]│
│ 標題："身體指標"     日期 [stone-600] │
│                                        │
│  體重          體脂率         骨骼肌   │
│  70.5 kg       18.5 %        35.2 kg  │
│  [blue-400]   [orange-400]  [emerald-400] │
└────────────────────────────────────────┘
```
- 3 欄 grid，數值用大字體（18pt bold），單位 12pt stone-500

---

**快速導航（2 欄 grid）：**
```
┌──────────────────┬──────────────────┐
│  [blue-500/20]   │  [green-500/20]  │
│  藍色圖示        │  綠色圖示        │
│  "今日營養"      │  "運動記錄"      │
│  查看飲食紀錄    │  追蹤訓練進度    │
└──────────────────┴──────────────────┘
```
- 卡片高度自適應，內部 padding 16pt
- icon 容器：40×40pt rounded-xl

---

### 2. 飲食頁 (Nutrition)
`src/app/(date)/nutrition/`

**版面（由上到下）：**
1. 頁面標題："今日飲食" [20pt bold]
2. **日期選擇器** (DateSelector)
3. **本週摘要** (WeeklySummary) — 可折疊
4. **營養總覽** (NutritionOverview)
5. **餐次 Tracker × 4** (MealTracker)：早餐 / 午餐 / 晚餐 / 點心

---

#### 2a. 日期選擇器 (DateSelector)
`src/components/date-selector.tsx`

```
┌─ 月份導航 ──────────────────────┐
│  ←    2025年 5月    →           │
└──────────────────────────────────┘
┌─ 日曆格 7×6 ────────────────────┐
│  日  一  二  三  四  五  六     │
│  ○  ○  ●  ○  ●  ○  ○     ← ● = 有資料（彩色點） │
│  ...                             │
└──────────────────────────────────┘
[今天] 按鈕（僅在不是當月時顯示）
```

- 選中日期：`blue-500` 圓形背景
- 今天（未選中）：小藍點指示
- 日期提示點（hints）：最多 3 個彩色點，emerald-400 = 有運動

---

#### 2b. 本週摘要 (WeeklySummary)
`src/app/(date)/nutrition/components/weekly-summary.tsx`

**可折疊卡片（預設展開）：**
```
┌─ 本週摘要  05/05 – 05/11  3/7天  ▾ ─┐
│                                        │
│  橫條圖（7天，高度 = 卡路里 %）:       │
│  ▐▌ ▐▌ ▐▌ ░ ▐▌ ░ ░                  │
│  一  二  三  四  五  六  日            │
│  綠 = ≥90% 目標，藍 = 有記錄但未達標  │
│                                        │
│  ┌────────┬────────┬────────┐          │
│  │均卡路里│均蛋白質│達標天數│          │
│  │  1850  │  145g  │  3/7   │          │
│  └────────┴────────┴────────┘          │
└────────────────────────────────────────┘
```
- 3 統計格：`stone-700/50` 背景 rounded-xl
- 蛋白質數值：emerald-400；達標天數：blue-400

---

#### 2c. 營養總覽 (NutritionOverview)
`src/app/(date)/nutrition/components/nutrition-overview.tsx`

**有目標模式（4 列進度條）：**
```
┌──────────────────────────────────┐
│ 熱量              1850 / 2000 kcal│
│ ████████████░░░░  [red-400]      │
│ 還差 150 kcal [stone-500]        │
│                                   │
│ 蛋白質            145 / 150 g    │
│ ███████████░░░░   [blue-400]     │
│ 還差 5 g                         │
│                                   │
│ 碳水              200 / 250 g    │
│ ████████░░░░░░    [green-400]    │
│                                   │
│ 脂肪              60 / 65 g      │
│ █████████░░░░░    [yellow-400]   │
└───────────────────────────────────┘
```
- 超標時：進度條變 red-500，文字顯示「超出 X kcal」(red-400)

**無目標模式（4 格數值）：**
```
┌──────┬──────┬──────┬──────┐
│蛋白質│ 脂肪 │ 碳水 │ 熱量 │
│ 145  │  60  │ 200  │ 1850 │
│  g   │  g   │  g   │ kcal │
└──────┴──────┴──────┴──────┘
```

---

#### 2d. 餐次 Tracker (MealTracker)
`src/app/(date)/nutrition/components/meal-tracker.tsx`

**餐次卡片：**
```
┌─ 早餐   850 kcal                 + ─┐
├─────────────────────────────────────┤
│ 雞胸肉  [stone-200]                 │
│ 150g · 248 kcal · P 46g · F 5g · C 0g [stone-500 xs] │
│                                      [✏] [🗑]         │
├─────────────────────────────────────┤
│ 白飯                                 │
│ 200g · 260 kcal · ...               │
└─────────────────────────────────────┘
```

- 列高：最小 40pt；列之間：`divide-y stone-700/50`
- 鉛筆按鈕：28×28pt，hover→ blue-400
- 垃圾桶按鈕：28×28pt，hover→ red-400
- 空狀態：「尚無紀錄，點擊 + 新增」(stone-600 xs)

---

**新增食物 Modal（底部彈出）：**

**搜尋介面：**
```
┌─────────────── 新增食物 ────── ✕ ─┐
│  [搜尋食物... 輸入框]              │
├────────────────────────────────────┤
│ 🕐 最近使用                        │
│   雞胸肉    248 kcal / 100g       │
│   白飯      130 kcal / 100g       │
│ ─────────────────────────────────  │
│   [搜尋結果列表]                   │
│   + 建立新食物  [emerald-400]      │
├────────────────────────────────────┤
│（選中食物後，底部出現）            │
│  蛋白質 脂肪 碳水 糖 纖維 鈉       │
│  [3 欄 × 2 列 細節格]              │
│  攝取量(g) [輸入框]   [新增 按鈕] │
└────────────────────────────────────┘
```
- 最大高度：85vh
- 搜尋結果列：選中時 `blue-500/20` 背景 + border `blue-500/30`

**建立食物介面（從同一 Modal 切換）：**
```
← 建立食物 ─────────────── ✕
食物名稱 [輸入框]
基準份量 (g) [輸入框]
以下為每 Xg 的營養數值
┌──────────┬──────────┐
│熱量(kcal)│蛋白質(g) │
├──────────┼──────────┤
│脂肪(g)   │碳水(g)   │
└──────────┴──────────┘
[建立食物] emerald-500 按鈕
```

**修改分量 Modal：**
```
修改分量 ─────────────── ✕
雞胸肉 [stone-300 sm]
攝取量 (g) [輸入框]
[確認] blue-500 按鈕
```

---

### 3. 運動頁 (Workouts)
`src/app/workouts/`

**版面（由上到下）：**
1. 頁面標題："運動紀錄" [20pt bold]
2. **日期選擇器**（同 Nutrition，含 emerald 點 hints）
3. **本週訓練摘要** (WeeklyWorkoutSummary)
4. **訓練 Tracker** (ExerciseTracker)

---

#### 3a. 本週訓練摘要 (WeeklyWorkoutSummary)
`src/app/workouts/components/weekly-workout-summary.tsx`

```
┌─ 本週訓練  X天  Y組 ─────────────┐
│  一  二  三  四  五  六  日        │
│  ●  ●  ○  ●  ○  ○  ○           │
│  3   2     4                      │
│                                    │
│  訓練天數  總組數                  │
│     3        9                     │
└────────────────────────────────────┘
```
- 日期圓圈：有訓練 = `emerald-500` 填充；今天 = 藍色外框 ring
- 圓圈下方顯示當天組數

---

#### 3b. 訓練 Tracker (ExerciseTracker)
`src/app/workouts/components/exercise-tracker.tsx`

**工具列（有動作時才出現）：**
```
┌─ 共 3 個動作 · 12 組 ─── [磅][kg] ─┐
└─────────────────────────────────────┘
```
- 磅/kg 切換：`stone-700` 容器，選中格 = `stone-500` 背景

**主訓練卡片：**
```
┌─ 今日訓練 ────────────── [+] ─┐
├────────────────────────────────┤
│ [WorkoutBlockRow × N]          │
└────────────────────────────────┘
```

**WorkoutBlock 列（每個訓練動作區塊）：**
```
├─────────────────────────────────────────┤
│ 臥推 [15pt semibold]  [單一動作] badge  │
│ 3 回合 · 9 筆 set  [stone-500 xs]      │
│                      [≡][+][🗑]        │
│                                          │
│ ┌─ 第 1 回合 [stone-900/45 rounded-xl]─┐│
│ │  100 磅 · 8 下                       ││
│ └──────────────────────────────────────┘│
│ ┌─ 第 2 回合 ──────────────────────────┐│
│ │  100 磅 · 8 下                       ││
│ └──────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**Block 類型 Badge 色碼：**
| 類型 | 中文 | 顏色 |
|------|------|------|
| single | 單一動作 | blue-500/15 text-blue-400 |
| drop_set | Drop Set | orange-500/15 text-orange-400 |
| superset | Superset | emerald-500/15 text-emerald-400 |
| circuit | Circuit | purple-500/15 text-purple-400 |

**Drop Set 回合顯示（2 欄 + 箭頭）：**
```
┌──────────────┐  →  ┌──────────────┐
│ 第一段       │      │ 降重         │
│ 100 磅 · 8下 │      │ 80 磅 · 12下 │
└──────────────┘      └──────────────┘
```
- 左格：stone-500 標籤；右格：orange-400 標籤

**Set 類型標籤（僅有時才顯示）：**
| setType | 標籤 | 顏色 |
|---------|------|------|
| warmup | 暖身 | orange-400 bg-orange-500/10 |
| failure | 力竭 | orange-400 bg-orange-500/10 |

---

**拖曳重排（Drag & Drop）：**
- 區塊列右側有 `≡` 拖曳 handle（40×40pt）
- 拖曳中：背景 `stone-700/30`，handle 變 blue-300
- 回合列同樣可拖曳重排

---

**新增動作 Modal（底部彈出，兩步驟）：**

**Step 1 — 選擇動作：**
```
選擇動作 ─────────────── ✕
┌─ Block 類型選擇器 (2 欄) ─────────┐
│  [單一動作]  [Drop Set]            │
└────────────────────────────────────┘
[搜尋動作... 輸入框]

設備篩選（橫向滾動 Chips）:
  徒手(綠)  啞鈴(藍)  槓鈴(橘)  機械(紫)  繩索(黃)  壺鈴(紅)

肌群篩選（橫向滾動 Chips）:
  胸  背  肩  二頭  三頭  腿  臀  核心

🕐 最近使用
[動作列表 → 點擊進 Step 2]
```

**Step 2 — 設定動作：**
```
← [動作名稱] ─────────── ✕

┌─ Block 類型 ──────────────────────┐
│  [單一動作]  [Drop Set]            │
└────────────────────────────────────┘

上次  100磅 · 8下 (2025-05-01) [stone-300]
PR    120磅 · 5下 (2025-04-01) [yellow-400]

▸ 過去 12 週進度（點擊展開折線圖）

重量 [數字輸入] [磅][kg]
次數／組 [輸入]  |  組數（選填）[輸入]

預覽："100磅 · 3組 × 8下"

[新增] blue-500 按鈕（full width）
```

**Drop Set 設定：**
```
┌─ 第一段 ────────────────────────┐
│ 重量 [輸入] [磅][kg]            │
│ 次數 [輸入]                     │
└──────────────────────────────────┘
     ──→ 接著（不休息）──
┌─ 第二段（降重）─────────────────┐
│ 重量 [輸入] [磅][kg]            │
│ 次數 [輸入]                     │
└──────────────────────────────────┘
```

---

**追加一組 Modal：**
```
追加一組 / 追加 Drop Set ─── ✕
[動作名稱 xs stone-500]

Block 類型選擇器

[重量輸入]
[次數輸入]

組類型選擇（3 格）:
  [一般]  [暖身]  [力竭]
  選中 = blue-500，其他 = stone-800

[加入此區塊] blue-500 按鈕
```

---

### 4. 個人設定頁 (Profile)
`src/app/profile/page.tsx`

```
個人設定 [20pt bold]

[健康數據] ─ section 標題 (stone-400 xs uppercase tracking)
┌─ 身體指標 ─────────────────── › ─┐
│ [emerald 圖示]  體重、體脂率...   │
└────────────────────────────────────┘

[飲食設定]
┌─ 飲食目標 ─────────────────── › ─┐
│ [orange 圖示]  每日卡路里...       │
└────────────────────────────────────┘

[運動設定]
┌─ 動作管理 ─────────────────── › ─┐
│ [blue 圖示]  新增、編輯...        │
└────────────────────────────────────┘

[應用程式]
┌─ Notion 連接設定 ──────────── › ─┐
│ [stone 圖示]  API Token...        │
└────────────────────────────────────┘

┌─ 關於 ─────────────────────────────┐
│ 運動紀錄 v1.0                      │
│ 資料存儲於你的 Notion workspace    │
└────────────────────────────────────┘
```

**SettingsRow 規格：**
- 背景：stone-800 rounded-2xl px-4 py-4
- 圖示容器：36×36pt rounded-xl，各有對應 bg 色
- 右側：chevron.right，stone-600
- 圖示大小：18pt（Notion logo 16pt）

---

### 5. 身體指標頁 (BodyIndex)
`src/app/profile/body-index/page.tsx`

**版面：**
```
← 身體指標 ─────────────── [+]

最後量測：2025-05-01 [xs stone-500]

┌──────────────┬──────────────┐
│ 體重         │ 體脂率       │
│ 70.5 kg      │ 18.5 %       │
│ [blue-400]   │ [orange-400] │
├──────────────┼──────────────┤
│ 骨骼肌重     │ 內臟脂肪指數 │
│ 35.2 kg      │ 8            │
│ [emerald-400]│ [red-400]    │
├──────────────┼──────────────┤
│ 體脂重       │ 基礎代謝率   │
│ 14.5 kg      │ 1650 kcal    │
│ [yellow-400] │ [purple-400] │
├──────────────┼──────────────┤
│ 蛋白質重     │ 體內水分     │
│ 12.0 kg      │ 42.0 kg      │
│ [cyan-400]   │ [sky-400]    │
└──────────────┴──────────────┘

┌─ 趨勢圖 ─── [體重][體脂率][骨骼肌重] ─┐
│         折線圖（高度 160pt）           │
└────────────────────────────────────────┘

歷史紀錄 [sm semibold]
┌─ 2025-05-01 ────── 70.5kg 18.5% 35.2kg ─┐
│ ...（最多顯示 5 筆，可展開）              │
└───────────────────────────────────────────┘
[顯示全部 N 筆] / [收起]
```

**新增量測 Modal：**
```
新增量測 ─────────────── ✕

量測日期 [date 輸入框]

┌──────────┬──────────┐
│體重(kg)  │體脂率(%) │
├──────────┼──────────┤
│骨骼肌重  │體脂重    │
├──────────┼──────────┤
│內臟脂肪  │基礎代謝  │
├──────────┼──────────┤
│身高(cm)  │體內水分  │
├──────────┼──────────┤
│蛋白質重  │礦物質重  │
└──────────┴──────────┘

[儲存] emerald-500 按鈕（體重 > 0 才啟用）
```

---

### 6. 飲食目標頁 (NutritionGoals)
`src/app/profile/nutrition-goals/page.tsx`

```
← 飲食目標

┌─ stone-800 rounded-2xl p-4 ─────────┐
│ 每日熱量 (kcal) [輸入框]             │
│ 蛋白質 (g)      [輸入框]             │
│ 碳水化合物 (g)  [輸入框]             │
│ 脂肪 (g)        [輸入框]             │
│ [儲存] blue-500 按鈕                 │
└────────────────────────────────────────┘
```

---

### 7. 動作管理頁 (Exercises)
`src/app/profile/exercises/`

```
← 動作管理 ─────────────── [+]

[搜尋動作... 輸入框]

設備篩選 Chips（橫向滾動）

動作列表：
┌─ 臥推 ─────────────────────── › ─┐
│ 胸 · 三頭  [stone-500 xs]         │
│                          [槓鈴]   │
└────────────────────────────────────┘
```

- 每個動作列：點擊 → 編輯 Modal
- 新增 Modal：名稱、設備、主要肌群

---

## 共用元件規格

### 進度條
`src/components/progress-bar.tsx`
- 軌道：`stone-700`，高 6pt，全圓角
- 填充：對應顏色，`max(0%, min(100%, pct))`
- 超標：填充色變 red-500

### Modal 共用規格
`src/components/model.tsx`
- 背景蒙版：`black/70` 固定全螢幕
- 主體：`stone-900 rounded-t-2xl`，從底部 Tab Bar 上方彈起
- 點蒙版關閉
- Header：左標題 + 右 ✕（32×32pt stone-800 rounded-full）
- 分隔線：`stone-800` border-t

### 圖示按鈕規格
`src/components/icon-botton.tsx`
- 標準尺寸：40×40pt，rounded-full
- 小尺寸：28–32×28–32pt
- 預設：stone-700 背景 + stone-400 圖示
- 刪除狀態：red-400/10 背景 + red-400 圖示
- 操作狀態：blue-400/10 背景 + blue-400 圖示

### 空狀態
- 圖示：48pt，stone-700 色
- 說明文字：stone-500，14pt
- CTA 按鈕：emerald-500 或 blue-500

### Loading Skeleton
- 高度對應實際內容
- 背景：stone-700，加 `animate-pulse`

---

## 資料模型（供 SwiftUI 型別定義參考）

### Food
```
id: String
name: String
weight: Double        // 基準份量 g
calories: Double
protein: Double
fat: Double
carbs: Double
sugar: Double?
dietaryFiber: Double?
sodium: Double?       // mg
```

### MealItem
```
id: String
date: String          // YYYY-MM-DD
mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack"
foodId: String
foodName: String
intake: Double        // g
calories: Double
protein: Double
fat: Double
carbs: Double
```

### NutritionGoals
```
calories: Int
protein: Int
carbs: Int
fat: Int
```

### NutritionOverview（日匯總）
```
date: String
calories: Double
protein: Double
fat: Double
carbs: Double
```

### Exercise
```
id: String
brand: String?
machineName: String
equipment: "徒手"|"啞鈴"|"槓鈴"|"機械"|"繩索"|"壺鈴"
muscleGroups: [String]
```

### ExerciseSet
```
id: String
exerciseId: String
exerciseName: String
roundIndex: Int
orderIndex: Int
weightKg: Double
reps: Int
setType: "normal"|"warmup"|"drop"|"failure"
```

### WorkoutBlock
```
id: String
sessionId: String
type: "single"|"drop_set"|"superset"|"circuit"
rounds: Int
orderIndex: Int
sets: [ExerciseSet]
```

### BodyIndex
```
id: String
date: String
weight: Double
bodyFatPercentage: Double
skeletalMuscleWeight: Double
bodyFatWeight: Double
visceralFatIndex: Double
basalMetabolicRate: Double
height: Double
totalWater: Double
proteinWeight: Double
mineralWeight: Double
```

---

## 重構工作拆解（建議順序）

1. **設計系統層**：Color、Typography、Spacing 常數 + 共用元件（ProgressBar、IconButton、BottomSheet）
2. **Tab Navigator**：TabView 4 頁 + 底部導航
3. **首頁**：週訓練格、營養摘要卡、身體指標卡、快速導航
4. **飲食頁**：DateSelector → WeeklySummary → NutritionOverview → MealTracker + 2 個 Modal
5. **運動頁**：DateSelector → WeeklyWorkoutSummary → ExerciseTracker + 拖曳 + 2 個 Modal
6. **個人設定頁**：SettingsRow 列表 + 4 個子頁面
7. **身體指標子頁**：Grid 卡片 + 折線圖 + 歷史列表 + Modal
8. **資料層**：Notion API 或本地 SQLite 對接

---

## 驗收標準

- [ ] 所有畫面與設計規格色碼、尺寸一致
- [ ] 底部彈出 Sheet 有 spring 動畫
- [ ] 日期選擇器正確標示今天 & 選中狀態
- [ ] 訓練區塊支援拖曳重排
- [ ] Drop Set 顯示兩段式版面（含箭頭）
- [ ] 空狀態、Loading Skeleton、錯誤狀態均已實作
- [ ] 深色模式（所有畫面均已使用 Dark 色板）
- [ ] Safe Area 正確處理（Tab Bar 不遮內容）
