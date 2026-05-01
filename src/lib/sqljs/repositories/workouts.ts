import type { Database } from "@sqlite.org/sqlite-wasm";

type Row = Record<string, import("@sqlite.org/sqlite-wasm").SqlValue>;

export type WorkoutBlockType = "single" | "superset" | "circuit" | "drop_set";
export type ExerciseSetType = "normal" | "warmup" | "drop" | "failure";

export type WorkoutSession = {
  id: string;
  date: string;
  startedAt: string | null;
  endedAt: string | null;
  note: string;
};

export type WorkoutBlock = {
  id: string;
  sessionId: string;
  orderIndex: number;
  type: WorkoutBlockType;
  rounds: number;
  note: string;
};

export type ExerciseSet = {
  id: string;
  blockId: string;
  exerciseId: string | null;
  exerciseName: string;
  roundIndex: number;
  orderIndex: number;
  weightKg: number;
  reps: number;
  setType: ExerciseSetType;
  note: string;
  legacyRecordId: string | null;
};

export type WorkoutBlockWithSets = WorkoutBlock & {
  sets: ExerciseSet[];
};

export type WorkoutSessionWithBlocks = WorkoutSession & {
  blocks: WorkoutBlockWithSets[];
};

function rowToSession(row: Row): WorkoutSession {
  return {
    id: row.id as string,
    date: row.date as string,
    startedAt: (row.started_at as string | null) ?? null,
    endedAt: (row.ended_at as string | null) ?? null,
    note: (row.note as string | null) ?? "",
  };
}

function rowToBlock(row: Row): WorkoutBlock {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    orderIndex: Number(row.order_index) || 0,
    type: ((row.type as string) || "single") as WorkoutBlockType,
    rounds: Number(row.rounds) || 1,
    note: (row.note as string | null) ?? "",
  };
}

function rowToSet(row: Row): ExerciseSet {
  return {
    id: row.id as string,
    blockId: row.block_id as string,
    exerciseId: (row.exercise_id as string | null) ?? null,
    exerciseName: row.exercise_name as string,
    roundIndex: Number(row.round_index) || 0,
    orderIndex: Number(row.order_index) || 0,
    weightKg: Number(row.weight_kg) || 0,
    reps: Number(row.reps) || 0,
    setType: ((row.set_type as string) || "normal") as ExerciseSetType,
    note: (row.note as string | null) ?? "",
    legacyRecordId: (row.legacy_record_id as string | null) ?? null,
  };
}

