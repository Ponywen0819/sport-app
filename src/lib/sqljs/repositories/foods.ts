import type { Database } from "sql.js";
import type { Food } from "@/lib/notion/mappers/food-mapper";

type Row = { [key: string]: number | string | Uint8Array | null };

function rowToFood(row: Row): Food {
  return {
    id: row.id as string,
    name: row.name as string,
    weight: (row.weight as number) ?? 0,
    calories: (row.calories as number) ?? 0,
    protein: (row.protein as number) ?? 0,
    fat: (row.fat as number) ?? 0,
    transFat: (row.trans_fat as number | null) ?? undefined,
    saturatedFat: (row.saturated_fat as number | null) ?? undefined,
    monounsaturatedFat:
      (row.monounsaturated_fat as number | null) ?? undefined,
    polyunsaturatedFat:
      (row.polyunsaturated_fat as number | null) ?? undefined,
    carbs: (row.carbs as number) ?? 0,
    sugar: (row.sugar as number | null) ?? undefined,
    dietaryFiber: (row.dietary_fiber as number | null) ?? undefined,
    sodium: (row.sodium as number | null) ?? undefined,
    potassium: (row.potassium as number | null) ?? undefined,
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
      stmt.run({
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
      });
    }
    stmt.free();
  },

  upsert(db: Database, food: Food): void {
    this.upsertMany(db, [food]);
  },

  delete(db: Database, id: string): void {
    db.run("DELETE FROM foods WHERE id = :id", { ":id": id });
  },

  search(db: Database, name?: string): Food[] {
    const sql = name
      ? "SELECT * FROM foods WHERE name LIKE :name ORDER BY name LIMIT 50"
      : "SELECT * FROM foods ORDER BY name LIMIT 50";
    const stmt = db.prepare(sql);
    if (name) stmt.bind({ ":name": `%${name}%` });
    const rows: Food[] = [];
    while (stmt.step()) rows.push(rowToFood(stmt.getAsObject() as Row));
    stmt.free();
    return rows;
  },

  getById(db: Database, id: string): Food | null {
    const stmt = db.prepare("SELECT * FROM foods WHERE id = :id");
    stmt.bind({ ":id": id });
    if (stmt.step()) {
      const row = rowToFood(stmt.getAsObject() as Row);
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  count(db: Database): number {
    const stmt = db.prepare("SELECT COUNT(*) as cnt FROM foods");
    stmt.step();
    const cnt = (stmt.getAsObject() as Row).cnt as number;
    stmt.free();
    return cnt;
  },
};
