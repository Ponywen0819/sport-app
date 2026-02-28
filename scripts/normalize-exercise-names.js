// scripts/normalize-exercise-names.js
// 將 Exercise Records 的動作名稱正規化，對齊 Exercises 資料庫中的標準名稱
//
// 使用方式：
//   DRY_RUN=true node --env-file=.env.local scripts/normalize-exercise-names.js  # 預覽
//   node --env-file=.env.local scripts/normalize-exercise-names.js               # 正式執行

const { Client } = require("@notionhq/client");

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
// 取得名稱欄位
// =====================
function getTitle(page) {
  const nameProp = page.properties?.Name;
  if (nameProp?.type === "title") return nameProp.title[0]?.plain_text ?? "";
  return "";
}

// =====================
// 分頁抓取所有資料
// =====================
async function fetchAll(databaseId, filter) {
  const pages = [];
  let cursor;
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      ...(filter ? { filter } : {}),
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
function findMatch(recordName, exerciseNames) {
  // 1. 完全符合
  if (exerciseNames.includes(recordName)) return recordName;

  // 2. 正規化後完全符合（忽略全形/空白）
  const normalize = (s) => s.replace(/\s+/g, "").replace(/（/g, "(").replace(/）/g, ")");
  const normRecord = normalize(recordName);
  const exactNorm = exerciseNames.find((n) => normalize(n) === normRecord);
  if (exactNorm) return exactNorm;

  // 3. 包含關係：exercise 的名稱包含 record 名稱（或反之）
  const contained = exerciseNames.find(
    (n) => n.includes(recordName) || recordName.includes(n)
  );
  if (contained) return contained;

  return null;
}

// =====================
// 主流程
// =====================
async function main() {
  console.log("📥 載入 Exercises 資料庫...");
  const exercisePages = await fetchAll(EXERCISES_DB_ID);
  const exerciseNames = exercisePages.map(getTitle).filter(Boolean);
  console.log(`   找到 ${exerciseNames.length} 個動作\n`);

  console.log("📥 載入 Exercise Records...");
  const recordPages = await fetchAll(RECORDS_DB_ID);
  console.log(`   找到 ${recordPages.length} 筆紀錄\n`);

  // 統計各動作名稱的匹配結果
  const uniqueNames = [...new Set(recordPages.map(getTitle).filter(Boolean))];
  console.log(`📊 共 ${uniqueNames.length} 個不重複動作名稱\n`);

  const matchMap = new Map(); // recordName -> canonicalName | null
  const noMatch = [];

  for (const name of uniqueNames) {
    const matched = findMatch(name, exerciseNames);
    matchMap.set(name, matched);
    if (!matched) noMatch.push(name);
  }

  // 需要更新的（名稱不一致但有匹配到）
  const toUpdate = [...matchMap.entries()].filter(
    ([original, canonical]) => canonical && canonical !== original
  );

  console.log("─".repeat(50));
  if (toUpdate.length === 0) {
    console.log("✅ 所有動作名稱已是標準名稱，無需更新\n");
  } else {
    console.log(`🔄 需要更新名稱（${toUpdate.length} 種）：\n`);
    for (const [original, canonical] of toUpdate) {
      console.log(`  「${original}」→「${canonical}」`);
    }
    console.log("");
  }

  if (noMatch.length > 0) {
    console.log(`⚠️  找不到對應標準名稱（${noMatch.length} 種，不會修改）：\n`);
    for (const name of noMatch) {
      console.log(`  「${name}」`);
    }
    console.log("");
  }

  if (toUpdate.length === 0) {
    console.log("✨ 完成，無需任何更新。");
    return;
  }

  if (DRY_RUN) {
    const affected = recordPages.filter((p) => {
      const name = getTitle(p);
      return matchMap.get(name) && matchMap.get(name) !== name;
    });
    console.log(`   將影響 ${affected.length} 筆紀錄（Dry run，未寫入）`);
    return;
  }

  // 正式更新
  console.log("✏️  更新中...\n");
  let updated = 0;
  let failed = 0;

  for (const page of recordPages) {
    const originalName = getTitle(page);
    const canonicalName = matchMap.get(originalName);
    if (!canonicalName || canonicalName === originalName) continue;

    try {
      await notion.pages.update({
        page_id: page.id,
        properties: {
          Name: { title: [{ text: { content: canonicalName } }] },
        },
      });
      updated++;
      // 不印每筆，只顯示進度
      process.stdout.write(`\r   已更新 ${updated} 筆...`);
    } catch (err) {
      failed++;
      console.error(`\n  ❌ 更新失敗 [${page.id}]：${err.message}`);
    }

    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`\n\n✨ 完成！更新 ${updated} 筆，失敗 ${failed} 筆`);
}

main().catch((err) => {
  console.error("❌ 執行失敗：", err);
  process.exit(1);
});
