"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDate } from "@/components/date-selector";
import {
  getExerciseRecords,
  addExerciseRecord,
  removeExerciseRecord,
  searchExercises,
} from "@/lib/api/exercise";
import type {
  ExerciseRecord,
  WeightUnit,
} from "@/lib/notion/mappers/exercise-record-mapper";
import {
  convertToDisplay,
  convertToKg,
} from "@/lib/notion/mappers/exercise-record-mapper";
import type { Exercise } from "@/lib/notion/mappers/exercise-mapper";
import { IoAdd, IoClose, IoTrash, IoArrowForward } from "react-icons/io5";

const formatDate = (date: CalendarDate): string => {
  const y = date.year.toString().padStart(4, "0");
  const m = (date.month + 1).toString().padStart(2, "0");
  const d = date.day.toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatWeight = (kg: number, unit: WeightUnit): string => {
  const val = convertToDisplay(kg, unit);
  return `${val}`;
};

type ExerciseTrackerProps = { date: CalendarDate };

export const ExerciseTracker = ({ date }: ExerciseTrackerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayUnit, setDisplayUnit] = useState<WeightUnit>("磅");
  const queryClient = useQueryClient();
  const dateStr = formatDate(date);
  const queryKey = ["exercise-records", dateStr];

  const { data: records = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getExerciseRecords(dateStr),
  });

  const { data: allExercises = [] } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => searchExercises(),
  });

  const exerciseNameMap = useMemo(
    () => new Map(allExercises.map((e) => [e.id, e.name])),
    [allExercises],
  );

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeExerciseRecord(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const totalSets = records.reduce((sum, r) => sum + r.sets, 0);

  return (
    <div className="flex flex-col gap-3">
      {records.length > 0 && (
        <div className="bg-stone-800 rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-stone-400 text-sm">
            共 {records.length} 個動作 · {totalSets} 組
          </span>
          <div className="flex bg-stone-700 rounded-lg overflow-hidden">
            {(["磅", "kg"] as WeightUnit[]).map((u) => (
              <button
                key={u}
                onClick={() => setDisplayUnit(u)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  displayUnit === u
                    ? "bg-stone-500 text-stone-100"
                    : "text-stone-400"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-stone-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700/50">
          <h2 className="text-stone-100 font-semibold text-sm">今日訓練</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-7 h-7 rounded-full bg-stone-700 hover:bg-stone-600 active:bg-stone-500 flex items-center justify-center transition-colors"
          >
            <IoAdd size={16} className="text-stone-300" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-4 flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-14 bg-stone-700 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : records.length > 0 ? (
          <div className="flex flex-col divide-y divide-stone-700/50">
            {records.map((record) => (
              <ExerciseRow
                key={record.id}
                record={record}
                displayUnit={displayUnit}
                exerciseNameMap={exerciseNameMap}
                onDelete={() => removeMutation.mutate(record.id)}
              />
            ))}
          </div>
        ) : (
          <div className="px-4 py-4">
            <p className="text-stone-600 text-xs">尚無紀錄，點擊 + 新增動作</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <AddExerciseModal
            date={dateStr}
            defaultUnit={displayUnit}
            onClose={() => setIsModalOpen(false)}
            onAdded={() => queryClient.invalidateQueries({ queryKey })}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ExerciseRow = ({
  record,
  displayUnit,
  exerciseNameMap,
  onDelete,
}: {
  record: ExerciseRecord;
  displayUnit: WeightUnit;
  exerciseNameMap: Map<string, string>;
  onDelete: () => void;
}) => {
  const isDropSet = record.dropWeightKg !== null && record.dropWeightKg > 0;
  const displayName =
    (record.exerciseId ? exerciseNameMap.get(record.exerciseId) : null) ??
    record.exerciseName;
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-stone-100 text-sm font-medium truncate">
          {displayName}
        </p>
        {isDropSet ? (
          <div className="flex items-center gap-1 text-xs text-stone-400">
            <span>
              {formatWeight(record.weightKg, displayUnit)}
              {displayUnit} × {record.reps}下
            </span>
            <IoArrowForward
              size={10}
              className="text-stone-600 flex-shrink-0"
            />
            <span>
              {formatWeight(record.dropWeightKg!, displayUnit)}
              {displayUnit} × {record.dropReps}下
            </span>
          </div>
        ) : (
          <p className="text-stone-400 text-xs">
            {record.weightKg > 0
              ? `${formatWeight(record.weightKg, displayUnit)} ${displayUnit} · `
              : ""}
            {record.sets} 組 × {record.reps} 下
          </p>
        )}
      </div>
      <button
        onClick={onDelete}
        className="w-7 h-7 rounded-full text-stone-600 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-colors flex-shrink-0 ml-2"
      >
        <IoTrash size={14} />
      </button>
    </div>
  );
};

// 重量輸入元件
const WeightInput = ({
  value,
  unit,
  onValueChange,
  onUnitChange,
  placeholder = "0",
}: {
  value: string;
  unit: WeightUnit;
  onValueChange: (v: string) => void;
  onUnitChange: (u: WeightUnit) => void;
  placeholder?: string;
}) => (
  <div className="flex gap-2">
    <input
      type="number"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      placeholder={placeholder}
      min="0"
      step={unit === "磅" ? "1" : "0.5"}
      className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-blue-500 text-sm"
    />
    <div className="flex bg-stone-800 border border-stone-700 rounded-xl overflow-hidden">
      {(["磅", "kg"] as WeightUnit[]).map((u) => (
        <button
          key={u}
          onClick={() => onUnitChange(u)}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            unit === u
              ? "bg-blue-500 text-white"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          {u}
        </button>
      ))}
    </div>
  </div>
);

type AddExerciseModalProps = {
  date: string;
  defaultUnit: WeightUnit;
  onClose: () => void;
  onAdded: () => void;
};

// Step 1: 選動作  Step 2: 填重量/組數
type Step = "select" | "configure";

const EQUIPMENT_COLORS: Record<string, string> = {
  徒手: "bg-green-500/15 text-green-400",
  啞鈴: "bg-blue-500/15 text-blue-400",
  槓鈴: "bg-orange-500/15 text-orange-400",
  機械: "bg-purple-500/15 text-purple-400",
  繩索: "bg-yellow-500/15 text-yellow-400",
  壺鈴: "bg-red-500/15 text-red-400",
};

const EQUIPMENT_LIST = [
  "徒手",
  "啞鈴",
  "槓鈴",
  "機械",
  "繩索",
  "壺鈴",
] as const;
const MUSCLE_LIST = [
  "胸",
  "背",
  "肩",
  "二頭",
  "三頭",
  "腿",
  "臀",
  "核心",
] as const;

const AddExerciseModal = ({
  date,
  defaultUnit,
  onClose,
  onAdded,
}: AddExerciseModalProps) => {
  const [step, setStep] = useState<Step>("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );

  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(defaultUnit);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("12");
  const [isDropSet, setIsDropSet] = useState(false);
  const [dropWeight, setDropWeight] = useState("");
  const [dropWeightUnit, setDropWeightUnit] = useState<WeightUnit>(defaultUnit);
  const [dropReps, setDropReps] = useState("");
  const [filterEquipment, setFilterEquipment] = useState<string | null>(null);
  const [filterMuscle, setFilterMuscle] = useState<string | null>(null);

  const { data: exercises = [], isLoading: isSearching } = useQuery({
    queryKey: ["exercises", searchQuery],
    queryFn: () => searchExercises(searchQuery || undefined),
  });

  const filteredExercises = exercises.filter((e) => {
    if (filterEquipment && e.equipment !== filterEquipment) return false;
    if (
      filterMuscle &&
      !e.muscleGroups.some((mg) => mg.startsWith(filterMuscle))
    )
      return false;
    return true;
  });

  const addMutation = useMutation({
    mutationFn: () => {
      if (!selectedExercise) throw new Error("No exercise selected");
      const weightKg = weight ? convertToKg(parseFloat(weight), weightUnit) : 0;
      const dropWeightKg =
        isDropSet && dropWeight
          ? convertToKg(parseFloat(dropWeight), dropWeightUnit)
          : null;

      return addExerciseRecord({
        exerciseName: selectedExercise.name,
        exerciseId: selectedExercise.id,
        date,
        weightKg,
        reps: parseInt(reps) || 0,
        sets: isDropSet ? 1 : parseInt(sets) || 0,
        dropWeightKg,
        dropReps: isDropSet ? parseInt(dropReps) || null : null,
      });
    },
    onSuccess: () => {
      onAdded();
      onClose();
    },
  });

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setStep("configure");
  };

  const isValid =
    selectedExercise !== null &&
    parseInt(reps) > 0 &&
    (isDropSet ? parseInt(dropReps) > 0 : parseInt(sets) > 0);

  const previewText = isValid
    ? isDropSet
      ? `${weight || "?"} ${weightUnit} × ${reps}下 → ${dropWeight || "?"} ${dropWeightUnit} × ${dropReps}下`
      : `${weight ? `${weight} ${weightUnit} · ` : ""}${sets} 組 × ${reps} 下`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end pb-16"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-stone-900 rounded-t-2xl flex flex-col max-w-md mx-auto w-full max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            {step === "configure" && (
              <button
                onClick={() => setStep("select")}
                className="text-stone-400 hover:text-stone-200 text-sm"
              >
                ←
              </button>
            )}
            <h3 className="text-stone-100 font-semibold">
              {step === "select" ? "選擇動作" : selectedExercise?.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center"
          >
            <IoClose size={18} className="text-stone-400" />
          </button>
        </div>

        {step === "select" ? (
          <>
            {/* 搜尋框 */}
            <div className="px-4 py-3 flex-shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋動作..."
                autoFocus
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* 器具篩選 */}
            <div className="flex gap-2 overflow-x-auto px-4 pb-1 flex-shrink-0 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
              {EQUIPMENT_LIST.map((eq) => (
                <button
                  key={eq}
                  onClick={() =>
                    setFilterEquipment(filterEquipment === eq ? null : eq)
                  }
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterEquipment === eq
                      ? EQUIPMENT_COLORS[eq]
                      : "bg-stone-800 text-stone-500"
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>

            {/* 部位篩選 */}
            <div className="flex gap-2 overflow-x-auto px-4 pb-2 flex-shrink-0 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
              {MUSCLE_LIST.map((muscle) => (
                <button
                  key={muscle}
                  onClick={() =>
                    setFilterMuscle(filterMuscle === muscle ? null : muscle)
                  }
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterMuscle === muscle
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-stone-800 text-stone-500"
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>

            {/* 動作列表 */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {isSearching && filteredExercises.length === 0 ? (
                <p className="text-stone-500 text-sm text-center py-4">
                  搜尋中...
                </p>
              ) : filteredExercises.length === 0 ? (
                <p className="text-stone-500 text-sm text-center py-4">
                  找不到動作
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => handleSelectExercise(exercise)}
                      className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-stone-800 text-left transition-colors"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-stone-100 text-sm">
                          {exercise.name}
                        </span>
                        {exercise.muscleGroups.length > 0 && (
                          <span className="text-stone-500 text-xs truncate">
                            {exercise.muscleGroups.join(" · ")}
                          </span>
                        )}
                      </div>
                      {exercise.equipment && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                            EQUIPMENT_COLORS[exercise.equipment] ??
                            "bg-stone-700 text-stone-400"
                          }`}
                        >
                          {exercise.equipment}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Step 2: 填入重量/組數 */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              {/* Drop set 切換 */}
              <button
                onClick={() => setIsDropSet(!isDropSet)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                  isDropSet
                    ? "bg-orange-500/15 border-orange-500/30 text-orange-400"
                    : "bg-stone-800 border-stone-700 text-stone-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <IoArrowForward size={14} />
                  <span className="text-sm font-medium">Drop Set</span>
                </div>
                <span className="text-xs">{isDropSet ? "開啟" : "關閉"}</span>
              </button>

              {!isDropSet ? (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-stone-400 text-xs font-medium">
                      重量
                    </label>
                    <WeightInput
                      value={weight}
                      unit={weightUnit}
                      onValueChange={setWeight}
                      onUnitChange={setWeightUnit}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <label className="text-stone-400 text-xs font-medium">
                        組數
                      </label>
                      <input
                        type="number"
                        value={sets}
                        onChange={(e) => setSets(e.target.value)}
                        min="1"
                        className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:border-blue-500 text-sm text-center"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-stone-400 text-xs font-medium">
                        次數／組
                      </label>
                      <input
                        type="number"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        min="1"
                        className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:border-blue-500 text-sm text-center"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-3 bg-stone-800/50 rounded-2xl p-3">
                    <p className="text-stone-500 text-xs font-medium">第一段</p>
                    <WeightInput
                      value={weight}
                      unit={weightUnit}
                      onValueChange={setWeight}
                      onUnitChange={setWeightUnit}
                    />
                    <div className="flex flex-col gap-2">
                      <label className="text-stone-400 text-xs font-medium">
                        次數
                      </label>
                      <input
                        type="number"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        placeholder="8"
                        min="1"
                        className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-blue-500 text-sm text-center"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-stone-700" />
                    <div className="flex items-center gap-1 text-stone-500">
                      <IoArrowForward size={12} />
                      <span className="text-xs">接著（不休息）</span>
                    </div>
                    <div className="flex-1 h-px bg-stone-700" />
                  </div>

                  <div className="flex flex-col gap-3 bg-stone-800/50 rounded-2xl p-3">
                    <p className="text-stone-500 text-xs font-medium">
                      第二段（降重）
                    </p>
                    <WeightInput
                      value={dropWeight}
                      unit={dropWeightUnit}
                      onValueChange={setDropWeight}
                      onUnitChange={setDropWeightUnit}
                    />
                    <div className="flex flex-col gap-2">
                      <label className="text-stone-400 text-xs font-medium">
                        次數
                      </label>
                      <input
                        type="number"
                        value={dropReps}
                        onChange={(e) => setDropReps(e.target.value)}
                        placeholder="12"
                        min="1"
                        className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-blue-500 text-sm text-center"
                      />
                    </div>
                  </div>
                </>
              )}

              {previewText && (
                <div className="bg-stone-800/80 rounded-xl px-4 py-3">
                  <p className="text-stone-100 text-sm font-medium">
                    {selectedExercise?.name}
                  </p>
                  <p className="text-stone-400 text-xs mt-0.5">{previewText}</p>
                  {(weight || dropWeight) && (
                    <p className="text-stone-600 text-xs mt-0.5">
                      存入 Notion：
                      {weight
                        ? `${convertToKg(parseFloat(weight) || 0, weightUnit)} kg`
                        : ""}
                      {isDropSet && dropWeight
                        ? ` → ${convertToKg(parseFloat(dropWeight) || 0, dropWeightUnit)} kg`
                        : ""}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="px-4 py-4 border-t border-stone-800 flex-shrink-0">
              <button
                onClick={() => addMutation.mutate()}
                disabled={!isValid || addMutation.isPending}
                className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-xl py-3 font-semibold text-sm transition-colors"
              >
                {addMutation.isPending ? "新增中..." : "新增"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};
