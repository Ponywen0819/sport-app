// scripts/setup-exercises-db.js
// 建立 Exercises 資料庫並填入預設動作
//
// 使用方式：
//   node --env-file=.env.local scripts/setup-exercises-db.js
//
// 需要在 .env.local 中設定：
//   NOTION_TOKEN=secret_xxx
//   NOTION_ROOT_PAGE_ID=<你的 Notion Page ID>（執行一次後可移除）
//
// 完成後把輸出的 ID 填入 .env.local：
//   NOTION_EXERCISES_DB_ID=xxx

const { Client } = require("@notionhq/client");

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const ROOT_PAGE_ID = process.env.NOTION_ROOT_PAGE_ID;

if (!NOTION_TOKEN || !ROOT_PAGE_ID) {
  console.error("❌ 請設定 NOTION_TOKEN 和 NOTION_ROOT_PAGE_ID");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });

// =====================
// 動作清單
// =====================
const EXERCISES = [
  // ── 徒手 ──────────────────────────────
  { name: "伏地挺身",         equipment: "徒手", muscles: ["胸", "三頭", "肩"] },
  { name: "窄距伏地挺身",     equipment: "徒手", muscles: ["三頭", "胸"] },
  { name: "引體向上",         equipment: "徒手", muscles: ["背", "二頭"] },
  { name: "反手引體向上",     equipment: "徒手", muscles: ["背", "二頭"] },
  { name: "雙槓撐體",         equipment: "徒手", muscles: ["胸", "三頭"] },
  { name: "深蹲",             equipment: "徒手", muscles: ["腿", "臀"] },
  { name: "保加利亞分腿蹲",   equipment: "徒手", muscles: ["腿", "臀"] },
  { name: "弓步蹲",           equipment: "徒手", muscles: ["腿", "臀"] },
  { name: "臀橋",             equipment: "徒手", muscles: ["臀", "腿"] },
  { name: "捲腹",             equipment: "徒手", muscles: ["核心"] },
  { name: "棒式",             equipment: "徒手", muscles: ["核心"] },
  { name: "側棒式",           equipment: "徒手", muscles: ["核心"] },
  { name: "登山者式",         equipment: "徒手", muscles: ["核心", "腿"] },

  // ── 啞鈴 ──────────────────────────────
  { name: "啞鈴平板臥推",     equipment: "啞鈴", muscles: ["胸", "三頭", "肩"] },
  { name: "啞鈴上斜臥推",     equipment: "啞鈴", muscles: ["胸（上）", "三頭", "肩"] },
  { name: "啞鈴下斜臥推",     equipment: "啞鈴", muscles: ["胸（下）", "三頭"] },
  { name: "啞鈴飛鳥",         equipment: "啞鈴", muscles: ["胸"] },
  { name: "啞鈴上斜飛鳥",     equipment: "啞鈴", muscles: ["胸（上）"] },
  { name: "啞鈴單臂划船",     equipment: "啞鈴", muscles: ["背", "二頭"] },
  { name: "啞鈴俯身划船",     equipment: "啞鈴", muscles: ["背", "二頭"] },
  { name: "啞鈴肩推",         equipment: "啞鈴", muscles: ["肩", "三頭"] },
  { name: "啞鈴側平舉",       equipment: "啞鈴", muscles: ["肩（側）"] },
  { name: "啞鈴前平舉",       equipment: "啞鈴", muscles: ["肩（前）"] },
  { name: "啞鈴俯身側平舉",   equipment: "啞鈴", muscles: ["肩（後）"] },
  { name: "啞鈴彎舉",         equipment: "啞鈴", muscles: ["二頭"] },
  { name: "啞鈴錘式彎舉",     equipment: "啞鈴", muscles: ["二頭", "前臂"] },
  { name: "啞鈴集中彎舉",     equipment: "啞鈴", muscles: ["二頭"] },
  { name: "啞鈴頭後三頭伸展", equipment: "啞鈴", muscles: ["三頭"] },
  { name: "啞鈴深蹲",         equipment: "啞鈴", muscles: ["腿", "臀"] },
  { name: "啞鈴弓步蹲",       equipment: "啞鈴", muscles: ["腿", "臀"] },
  { name: "啞鈴羅馬尼亞硬舉", equipment: "啞鈴", muscles: ["腿", "臀", "下背"] },
  { name: "啞鈴側彎",         equipment: "啞鈴", muscles: ["核心"] },
  { name: "啞鈴聳肩",         equipment: "啞鈴", muscles: ["斜方肌"] },
];

// =====================
// 建立 Exercises 資料庫
// =====================
async function createExercisesDatabase(rootPageId) {
  const response = await notion.databases.create({
    parent: { type: "page_id", page_id: rootPageId },
    title: [{ type: "text", text: { content: "💪 Exercises" } }],
    properties: {
      Name: { title: {} },
      Equipment: {
        select: {
          options: [
            { name: "徒手", color: "green" },
            { name: "啞鈴", color: "blue" },
            { name: "槓鈴", color: "orange" },
            { name: "機械", color: "purple" },
            { name: "繩索", color: "yellow" },
            { name: "壺鈴", color: "red" },
          ],
        },
      },
      MuscleGroup: {
        multi_select: {
          options: [
            { name: "胸",     color: "red" },
            { name: "胸（上）", color: "red" },
            { name: "胸（下）", color: "red" },
            { name: "背",     color: "blue" },
            { name: "肩",     color: "orange" },
            { name: "肩（前）", color: "orange" },
            { name: "肩（側）", color: "orange" },
            { name: "肩（後）", color: "orange" },
            { name: "二頭",   color: "green" },
            { name: "三頭",   color: "yellow" },
            { name: "前臂",   color: "brown" },
            { name: "斜方肌", color: "gray" },
            { name: "腿",     color: "purple" },
            { name: "臀",     color: "pink" },
            { name: "核心",   color: "default" },
            { name: "下背",   color: "blue" },
          ],
        },
      },
    },
  });
  return response.id;
}

// =====================
// 新增單一動作
// =====================
async function addExercise(databaseId, exercise) {
  await notion.pages.create({
    parent: { database_id: databaseId },
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

// =====================
// 主流程
// =====================
async function main() {
  console.log("💪 建立 Exercises 資料庫...\n");

  const dbId = await createExercisesDatabase(ROOT_PAGE_ID);
  console.log(`✅ 資料庫已建立：${dbId}\n`);
  console.log("📝 填入動作中...\n");

  let success = 0;
  let failed = 0;

  for (const exercise of EXERCISES) {
    try {
      await addExercise(dbId, exercise);
      console.log(`  ✅ ${exercise.name}（${exercise.equipment}）`);
      success++;
    } catch (err) {
      console.error(`  ❌ ${exercise.name}：${err.message}`);
      failed++;
    }
    await sleep(350);
  }

  console.log(`
─────────────────────────────────
✨ 完成！新增 ${success} 筆，失敗 ${failed} 筆

請將以下內容加入 .env.local：

  NOTION_EXERCISES_DB_ID=${dbId}
─────────────────────────────────
`);
}

main().catch((err) => {
  console.error("❌ 執行失敗：", err);
  process.exit(1);
});
