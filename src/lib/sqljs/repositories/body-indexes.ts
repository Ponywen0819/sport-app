import type { Database } from "@sqlite.org/sqlite-wasm";
import type { BodyIndex } from "@/lib/notion/mappers/body-index-mapper";

type Row = Record<string, import("@sqlite.org/sqlite-wasm").SqlValue>;

function rowToBodyIndex(row: Row): BodyIndex {
  return {
    id: row.id as string,
    date: row.date as string,
    weight: Number(row.weight) ?? 0,
    height: Number(row.height) ?? 0,
    bodyFatPercentage: Number(row.body_fat_percentage) ?? 0,
    skeletalMuscleWeight: Number(row.skeletal_muscle_weight) ?? 0,
    totalWater: Number(row.total_water) ?? 0,
    proteinWeight: Number(row.protein_weight) ?? 0,
    mineralWeight: Number(row.mineral_weight) ?? 0,
    bodyFatWeight: Number(row.body_fat_weight) ?? 0,
    visceralFatIndex: Number(row.visceral_fat_index) ?? 0,
    basalMetabolicRate: Number(row.basal_metabolic_rate) ?? 0,
  };
}

export const bodyIndexesLocalRepo = {
  upsertMany(db: Database, records: BodyIndex[]): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO body_indexes
        (id, date, weight, height, body_fat_percentage, skeletal_muscle_weight,
         total_water, protein_weight, mineral_weight, body_fat_weight,
         visceral_fat_index, basal_metabolic_rate)
      VALUES
        (:id, :date, :weight, :height, :body_fat_percentage, :skeletal_muscle_weight,
         :total_water, :protein_weight, :mineral_weight, :body_fat_weight,
         :visceral_fat_index, :basal_metabolic_rate)
    `);
    for (const r of records) {
      stmt
        .bind({
          ":id": r.id,
          ":date": r.date,
          ":weight": r.weight,
          ":height": r.height,
          ":body_fat_percentage": r.bodyFatPercentage,
          ":skeletal_muscle_weight": r.skeletalMuscleWeight,
          ":total_water": r.totalWater,
          ":protein_weight": r.proteinWeight,
          ":mineral_weight": r.mineralWeight,
          ":body_fat_weight": r.bodyFatWeight,
          ":visceral_fat_index": r.visceralFatIndex,
          ":basal_metabolic_rate": r.basalMetabolicRate,
        })
        .stepReset();
    }
    stmt.finalize();
  },

  upsert(db: Database, record: BodyIndex): void {
    this.upsertMany(db, [record]);
  },

  getAll(db: Database): BodyIndex[] {
    const stmt = db.prepare("SELECT * FROM body_indexes ORDER BY date DESC");
    const rows: BodyIndex[] = [];
    while (stmt.step()) rows.push(rowToBodyIndex(stmt.get({}) as Row));
    stmt.finalize();
    return rows;
  },

  getByDate(db: Database, date: string): BodyIndex | null {
    const stmt = db.prepare(
      "SELECT * FROM body_indexes WHERE date = :date LIMIT 1"
    );
    stmt.bind({ ":date": date });
    if (stmt.step()) {
      const row = rowToBodyIndex(stmt.get({}) as Row);
      stmt.finalize();
      return row;
    }
    stmt.finalize();
    return null;
  },

  getLatest(db: Database): BodyIndex | null {
    const stmt = db.prepare(
      "SELECT * FROM body_indexes ORDER BY date DESC LIMIT 1"
    );
    if (stmt.step()) {
      const row = rowToBodyIndex(stmt.get({}) as Row);
      stmt.finalize();
      return row;
    }
    stmt.finalize();
    return null;
  },

  getHistory(db: Database, limit = 30): BodyIndex[] {
    const stmt = db.prepare(
      "SELECT * FROM body_indexes ORDER BY date DESC LIMIT :limit"
    );
    stmt.bind({ ":limit": limit });
    const rows: BodyIndex[] = [];
    while (stmt.step()) rows.push(rowToBodyIndex(stmt.get({}) as Row));
    stmt.finalize();
    return rows;
  },

  count(db: Database): number {
    const stmt = db.prepare("SELECT COUNT(*) as cnt FROM body_indexes");
    stmt.step();
    const cnt = Number((stmt.get({}) as Row).cnt);
    stmt.finalize();
    return cnt;
  },
};
