import type { ConsumptionLog, CookLog, IngredientCategory } from "./types";
import { CATEGORY_LABELS } from "./types";
import { addDays, toISODate, todayStart } from "./expiry-calculator";
import { isRescue } from "./demo-data";

/** 오늘 기준 newestDaysAgo ~ oldestDaysAgo 일 전 사이(양끝 포함)인지 */
function inRange(dateISO: string, newestDaysAgo: number, oldestDaysAgo: number): boolean {
  const today = todayStart();
  return dateISO >= toISODate(addDays(today, -oldestDaysAgo)) && dateISO <= toISODate(addDays(today, -newestDaysAgo));
}

export interface PeriodSummary {
  usedCount: number;
  wastedCount: number;
  wasteRate: number; // %
  savedAmount: number; // 버리지 않고 사용한 재료 금액
  wastedAmount: number;
  rescuedCount: number; // D-2 이내 재료를 버리기 전에 먹은 횟수
  cookCount: number;
}

export function periodSummary(
  logs: ConsumptionLog[],
  cooks: CookLog[],
  newestDaysAgo: number,
  oldestDaysAgo: number
): PeriodSummary {
  const inPeriod = logs.filter((l) => inRange(l.date, newestDaysAgo, oldestDaysAgo));
  const used = inPeriod.filter((l) => l.type === "consumed");
  const wasted = inPeriod.filter((l) => l.type === "discarded");
  const total = used.length + wasted.length;
  return {
    usedCount: used.length,
    wastedCount: wasted.length,
    wasteRate: total === 0 ? 0 : Math.round((wasted.length / total) * 1000) / 10,
    savedAmount: used.reduce((s, l) => s + l.price, 0),
    wastedAmount: wasted.reduce((s, l) => s + l.price, 0),
    rescuedCount: used.filter((l) => isRescue(l.dLeft)).length,
    cookCount: cooks.filter((c) => inRange(c.date, newestDaysAgo, oldestDaysAgo)).length,
  };
}

/** 최근 7일 */
export function weeklySummary(logs: ConsumptionLog[], cooks: CookLog[]): PeriodSummary {
  return periodSummary(logs, cooks, 0, 6);
}

export interface MonthlyReport {
  current: PeriodSummary; // 최근 30일
  previous: PeriodSummary | null; // 그 이전 30일 (기록이 없으면 null — 비교를 지어내지 않는다)
  wasteCountDelta: number | null; // 음수면 폐기가 줄어든 것
  wasteRateDelta: number | null; // %p, 음수면 개선
}

export function monthlyReport(logs: ConsumptionLog[], cooks: CookLog[]): MonthlyReport {
  const current = periodSummary(logs, cooks, 0, 29);
  const prev = periodSummary(logs, cooks, 30, 59);
  const hasPrev = prev.usedCount + prev.wastedCount > 0;
  return {
    current,
    previous: hasPrev ? prev : null,
    wasteCountDelta: hasPrev ? current.wastedCount - prev.wastedCount : null,
    wasteRateDelta: hasPrev ? Math.round((current.wasteRate - prev.wasteRate) * 10) / 10 : null,
  };
}

export interface WeekBar {
  label: string;
  used: number;
  wasted: number;
}

/** 최근 N주 사용/폐기 추이 (오래된 주 → 이번 주) */
export function weeklyTrend(logs: ConsumptionLog[], weeks = 4): WeekBar[] {
  const bars: WeekBar[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const newest = w * 7;
    const oldest = newest + 6;
    const inWeek = logs.filter((l) => inRange(l.date, newest, oldest));
    bars.push({
      label: w === 0 ? "이번 주" : `${w}주 전`,
      used: inWeek.filter((l) => l.type === "consumed").length,
      wasted: inWeek.filter((l) => l.type === "discarded").length,
    });
  }
  return bars;
}

export interface WasteByCategory {
  category: IngredientCategory;
  label: string;
  count: number;
  amount: number;
}

/** 최근 days 일 동안 버린 재료를 카테고리별로 */
export function wasteByCategory(logs: ConsumptionLog[], days = 30): WasteByCategory[] {
  const map = new Map<IngredientCategory, WasteByCategory>();
  for (const l of logs) {
    if (l.type !== "discarded" || !inRange(l.date, 0, days - 1)) continue;
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

export function wasteReasonCounts(logs: ConsumptionLog[], days = 30): { reason: string; count: number }[] {
  const map = new Map<string, number>();
  for (const l of logs) {
    if (l.type !== "discarded" || !l.reason || !inRange(l.date, 0, days - 1)) continue;
    map.set(l.reason, (map.get(l.reason) ?? 0) + 1);
  }
  return [...map.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
}

/** 레시피별 마지막으로 만든 날짜 */
export function lastCookedByRecipe(cooks: CookLog[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of cooks) {
    const prev = map.get(c.recipeId);
    if (!prev || c.date > prev) map.set(c.recipeId, c.date);
  }
  return map;
}

/** "3일 전" 같은 상대 날짜 */
export function relativeDay(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const diff = Math.round((todayStart().getTime() - new Date(y, m - 1, d).getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "오늘";
  if (diff === 1) return "어제";
  if (diff < 7) return `${diff}일 전`;
  if (diff < 30) return `${Math.floor(diff / 7)}주 전`;
  return `${Math.floor(diff / 30)}달 전`;
}
