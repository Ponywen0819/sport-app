import type { Database } from "sql.js";
import type { BodyIndex } from "@/lib/notion/mappers/body-index-mapper";

type Row = { [key: string]: number | string | Uint8Array | null };

function rowToBodyIndex(row: Row): BodyIndex {
  return {
    id: row.id as string,
    date: row.date as string,
    weight: (row.weight as number) ?? 0,
    height: (row.height as number) ?? 0,
    bodyFatPercentage: (row.body_fat_percentage as number) ?? 0,
    skeletalMuscleWeight: (row.skeletal_muscle_weight as number) ?? 0,
    totalWater: (row.total_water as number) ?? 0,
    proteinWeight: (row.protein_weight as number) ?? 0,
    mineralWeight: (row.mineral_weight as number) ?? 0,
    bodyFatWeight: (row.body_fat_weight as number) ?? 0,
    visceralFatIndex: (row.visceral_fat_index as number) ?? 0,
    basalMetabolicRate: (row.basal_metabolic_rate as number) ?? 0,
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
      stmt.run({
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
      });
    }
    stmt.free();
  },

  upsert(db: Database, record: BodyIndex): void {
    this.upsertMany(db, [record]);
  },

  getAll(db: Database): BodyIndex[] {
    const stmt = db.prepare(
      "SELECT * FROM body_indexes ORDER BY date DESC"
    );
    const rows: BodyIndex[] = [];
    while (stmt.step()) rows.push(rowToBodyIndex(stmt.getAsObject() as Row));
    stmt.free();
    return rows;
  },

  getByDate(db: Database, date: string): BodyIndex | null {
    const stmt = db.prepare(
      "SELECT * FROM body_indexes WHERE date = :date LIMIT 1"
    );
    stmt.bind({ ":date": date });
    if (stmt.step()) {
      const row = rowToBodyIndex(stmt.getAsObject() as Row);
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  getLatest(db: Database): BodyIndex | null {
    const stmt = db.prepare(
      "SELECT * FROM body_indexes ORDER BY date DESC LIMIT 1"
    );
    if (stmt.step()) {
      const row = rowToBodyIndex(stmt.getAsObject() as Row);
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  getHistory(db: Database, limit = 30): BodyIndex[] {
    const stmt = db.prepare(
      "SELECT * FROM body_indexes ORDER BY date DESC LIMIT :limit"
    );
    stmt.bind({ ":limit": limit });
    const rows: BodyIndex[] = [];
    while (stmt.step()) rows.push(rowToBodyIndex(stmt.getAsObject() as Row));
    stmt.free();
    return rows;
  },

  count(db: Database): number {
    const stmt = db.prepare("SELECT COUNT(*) as cnt FROM body_indexes");
    stmt.step();
    const cnt = (stmt.getAsObject() as Row).cnt as number;
    stmt.free();
    return cnt;
  },
};
