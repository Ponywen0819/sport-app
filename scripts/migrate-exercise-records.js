// scripts/migrate-exercise-records.js
// 將舊 Notion 健身紀錄遷移到新的 Exercise Records 資料庫
//
// 使用方式：
//   node --env-file=.env scripts/migrate-exercise-records.js
//
// Dry run（只看會匯入什麼，不真的寫入）：
//   DRY_RUN=true node --env-file=.env scripts/migrate-exercise-records.js

const { Client } = require("@notionhq/client");

// =====================
// 設定
// =====================
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SOURCE_DATABASE_ID = "235a9868baf0817594d5dab6e3ffabb8";
const TARGET_DATABASE_ID = process.env.NOTION_EXERCISE_RECORDS_DB_ID;
const DRY_RUN = process.env.DRY_RUN === "true";

if (!NOTION_TOKEN || !TARGET_DATABASE_ID) {
  console.error("❌ 請在 .env 中設定 NOTION_TOKEN 和 NOTION_EXERCISE_RECORDS_DB_ID");
  process.exit(1);
}

if (DRY_RUN) {
  console.log("🔍 Dry run 模式：只預覽，不寫入\n");
}

const notion = new Client({ auth: NOTION_TOKEN });

// =====================
// 單位換算
// =====================
function lbsToKg(lbs) {
  return Math.round(lbs * 0.453592 * 100) / 100;
}

function parseWeight(str) {
  str = str.trim();
  if (str.endsWith("磅")) {
    const val = parseFloat(str.replace("磅", ""));
    return isNaN(val) ? null : { value: val, unit: "磅" };
  }
  if (str.toLowerCase().endsWith("kg")) {
    const val = parseFloat(str.replace(/kg$/i, ""));
    return isNaN(val) ? null : { value: val, unit: "kg" };
  }
  if (str.endsWith("公斤")) {
    const val = parseFloat(str.replace("公斤", ""));
    return isNaN(val) ? null : { value: val, unit: "kg" };
  }
  // 純數字視為 kg
  const val = parseFloat(str);
  return isNaN(val) ? null : { value: val, unit: "kg" };
}

function toKg(weight) {
  if (!weight) return 0;
  return weight.unit === "磅" ? lbsToKg(weight.value) : weight.value;
}

function weightLabel(weightObj) {
  return `${weightObj.value}${weightObj.unit}`;
}

// =====================
// 解析一行 set 字串
// =====================
function parseSetLine(line) {
  // 格式一：70磅 / 12下 / 3組  → 一般組
  // 格式二：70磅 / 8下 / 50磅 / 12下  → Drop Set
  const parts = line.split("/").map((p) => p.trim());

  if (parts.length === 2) {
    // 兩段格式：weight / reps下（缺組數，視為 1 組）
    const weightObj = parseWeight(parts[0]);
    const repsStr = parts[1].replace(/[下\/組次\s]/g, "");
    const reps = parseInt(repsStr);
    if (!weightObj || isNaN(reps)) return null;
    return {
      displayLine: `${weightLabel(weightObj)} × ${reps}下 × 1組`,
      weightKg: toKg(weightObj),
      reps,
      sets: 1,
      dropWeightKg: null,
      dropReps: null,
    };
  }

  if (parts.length === 3) {
    // 一般組
    const weightObj = parseWeight(parts[0]);
    const reps = parseInt(parts[1].replace(/[下次\/\s]/g, ""));
    const sets = parseInt(parts[2].replace(/[組\/\s]/g, ""));
    if (!weightObj || isNaN(reps) || isNaN(sets)) return null;
    return {
      displayLine: `${weightLabel(weightObj)} × ${reps}下 × ${sets}組`,
      weightKg: toKg(weightObj),
      reps,
      sets,
      dropWeightKg: null,
      dropReps: null,
    };
  }

  if (parts.length === 4) {
    // Drop Set
    const weightObj = parseWeight(parts[0]);
    const reps = parseInt(parts[1].replace(/[下次\/\s]/g, ""));
    const dropWeightObj = parseWeight(parts[2]);
    const dropReps = parseInt(parts[3].replace(/[下次\/\s]/g, ""));
    if (!weightObj || isNaN(reps) || !dropWeightObj || isNaN(dropReps)) return null;
    return {
      displayLine: `${weightLabel(weightObj)} × ${reps}下 → ${weightLabel(dropWeightObj)} × ${dropReps}下（Drop Set）`,
      weightKg: toKg(weightObj),
      reps,
      sets: 1,
      dropWeightKg: toKg(dropWeightObj),
      dropReps,
    };
  }

  return null;
}

