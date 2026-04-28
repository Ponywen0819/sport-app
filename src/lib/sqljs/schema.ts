export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS exercises (
  id            TEXT PRIMARY KEY,
  brand         TEXT,
  machine_name  TEXT NOT NULL,
  equipment     TEXT,
  muscle_groups TEXT
);

CREATE TABLE IF NOT EXISTS exercise_records (
  id             TEXT PRIMARY KEY,
  exercise_name  TEXT NOT NULL,
  exercise_id    TEXT,
  date           TEXT NOT NULL,
  weight_kg      REAL NOT NULL DEFAULT 0,
  reps           INTEGER NOT NULL DEFAULT 0,
  sets           INTEGER NOT NULL DEFAULT 1,
  drop_weight_kg REAL,
  drop_reps      INTEGER
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id         TEXT PRIMARY KEY,
  date       TEXT NOT NULL,
  started_at TEXT,
  ended_at   TEXT,
  note       TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workout_blocks (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  type        TEXT NOT NULL DEFAULT 'single',
  rounds      INTEGER NOT NULL DEFAULT 1,
  note        TEXT,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exercise_sets (
  id               TEXT PRIMARY KEY,
  block_id         TEXT NOT NULL,
  exercise_id      TEXT,
  exercise_name    TEXT NOT NULL,
  round_index      INTEGER NOT NULL DEFAULT 0,
  order_index      INTEGER NOT NULL DEFAULT 0,
  weight_kg        REAL NOT NULL DEFAULT 0,
  reps             INTEGER NOT NULL DEFAULT 0,
  set_type         TEXT NOT NULL DEFAULT 'normal',
  note             TEXT,
  legacy_record_id TEXT,
  created_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (block_id) REFERENCES workout_blocks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS foods (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  weight               REAL NOT NULL DEFAULT 0,
  calories             REAL NOT NULL DEFAULT 0,
  protein              REAL NOT NULL DEFAULT 0,
  fat                  REAL NOT NULL DEFAULT 0,
  trans_fat            REAL,
  saturated_fat        REAL,
  monounsaturated_fat  REAL,
  polyunsaturated_fat  REAL,
  carbs                REAL NOT NULL DEFAULT 0,
  sugar                REAL,
  dietary_fiber        REAL,
  sodium               REAL,
  potassium            REAL
);

CREATE TABLE IF NOT EXISTS meal_items (
  id        TEXT PRIMARY KEY,
  date      TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  food_id   TEXT NOT NULL,
  food_name TEXT NOT NULL,
  intake    REAL NOT NULL DEFAULT 0,
  calories  REAL NOT NULL DEFAULT 0,
  protein   REAL NOT NULL DEFAULT 0,
  fat       REAL NOT NULL DEFAULT 0,
  carbs     REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS body_indexes (
  id                     TEXT PRIMARY KEY,
  date                   TEXT NOT NULL,
  weight                 REAL NOT NULL DEFAULT 0,
  height                 REAL NOT NULL DEFAULT 0,
  body_fat_percentage    REAL NOT NULL DEFAULT 0,
  skeletal_muscle_weight REAL NOT NULL DEFAULT 0,
  total_water            REAL NOT NULL DEFAULT 0,
  protein_weight         REAL NOT NULL DEFAULT 0,
  mineral_weight         REAL NOT NULL DEFAULT 0,
  body_fat_weight        REAL NOT NULL DEFAULT 0,
  visceral_fat_index     REAL NOT NULL DEFAULT 0,
  basal_metabolic_rate   REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_er_date      ON exercise_records(date);
CREATE INDEX IF NOT EXISTS idx_er_name      ON exercise_records(exercise_name);
CREATE INDEX IF NOT EXISTS idx_ws_date      ON workout_sessions(date);
CREATE INDEX IF NOT EXISTS idx_wb_session   ON workout_blocks(session_id, order_index);
CREATE INDEX IF NOT EXISTS idx_es_block     ON exercise_sets(block_id, round_index, order_index);
CREATE INDEX IF NOT EXISTS idx_es_exercise  ON exercise_sets(exercise_name);
CREATE INDEX IF NOT EXISTS idx_es_legacy    ON exercise_sets(legacy_record_id);
CREATE INDEX IF NOT EXISTS idx_mi_date      ON meal_items(date);
CREATE INDEX IF NOT EXISTS idx_mi_date_type ON meal_items(date, meal_type);
CREATE INDEX IF NOT EXISTS idx_bi_date      ON body_indexes(date);
`;
