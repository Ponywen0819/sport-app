import type { Database } from "sql.js";
import type { MealItem } from "@/lib/notion/mappers/meal-item-mapper";

type Row = { [key: string]: number | string | Uint8Array | null };

function rowToMealItem(row: Row): MealItem {
  return {
    id: row.id as string,
    date: row.date as string,
    mealType: row.meal_type as MealItem["mealType"],
    foodId: row.food_id as string,
    foodName: row.food_name as string,
    intake: (row.intake as number) ?? 0,
    calories: (row.calories as number) ?? 0,
    protein: (row.protein as number) ?? 0,
    fat: (row.fat as number) ?? 0,
    carbs: (row.carbs as number) ?? 0,
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
      stmt.run({
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
      });
    }
    stmt.free();
  },

  upsert(db: Database, item: MealItem): void {
    this.upsertMany(db, [item]);
  },

  delete(db: Database, id: string): void {
    db.run("DELETE FROM meal_items WHERE id = :id", { ":id": id });
  },

  update(
    db: Database,
    id: string,
    data: Pick<MealItem, "intake" | "calories" | "protein" | "fat" | "carbs">
  ): void {
    db.run(
      `UPDATE meal_items
       SET intake = :intake, calories = :calories, protein = :protein, fat = :fat, carbs = :carbs
       WHERE id = :id`,
      {
        ":id": id,
        ":intake": data.intake,
        ":calories": data.calories,
        ":protein": data.protein,
        ":fat": data.fat,
        ":carbs": data.carbs,
      }
    );
  },

  getByDate(db: Database, date: string): MealItem[] {
    const stmt = db.prepare(
      "SELECT * FROM meal_items WHERE date = :date ORDER BY rowid ASC"
    );
    stmt.bind({ ":date": date });
    const rows: MealItem[] = [];
    while (stmt.step()) rows.push(rowToMealItem(stmt.getAsObject() as Row));
    stmt.free();
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
    while (stmt.step()) rows.push(rowToMealItem(stmt.getAsObject() as Row));
    stmt.free();
    return rows;
  },

  getByDateRange(db: Database, from: string, to: string): MealItem[] {
    const stmt = db.prepare(
      "SELECT * FROM meal_items WHERE date >= :from AND date <= :to ORDER BY date ASC, rowid ASC"
    );
    stmt.bind({ ":from": from, ":to": to });
    const rows: MealItem[] = [];
    while (stmt.step()) rows.push(rowToMealItem(stmt.getAsObject() as Row));
    stmt.free();
    return rows;
  },

  count(db: Database): number {
    const stmt = db.prepare("SELECT COUNT(*) as cnt FROM meal_items");
    stmt.step();
    const cnt = (stmt.getAsObject() as Row).cnt as number;
    stmt.free();
    return cnt;
  },
};
