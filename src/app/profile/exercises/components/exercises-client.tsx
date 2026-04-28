"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  IoAdd,
  IoClose,
  IoPencil,
  IoSearch,
  IoTrash,
  IoBarbell,
} from "react-icons/io5";
import {
  createExercise,
  deleteExercise,
  searchExercises,
  updateExercise,
} from "@/lib/api/exercise";
import {
  getExerciseDisplayName,
  type Exercise,
  type ExerciseInput,
} from "@/lib/notion/mappers/exercise-mapper";

const EQUIPMENT_LIST = ["徒手", "啞鈴", "槓鈴", "機械", "繩索", "壺鈴"] as const;

const EQUIPMENT_COLORS: Record<string, string> = {
  徒手: "bg-green-500/15 text-green-400",
  啞鈴: "bg-blue-500/15 text-blue-400",
  槓鈴: "bg-orange-500/15 text-orange-400",
  機械: "bg-purple-500/15 text-purple-400",
  繩索: "bg-yellow-500/15 text-yellow-400",
  壺鈴: "bg-red-500/15 text-red-400",
};

const MUSCLE_GROUPS = [
  {
    label: "胸",
    muscles: ["胸", "胸-上胸", "胸-中胸", "胸-下胸", "胸-內側"],
  },
  {
    label: "背",
    muscles: [
      "背",
      "背-闊背",
      "背-上背",
      "背-中背",
      "背-下背",
      "背-斜方肌",
      "背-菱形肌",
    ],
  },
  {
    label: "肩",
    muscles: ["肩", "肩-前束", "肩-中束", "肩-後束", "肩-旋轉肌群"],
  },
  {
    label: "手臂",
    muscles: [
      "二頭",
      "二頭-長頭",
      "二頭-短頭",
      "肱肌",
      "三頭",
      "三頭-長頭",
      "三頭-外側頭",
      "三頭-內側頭",
      "前臂",
    ],
  },
  {
    label: "腿",
    muscles: [
      "腿",
      "腿-股四頭",
      "腿-腿後側",
      "腿-內收肌",
      "腿-外展肌",
      "腿-小腿",
    ],
  },
  {
    label: "臀",
    muscles: ["臀", "臀-臀大肌", "臀-臀中肌", "臀-臀小肌"],
  },
  {
    label: "核心",
    muscles: [
      "核心",
      "核心-上腹",
      "核心-下腹",
      "核心-腹斜肌",
      "核心-豎脊肌",
    ],
  },
] as const;

type EditorState =
  | { mode: "create" }
  | { mode: "edit"; exercise: Exercise }
  | null;

