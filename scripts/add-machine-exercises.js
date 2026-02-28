// scripts/add-machine-exercises.js
// 將機械與繩索動作加入現有 Exercises 資料庫
//
// 使用方式：
//   node --env-file=.env.local scripts/add-machine-exercises.js

const { Client } = require("@notionhq/client");

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const EXERCISES_DB_ID = process.env.NOTION_EXERCISES_DB_ID;

if (!NOTION_TOKEN || !EXERCISES_DB_ID) {
  console.error("❌ 請設定 NOTION_TOKEN 和 NOTION_EXERCISES_DB_ID");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });

// 整理自你的歷史訓練紀錄
const EXERCISES = [
  // ── 機械 · 胸 ────────────────────────
  { name: "機械分動胸推",       equipment: "機械", muscles: ["胸", "三頭", "肩"] },
  { name: "機械分動上斜胸推",   equipment: "機械", muscles: ["胸（上）", "三頭"] },
  { name: "機械下胸飛鳥",       equipment: "機械", muscles: ["胸（下）"] },
  { name: "機械雙槓",           equipment: "機械", muscles: ["胸", "三頭"] },

  // ── 機械 · 背 ────────────────────────
  { name: "高位下拉",           equipment: "機械", muscles: ["背", "二頭"] },
  { name: "機械窄距下拉",       equipment: "機械", muscles: ["背", "二頭"] },
  { name: "單側機械分動下拉",   equipment: "機械", muscles: ["背", "二頭"] },
  { name: "機械坐姿划船",       equipment: "機械", muscles: ["背", "二頭"] },

  // ── 機械 · 肩 ────────────────────────
  { name: "機械分動肩推",       equipment: "機械", muscles: ["肩", "三頭"] },
  { name: "機械側平舉",         equipment: "機械", muscles: ["肩（側）"] },
  { name: "機械前傾肩推",       equipment: "機械", muscles: ["肩", "三頭"] },
  { name: "機械站姿肩推",       equipment: "機械", muscles: ["肩", "三頭"] },
  { name: "機械分動反向飛鳥",   equipment: "機械", muscles: ["肩（後）"] },
  { name: "機械飛鳥（肩後束）", equipment: "機械", muscles: ["肩（後）"] },

  // ── 機械 · 腿 ────────────────────────
  { name: "機械腿部伸張",       equipment: "機械", muscles: ["腿"] },
  { name: "機械腿部彎曲",       equipment: "機械", muscles: ["腿"] },
  { name: "機械大腿內收",       equipment: "機械", muscles: ["腿", "臀"] },
  { name: "機械大腿外展",       equipment: "機械", muscles: ["腿", "臀"] },
  { name: "機械趴姿腿部彎曲",   equipment: "機械", muscles: ["腿"] },

  // ── 機械 · 核心 ──────────────────────
  { name: "機械捲腹",           equipment: "機械", muscles: ["核心"] },
  { name: "機械側卷腹",         equipment: "機械", muscles: ["核心"] },

  // ── 繩索 ─────────────────────────────
  { name: "繩索三頭下壓",       equipment: "繩索", muscles: ["三頭"] },
  { name: "繩索過頭三頭伸展",   equipment: "繩索", muscles: ["三頭"] },
  { name: "繩索二頭彎舉",       equipment: "繩索", muscles: ["二頭"] },
  { name: "直臂下壓",           equipment: "繩索", muscles: ["背"] },
];

async function addExercise(exercise) {
  await notion.pages.create({
    parent: { database_id: EXERCISES_DB_ID },
    properties: {
      Name: { title: [{ text: { content: exercise.name } }] },
      Equipment: { select: { name: exercise.equipment } },
      MuscleGroup: { multi_select: exercise.muscles.map((m) => ({ name: m })) },
    },
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("🏋️  新增機械 / 繩索動作...\n");

  let success = 0;
  let failed = 0;

  for (const exercise of EXERCISES) {
    try {
      await addExercise(exercise);
      console.log(`  ✅ ${exercise.name}（${exercise.equipment}）`);
      success++;
    } catch (err) {
      console.error(`  ❌ ${exercise.name}：${err.message}`);
      failed++;
    }
    await sleep(350);
  }

  console.log(`\n✨ 完成！新增 ${success} 筆，失敗 ${failed} 筆`);
}

main().catch((err) => {
  console.error("❌ 執行失敗：", err);
  process.exit(1);
});
