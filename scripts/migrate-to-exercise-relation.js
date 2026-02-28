// scripts/migrate-to-exercise-relation.js
// 對 Exercise Records 進行結構遷移：
//   1. 在 Records DB 新增 Exercise（relation）和 ExerciseName（rich_text）兩個欄位
//   2. 將每筆紀錄的 Name 複製到 ExerciseName
//   3. 根據名稱匹配將 Exercise relation 指向 Exercises DB 中的對應項目
//   4. 將 Name（title）改為 UUID
//
// 使用方式：
//   DRY_RUN=true node --env-file=.env.local scripts/migrate-to-exercise-relation.js  # 預覽
//   node --env-file=.env.local scripts/migrate-to-exercise-relation.js               # 正式執行

const { Client } = require("@notionhq/client");
const { randomUUID } = require("crypto");

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const RECORDS_DB_ID = process.env.NOTION_EXERCISE_RECORDS_DB_ID;
const EXERCISES_DB_ID = process.env.NOTION_EXERCISES_DB_ID;
const DRY_RUN = process.env.DRY_RUN === "true";

if (!NOTION_TOKEN || !RECORDS_DB_ID || !EXERCISES_DB_ID) {
  console.error("❌ 請設定 NOTION_TOKEN、NOTION_EXERCISE_RECORDS_DB_ID、NOTION_EXERCISES_DB_ID");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });

if (DRY_RUN) console.log("🔍 Dry run 模式：只預覽，不寫入\n");

// =====================
// 取得欄位值
// =====================
function getTitle(page) {
  const p = page.properties?.Name;
  if (p?.type === "title") return p.title[0]?.plain_text ?? "";
  return "";
}

function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// =====================
// 分頁抓取所有資料
// =====================
async function fetchAll(databaseId) {
  const pages = [];
  let cursor;
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);
  return pages;
}

// =====================
// 名稱匹配策略
// =====================
function findMatch(recordName, exerciseMap) {
  // 1. 完全符合
  if (exerciseMap.has(recordName)) return exerciseMap.get(recordName);

  // 2. 正規化後符合（忽略空白/全形括號）
  const normalize = (s) =>
    s.replace(/\s+/g, "").replace(/（/g, "(").replace(/）/g, ")");
  const normRecord = normalize(recordName);
  for (const [name, id] of exerciseMap) {
    if (normalize(name) === normRecord) return id;
  }

  // 3. 包含關係
  for (const [name, id] of exerciseMap) {
    if (name.includes(recordName) || recordName.includes(name)) return id;
  }

  return null;
}

// =====================
// Step 1：新增欄位到 Records DB
// =====================
async function addPropertiesToDatabase() {
  console.log("🔧 Step 1：檢查並新增資料庫欄位...");

  const db = await notion.databases.retrieve({ database_id: RECORDS_DB_ID });
  const existingProps = Object.keys(db.properties);

  const hasExercise = existingProps.includes("Exercise");
  const hasExerciseName = existingProps.includes("ExerciseName");

  if (hasExercise && hasExerciseName) {
    console.log("   欄位已存在，跳過新增\n");
    return;
  }

  if (DRY_RUN) {
    if (!hasExercise) console.log("   [Dry run] 將新增 Exercise（relation）欄位");
    if (!hasExerciseName) console.log("   [Dry run] 將新增 ExerciseName（rich_text）欄位");
    console.log("");
    return;
  }

  const newProps = {};
  if (!hasExercise) {
    newProps["Exercise"] = {
      relation: {
        database_id: EXERCISES_DB_ID,
        type: "single_property",
        single_property: {},
      },
    };
  }
  if (!hasExerciseName) {
    newProps["ExerciseName"] = {
      rich_text: {},
    };
  }

  await notion.databases.update({
    database_id: RECORDS_DB_ID,
    properties: newProps,
  });

  console.log(`   ✅ 已新增欄位：${Object.keys(newProps).join("、")}\n`);
}