export default function ExercisesClient() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(null);
  const [pendingDelete, setPendingDelete] = useState<Exercise | null>(null);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["exercises", "all"],
    queryFn: () => searchExercises(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((e) => {
      if (equipmentFilter && e.equipment !== equipmentFilter) return false;
      if (q) {
        const haystack = `${e.brand} ${e.machineName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [exercises, search, equipmentFilter]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["exercises"] });

  const createMutation = useMutation({
    mutationFn: (data: ExerciseInput) => createExercise(data),
    onSuccess: () => {
      invalidate();
      setEditor(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExerciseInput }) =>
      updateExercise(id, data),
    onSuccess: () => {
      invalidate();
      setEditor(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: () => {
      invalidate();
      setPendingDelete(null);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <IoSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋廠牌或機器名稱"
            className="w-full bg-stone-800 border border-stone-700 rounded-xl pl-9 pr-4 py-2.5 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>
        <button
          onClick={() => setEditor({ mode: "create" })}
          className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-1 transition-colors"
        >
          <IoAdd size={16} />
          新增
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        <FilterChip
          label="全部"
          active={equipmentFilter === null}
          onClick={() => setEquipmentFilter(null)}
        />
        {EQUIPMENT_LIST.map((e) => (
          <FilterChip
            key={e}
            label={e}
            active={equipmentFilter === e}
            onClick={() => setEquipmentFilter(equipmentFilter === e ? null : e)}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-stone-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <IoBarbell size={48} className="text-stone-700" />
          <p className="text-stone-500 text-sm">
            {exercises.length === 0 ? "尚無動作" : "找不到符合的動作"}
          </p>
          {exercises.length === 0 && (
            <button
              onClick={() => setEditor({ mode: "create" })}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-colors"
            >
              新增第一個動作
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((exercise) => (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              onEdit={() => setEditor({ mode: "edit", exercise })}
              onDelete={() => setPendingDelete(exercise)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {editor && (
          <ExerciseEditorModal
            initial={editor.mode === "edit" ? editor.exercise : null}
            isPending={createMutation.isPending || updateMutation.isPending}
            onClose={() => setEditor(null)}
            onSubmit={(data) => {
              if (editor.mode === "edit") {
                updateMutation.mutate({ id: editor.exercise.id, data });
              } else {
                createMutation.mutate(data);
              }
            }}
          />
        )}
        {pendingDelete && (
          <ConfirmDeleteModal
            exercise={pendingDelete}
            isPending={deleteMutation.isPending}
            onClose={() => setPendingDelete(null)}
            onConfirm={() => deleteMutation.mutate(pendingDelete.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const FilterChip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
      active
        ? "bg-blue-500 text-white"
        : "bg-stone-800 text-stone-400 hover:bg-stone-700"
    }`}
  >
    {label}
  </button>
);

const ExerciseRow = ({
  exercise,
  onEdit,
  onDelete,
}: {
  exercise: Exercise;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const equipColor =
    EQUIPMENT_COLORS[exercise.equipment] ?? "bg-stone-700 text-stone-300";

  return (
    <div className="bg-stone-800 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5 min-w-0">
          {exercise.brand && (
            <span className="text-stone-500 text-xs flex-shrink-0">
              {exercise.brand}
            </span>
          )}
          <p className="text-stone-100 text-sm font-medium truncate">
            {exercise.machineName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {exercise.equipment && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${equipColor}`}
            >
              {exercise.equipment}
            </span>
          )}
          {exercise.muscleGroups.map((m) => (
            <span
              key={m}
              className="px-2 py-0.5 rounded-full text-xs bg-stone-700 text-stone-300"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center transition-colors"
          aria-label="編輯"
        >
          <IoPencil size={14} className="text-stone-300" />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-full bg-stone-700 hover:bg-red-500/20 flex items-center justify-center transition-colors group"
          aria-label="刪除"
        >
          <IoTrash
            size={14}
            className="text-stone-300 group-hover:text-red-400"
          />
        </button>
      </div>
    </div>
  );
};

type ExerciseEditorModalProps = {
  initial: Exercise | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: ExerciseInput) => void;
};

const ExerciseEditorModal = ({
  initial,
  isPending,
  onClose,
  onSubmit,
}: ExerciseEditorModalProps) => {
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [machineName, setMachineName] = useState(initial?.machineName ?? "");
  const [equipment, setEquipment] = useState(initial?.equipment ?? "");
  const [muscleGroups, setMuscleGroups] = useState<string[]>(
    initial?.muscleGroups ?? [],
  );
  const [expandedMuscleGroup, setExpandedMuscleGroup] = useState<string>(() => {
    const initialMuscles = initial?.muscleGroups ?? [];
    return (
      MUSCLE_GROUPS.find((group) =>
        group.muscles.some((m) => initialMuscles.includes(m)),
      )?.label ?? MUSCLE_GROUPS[0].label
    );
  });

  const selectedMuscleGroup = MUSCLE_GROUPS.find(
    (group) => group.label === expandedMuscleGroup,
  ) ?? MUSCLE_GROUPS[0];

  const toggleMuscle = (m: string) => {
    setMuscleGroups((cur) =>
      cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m],
    );
  };

  const isValid = machineName.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      brand: brand.trim(),
      machineName: machineName.trim(),
      equipment,
      muscleGroups,
    });
  };

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
        className="bg-stone-900 rounded-t-2xl flex flex-col max-w-md mx-auto w-full max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-800 flex-shrink-0">
          <h3 className="text-stone-100 font-semibold">
            {initial ? "編輯動作" : "新增動作"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center"
          >
            <IoClose size={18} className="text-stone-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-stone-400 text-xs font-medium">
              廠牌 <span className="text-stone-600">(可留空)</span>
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="例如：Hammer Strength"
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-stone-400 text-xs font-medium">
              機器 / 動作名稱
            </label>
            <input
              type="text"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              placeholder="例如：臥推、坐姿划船"
              autoFocus
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-stone-400 text-xs font-medium">器材</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_LIST.map((e) => {
                const active = equipment === e;
                const color = EQUIPMENT_COLORS[e];
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEquipment(active ? "" : e)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      active ? color : "bg-stone-800 text-stone-400 hover:bg-stone-700"
                    }`}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-stone-400 text-xs font-medium">
                訓練部位
              </label>
              {muscleGroups.length > 0 && (
                <span className="text-stone-500 text-xs">
                  已選 {muscleGroups.length}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUPS.map((group) => {
                  const selectedCount = group.muscles.filter((m) =>
                    muscleGroups.includes(m),
                  ).length;
                  const active = expandedMuscleGroup === group.label;
                  return (
                    <button
                      key={group.label}
                      type="button"
                      onClick={() => setExpandedMuscleGroup(group.label)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        active
                          ? "bg-blue-500 text-white"
                          : selectedCount > 0
                            ? "bg-blue-500/15 text-blue-300"
                            : "bg-stone-800 text-stone-400 hover:bg-stone-700"
                      }`}
                    >
                      {group.label}
                      {selectedCount > 0 ? ` ${selectedCount}` : ""}
                    </button>
                  );
                })}
              </div>

              <div className="h-px bg-stone-800" />

              <div className="flex flex-wrap gap-2">
                {selectedMuscleGroup.muscles.map((m) => {
                  const active = muscleGroups.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMuscle(m)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        active
                          ? "bg-blue-500 text-white"
                          : "bg-stone-800 text-stone-400 hover:bg-stone-700"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 border-t border-stone-800 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-xl py-3 font-semibold text-sm transition-colors"
          >
            {isPending ? "儲存中..." : "儲存"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ConfirmDeleteModal = ({
  exercise,
  isPending,
  onClose,
  onConfirm,
}: {
  exercise: Exercise;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="bg-stone-900 rounded-2xl w-full max-w-sm flex flex-col"
    >
      <div className="p-5 flex flex-col gap-2">
        <h3 className="text-stone-100 font-semibold">刪除動作</h3>
        <p className="text-stone-400 text-sm">
          確定要刪除「{getExerciseDisplayName(exercise)}」嗎？
        </p>
      </div>
      <div className="flex gap-2 p-4 pt-0">
        <button
          onClick={onClose}
          disabled={isPending}
          className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
        >
          {isPending ? "刪除中..." : "刪除"}
        </button>
      </div>
    </motion.div>
  </motion.div>
);
