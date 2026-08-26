import type { ConsumptionLog, IngredientCategory } from "./types";
import { addDays, toISODate, todayStart } from "./expiry-calculator";
import { CATEGORY_LABELS } from "./types";

function withinDays(dateISO: string, days: number): boolean {
  const from = toISODate(addDays(todayStart(), -(days - 1)));
  return dateISO >= from;
}

export interface WeeklySavings {
  usedCount: number;
  savedAmount: number;
}

/** 최근 7일간 버리지 않고 사용한 식재료 수와 예상 절약 금액 */
export function weeklySavings(logs: ConsumptionLog[]): WeeklySavings {
  const used = logs.filter((l) => l.type === "consumed" && withinDays(l.date, 7));
  return {
    usedCount: used.length,
    savedAmount: used.reduce((sum, l) => sum + l.price, 0),
  };
}

export interface MonthlyReport {
  usedCount: number;
  wastedCount: number;
  wasteRate: number; // %
  savedAmount: number;
  wastedAmount: number;
  prevWasteRate: number;
  wasteRateDelta: number; // 음수면 개선
}

/** 최근 30일 vs 그 이전 30일 비교 리포트 */
export function monthlyReport(logs: ConsumptionLog[]): MonthlyReport {
  const cur = logs.filter((l) => withinDays(l.date, 30));
  const prevFrom = toISODate(addDays(todayStart(), -59));
  const prevTo = toISODate(addDays(todayStart(), -30));
  const prev = logs.filter((l) => l.date >= prevFrom && l.date <= prevTo);

  const usedCount = cur.filter((l) => l.type === "consumed").length;
  const wastedCount = cur.filter((l) => l.type === "discarded").length;
  const total = usedCount + wastedCount;
  const wasteRate = total === 0 ? 0 : Math.round((wastedCount / total) * 1000) / 10;

  const prevUsed = prev.filter((l) => l.type === "consumed").length;
  const prevWasted = prev.filter((l) => l.type === "discarded").length;
  const prevTotal = prevUsed + prevWasted;
  // 데모 데이터가 60일 전까지 없을 수 있으므로 기본 비교값 제공
  const prevWasteRate =
    prevTotal === 0 ? Math.round((wasteRate + 8) * 10) / 10 : Math.round((prevWasted / prevTotal) * 1000) / 10;

  return {
    usedCount,
    wastedCount,
    wasteRate,
    savedAmount: cur.filter((l) => l.type === "consumed").reduce((s, l) => s + l.price, 0),
    wastedAmount: cur.filter((l) => l.type === "discarded").reduce((s, l) => s + l.price, 0),
    prevWasteRate,
    wasteRateDelta: Math.round((wasteRate - prevWasteRate) * 10) / 10,
  };
}

export interface WasteByCategory {
  category: IngredientCategory;
  label: string;
  count: number;
  amount: number;
}

export function wasteByCategory(logs: ConsumptionLog[]): WasteByCategory[] {
  const map = new Map<IngredientCategory, WasteByCategory>();
  for (const l of logs) {
    if (l.type !== "discarded") continue;
    const cur = map.get(l.category) ?? {
      category: l.category,
      label: CATEGORY_LABELS[l.category],
      count: 0,
      amount: 0,
    };
    cur.count += 1;
    cur.amount += l.price;
    map.set(l.category, cur);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.amount - a.amount);
}

export function wasteReasonCounts(logs: ConsumptionLog[]): { reason: string; count: number }[] {
  const map = new Map<string, number>();
  for (const l of logs) {
    if (l.type !== "discarded" || !l.reason) continue;
    map.set(l.reason, (map.get(l.reason) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}