// =====================
// 主流程
// =====================
async function main() {
  // Step 1：確保欄位存在
  await addPropertiesToDatabase();

  // Step 2：載入 Exercises DB，建立 name → id 對照表
  console.log("📥 Step 2：載入 Exercises 資料庫...");
  const exercisePages = await fetchAll(EXERCISES_DB_ID);
  const exerciseMap = new Map(); // name → page.id
  for (const page of exercisePages) {
    const name = getTitle(page);
    if (name) exerciseMap.set(name, page.id);
  }
  console.log(`   找到 ${exerciseMap.size} 個動作\n`);

  // Step 3：載入所有 Records
  console.log("📥 Step 3：載入 Exercise Records...");
  const recordPages = await fetchAll(RECORDS_DB_ID);
  console.log(`   找到 ${recordPages.length} 筆紀錄\n`);

  // Step 4：分析每筆記錄
  const toMigrate = [];  // 需要遷移（Name 不是 UUID）
  const alreadyMigrated = [];  // 已遷移（Name 已是 UUID）
  const noMatch = [];   // 找不到對應 Exercise

  for (const page of recordPages) {
    const name = getTitle(page);
    if (isUUID(name)) {
      alreadyMigrated.push(page);
      continue;
    }
    const exerciseId = findMatch(name, exerciseMap);
    toMigrate.push({ page, originalName: name, exerciseId });
    if (!exerciseId) noMatch.push(name);
  }

  console.log("─".repeat(50));
  console.log(`📊 統計：`);
  console.log(`   需遷移：${toMigrate.length} 筆`);
  console.log(`   已遷移：${alreadyMigrated.length} 筆（跳過）`);
  if (noMatch.length > 0) {
    const uniqueNoMatch = [...new Set(noMatch)];
    console.log(`\n⚠️  找不到對應 Exercise（${uniqueNoMatch.length} 種，ExerciseName 仍會保留，relation 留空）：`);
    for (const name of uniqueNoMatch) {
      console.log(`   「${name}」`);
    }
  }
  console.log("");

  // 預覽前 5 筆
  if (toMigrate.length > 0) {
    console.log("📋 前 5 筆遷移預覽：");
    for (const { originalName, exerciseId } of toMigrate.slice(0, 5)) {
      const uuid = "xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx";
      console.log(`   「${originalName}」→ Name: ${uuid} | ExerciseName: ${originalName} | Exercise: ${exerciseId ?? "（無對應）"}`);
    }
    console.log("");
  }

  if (DRY_RUN) {
    console.log(`✨ Dry run 完成，將影響 ${toMigrate.length} 筆紀錄（未寫入）`);
    return;
  }

  if (toMigrate.length === 0) {
    console.log("✨ 所有紀錄已遷移完畢，無需操作。");
    return;
  }

  // Step 5：正式更新
  console.log("✏️  Step 4：更新中...\n");
  let updated = 0;
  let failed = 0;

  for (const { page, originalName, exerciseId } of toMigrate) {
    const uuid = randomUUID();
    try {
      const properties = {
        Name: { title: [{ text: { content: uuid } }] },
        ExerciseName: { rich_text: [{ text: { content: originalName } }] },
        ...(exerciseId
          ? { Exercise: { relation: [{ id: exerciseId }] } }
          : {}),
      };

      await notion.pages.update({
        page_id: page.id,
        properties,
      });

      updated++;
      process.stdout.write(`\r   已更新 ${updated} / ${toMigrate.length} 筆...`);
    } catch (err) {
      failed++;
      console.error(`\n  ❌ 更新失敗 [${page.id}] 「${originalName}」：${err.message}`);
    }

    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`\n\n✨ 完成！更新 ${updated} 筆，失敗 ${failed} 筆`);
}

main().catch((err) => {
  console.error("❌ 執行失敗：", err);
  process.exit(1);
});
