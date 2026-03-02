"use client";

import { type ReactNode, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IoWarning, IoCheckmarkCircle } from "react-icons/io5";
import type { NutritionSchemaCheckResponse } from "@/app/api/notion/nutrition/schema/route";

async function checkSchema(): Promise<NutritionSchemaCheckResponse> {
  const res = await fetch("/api/notion/nutrition/schema");
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function migrateSchema(): Promise<void> {
  const res = await fetch("/api/notion/nutrition/schema", { method: "POST" });
  if (!res.ok) throw new Error(`${res.status}`);
}

type Props = { children: ReactNode };

/**
 * Schema Gate：
 * - 正在檢查 → 顯示 skeleton，不渲染子元件（避免發出無效請求）
 * - Schema 有缺少 → 只顯示警告 banner，不渲染子元件
 * - Schema 正常 / 修復後 → 渲染子元件
 */
export const SchemaMismatchBanner = ({ children }: Props) => {
  const queryClient = useQueryClient();
  const [migrated, setMigrated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["nutrition-schema-check"],
    queryFn: checkSchema,
    staleTime: Infinity,
    retry: 1,
  });

  const migrateMutation = useMutation({
    mutationFn: migrateSchema,
    onSuccess: () => {
      // 清掉舊結果，讓 gate 重新驗證一次
      queryClient.invalidateQueries({ queryKey: ["nutrition-schema-check"] });
      setMigrated(true);
    },
  });

  // ── 0. SSR / first hydration frame → pass-through to match server HTML ──
  if (!mounted) return <>{children}</>;

  // ── 1. 正在 check schema ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 px-4">
        <div className="h-10 bg-stone-800 rounded-2xl animate-pulse" />
        <div className="h-32 bg-stone-800 rounded-2xl animate-pulse" />
        <div className="h-20 bg-stone-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // ── 2. Check 失敗（網路錯誤等）→ 直接讓子元件渲染，各自處理錯誤 ────────
  if (isError) return <>{children}</>;

  // ── 3. Schema 正常 or 已完成 migrate ─────────────────────────────────────
  if (!data || data.allValid || migrated) {
    return (
      <>
        {migrated && (
          <div className="mx-4 mb-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
            <IoCheckmarkCircle size={20} className="text-emerald-400 flex-shrink-0" />
            <p className="text-emerald-300 text-sm">資料庫結構已更新，頁面功能已恢復正常</p>
          </div>
        )}
        {children}
      </>
    );
  }

  // ── 4. Schema 有缺少 → 只顯示 banner，不渲染子元件 ────────────────────────
  const issues: { dbName: string; missing: string[] }[] = [];
  if (!data.foods.valid) {
    issues.push({ dbName: data.foods.dbName, missing: data.foods.missingProperties });
  }
  if (!data.mealItems.valid) {
    issues.push({ dbName: data.mealItems.dbName, missing: data.mealItems.missingProperties });
  }

  return (
    <div className="mx-4 mb-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-3 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <IoWarning size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-yellow-300 text-sm font-semibold">資料庫結構需要更新</p>
          <p className="text-yellow-400/70 text-xs">
            以下欄位不存在，頁面請求已暫停以避免錯誤：
          </p>
          {issues.map(({ dbName, missing }) => (
            <div key={dbName} className="mt-1">
              <p className="text-stone-400 text-xs font-medium">{dbName}</p>
              <p className="text-stone-500 text-xs">{missing.join("、")}</p>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => migrateMutation.mutate()}
        disabled={migrateMutation.isPending}
        className="w-full bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 disabled:opacity-50 text-stone-900 font-semibold text-sm rounded-xl py-2.5 transition-colors"
      >
        {migrateMutation.isPending ? "更新中..." : "自動補齊缺少欄位"}
      </button>
      {migrateMutation.isError && (
        <p className="text-red-400 text-xs text-center">
          更新失敗，請確認 Notion Token 是否有 DB 編輯權限
        </p>
      )}
    </div>
  );
};
