"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { IoAdd, IoClose, IoBody, IoChevronBack, IoChevronDown, IoChevronUp } from "react-icons/io5";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getLatestBodyIndex, getBodyIndexHistory, addBodyIndex } from "@/lib/api/body-index";
import type { BodyIndex, CreateBodyIndexInput } from "@/lib/notion/mappers/body-index-mapper";
import { getCurrentDate } from "@/utils/time";
import { BodyIndexSchemaGate } from "./components/schema-gate";

const formatDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function BodyIndexPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (data: CreateBodyIndexInput) => addBodyIndex(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["body-index"] });
      setIsModalOpen(false);
    },
  });

  return (
    <div className="flex flex-col px-4 py-6 gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center active:bg-stone-700 transition-colors"
          >
            <IoChevronBack size={18} className="text-stone-300" />
          </Link>
          <h1 className="text-xl font-bold text-stone-100">身體指標</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-8 h-8 rounded-full bg-stone-700 hover:bg-stone-600 active:bg-stone-500 flex items-center justify-center transition-colors"
        >
          <IoAdd size={18} className="text-stone-300" />
        </button>
      </div>

      <BodyIndexSchemaGate>
        {/* BodyIndexData only mounts (and queries) when gate passes */}
        <BodyIndexData onAddClick={() => setIsModalOpen(true)} />
      </BodyIndexSchemaGate>

      <AnimatePresence>
        {isModalOpen && (
          <AddBodyIndexModal
            onClose={() => setIsModalOpen(false)}
            onSubmit={(data) => addMutation.mutate(data)}
            isPending={addMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Inner component — only mounts when BodyIndexSchemaGate renders its children
const BodyIndexData = ({ onAddClick }: { onAddClick: () => void }) => {
  const { data: latest, isLoading: latestLoading } = useQuery({
    queryKey: ["body-index", "latest"],
    queryFn: getLatestBodyIndex,
  });

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["body-index", "history"],
    queryFn: () => getBodyIndexHistory(30),
    enabled: !!latest,
  });

  if (latestLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 bg-stone-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <IoBody size={48} className="text-stone-700" />
        <p className="text-stone-500 text-sm">尚無量測紀錄</p>
        <button
          onClick={onAddClick}
          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-colors"
        >
          新增第一筆
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BodyIndexCards record={latest} />
      {!historyLoading && history.length >= 2 && (
        <BodyIndexChart records={history} />
      )}
      {!historyLoading && history.length > 1 && (
        <BodyIndexHistory records={history} />
      )}
    </div>
  );
};

const BodyIndexCards = ({ record }: { record: BodyIndex }) => {
  const metrics: { label: string; value: number; unit: string; color: string }[] = [
    { label: "體重", value: record.weight, unit: "kg", color: "text-blue-400" },
    { label: "體脂率", value: record.bodyFatPercentage, unit: "%", color: "text-orange-400" },
    { label: "骨骼肌重", value: record.skeletalMuscleWeight, unit: "kg", color: "text-emerald-400" },
    { label: "內臟脂肪指數", value: record.visceralFatIndex, unit: "", color: "text-red-400" },
    { label: "體脂重", value: record.bodyFatWeight, unit: "kg", color: "text-yellow-400" },
    { label: "基礎代謝率", value: record.basalMetabolicRate, unit: "kcal", color: "text-purple-400" },
    { label: "蛋白質重", value: record.proteinWeight, unit: "kg", color: "text-cyan-400" },
    { label: "體內水分", value: record.totalWater, unit: "kg", color: "text-sky-400" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-stone-500 text-xs">最後量測：{record.date}</p>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-stone-800 rounded-2xl px-4 py-4">
            <p className="text-stone-500 text-xs mb-1">{m.label}</p>
            <p className={`text-2xl font-bold ${m.color}`}>
              {m.value > 0 ? m.value : "—"}
              {m.value > 0 && m.unit && (
                <span className="text-sm font-normal text-stone-400 ml-1">{m.unit}</span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

type ChartMetric = {
  key: keyof BodyIndex;
  label: string;
  color: string;
  unit: string;
};

const CHART_METRICS: ChartMetric[] = [
  { key: "weight", label: "體重", color: "#60a5fa", unit: "kg" },
  { key: "bodyFatPercentage", label: "體脂率", color: "#fb923c", unit: "%" },
  { key: "skeletalMuscleWeight", label: "骨骼肌重", color: "#34d399", unit: "kg" },
];

const BodyIndexChart = ({ records }: { records: BodyIndex[] }) => {
  const [activeMetric, setActiveMetric] = useState<ChartMetric>(CHART_METRICS[0]);

  // Recharts needs ascending order
  const chartData = [...records]
    .reverse()
    .map((r) => ({
      date: r.date.slice(5), // Show MM-DD
      value: r[activeMetric.key] as number,
    }));

  return (
    <div className="bg-stone-800 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-stone-300 text-sm font-semibold">趨勢圖</p>
        <div className="flex gap-1">
          {CHART_METRICS.map((m) => (
            <button
              key={m.key as string}
              onClick={() => setActiveMetric(m)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeMetric.key === m.key
                  ? "bg-stone-600 text-stone-100"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#78716c", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "#78716c", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1c1917",
              border: "1px solid #44403c",
              borderRadius: "12px",
              color: "#e7e5e4",
              fontSize: "12px",
            }}
            formatter={(v: number | undefined) => v != null ? [`${v} ${activeMetric.unit}`, activeMetric.label] : ["—", activeMetric.label]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={activeMetric.color}
            strokeWidth={2}
            dot={{ fill: activeMetric.color, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const BodyIndexHistory = ({ records }: { records: BodyIndex[] }) => {
  const [expanded, setExpanded] = useState(false);
  const displayed = expanded ? records : records.slice(0, 5);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-stone-400 text-sm font-semibold">歷史紀錄</p>
      <div className="flex flex-col gap-2">
        {displayed.map((r) => (
          <div key={r.id} className="bg-stone-800 rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-stone-400 text-sm">{r.date}</span>
            <div className="flex items-center gap-4">
              {r.weight > 0 && (
                <span className="text-blue-400 text-sm font-semibold">{r.weight} kg</span>
              )}
              {r.bodyFatPercentage > 0 && (
                <span className="text-orange-400 text-sm">{r.bodyFatPercentage}%</span>
              )}
              {r.skeletalMuscleWeight > 0 && (
                <span className="text-emerald-400 text-sm">{r.skeletalMuscleWeight} kg</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {records.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center gap-1 py-2 text-stone-500 text-sm hover:text-stone-300 transition-colors"
        >
          {expanded ? (
            <><IoChevronUp size={14} /> 收起</>
          ) : (
            <><IoChevronDown size={14} /> 顯示全部 {records.length} 筆</>
          )}
        </button>
      )}
    </div>
  );
};

type FieldConfig = {
  key: keyof Omit<CreateBodyIndexInput, "date">;
  label: string;
  unit: string;
  placeholder: string;
};

const FIELDS: FieldConfig[] = [
  { key: "weight", label: "體重", unit: "kg", placeholder: "70.0" },
  { key: "bodyFatPercentage", label: "體脂率", unit: "%", placeholder: "20.0" },
  { key: "skeletalMuscleWeight", label: "骨骼肌重", unit: "kg", placeholder: "30.0" },
  { key: "bodyFatWeight", label: "體脂重", unit: "kg", placeholder: "14.0" },
  { key: "visceralFatIndex", label: "內臟脂肪指數", unit: "", placeholder: "8" },
  { key: "basalMetabolicRate", label: "基礎代謝率", unit: "kcal", placeholder: "1600" },
  { key: "height", label: "身高", unit: "cm", placeholder: "170" },
  { key: "totalWater", label: "體內水分", unit: "kg", placeholder: "42.0" },
  { key: "proteinWeight", label: "蛋白質重", unit: "kg", placeholder: "12.0" },
  { key: "mineralWeight", label: "礦物質重", unit: "kg", placeholder: "3.5" },
];

type AddBodyIndexModalProps = {
  onClose: () => void;
  onSubmit: (data: CreateBodyIndexInput) => void;
  isPending: boolean;
};

const AddBodyIndexModal = ({ onClose, onSubmit, isPending }: AddBodyIndexModalProps) => {
  const today = formatDate(getCurrentDate());
  const [date, setDate] = useState(today);
  const [values, setValues] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const data: CreateBodyIndexInput = {
      date,
      weight: parseFloat(values.weight) || 0,
      height: parseFloat(values.height) || 0,
      bodyFatPercentage: parseFloat(values.bodyFatPercentage) || 0,
      skeletalMuscleWeight: parseFloat(values.skeletalMuscleWeight) || 0,
      totalWater: parseFloat(values.totalWater) || 0,
      proteinWeight: parseFloat(values.proteinWeight) || 0,
      mineralWeight: parseFloat(values.mineralWeight) || 0,
      bodyFatWeight: parseFloat(values.bodyFatWeight) || 0,
      visceralFatIndex: parseFloat(values.visceralFatIndex) || 0,
      basalMetabolicRate: parseFloat(values.basalMetabolicRate) || 0,
    };
    onSubmit(data);
  };

  const isValid = !!values.weight && parseFloat(values.weight) > 0;

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
          <h3 className="text-stone-100 font-semibold">新增量測</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center"
          >
            <IoClose size={18} className="text-stone-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-stone-400 text-xs font-medium">量測日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(({ key, label, unit, placeholder }) => (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-stone-400 text-xs font-medium">
                  {label}{unit && <span className="text-stone-600 ml-1">({unit})</span>}
                </label>
                <input
                  type="number"
                  value={values[key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                  placeholder={placeholder}
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
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-xl py-3 font-semibold text-sm transition-colors"
          >
            {isPending ? "儲存中..." : "儲存"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
