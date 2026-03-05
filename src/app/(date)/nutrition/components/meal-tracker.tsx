"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDate } from "@/components/date-selector";
import { getMealItems, addMealItem, removeMealItem, updateMealItem, searchFoods, addFood } from "@/lib/api/nutrition";
import type { MealItem } from "@/lib/notion/mappers/meal-item-mapper";
import type { Food } from "@/lib/notion/mappers/food-mapper";
import { IoAdd, IoClose, IoTrash, IoArrowBack, IoTime, IoPencil } from "react-icons/io5";
import { useRecentFoods } from "@/providers/recent-foods-provider";

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
  const [editingItem, setEditingItem] = useState<MealItem | null>(null);
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
              onEdit={() => setEditingItem(item)}
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
        {editingItem && (
          <EditMealItemModal
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onEdited={() => {
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
  onEdit,
  onDelete,
}: {
  item: MealItem;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-stone-200 text-sm truncate">{item.foodName}</p>
        <p className="text-stone-500 text-xs">
          {item.intake}g · {Math.round(item.calories)} kcal · P {Math.round(item.protein)}g · F {Math.round(item.fat)}g · C {Math.round(item.carbs)}g
        </p>
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
        <button
          onClick={onEdit}
          className="w-7 h-7 rounded-full text-stone-600 hover:text-blue-400 hover:bg-blue-400/10 flex items-center justify-center transition-colors"
        >
          <IoPencil size={13} />
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-full text-stone-600 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-colors"
        >
          <IoTrash size={14} />
        </button>
      </div>
    </div>
  );
};

const EditMealItemModal = ({
  item,
  onClose,
  onEdited,
}: {
  item: MealItem;
  onClose: () => void;
  onEdited: () => void;
}) => {
  const [intake, setIntake] = useState(String(item.intake));

  const updateMutation = useMutation({
    mutationFn: () => {
      const newIntake = parseFloat(intake) || 0;
      if (newIntake <= 0) throw new Error("攝取量必須大於 0");
      const ratio = newIntake / item.intake;
      return updateMealItem(item.id, {
        intake: newIntake,
        calories: Math.round(item.calories * ratio * 10) / 10,
        protein: Math.round(item.protein * ratio * 10) / 10,
        fat: Math.round(item.fat * ratio * 10) / 10,
        carbs: Math.round(item.carbs * ratio * 10) / 10,
      });
    },
    onSuccess: () => {
      onEdited();
      onClose();
    },
  });

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
        className="bg-stone-900 rounded-t-2xl max-w-md mx-auto w-full"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-800">
          <h3 className="text-stone-100 font-semibold">修改分量</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center"
          >
            <IoClose size={18} className="text-stone-400" />
          </button>
        </div>
        <div className="px-4 py-4 flex flex-col gap-3">
          <p className="text-stone-300 text-sm font-medium">{item.foodName}</p>
          <div className="flex flex-col gap-1">
            <label className="text-stone-400 text-xs">攝取量 (g)</label>
            <input
              type="number"
              value={intake}
              onChange={(e) => setIntake(e.target.value)}
              autoFocus
              min="1"
              className="bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 text-sm focus:outline-none focus:border-blue-500 w-full"
            />
          </div>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || (parseFloat(intake) || 0) <= 0}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-xl py-3 font-semibold text-sm transition-colors"
          >
            {updateMutation.isPending ? "更新中..." : "確認"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

type AddFoodModalProps = {
  mealType: MealType;
  date: string;
  onClose: () => void;
  onAdded: () => void;
};

type ModalView = "search" | "create";

const AddFoodModal = ({ mealType, date, onClose, onAdded }: AddFoodModalProps) => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ModalView>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [intake, setIntake] = useState("100");
  const recentFoods = useRecentFoods((s) => s.recentFoods);
  const addRecentFood = useRecentFoods((s) => s.addRecentFood);

  const [newFood, setNewFood] = useState({
    name: "",
    weight: "100",
    calories: "",
    protein: "",
    fat: "",
    carbs: "",
  });

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
      if (selectedFood) addRecentFood(selectedFood);
      onAdded();
      onClose();
    },
  });

  const createFoodMutation = useMutation({
    mutationFn: () =>
      addFood({
        name: newFood.name,
        weight: parseFloat(newFood.weight) || 100,
        calories: parseFloat(newFood.calories) || 0,
        protein: parseFloat(newFood.protein) || 0,
        fat: parseFloat(newFood.fat) || 0,
        carbs: parseFloat(newFood.carbs) || 0,
        transFat: 0,
        saturatedFat: 0,
        monounsaturatedFat: 0,
        polyunsaturatedFat: 0,
        sugar: 0,
        dietaryFiber: 0,
        sodium: 0,
        potassium: 0,
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["food-search"] });
      const created: Food = {
        id: result.id,
        name: newFood.name,
        weight: parseFloat(newFood.weight) || 100,
        calories: parseFloat(newFood.calories) || 0,
        protein: parseFloat(newFood.protein) || 0,
        fat: parseFloat(newFood.fat) || 0,
        carbs: parseFloat(newFood.carbs) || 0,
        transFat: 0,
        saturatedFat: 0,
        monounsaturatedFat: 0,
        polyunsaturatedFat: 0,
        sugar: 0,
        dietaryFiber: 0,
        sodium: 0,
        potassium: 0,
      };
      addRecentFood(created);
      setSelectedFood(created);
      setSearchQuery(newFood.name);
      setView("search");
    },
  });

  const isCreateValid = newFood.name.trim().length > 0 && parseFloat(newFood.calories) > 0;

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
        className="bg-stone-900 rounded-t-2xl max-h-[85vh] flex flex-col max-w-md mx-auto w-full"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            {view === "create" && (
              <button onClick={() => setView("search")} className="text-stone-400 hover:text-stone-200">
                <IoArrowBack size={18} />
              </button>
            )}
            <h3 className="text-stone-100 font-semibold">
              {view === "search" ? "新增食物" : "建立食物"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center"
          >
            <IoClose size={18} className="text-stone-400" />
          </button>
        </div>

        {view === "search" ? (
          <>
            <div className="px-4 py-3 flex-shrink-0">
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
              {!searchQuery && recentFoods.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <IoTime size={12} className="text-stone-500" />
                    <p className="text-stone-500 text-xs">最近使用</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {recentFoods.slice(0, 5).map((food) => (
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
                  <div className="border-t border-stone-800 my-2" />
                </div>
              )}
              {isSearching && !foods.length ? (
                <p className="text-stone-500 text-sm text-center py-4">搜尋中...</p>
              ) : foods.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <p className="text-stone-500 text-sm">找不到食物</p>
                  <button
                    onClick={() => {
                      setNewFood((f) => ({ ...f, name: searchQuery }));
                      setView("create");
                    }}
                    className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-emerald-500/25 transition-colors"
                  >
                    + 建立「{searchQuery || "新食物"}」
                  </button>
                </div>
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
                  <button
                    onClick={() => {
                      setNewFood((f) => ({ ...f, name: searchQuery }));
                      setView("create");
                    }}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl text-emerald-400 text-sm text-left hover:bg-emerald-500/10 transition-colors"
                  >
                    + 建立新食物
                  </button>
                </div>
              )}
            </div>

            {selectedFood && (() => {
              const ratio = (parseFloat(intake) || 100) / (selectedFood.weight || 100);
              const nutrients = [
                { label: "蛋白質", value: selectedFood.protein, unit: "g" },
                { label: "脂肪", value: selectedFood.fat, unit: "g" },
                { label: "碳水", value: selectedFood.carbs, unit: "g" },
                { label: "糖", value: selectedFood.sugar, unit: "g" },
                { label: "膳食纖維", value: selectedFood.dietaryFiber, unit: "g" },
                { label: "鈉", value: selectedFood.sodium, unit: "mg" },
              ];
              return (
                <div className="px-4 pt-3 pb-4 border-t border-stone-800 flex-shrink-0 flex flex-col gap-2.5">
                  <div className="grid grid-cols-3 gap-x-3 gap-y-2 bg-stone-800/60 rounded-xl px-3 py-2.5">
                    {nutrients.map(({ label, value, unit }) => (
                      <div key={label}>
                        <p className="text-stone-500 text-xs">{label}</p>
                        <p className="text-stone-200 text-xs font-medium">
                          {Math.round((value ?? 0) * ratio * 10) / 10}{unit}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-end gap-3">
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
                </div>
              );
            })()}
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-stone-400 text-xs font-medium">食物名稱</label>
                <input
                  type="text"
                  value={newFood.name}
                  onChange={(e) => setNewFood((f) => ({ ...f, name: e.target.value }))}
                  placeholder="例：雞胸肉"
                  autoFocus
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-stone-400 text-xs font-medium">
                  基準份量 <span className="text-stone-600">(g)</span>
                </label>
                <input
                  type="number"
                  value={newFood.weight}
                  onChange={(e) => setNewFood((f) => ({ ...f, weight: e.target.value }))}
                  placeholder="100"
                  min="1"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <p className="text-stone-600 text-xs -mt-1">以下為每 {newFood.weight || "?"}g 的營養數值</p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "calories", label: "熱量", unit: "kcal" },
                  { key: "protein", label: "蛋白質", unit: "g" },
                  { key: "fat", label: "脂肪", unit: "g" },
                  { key: "carbs", label: "碳水", unit: "g" },
                ].map(({ key, label, unit }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-stone-400 text-xs font-medium">
                      {label} <span className="text-stone-600">({unit})</span>
                    </label>
                    <input
                      type="number"
                      value={newFood[key as keyof typeof newFood]}
                      onChange={(e) =>
                        setNewFood((f) => ({ ...f, [key]: e.target.value }))
                      }
                      placeholder="0"
                      min="0"
                      step="0.1"
                      className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-4 border-t border-stone-800 flex-shrink-0">
              <button
                onClick={() => createFoodMutation.mutate()}
                disabled={!isCreateValid || createFoodMutation.isPending}
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-xl py-3 font-semibold text-sm transition-colors"
              >
                {createFoodMutation.isPending ? "建立中..." : "建立食物"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};