export const workoutsLocalRepo = {
  upsertSession(db: Database, session: WorkoutSession): void {
    db.exec({
      sql: `
        INSERT OR REPLACE INTO workout_sessions
          (id, date, started_at, ended_at, note, updated_at)
        VALUES
          (:id, :date, :started_at, :ended_at, :note, CURRENT_TIMESTAMP)
      `,
      bind: {
        ":id": session.id,
        ":date": session.date,
        ":started_at": session.startedAt,
        ":ended_at": session.endedAt,
        ":note": session.note || null,
      },
    });
  },

  upsertBlock(db: Database, block: WorkoutBlock): void {
    db.exec({
      sql: `
        INSERT OR REPLACE INTO workout_blocks
          (id, session_id, order_index, type, rounds, note, updated_at)
        VALUES
          (:id, :session_id, :order_index, :type, :rounds, :note, CURRENT_TIMESTAMP)
      `,
      bind: {
        ":id": block.id,
        ":session_id": block.sessionId,
        ":order_index": block.orderIndex,
        ":type": block.type,
        ":rounds": block.rounds,
        ":note": block.note || null,
      },
    });
  },

  upsertSets(db: Database, sets: ExerciseSet[]): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO exercise_sets
        (id, block_id, exercise_id, exercise_name, round_index, order_index,
         weight_kg, reps, set_type, note, legacy_record_id, updated_at)
      VALUES
        (:id, :block_id, :exercise_id, :exercise_name, :round_index, :order_index,
         :weight_kg, :reps, :set_type, :note, :legacy_record_id, CURRENT_TIMESTAMP)
    `);
    for (const set of sets) {
      stmt
        .bind({
          ":id": set.id,
          ":block_id": set.blockId,
          ":exercise_id": set.exerciseId,
          ":exercise_name": set.exerciseName,
          ":round_index": set.roundIndex,
          ":order_index": set.orderIndex,
          ":weight_kg": set.weightKg,
          ":reps": set.reps,
          ":set_type": set.setType,
          ":note": set.note || null,
          ":legacy_record_id": set.legacyRecordId,
        })
        .stepReset();
    }
    stmt.finalize();
  },

  deleteSession(db: Database, id: string): void {
    db.exec({
      sql: `DELETE FROM exercise_sets
            WHERE block_id IN (SELECT id FROM workout_blocks WHERE session_id = ?)`,
      bind: [id],
    });
    db.exec({ sql: "DELETE FROM workout_blocks WHERE session_id = ?", bind: [id] });
    db.exec({ sql: "DELETE FROM workout_sessions WHERE id = ?", bind: [id] });
  },

  deleteBlock(db: Database, id: string): void {
    db.exec({ sql: "DELETE FROM exercise_sets WHERE block_id = ?", bind: [id] });
    db.exec({ sql: "DELETE FROM workout_blocks WHERE id = ?", bind: [id] });
  },

  deleteSet(db: Database, id: string): void {
    db.exec({ sql: "DELETE FROM exercise_sets WHERE id = ?", bind: [id] });
  },

  reorderBlocks(db: Database, sessionId: string, blockIds: string[]): void {
    const stmt = db.prepare(`
      UPDATE workout_blocks
      SET order_index = :order_index,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = :id AND session_id = :session_id
    `);
    blockIds.forEach((id, index) => {
      stmt
        .bind({
          ":id": id,
          ":session_id": sessionId,
          ":order_index": index,
        })
        .stepReset();
    });
    stmt.finalize();
  },

  reorderBlockRounds(
    db: Database,
    blockId: string,
    roundIndices: number[],
  ): void {
    const tempStmt = db.prepare(`
      UPDATE exercise_sets
      SET round_index = :temp_round_index,
          updated_at = CURRENT_TIMESTAMP
      WHERE block_id = :block_id AND round_index = :round_index
    `);
    roundIndices.forEach((roundIndex, newIndex) => {
      tempStmt
        .bind({
          ":block_id": blockId,
          ":round_index": roundIndex,
          ":temp_round_index": -(newIndex + 1),
        })
        .stepReset();
    });
    tempStmt.finalize();

    const finalStmt = db.prepare(`
      UPDATE exercise_sets
      SET round_index = :round_index,
          updated_at = CURRENT_TIMESTAMP
      WHERE block_id = :block_id AND round_index = :temp_round_index
    `);
    roundIndices.forEach((_, newIndex) => {
      finalStmt
        .bind({
          ":block_id": blockId,
          ":temp_round_index": -(newIndex + 1),
          ":round_index": newIndex,
        })
        .stepReset();
    });
    finalStmt.finalize();

    db.exec({
      sql: `
        UPDATE workout_blocks
        SET rounds = :rounds,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :block_id
      `,
      bind: {
        ":block_id": blockId,
        ":rounds": Math.max(1, roundIndices.length),
      },
    });
  },

  getSessionByDate(db: Database, date: string): WorkoutSessionWithBlocks | null {
    const sessionStmt = db.prepare(
      "SELECT * FROM workout_sessions WHERE date = :date ORDER BY started_at DESC, rowid DESC LIMIT 1",
    );
    sessionStmt.bind({ ":date": date });
    if (!sessionStmt.step()) {
      sessionStmt.finalize();
      return null;
    }

    const session = rowToSession(sessionStmt.get({}) as Row);
    sessionStmt.finalize();

    return {
      ...session,
      blocks: this.getBlocksBySession(db, session.id),
    };
  },

  getBlocksBySession(db: Database, sessionId: string): WorkoutBlockWithSets[] {
    const blockStmt = db.prepare(
      "SELECT * FROM workout_blocks WHERE session_id = :session_id ORDER BY order_index ASC, rowid ASC",
    );
    blockStmt.bind({ ":session_id": sessionId });

    const blocks: WorkoutBlockWithSets[] = [];
    while (blockStmt.step()) {
      const block = rowToBlock(blockStmt.get({}) as Row);
      blocks.push({
        ...block,
        sets: this.getSetsByBlock(db, block.id),
      });
    }
    blockStmt.finalize();
    return blocks;
  },

  getSetsByBlock(db: Database, blockId: string): ExerciseSet[] {
    const setStmt = db.prepare(
      `SELECT * FROM exercise_sets
       WHERE block_id = :block_id
       ORDER BY round_index ASC, order_index ASC, rowid ASC`,
    );
    setStmt.bind({ ":block_id": blockId });

    const sets: ExerciseSet[] = [];
    while (setStmt.step()) sets.push(rowToSet(setStmt.get({}) as Row));
    setStmt.finalize();
    return sets;
  },
};
