"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  IoAdd,
  IoArrowBack,
  IoArrowForward,
  IoClose,
  IoReorderThree,
  IoTime,
  IoTrash,
} from "react-icons/io5";
import { CalendarDate } from "@/components/date-selector";
import {
  addWorkoutSetToBlock,
  addWorkoutSetsToBlock,
  addWorkoutBlock,
  getExerciseProgress,
  getLastExerciseRecord,
  getPRExerciseRecord,
  getWorkoutSession,
  removeWorkoutBlock,
  reorderWorkoutBlockRounds,
  reorderWorkoutBlocks,
  searchExercises,
} from "@/lib/api/exercise";
import {
  convertToDisplay,
  convertToKg,
  type WeightUnit,
} from "@/lib/notion/mappers/exercise-record-mapper";
import {
  getExerciseDisplayName,
  type Exercise,
} from "@/lib/notion/mappers/exercise-mapper";
import type {
  ExerciseSet,
  ExerciseSetType,
  WorkoutBlockType,
  WorkoutBlockWithSets,
  WorkoutSessionWithBlocks,
} from "@/lib/sqljs";
import { useRecentExercises } from "@/providers/recent-exercises-provider";

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

const arraysEqual = <T,>(a: T[], b: T[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const BLOCK_LABELS: Record<WorkoutBlockType, string> = {
  single: "單一動作",
  drop_set: "Drop Set",
  superset: "Superset",
  circuit: "Circuit",
};

const BLOCK_BADGE_CLASSES: Record<WorkoutBlockType, string> = {
  single: "bg-blue-500/15 text-blue-400",
  drop_set: "bg-orange-500/15 text-orange-400",
  superset: "bg-emerald-500/15 text-emerald-400",
  circuit: "bg-purple-500/15 text-purple-400",
};

const SET_TYPE_LABELS: Record<ExerciseSetType, string> = {
  normal: "",
  warmup: "暖身",
  drop: "降重",
  failure: "力竭",
};

type ExerciseTrackerProps = { date: CalendarDate };

type WorkoutRoundGroup = {
  roundIndex: number;
  sets: ExerciseSet[];
};

export const ExerciseTracker = ({ date }: ExerciseTrackerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingSetBlock, setAddingSetBlock] =
    useState<WorkoutBlockWithSets | null>(null);
  const [displayUnit, setDisplayUnit] = useState<WeightUnit>("磅");
  const queryClient = useQueryClient();
  const dateStr = formatDate(date);
  const queryKey = ["workout-session", dateStr];

  const { data: session, isLoading } = useQuery({
    queryKey,
    queryFn: () => getWorkoutSession(dateStr),
  });

  const blocks = session?.blocks ?? [];
  const totalSets = blocks.reduce((sum, block) => sum + block.sets.length, 0);
  const exerciseCount = useMemo(
    () =>
      new Set(blocks.flatMap((block) => block.sets.map((set) => set.exerciseName)))
        .size,
    [blocks],
  );

  const invalidateWorkoutQueries = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ["exercise-dates"] });
    queryClient.invalidateQueries({ queryKey: ["weekly-workout-summary"] });
  };

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeWorkoutBlock(id),
    onSuccess: invalidateWorkoutQueries,
  });

  const reorderMutation = useMutation({
    mutationFn: ({
      sessionId,
      blockIds,
    }: {
      sessionId: string;
      blockIds: string[];
    }) => reorderWorkoutBlocks(sessionId, blockIds),
    onError: invalidateWorkoutQueries,
    onSuccess: invalidateWorkoutQueries,
  });

  const reorderRoundsMutation = useMutation({
    mutationFn: ({
      blockId,
      roundIndices,
    }: {
      blockId: string;
      roundIndices: number[];
    }) => reorderWorkoutBlockRounds(blockId, roundIndices),
    onError: invalidateWorkoutQueries,
    onSuccess: invalidateWorkoutQueries,
  });

  const handleReorderBlocks = (blockIds: string[]) => {
    if (!session) return;

    queryClient.setQueryData<WorkoutSessionWithBlocks | null>(
      queryKey,
      (current) => {
        if (!current) return current;
        const blocksById = new Map(
          current.blocks.map((block) => [block.id, block]),
        );
        const orderedBlocks = blockIds
          .map((id, index) => {
            const block = blocksById.get(id);
            return block ? { ...block, orderIndex: index } : null;
          })
          .filter((block): block is WorkoutBlockWithSets => block !== null);

        return { ...current, blocks: orderedBlocks };
      },
    );

    reorderMutation.mutate({ sessionId: session.id, blockIds });
  };

  const handleReorderBlockRounds = (
    blockId: string,
    roundIndices: number[],
  ) => {
    const roundIndexByPrevious = new Map(
      roundIndices.map((roundIndex, index) => [roundIndex, index]),
    );

    queryClient.setQueryData<WorkoutSessionWithBlocks | null>(
      queryKey,
      (current) => {
        if (!current) return current;

        return {
          ...current,
          blocks: current.blocks.map((block) => {
            if (block.id !== blockId) return block;

            return {
              ...block,
              rounds: Math.max(1, roundIndices.length),
              sets: block.sets.map((set) => {
                const nextRoundIndex = roundIndexByPrevious.get(set.roundIndex);
                return nextRoundIndex === undefined
                  ? set
                  : { ...set, roundIndex: nextRoundIndex };
              }),
            };
          }),
        };
      },
    );

    reorderRoundsMutation.mutate({ blockId, roundIndices });
  };

  return (
    <div className="flex flex-col gap-3">
      {blocks.length > 0 && (
        <div className="bg-stone-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-stone-300 text-sm font-medium">
            共 {exerciseCount} 個動作 · {totalSets} 組
          </span>
          <div className="flex bg-stone-700 rounded-xl overflow-hidden">
            {(["磅", "kg"] as WeightUnit[]).map((u) => (
              <button
                key={u}
                onClick={() => setDisplayUnit(u)}
                className={`min-h-10 px-4 text-sm font-semibold transition-colors ${
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
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-700/50">
          <h2 className="text-stone-100 font-semibold text-base">今日訓練</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-10 h-10 rounded-full bg-stone-700 hover:bg-stone-600 active:bg-stone-500 flex items-center justify-center transition-colors"
            aria-label="新增動作"
          >
            <IoAdd size={20} className="text-stone-200" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-4 flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 bg-stone-700 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : blocks.length > 0 ? (
          <SortableWorkoutBlockList
            blocks={blocks}
            displayUnit={displayUnit}
            onAddSet={(block) => setAddingSetBlock(block)}
            onDelete={(block) => removeMutation.mutate(block.id)}
            onReorder={handleReorderBlocks}
            onReorderRounds={handleReorderBlockRounds}
          />
        ) : (
          <div className="px-4 py-6">
            <p className="text-stone-500 text-sm">尚無紀錄，點擊 + 新增動作</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <AddExerciseModal
            date={dateStr}
            defaultUnit={displayUnit}
            onClose={() => setIsModalOpen(false)}
            onAdded={invalidateWorkoutQueries}
          />
        )}
        {addingSetBlock && (
          <AddSetToBlockModal
            block={addingSetBlock}
            defaultUnit={displayUnit}
            onClose={() => setAddingSetBlock(null)}
            onAdded={invalidateWorkoutQueries}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const SortableWorkoutBlockList = ({
  blocks,
  displayUnit,
  onAddSet,
  onDelete,
  onReorder,
  onReorderRounds,
}: {
  blocks: WorkoutBlockWithSets[];
  displayUnit: WeightUnit;
  onAddSet: (block: WorkoutBlockWithSets) => void;
  onDelete: (block: WorkoutBlockWithSets) => void;
  onReorder: (blockIds: string[]) => void;
  onReorderRounds: (blockId: string, roundIndices: number[]) => void;
}) => {
  const [orderedBlocks, setOrderedBlocks] = useState(blocks);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const orderedBlocksRef = useRef(orderedBlocks);
  const dragStateRef = useRef<{
    activeId: string;
    startIds: string[];
    cleanup: () => void;
  } | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    orderedBlocksRef.current = orderedBlocks;
  }, [orderedBlocks]);

  useEffect(() => {
    if (!draggingId) setOrderedBlocks(blocks);
  }, [blocks, draggingId]);

  useEffect(
    () => () => {
      dragStateRef.current?.cleanup();
    },
    [],
  );

  const setRowRef = (id: string, element: HTMLDivElement | null) => {
    if (element) {
      rowRefs.current.set(id, element);
    } else {
      rowRefs.current.delete(id);
    }
  };

  const reorderAtPointer = (activeId: string, pointerY: number) => {
    const currentBlocks = orderedBlocksRef.current;
    const activeBlock = currentBlocks.find((block) => block.id === activeId);
    if (!activeBlock) return;

    const blocksWithoutActive = currentBlocks.filter(
      (block) => block.id !== activeId,
    );
    let nextIndex = blocksWithoutActive.length;

    for (let index = 0; index < blocksWithoutActive.length; index += 1) {
      const block = blocksWithoutActive[index];
      const rect = rowRefs.current.get(block.id)?.getBoundingClientRect();
      if (!rect) continue;

      if (pointerY < rect.top + rect.height / 2) {
        nextIndex = index;
        break;
      }
    }

    const nextBlocks = [
      ...blocksWithoutActive.slice(0, nextIndex),
      activeBlock,
      ...blocksWithoutActive.slice(nextIndex),
    ];
    const nextIds = nextBlocks.map((block) => block.id);
    const currentIds = currentBlocks.map((block) => block.id);
    if (arraysEqual(nextIds, currentIds)) return;

    orderedBlocksRef.current = nextBlocks;
    setOrderedBlocks(nextBlocks);
  };

  const finishDrag = (shouldCommit: boolean) => {
    const dragState = dragStateRef.current;
    if (!dragState) return;

    dragState.cleanup();
    dragStateRef.current = null;
    setDraggingId(null);

    if (!shouldCommit) {
      setOrderedBlocks(blocks);
      return;
    }

    const nextIds = orderedBlocksRef.current.map((block) => block.id);
    if (!arraysEqual(nextIds, dragState.startIds)) onReorder(nextIds);
  };

  const startDrag = (
    blockId: string,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    if (orderedBlocksRef.current.length < 2) return;

    event.preventDefault();
    event.stopPropagation();

    dragStateRef.current?.cleanup();
    const startIds = orderedBlocksRef.current.map((block) => block.id);
    const originalOverflow = document.body.style.overflow;
    const originalUserSelect = document.body.style.userSelect;
    document.body.style.overflow = "hidden";
    document.body.style.userSelect = "none";

    const handlePointerMove = (pointerEvent: globalThis.PointerEvent) => {
      pointerEvent.preventDefault();
      reorderAtPointer(blockId, pointerEvent.clientY);
    };
    const handlePointerUp = () => finishDrag(true);
    const handlePointerCancel = () => finishDrag(false);
    const cleanup = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      document.body.style.overflow = originalOverflow;
      document.body.style.userSelect = originalUserSelect;
    };

    dragStateRef.current = {
      activeId: blockId,
      startIds,
      cleanup,
    };
    setDraggingId(blockId);
    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
  };

  return (
    <div className="flex flex-col divide-y divide-stone-700/50">
      {orderedBlocks.map((block) => (
        <div
          key={block.id}
          ref={(element) => setRowRef(block.id, element)}
          className={`transition-colors ${
            draggingId === block.id ? "bg-stone-700/30" : ""
          }`}
        >
          <WorkoutBlockRow
            block={block}
            displayUnit={displayUnit}
            canReorder={orderedBlocks.length > 1}
            isDragging={draggingId === block.id}
            onDragStart={(event) => startDrag(block.id, event)}
            onAddSet={() => onAddSet(block)}
            onDelete={() => onDelete(block)}
            onReorderRounds={(roundIndices) =>
              onReorderRounds(block.id, roundIndices)
            }
          />
        </div>
      ))}
    </div>
  );
};

const WorkoutBlockRow = ({
  block,
  displayUnit,
  canReorder,
  isDragging,
  onDragStart,
  onAddSet,
  onDelete,
  onReorderRounds,
}: {
  block: WorkoutBlockWithSets;
  displayUnit: WeightUnit;
  canReorder: boolean;
  isDragging: boolean;
  onDragStart: (event: PointerEvent<HTMLButtonElement>) => void;
  onAddSet: () => void;
  onDelete: () => void;
  onReorderRounds: (roundIndices: number[]) => void;
}) => {
  const exerciseNames = Array.from(
    new Set(block.sets.map((set) => set.exerciseName).filter(Boolean)),
  );
  const setGroups = groupSetsByRound(block.sets);
  const isMultiExercise = exerciseNames.length > 1;
  const isDropSetBlock = block.type === "drop_set";
  const hasDropSetRounds = setGroups.some(({ sets }) => isDropSetRound(sets));
  const showBlockBadge = block.type !== "single";
  const blockSummary = (() => {
    if (isDropSetBlock) return `${block.rounds} 回合 · Drop Set`;
    if (hasDropSetRounds) return `${block.rounds} 回合 · 含 Drop Set`;
    return `${block.rounds} 回合 · ${block.sets.length} 筆 set`;
  })();

  return (
    <div className="px-4 py-3.5 flex flex-col gap-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <p className="min-w-0 flex-1 text-stone-100 text-[15px] font-semibold truncate">
              {exerciseNames.join(" + ") || "未命名動作"}
            </p>
            {showBlockBadge && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${BLOCK_BADGE_CLASSES[block.type]}`}
              >
                {BLOCK_LABELS[block.type]}
              </span>
            )}
          </div>
          <p className="text-stone-500 text-xs">{blockSummary}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {canReorder && (
            <button
              onPointerDown={onDragStart}
              className={`w-10 h-10 rounded-full bg-stone-900/45 flex touch-none items-center justify-center transition-colors ${
                isDragging
                  ? "text-blue-300"
                  : "text-stone-500 hover:text-stone-300"
              }`}
              aria-label="拖曳調整順序"
            >
              <IoReorderThree size={22} />
            </button>
          )}
          <button
            onClick={onAddSet}
            className="w-10 h-10 rounded-full bg-stone-900/45 text-stone-400 hover:text-blue-300 hover:bg-blue-400/10 flex items-center justify-center transition-colors"
            aria-label="追加一組"
          >
            <IoAdd size={19} />
          </button>
          <button
            onClick={onDelete}
            className="w-10 h-10 rounded-full bg-stone-900/45 text-stone-500 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-colors"
            aria-label="刪除訓練區塊"
          >
            <IoTrash size={17} />
          </button>
        </div>
      </div>

      <SortableWorkoutRoundList
        groups={setGroups}
        displayUnit={displayUnit}
        isDropSetBlock={isDropSetBlock}
        isMultiExercise={isMultiExercise}
        onReorder={onReorderRounds}
      />
    </div>
  );
};

const SortableWorkoutRoundList = ({
  groups,
  displayUnit,
  isDropSetBlock,
  isMultiExercise,
  onReorder,
}: {
  groups: WorkoutRoundGroup[];
  displayUnit: WeightUnit;
  isDropSetBlock: boolean;
  isMultiExercise: boolean;
  onReorder: (roundIndices: number[]) => void;
}) => {
  const [orderedGroups, setOrderedGroups] = useState(groups);
  const [draggingRoundIndex, setDraggingRoundIndex] = useState<number | null>(
    null,
  );
  const orderedGroupsRef = useRef(orderedGroups);
  const dragStateRef = useRef<{
    activeRoundIndex: number;
    startRoundIndices: number[];
    cleanup: () => void;
  } | null>(null);
  const rowRefs = useRef(new Map<number, HTMLDivElement>());

  useEffect(() => {
    orderedGroupsRef.current = orderedGroups;
  }, [orderedGroups]);

  useEffect(() => {
    if (draggingRoundIndex === null) setOrderedGroups(groups);
  }, [groups, draggingRoundIndex]);

  useEffect(
    () => () => {
      dragStateRef.current?.cleanup();
    },
    [],
  );

  const setRowRef = (roundIndex: number, element: HTMLDivElement | null) => {
    if (element) {
      rowRefs.current.set(roundIndex, element);
    } else {
      rowRefs.current.delete(roundIndex);
    }
  };

  const reorderAtPointer = (activeRoundIndex: number, pointerY: number) => {
    const currentGroups = orderedGroupsRef.current;
    const activeGroup = currentGroups.find(
      (group) => group.roundIndex === activeRoundIndex,
    );
    if (!activeGroup) return;

    const groupsWithoutActive = currentGroups.filter(
      (group) => group.roundIndex !== activeRoundIndex,
    );
    let nextIndex = groupsWithoutActive.length;

    for (let index = 0; index < groupsWithoutActive.length; index += 1) {
      const group = groupsWithoutActive[index];
      const rect = rowRefs.current.get(group.roundIndex)?.getBoundingClientRect();
      if (!rect) continue;

      if (pointerY < rect.top + rect.height / 2) {
        nextIndex = index;
        break;
      }
    }

    const nextGroups = [
      ...groupsWithoutActive.slice(0, nextIndex),
      activeGroup,
      ...groupsWithoutActive.slice(nextIndex),
    ];
    const nextRoundIndices = nextGroups.map((group) => group.roundIndex);
    const currentRoundIndices = currentGroups.map((group) => group.roundIndex);
    if (arraysEqual(nextRoundIndices, currentRoundIndices)) return;

    orderedGroupsRef.current = nextGroups;
    setOrderedGroups(nextGroups);
  };

  const finishDrag = (shouldCommit: boolean) => {
    const dragState = dragStateRef.current;
    if (!dragState) return;

    dragState.cleanup();
    dragStateRef.current = null;
    setDraggingRoundIndex(null);

    if (!shouldCommit) {
      setOrderedGroups(groups);
      return;
    }

    const nextRoundIndices = orderedGroupsRef.current.map(
      (group) => group.roundIndex,
    );
    if (!arraysEqual(nextRoundIndices, dragState.startRoundIndices)) {
      onReorder(nextRoundIndices);
    }
  };

  const startDrag = (
    roundIndex: number,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    if (orderedGroupsRef.current.length < 2) return;

    event.preventDefault();
    event.stopPropagation();

    dragStateRef.current?.cleanup();
    const startRoundIndices = orderedGroupsRef.current.map(
      (group) => group.roundIndex,
    );
    const originalOverflow = document.body.style.overflow;
    const originalUserSelect = document.body.style.userSelect;
    document.body.style.overflow = "hidden";
    document.body.style.userSelect = "none";

    const handlePointerMove = (pointerEvent: globalThis.PointerEvent) => {
      pointerEvent.preventDefault();
      reorderAtPointer(roundIndex, pointerEvent.clientY);
    };
    const handlePointerUp = () => finishDrag(true);
    const handlePointerCancel = () => finishDrag(false);
    const cleanup = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      document.body.style.overflow = originalOverflow;
      document.body.style.userSelect = originalUserSelect;
    };

    dragStateRef.current = {
      activeRoundIndex: roundIndex,
      startRoundIndices,
      cleanup,
    };
    setDraggingRoundIndex(roundIndex);
    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
  };

  return (
    <div className="flex flex-col gap-3">
      {orderedGroups.map((group, index) => (
        <div
          key={group.roundIndex}
          ref={(element) => setRowRef(group.roundIndex, element)}
          className={`transition-colors ${
            draggingRoundIndex === group.roundIndex ? "rounded-xl bg-stone-700/30" : ""
          }`}
        >
          <WorkoutRoundGroupRow
            group={group}
            displayRoundNumber={index + 1}
            displayUnit={displayUnit}
            isDropSetBlock={isDropSetBlock}
            isMultiExercise={isMultiExercise}
            canReorder={orderedGroups.length > 1}
            isDragging={draggingRoundIndex === group.roundIndex}
            onDragStart={(event) => startDrag(group.roundIndex, event)}
          />
        </div>
      ))}
    </div>
  );
};

const WorkoutRoundGroupRow = ({
  group,
  displayRoundNumber,
  displayUnit,
  isDropSetBlock,
  isMultiExercise,
  canReorder,
  isDragging,
  onDragStart,
}: {
  group: WorkoutRoundGroup;
  displayRoundNumber: number;
  displayUnit: WeightUnit;
  isDropSetBlock: boolean;
  isMultiExercise: boolean;
  canReorder: boolean;
  isDragging: boolean;
  onDragStart: (event: PointerEvent<HTMLButtonElement>) => void;
}) => {
  const shouldUseDropSetLayout =
    isDropSetBlock || isDropSetRound(group.sets);
  const showRoundLabel = shouldUseDropSetLayout || canReorder;

  return (
    <div className="bg-stone-900/45 rounded-xl px-3.5 py-2.5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {showRoundLabel && (
            <p className="text-stone-500 text-xs font-medium mb-2">
              第 {displayRoundNumber} 回合
            </p>
          )}
          {shouldUseDropSetLayout ? (
            <DropSetRoundLine
              sets={group.sets}
              displayUnit={displayUnit}
              showExerciseName={isMultiExercise}
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              {group.sets.map((set) => (
                <SetLine
                  key={set.id}
                  set={set}
                  displayUnit={displayUnit}
                  showExerciseName={isMultiExercise}
                />
              ))}
            </div>
          )}
        </div>
        {canReorder && (
          <button
            onPointerDown={onDragStart}
            className={`mt-0.5 w-9 h-9 rounded-full bg-stone-800/70 flex touch-none items-center justify-center transition-colors ${
              isDragging
                ? "text-blue-300"
                : "text-stone-600 hover:text-stone-300"
            }`}
            aria-label="拖曳調整回合順序"
          >
            <IoReorderThree size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

const SetLine = ({
  set,
  displayUnit,
  showExerciseName,
}: {
  set: ExerciseSet;
  displayUnit: WeightUnit;
  showExerciseName: boolean;
}) => (
  <div className="flex min-h-9 items-center justify-between gap-3 text-sm">
    <div className="min-w-0 flex items-center gap-2">
      {showExerciseName && (
        <span className="text-stone-300 truncate">{set.exerciseName}</span>
      )}
      {SET_TYPE_LABELS[set.setType] && (
        <span className="text-[11px] text-orange-400 bg-orange-500/10 rounded-full px-2 py-0.5">
          {SET_TYPE_LABELS[set.setType]}
        </span>
      )}
    </div>
    <span className="text-stone-200 font-medium flex-shrink-0">
      {set.weightKg > 0
        ? `${formatWeight(set.weightKg, displayUnit)} ${displayUnit} · `
        : ""}
      {set.reps} 下
    </span>
  </div>
);

const DropSetRoundLine = ({
  sets,
  displayUnit,
  showExerciseName,
}: {
  sets: ExerciseSet[];
  displayUnit: WeightUnit;
  showExerciseName: boolean;
}) => {
  const primarySet = getPrimarySet(sets);
  const dropSet = getDropSet(sets);
  const exerciseName = primarySet?.exerciseName ?? dropSet?.exerciseName;

  return (
    <div className="flex flex-col gap-2">
      {showExerciseName && exerciseName && (
        <p className="text-stone-300 text-sm truncate">{exerciseName}</p>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2">
        <DropSetSegment label="第一段" set={primarySet} unit={displayUnit} />
        <div className="flex items-center justify-center text-stone-600">
          <IoArrowForward size={14} />
        </div>
        <DropSetSegment label="降重" set={dropSet} unit={displayUnit} accent />
      </div>
    </div>
  );
};

const DropSetSegment = ({
  label,
  set,
  unit,
  accent = false,
}: {
  label: string;
  set: ExerciseSet | null;
  unit: WeightUnit;
  accent?: boolean;
}) => (
  <div className="min-w-0 rounded-lg bg-stone-800/60 px-3 py-2">
    <p
      className={`text-[11px] font-medium ${
        accent ? "text-orange-400" : "text-stone-500"
      }`}
    >
      {label}
    </p>
    <p className="mt-0.5 truncate text-sm font-semibold text-stone-100">
      {set ? formatSetValue(set, unit) : "-"}
    </p>
  </div>
);

const groupSetsByRound = (sets: ExerciseSet[]) => {
  const map = new Map<number, ExerciseSet[]>();
  for (const set of sets) {
    const group = map.get(set.roundIndex) ?? [];
    group.push(set);
    map.set(set.roundIndex, group);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([roundIndex, group]) => ({
      roundIndex,
      sets: group.sort((a, b) => a.orderIndex - b.orderIndex),
    }));
};

const getLastSet = (sets: ExerciseSet[]): ExerciseSet | null =>
  [...sets].sort(
    (a, b) =>
      a.roundIndex - b.roundIndex ||
      a.orderIndex - b.orderIndex ||
      a.id.localeCompare(b.id),
  )[sets.length - 1] ?? null;

const getNextRoundIndex = (sets: ExerciseSet[]): number =>
  sets.reduce((max, set) => Math.max(max, set.roundIndex), -1) + 1;

const getLastRoundSets = (sets: ExerciseSet[]): ExerciseSet[] => {
  const groups = groupSetsByRound(sets);
  return groups[groups.length - 1]?.sets ?? [];
};

const getPrimarySet = (sets: ExerciseSet[]): ExerciseSet | null =>
  sets.find((set) => set.setType !== "drop") ?? sets[0] ?? null;

const getDropSet = (sets: ExerciseSet[]): ExerciseSet | null =>
  sets.find((set) => set.setType === "drop") ??
  sets.find((set) => set.orderIndex > 0) ??
  null;

const isDropSetRound = (sets: ExerciseSet[]): boolean =>
  sets.some((set) => set.setType === "drop");

const formatSetValue = (set: ExerciseSet, unit: WeightUnit): string =>
  `${set.weightKg > 0 ? `${formatWeight(set.weightKg, unit)} ${unit} · ` : ""}${
    set.reps
  } 下`;

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
      className="flex-1 min-w-0 bg-stone-800 border border-stone-700 rounded-xl px-4 py-3.5 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-blue-500 text-[15px]"
    />
    <div className="flex bg-stone-800 border border-stone-700 rounded-xl overflow-hidden">
      {(["磅", "kg"] as WeightUnit[]).map((u) => (
        <button
          key={u}
          onClick={() => onUnitChange(u)}
          className={`min-w-12 px-3.5 py-3.5 text-sm font-semibold transition-colors ${
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

const QUICK_BLOCK_TYPES: WorkoutBlockType[] = ["single", "drop_set"];

const AddExerciseModal = ({
  date,
  defaultUnit,
  onClose,
  onAdded,
}: AddExerciseModalProps) => {
  const [step, setStep] = useState<Step>("select");
  const [blockType, setBlockType] = useState<WorkoutBlockType>("single");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );

  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(defaultUnit);
  const [reps, setReps] = useState("12");
  const [sets, setSets] = useState("");
  const [dropWeight, setDropWeight] = useState("");
  const [dropWeightUnit, setDropWeightUnit] = useState<WeightUnit>(defaultUnit);
  const [dropReps, setDropReps] = useState("");
  const [filterEquipment, setFilterEquipment] = useState<string | null>(null);
  const [filterMuscle, setFilterMuscle] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  const isDropSet = blockType === "drop_set";

  const { data: exercises = [], isLoading: isSearching } = useQuery({
    queryKey: ["exercises", searchQuery],
    queryFn: () => searchExercises(searchQuery || undefined),
  });

  const { data: lastRecord } = useQuery({
    queryKey: ["exercise-last", selectedExercise?.id],
    queryFn: () => getLastExerciseRecord(getExerciseDisplayName(selectedExercise!)),
    enabled: !!selectedExercise && step === "configure",
  });

  const { data: prRecord } = useQuery({
    queryKey: ["exercise-pr", selectedExercise?.id],
    queryFn: () => getPRExerciseRecord(getExerciseDisplayName(selectedExercise!)),
    enabled: !!selectedExercise && step === "configure",
  });

  const { data: progressRecords = [] } = useQuery({
    queryKey: ["exercise-progress", selectedExercise?.id],
    queryFn: () =>
      getExerciseProgress(getExerciseDisplayName(selectedExercise!), 12),
    enabled: !!selectedExercise && step === "configure" && showProgress,
  });

  const filteredExercises = exercises.filter((e) => {
    if (filterEquipment && e.equipment !== filterEquipment) return false;
    if (
      filterMuscle &&
      !e.muscleGroups.some((mg) => mg.startsWith(filterMuscle))
    ) {
      return false;
    }
    return true;
  });

  const recentExercises = useRecentExercises((s) => s.recentExercises);
  const addRecentExercise = useRecentExercises((s) => s.addRecentExercise);

  const addMutation = useMutation({
    mutationFn: () => {
      if (!selectedExercise) throw new Error("No exercise selected");

      const exerciseName = getExerciseDisplayName(selectedExercise);
      const normalReps = parseInt(reps) || 0;
      const setCount = Math.max(1, parseInt(sets) || 1);
      const weightKg = weight ? convertToKg(parseFloat(weight), weightUnit) : 0;
      const dropWeightKg = dropWeight
        ? convertToKg(parseFloat(dropWeight), dropWeightUnit)
        : 0;
      const normalSets = Array.from({ length: setCount }, (_, index) => ({
        exerciseId: selectedExercise.id,
        exerciseName,
        roundIndex: index,
        orderIndex: 0,
        weightKg,
        reps: normalReps,
        setType: "normal" as const,
      }));

      const workoutSets = isDropSet
        ? [
            {
              exerciseId: selectedExercise.id,
              exerciseName,
              roundIndex: 0,
              orderIndex: 0,
              weightKg,
              reps: normalReps,
              setType: "normal" as const,
            },
            {
              exerciseId: selectedExercise.id,
              exerciseName,
              roundIndex: 0,
              orderIndex: 1,
              weightKg: dropWeightKg,
              reps: parseInt(dropReps) || 0,
              setType: "drop" as const,
            },
          ]
        : normalSets;

      return addWorkoutBlock({
        date,
        type: blockType,
        rounds: isDropSet ? 1 : normalSets.length,
        sets: workoutSets,
      });
    },
    onSuccess: () => {
      if (selectedExercise) addRecentExercise(selectedExercise);
      onAdded();
      onClose();
    },
  });

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setStep("configure");
  };

  const setCount = Math.max(1, parseInt(sets) || 1);
  const setsAreValid = sets.trim() === "" || parseInt(sets) > 0;

  const isValid =
    selectedExercise !== null &&
    (isDropSet
      ? parseInt(reps) > 0 && parseInt(dropReps) > 0
      : parseInt(reps) > 0 && setsAreValid);

  const previewText = isValid
    ? isDropSet
      ? `${weight || "?"} ${weightUnit} × ${reps}下 → ${dropWeight || "?"} ${dropWeightUnit} × ${dropReps}下`
      : `${weight ? `${weight} ${weightUnit} · ` : ""}${setCount} 組 × ${reps} 下`
    : null;
  const hasStoredWeightPreview = isDropSet
    ? Boolean(weight || dropWeight)
    : Boolean(weight);

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
        className="bg-stone-900 rounded-t-2xl flex flex-col max-w-md mx-auto w-full max-h-[88vh]"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-800 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {step === "configure" && (
              <button
                onClick={() => setStep("select")}
                className="w-9 h-9 rounded-full bg-stone-800 text-stone-400 hover:text-stone-200 flex items-center justify-center transition-colors"
                aria-label="返回選擇動作"
              >
                <IoArrowBack size={18} />
              </button>
            )}
            <h3 className="text-stone-100 text-base font-semibold truncate">
              {step === "select"
                ? "選擇動作"
                : selectedExercise
                  ? getExerciseDisplayName(selectedExercise)
                  : ""}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center"
            aria-label="關閉"
          >
            <IoClose size={20} className="text-stone-400" />
          </button>
        </div>

        {step === "select" ? (
          <>
            <div className="px-4 pt-3.5 flex-shrink-0">
              <BlockTypeSelector value={blockType} onChange={setBlockType} />
            </div>

            <div className="px-4 py-3.5 flex-shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋動作..."
                autoFocus
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3.5 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-blue-500 text-[15px]"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto px-4 pb-2 flex-shrink-0 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
              {EQUIPMENT_LIST.map((eq) => (
                <button
                  key={eq}
                  onClick={() =>
                    setFilterEquipment(filterEquipment === eq ? null : eq)
                  }
                  className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors ${
                    filterEquipment === eq
                      ? EQUIPMENT_COLORS[eq]
                      : "bg-stone-800 text-stone-500"
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto px-4 pb-3 flex-shrink-0 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
              {MUSCLE_LIST.map((muscle) => (
                <button
                  key={muscle}
                  onClick={() =>
                    setFilterMuscle(filterMuscle === muscle ? null : muscle)
                  }
                  className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors ${
                    filterMuscle === muscle
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-stone-800 text-stone-500"
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-5">
              {!searchQuery && recentExercises.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <IoTime size={14} className="text-stone-500" />
                    <p className="text-stone-500 text-xs font-medium">
                      最近使用
                    </p>
                  </div>
                  <ExerciseList
                    exercises={recentExercises.slice(0, 5)}
                    onSelect={handleSelectExercise}
                  />
                  <div className="border-t border-stone-800 my-3" />
                </div>
              )}

              {isSearching && filteredExercises.length === 0 ? (
                <p className="text-stone-500 text-sm text-center py-6">
                  搜尋中...
                </p>
              ) : filteredExercises.length === 0 ? (
                <p className="text-stone-500 text-sm text-center py-6">
                  找不到動作
                </p>
              ) : (
                <ExerciseList
                  exercises={filteredExercises}
                  onSelect={handleSelectExercise}
                />
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              <BlockTypeSelector value={blockType} onChange={setBlockType} />

              {(lastRecord || prRecord) && (
                <div className="bg-stone-800/60 rounded-xl px-4 py-3 flex flex-col gap-2.5">
                  {lastRecord && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-stone-500 text-xs">上次</span>
                      <span className="text-stone-300 text-xs text-right">
                        {lastRecord.weightKg > 0
                          ? `${convertToDisplay(lastRecord.weightKg, weightUnit)} ${weightUnit} · `
                          : ""}
                        {lastRecord.reps} 下
                        <span className="text-stone-600 ml-1">({lastRecord.date})</span>
                      </span>
                    </div>
                  )}
                  {prRecord && prRecord.weightKg > 0 && prRecord.id !== lastRecord?.id && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-yellow-500/80 text-xs font-medium">PR</span>
                      <span className="text-yellow-400/90 text-xs text-right">
                        {convertToDisplay(prRecord.weightKg, weightUnit)} {weightUnit} · {prRecord.reps} 下
                        <span className="text-stone-600 ml-1">({prRecord.date})</span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowProgress((v) => !v)}
                className="flex min-h-9 items-center gap-2 text-stone-500 hover:text-stone-300 text-xs transition-colors"
              >
                <span>{showProgress ? "▾" : "▸"}</span>
                <span>過去 12 週進度</span>
              </button>
              {showProgress && (
                progressRecords.length < 2 ? (
                  <p className="text-stone-600 text-xs text-center py-3">
                    資料不足（需至少 2 筆）
                  </p>
                ) : (
                  <div className="bg-stone-800/60 rounded-xl px-2 pt-2 pb-1">
                    <ResponsiveContainer width="100%" height={132}>
                      <LineChart
                        data={progressRecords.map((r) => ({
                          date: r.date.slice(5),
                          w: r.weightKg,
                        }))}
                      >
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "#78716c" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#78716c" }}
                          tickLine={false}
                          axisLine={false}
                          width={36}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#1c1917",
                            border: "1px solid #44403c",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          formatter={(v?: number | string) => [`${v ?? 0} kg`, "重量"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="w"
                          stroke="#60a5fa"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#60a5fa" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )
              )}

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
                    <NumberField
                      label="次數／組"
                      value={reps}
                      onChange={setReps}
                    />
                    <NumberField
                      label="組數（選填）"
                      value={sets}
                      onChange={setSets}
                      placeholder="1"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-3.5 bg-stone-800/50 rounded-xl p-3.5">
                    <p className="text-stone-500 text-xs font-medium">第一段</p>
                    <WeightInput
                      value={weight}
                      unit={weightUnit}
                      onValueChange={setWeight}
                      onUnitChange={setWeightUnit}
                    />
                    <NumberField label="次數" value={reps} onChange={setReps} />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-stone-700" />
                    <div className="flex items-center gap-1 text-stone-500">
                      <IoArrowForward size={14} />
                      <span className="text-xs">接著（不休息）</span>
                    </div>
                    <div className="flex-1 h-px bg-stone-700" />
                  </div>

                  <div className="flex flex-col gap-3.5 bg-stone-800/50 rounded-xl p-3.5">
                    <p className="text-stone-500 text-xs font-medium">
                      第二段（降重）
                    </p>
                    <WeightInput
                      value={dropWeight}
                      unit={dropWeightUnit}
                      onValueChange={setDropWeight}
                      onUnitChange={setDropWeightUnit}
                    />
                    <NumberField
                      label="次數"
                      value={dropReps}
                      onChange={setDropReps}
                      placeholder="12"
                    />
                  </div>
                </>
              )}

              {previewText && selectedExercise && (
                <div className="bg-stone-800/80 rounded-xl px-4 py-3.5">
                  <p className="text-stone-100 text-sm font-semibold">
                    {getExerciseDisplayName(selectedExercise)}
                  </p>
                  <p className="text-stone-400 text-xs mt-1">{previewText}</p>
                  {hasStoredWeightPreview && (
                    <p className="text-stone-600 text-xs mt-1">
                      儲存（kg）：
                      {isDropSet ? (
                        <>
                          {weight
                            ? `${convertToKg(parseFloat(weight) || 0, weightUnit)} kg`
                            : ""}
                          {dropWeight
                            ? ` → ${convertToKg(parseFloat(dropWeight) || 0, dropWeightUnit)} kg`
                            : ""}
                        </>
                      ) : (
                        `${convertToKg(parseFloat(weight) || 0, weightUnit)} kg`
                      )}
                    </p>
                  )}
                </div>
              )}

              {addMutation.isError && (
                <p className="text-red-400 text-xs">
                  {addMutation.error instanceof Error
                    ? addMutation.error.message
                    : "新增失敗"}
                </p>
              )}
            </div>

            <div className="px-4 py-4 border-t border-stone-800 flex-shrink-0">
              <button
                onClick={() => addMutation.mutate()}
                disabled={!isValid || addMutation.isPending}
                className="w-full min-h-12 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-xl px-4 py-3.5 font-semibold text-sm transition-colors"
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

const BlockTypeSelector = ({
  value,
  onChange,
}: {
  value: WorkoutBlockType;
  onChange: (value: WorkoutBlockType) => void;
}) => (
  <div className="grid grid-cols-2 gap-2.5">
    {QUICK_BLOCK_TYPES.map((type) => (
      <button
        key={type}
        onClick={() => onChange(type)}
        className={`min-h-11 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
          value === type
            ? BLOCK_BADGE_CLASSES[type]
            : "bg-stone-800 text-stone-500 hover:text-stone-300"
        }`}
      >
        {BLOCK_LABELS[type]}
      </button>
    ))}
  </div>
);

const APPEND_SET_TYPE_OPTIONS: ExerciseSetType[] = [
  "normal",
  "warmup",
  "failure",
];

const AddSetToBlockModal = ({
  block,
  defaultUnit,
  onClose,
  onAdded,
}: {
  block: WorkoutBlockWithSets;
  defaultUnit: WeightUnit;
  onClose: () => void;
  onAdded: () => void;
}) => {
  const inheritedRoundSets = useMemo(
    () => getLastRoundSets(block.sets),
    [block.sets],
  );
  const inheritedPrimarySet = useMemo(
    () => getPrimarySet(inheritedRoundSets),
    [inheritedRoundSets],
  );
  const inheritedDropSet = useMemo(
    () => getDropSet(inheritedRoundSets),
    [inheritedRoundSets],
  );
  const inheritedSet = inheritedPrimarySet ?? inheritedDropSet ?? null;
  const [appendMode, setAppendMode] = useState<WorkoutBlockType>(
    block.type === "drop_set" ? "drop_set" : "single",
  );
  const isDropSetAppend = appendMode === "drop_set";

  const [weight, setWeight] = useState(() =>
    inheritedPrimarySet && inheritedPrimarySet.weightKg > 0
      ? String(convertToDisplay(inheritedPrimarySet.weightKg, defaultUnit))
      : "",
  );
  const [unit, setUnit] = useState<WeightUnit>(defaultUnit);
  const [reps, setReps] = useState(() =>
    inheritedPrimarySet ? String(inheritedPrimarySet.reps) : "12",
  );
  const [dropWeight, setDropWeight] = useState(() =>
    inheritedDropSet && inheritedDropSet.weightKg > 0
      ? String(convertToDisplay(inheritedDropSet.weightKg, defaultUnit))
      : "",
  );
  const [dropUnit, setDropUnit] = useState<WeightUnit>(defaultUnit);
  const [dropReps, setDropReps] = useState(() =>
    inheritedDropSet ? String(inheritedDropSet.reps) : "12",
  );
  const [setType, setSetType] = useState<ExerciseSetType>(
    inheritedPrimarySet?.setType ?? "normal",
  );

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!inheritedSet) throw new Error("此區塊沒有可繼承的動作");

      const nextRoundIndex = getNextRoundIndex(block.sets);
      const exerciseId = inheritedSet.exerciseId;
      const exerciseName = inheritedSet.exerciseName;

      if (isDropSetAppend) {
        await addWorkoutSetsToBlock({
          blockId: block.id,
          sets: [
            {
              exerciseId,
              exerciseName,
              roundIndex: nextRoundIndex,
              orderIndex: 0,
              weightKg: weight ? convertToKg(parseFloat(weight), unit) : 0,
              reps: parseInt(reps) || 0,
              setType: "normal",
            },
            {
              exerciseId,
              exerciseName,
              roundIndex: nextRoundIndex,
              orderIndex: 1,
              weightKg: dropWeight
                ? convertToKg(parseFloat(dropWeight), dropUnit)
                : 0,
              reps: parseInt(dropReps) || 0,
              setType: "drop",
            },
          ],
        });
        return;
      }

      await addWorkoutSetToBlock({
        blockId: block.id,
        exerciseId,
        exerciseName,
        roundIndex: nextRoundIndex,
        orderIndex: 0,
        weightKg: weight ? convertToKg(parseFloat(weight), unit) : 0,
        reps: parseInt(reps) || 0,
        setType,
      });
    },
    onSuccess: () => {
      onAdded();
      onClose();
    },
  });

  const isValid =
    Boolean(inheritedSet) &&
    parseInt(reps) > 0 &&
    (!isDropSetAppend || parseInt(dropReps) > 0);

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
        className="bg-stone-900 rounded-t-2xl flex max-w-md mx-auto w-full flex-col"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-800">
          <div className="min-w-0">
            <h3 className="text-stone-100 text-base font-semibold">
              {isDropSetAppend ? "追加 Drop Set" : "追加一組"}
            </h3>
            <p className="mt-0.5 truncate text-xs text-stone-500">
              {inheritedSet?.exerciseName ?? "未命名動作"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center"
            aria-label="關閉"
          >
            <IoClose size={20} className="text-stone-400" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4">
          <BlockTypeSelector value={appendMode} onChange={setAppendMode} />

          {isDropSetAppend ? (
            <>
              <div className="flex flex-col gap-3.5 bg-stone-800/50 rounded-xl p-3.5">
                <p className="text-stone-500 text-xs font-medium">第一段</p>
                <WeightInput
                  value={weight}
                  unit={unit}
                  onValueChange={setWeight}
                  onUnitChange={setUnit}
                />
                <NumberField label="次數" value={reps} onChange={setReps} />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-stone-700" />
                <div className="flex items-center gap-1 text-stone-500">
                  <IoArrowForward size={14} />
                  <span className="text-xs">接著（不休息）</span>
                </div>
                <div className="flex-1 h-px bg-stone-700" />
              </div>

              <div className="flex flex-col gap-3.5 bg-stone-800/50 rounded-xl p-3.5">
                <p className="text-stone-500 text-xs font-medium">
                  第二段（降重）
                </p>
                <WeightInput
                  value={dropWeight}
                  unit={dropUnit}
                  onValueChange={setDropWeight}
                  onUnitChange={setDropUnit}
                />
                <NumberField
                  label="次數"
                  value={dropReps}
                  onChange={setDropReps}
                  placeholder="12"
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-stone-400 text-xs font-medium">
                  重量
                </label>
                <WeightInput
                  value={weight}
                  unit={unit}
                  onValueChange={setWeight}
                  onUnitChange={setUnit}
                />
              </div>

              <NumberField label="次數" value={reps} onChange={setReps} />

              <div className="grid grid-cols-3 gap-2">
                {APPEND_SET_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSetType(option)}
                    className={`min-h-11 rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors ${
                      setType === option
                        ? "bg-blue-500 text-white"
                        : "bg-stone-800 text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    {SET_TYPE_LABELS[option] || "一般"}
                  </button>
                ))}
              </div>
            </>
          )}

          {addMutation.isError && (
            <p className="text-red-400 text-xs">
              {addMutation.error instanceof Error
                ? addMutation.error.message
                : "新增失敗"}
            </p>
          )}
        </div>

        <div className="px-4 py-4 border-t border-stone-800">
          <button
            onClick={() => addMutation.mutate()}
            disabled={!isValid || addMutation.isPending}
            className="w-full min-h-12 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-xl px-4 py-3.5 font-semibold text-sm transition-colors"
          >
            {addMutation.isPending
              ? "加入中..."
              : isDropSetAppend
                ? "加入 Drop Set"
                : "加入此區塊"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ExerciseList = ({
  exercises,
  onSelect,
}: {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
}) => (
  <div className="flex flex-col gap-1.5">
    {exercises.map((exercise) => (
      <button
        key={exercise.id}
        onClick={() => onSelect(exercise)}
        className="w-full flex items-center justify-between px-3.5 py-3.5 rounded-xl hover:bg-stone-800 active:bg-stone-800 text-left transition-colors"
      >
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-baseline gap-2 min-w-0">
            {exercise.brand && (
              <span className="text-stone-500 text-xs flex-shrink-0">
                {exercise.brand}
              </span>
            )}
            <span className="text-stone-100 text-[15px] font-medium truncate">
              {exercise.machineName}
            </span>
          </div>
          {exercise.muscleGroups.length > 0 && (
            <span className="text-stone-500 text-xs truncate">
              {exercise.muscleGroups.join(" · ")}
            </span>
          )}
        </div>
        {exercise.equipment && (
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full flex-shrink-0 ml-3 ${
              EQUIPMENT_COLORS[exercise.equipment] ?? "bg-stone-700 text-stone-400"
            }`}
          >
            {exercise.equipment}
          </span>
        )}
      </button>
    ))}
  </div>
);

const NumberField = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-stone-400 text-xs font-medium">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min="1"
      className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3.5 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-blue-500 text-[15px] text-center"
    />
  </div>
);
