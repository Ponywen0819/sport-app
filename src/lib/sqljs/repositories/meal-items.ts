import type { Database } from "@sqlite.org/sqlite-wasm";
import type { MealItem } from "@/lib/notion/mappers/meal-item-mapper";

type Row = Record<string, import("@sqlite.org/sqlite-wasm").SqlValue>;

function rowToMealItem(row: Row): MealItem {
  return {
    id: row.id as string,
    date: row.date as string,
    mealType: row.meal_type as MealItem["mealType"],
    foodId: row.food_id as string,
    foodName: row.food_name as string,
    intake: Number(row.intake) ?? 0,
    calories: Number(row.calories) ?? 0,
    protein: Number(row.protein) ?? 0,
    fat: Number(row.fat) ?? 0,
    carbs: Number(row.carbs) ?? 0,
  };
}

export const mealItemsLocalRepo = {
  upsertMany(db: Database, items: MealItem[]): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO meal_items
        (id, date, meal_type, food_id, food_name, intake, calories, protein, fat, carbs)
      VALUES
        (:id, :date, :meal_type, :food_id, :food_name, :intake, :calories, :protein, :fat, :carbs)
    `);
    for (const item of items) {
      stmt
        .bind({
          ":id": item.id,
          ":date": item.date,
          ":meal_type": item.mealType,
          ":food_id": item.foodId,
          ":food_name": item.foodName,
          ":intake": item.intake,
          ":calories": item.calories,
          ":protein": item.protein,
          ":fat": item.fat,
          ":carbs": item.carbs,
        })
        .stepReset();
    }
    stmt.finalize();
  },

  upsert(db: Database, item: MealItem): void {
    this.upsertMany(db, [item]);
  },

  delete(db: Database, id: string): void {
    db.exec({ sql: "DELETE FROM meal_items WHERE id = ?", bind: [id] });
  },

  update(
    db: Database,
    id: string,
    data: Pick<MealItem, "intake" | "calories" | "protein" | "fat" | "carbs">
  ): void {
    db.exec({
      sql: `UPDATE meal_items
            SET intake = ?, calories = ?, protein = ?, fat = ?, carbs = ?
            WHERE id = ?`,
      bind: [data.intake, data.calories, data.protein, data.fat, data.carbs, id],
    });
  },

  getByDate(db: Database, date: string): MealItem[] {
    const stmt = db.prepare(
      "SELECT * FROM meal_items WHERE date = :date ORDER BY rowid ASC"
    );
    stmt.bind({ ":date": date });
    const rows: MealItem[] = [];
    while (stmt.step()) rows.push(rowToMealItem(stmt.get({}) as Row));
    stmt.finalize();
    return rows;
  },

  getByDateAndMealType(
    db: Database,
    date: string,
    mealType: MealItem["mealType"]
  ): MealItem[] {
    const stmt = db.prepare(
      "SELECT * FROM meal_items WHERE date = :date AND meal_type = :meal_type ORDER BY rowid ASC"
    );
    stmt.bind({ ":date": date, ":meal_type": mealType });
    const rows: MealItem[] = [];
    while (stmt.step()) rows.push(rowToMealItem(stmt.get({}) as Row));
    stmt.finalize();
    return rows;
  },

  getByDateRange(db: Database, from: string, to: string): MealItem[] {
    const stmt = db.prepare(
      "SELECT * FROM meal_items WHERE date >= :from AND date <= :to ORDER BY date ASC, rowid ASC"
    );
    stmt.bind({ ":from": from, ":to": to });
    const rows: MealItem[] = [];
    while (stmt.step()) rows.push(rowToMealItem(stmt.get({}) as Row));
    stmt.finalize();
    return rows;
  },

  count(db: Database): number {
    const stmt = db.prepare("SELECT COUNT(*) as cnt FROM meal_items");
    stmt.step();
    const cnt = Number((stmt.get({}) as Row).cnt);
    stmt.finalize();
    return cnt;
  },
};
