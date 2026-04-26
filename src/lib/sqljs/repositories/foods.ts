import type { Database } from "@sqlite.org/sqlite-wasm";
import type { Food } from "@/lib/notion/mappers/food-mapper";

type Row = Record<string, import("@sqlite.org/sqlite-wasm").SqlValue>;

function rowToFood(row: Row): Food {
  return {
    id: row.id as string,
    name: row.name as string,
    weight: Number(row.weight) ?? 0,
    calories: Number(row.calories) ?? 0,
    protein: Number(row.protein) ?? 0,
    fat: Number(row.fat) ?? 0,
    transFat: row.trans_fat != null ? Number(row.trans_fat) : undefined,
    saturatedFat: row.saturated_fat != null ? Number(row.saturated_fat) : undefined,
    monounsaturatedFat:
      row.monounsaturated_fat != null ? Number(row.monounsaturated_fat) : undefined,
    polyunsaturatedFat:
      row.polyunsaturated_fat != null ? Number(row.polyunsaturated_fat) : undefined,
    carbs: Number(row.carbs) ?? 0,
    sugar: row.sugar != null ? Number(row.sugar) : undefined,
    dietaryFiber: row.dietary_fiber != null ? Number(row.dietary_fiber) : undefined,
    sodium: row.sodium != null ? Number(row.sodium) : undefined,
    potassium: row.potassium != null ? Number(row.potassium) : undefined,
  };
}

export const foodsLocalRepo = {
  upsertMany(db: Database, foods: Food[]): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO foods
        (id, name, weight, calories, protein, fat,
         trans_fat, saturated_fat, monounsaturated_fat, polyunsaturated_fat,
         carbs, sugar, dietary_fiber, sodium, potassium)
      VALUES
        (:id, :name, :weight, :calories, :protein, :fat,
         :trans_fat, :saturated_fat, :monounsaturated_fat, :polyunsaturated_fat,
         :carbs, :sugar, :dietary_fiber, :sodium, :potassium)
    `);
    for (const f of foods) {
      stmt
        .bind({
          ":id": f.id,
          ":name": f.name,
          ":weight": f.weight,
          ":calories": f.calories,
          ":protein": f.protein,
          ":fat": f.fat,
          ":trans_fat": f.transFat ?? null,
          ":saturated_fat": f.saturatedFat ?? null,
          ":monounsaturated_fat": f.monounsaturatedFat ?? null,
          ":polyunsaturated_fat": f.polyunsaturatedFat ?? null,
          ":carbs": f.carbs,
          ":sugar": f.sugar ?? null,
          ":dietary_fiber": f.dietaryFiber ?? null,
          ":sodium": f.sodium ?? null,
          ":potassium": f.potassium ?? null,
        })
        .stepReset();
    }
    stmt.finalize();
  },

  upsert(db: Database, food: Food): void {
    this.upsertMany(db, [food]);
  },

  delete(db: Database, id: string): void {
    db.exec({ sql: "DELETE FROM foods WHERE id = ?", bind: [id] });
  },

  search(db: Database, name?: string): Food[] {
    const sql = name
      ? "SELECT * FROM foods WHERE name LIKE :name ORDER BY name LIMIT 50"
      : "SELECT * FROM foods ORDER BY name LIMIT 50";
    const stmt = db.prepare(sql);
    if (name) stmt.bind({ ":name": `%${name}%` });
    const rows: Food[] = [];
    while (stmt.step()) rows.push(rowToFood(stmt.get({}) as Row));
    stmt.finalize();
    return rows;
  },

  getById(db: Database, id: string): Food | null {
    const stmt = db.prepare("SELECT * FROM foods WHERE id = :id");
    stmt.bind({ ":id": id });
    if (stmt.step()) {
      const row = rowToFood(stmt.get({}) as Row);
      stmt.finalize();
      return row;
    }
    stmt.finalize();
    return null;
  },

  count(db: Database): number {
    const stmt = db.prepare("SELECT COUNT(*) as cnt FROM foods");
    stmt.step();
    const cnt = Number((stmt.get({}) as Row).cnt);
    stmt.finalize();
    return cnt;
  },
};