// =====================
// Notion 工具函式
// =====================
function getBlockText(block) {
  const richText = block?.[block.type]?.rich_text ?? [];
  return richText.map((t) => t.plain_text).join("").trim();
}

async function getAllBlocks(blockId) {
  const blocks = [];
  let cursor;
  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    blocks.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);
  return blocks;
}

async function querySourceDatabase() {
  const pages = [];
  let cursor;
  do {
    const response = await notion.databases.query({
      database_id: SOURCE_DATABASE_ID,
      filter: {
        property: "Due",
        date: { is_not_empty: true },
      },
      sorts: [{ property: "Due", direction: "ascending" }],
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);
  return pages;
}

async function createExerciseRecord(data) {
  if (DRY_RUN) return;
  const properties = {
    Name: { title: [{ text: { content: data.name } }] },
    Date: { date: { start: data.date } },
    Weight: { number: data.weightKg },
    Reps: { number: data.reps },
    Sets: { number: data.sets },
  };
  if (data.dropWeightKg !== null && data.dropWeightKg > 0) {
    properties.DropWeight = { number: data.dropWeightKg };
    properties.DropReps = { number: data.dropReps ?? 0 };
  }
  await notion.pages.create({
    parent: { database_id: TARGET_DATABASE_ID },
    properties,
  });
}

// 簡單 rate limit：Notion API 限制 ~3 req/s
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// =====================
// 主流程
// =====================
async function main() {
  console.log("🏋️  開始匯入運動紀錄...\n");

  const pages = await querySourceDatabase();
  console.log(`找到 ${pages.length} 筆健身紀錄\n`);

  let totalRecords = 0;
  let parseErrors = 0;
  let writeErrors = 0;

  for (const page of pages) {
    const dueDate = page.properties?.Due?.date?.start;
    if (!dueDate) {
      const title = page.properties?.Name?.title?.[0]?.plain_text ?? page.id;
      console.warn(`⚠️  跳過（無 Due 日期）：${title}`);
      continue;
    }

    console.log(`📅 ${dueDate}`);

    // 取得頁面所有頂層 blocks
    const blocks = await getAllBlocks(page.id);
    await sleep(350);

    let dayHasExercise = false;

    for (const block of blocks) {
      // 只處理有子項的 bulleted_list_item（動作名稱）
      if (block.type !== "bulleted_list_item") continue;
      if (!block.has_children) continue;

      const exerciseName = getBlockText(block);
      if (!exerciseName) continue;

      // 取得子 blocks（各組細節）
      const childBlocks = await getAllBlocks(block.id);
      await sleep(350);

      for (const child of childBlocks) {
        if (child.type !== "bulleted_list_item") continue;

        const line = getBlockText(child);
        if (!line) continue;

        const parsed = parseSetLine(line);
        if (!parsed) {
          console.warn(`  ⚠️  解析失敗：「${line}」（動作：${exerciseName}）`);
          parseErrors++;
          continue;
        }

        try {
          await createExerciseRecord({ name: exerciseName, date: dueDate, ...parsed });
          console.log(`  ${DRY_RUN ? "👀" : "✅"} ${exerciseName}：${parsed.displayLine}`);
          totalRecords++;
          if (!DRY_RUN) await sleep(350);
        } catch (err) {
          console.error(`  ❌ 新增失敗：${err.message}`);
          writeErrors++;
        }

        dayHasExercise = true;
      }
    }

    if (!dayHasExercise) {
      console.log("  （這天沒有有效的運動紀錄）");
    }
    console.log("");
  }

  console.log("─".repeat(40));
  console.log(`✨ 完成！`);
  console.log(`   匯入成功：${totalRecords} 筆`);
  if (parseErrors > 0) console.log(`   解析失敗：${parseErrors} 筆（請手動處理）`);
  if (writeErrors > 0) console.log(`   寫入失敗：${writeErrors} 筆`);
  if (DRY_RUN) console.log(`\n   （Dry run，未實際寫入）`);
}

main().catch((err) => {
  console.error("❌ 執行失敗：", err);
  process.exit(1);
});
