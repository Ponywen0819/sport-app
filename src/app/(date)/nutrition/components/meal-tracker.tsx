"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDate } from "@/components/date-selector";
import { getMealItems, addMealItem, removeMealItem, searchFoods } from "@/lib/api/nutrition";
import type { MealItem } from "@/lib/notion/mappers/meal-item-mapper";
import type { Food } from "@/lib/notion/mappers/food-mapper";
import { IoAdd, IoClose, IoTrash } from "react-icons/io5";

type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

type MealTrackerProps = {
  mealType: MealType;
  date: CalendarDate;
};

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  Breakfast: "早餐",
  Lunch: "午餐",
  Dinner: "晚餐",
  Snack: "點心",
};

const formatDate = (date: CalendarDate): string => {
  const y = date.year.toString().padStart(4, "0");
  const m = (date.month + 1).toString().padStart(2, "0");
  const d = date.day.toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const MealTracker = ({ mealType, date }: MealTrackerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const dateStr = formatDate(date);
  const queryKey = ["meal-items", dateStr, mealType];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getMealItems(dateStr, mealType),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeMealItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["nutrition-overview", dateStr] });
    },
  });

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const label = MEAL_TYPE_LABELS[mealType];

  return (
    <div className="bg-stone-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-stone-100 font-semibold text-sm">{label}</h3>
          {totalCalories > 0 && (
            <span className="text-stone-500 text-xs">{Math.round(totalCalories)} kcal</span>
          )}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-7 h-7 rounded-full bg-stone-700 hover:bg-stone-600 active:bg-stone-500 flex items-center justify-center transition-colors"
        >
          <IoAdd size={16} className="text-stone-300" />
        </button>
      </div>

      {isLoading ? (
        <div className="px-4 pb-3 flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-8 bg-stone-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="flex flex-col divide-y divide-stone-700/50">
          {items.map((item) => (
            <MealItemRow
              key={item.id}
              item={item}
              onDelete={() => removeMutation.mutate(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 pb-3">
          <p className="text-stone-600 text-xs">尚無紀錄，點擊 + 新增</p>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <AddFoodModal
            mealType={mealType}
            date={dateStr}
            onClose={() => setIsModalOpen(false)}
            onAdded={() => {
              queryClient.invalidateQueries({ queryKey });
              queryClient.invalidateQueries({ queryKey: ["nutrition-overview", dateStr] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const MealItemRow = ({
  item,
  onDelete,
}: {
  item: MealItem;
  onDelete: () => void;
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-stone-200 text-sm truncate">{item.foodName}</p>
        <p className="text-stone-500 text-xs">
          {Math.round(item.calories)} kcal · P {Math.round(item.protein)}g · F {Math.round(item.fat)}g · C {Math.round(item.carbs)}g
        </p>
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

type AddFoodModalProps = {
  mealType: MealType;
  date: string;
  onClose: () => void;
  onAdded: () => void;
};

const AddFoodModal = ({ mealType, date, onClose, onAdded }: AddFoodModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [intake, setIntake] = useState("100");

  const { data: foods = [], isLoading: isSearching } = useQuery({
    queryKey: ["food-search", searchQuery],
    queryFn: () => searchFoods(searchQuery || undefined),
  });

  const addMutation = useMutation({
    mutationFn: () => {
      if (!selectedFood) throw new Error("No food selected");
      const intakeAmount = parseFloat(intake) || 100;
      const ratio = intakeAmount / (selectedFood.weight || 100);
      return addMealItem({
        date,
        mealType,
        foodId: selectedFood.id,
        foodName: selectedFood.name,
        intake: intakeAmount,
        calories: Math.round((selectedFood.calories ?? 0) * ratio * 10) / 10,
        protein: Math.round((selectedFood.protein ?? 0) * ratio * 10) / 10,
        fat: Math.round((selectedFood.fat ?? 0) * ratio * 10) / 10,
        carbs: Math.round((selectedFood.carbs ?? 0) * ratio * 10) / 10,
      });
    },
    onSuccess: () => {
      onAdded();
      onClose();
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-stone-900 rounded-t-2xl max-h-[85vh] flex flex-col max-w-md mx-auto w-full"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-800">
          <h3 className="text-stone-100 font-semibold">新增食物</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center"
          >
            <IoClose size={18} className="text-stone-400" />
          </button>
        </div>

        <div className="px-4 py-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋食物..."
            className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-blue-500 text-sm"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {isSearching && !foods.length ? (
            <p className="text-stone-500 text-sm text-center py-4">搜尋中...</p>
          ) : foods.length === 0 ? (
            <p className="text-stone-500 text-sm text-center py-4">
              找不到食物，請在 Notion 食物資料庫中新增
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {foods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => setSelectedFood(food)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${
                    selectedFood?.id === food.id
                      ? "bg-blue-500/20 border border-blue-500/30"
                      : "hover:bg-stone-800"
                  }`}
                >
                  <span className="text-stone-100 text-sm">{food.name}</span>
                  <span className="text-stone-500 text-xs">
                    {food.calories} kcal / {food.weight}g
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedFood && (
          <div className="px-4 py-3 border-t border-stone-800 flex items-end gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <p className="text-stone-400 text-xs">攝取量 (g)</p>
              <input
                type="number"
                value={intake}
                onChange={(e) => setIntake(e.target.value)}
                className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-blue-500 w-full"
                min="1"
              />
            </div>
            <button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 text-white rounded-xl px-5 py-2 font-medium text-sm transition-colors"
            >
              {addMutation.isPending ? "新增中..." : "新增"}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
