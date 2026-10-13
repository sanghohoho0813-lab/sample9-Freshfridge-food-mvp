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
  const today = todayStart();
  return summaryBetween(
    logs,
    cooks,
    toISODate(addDays(today, -oldestDaysAgo)),
    toISODate(addDays(today, -newestDaysAgo))
  );
}

/** from ~ to (YYYY-MM-DD, 양끝 포함) 사이의 기록 요약 */
export function summaryBetween(logs: ConsumptionLog[], cooks: CookLog[], from: string, to: string): PeriodSummary {
  const within = (d: string) => d >= from && d <= to;
  const inPeriod = logs.filter((l) => within(l.date));
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
    cookCount: cooks.filter((c) => within(c.date)).length,
  };
}

export interface MonthSpan {
  /** 이번 달 1일 ~ 오늘 */
  from: string;
  to: string;
  month: number;
  /** 지난달 같은 기간 (1일 ~ 같은 날짜, 지난달이 짧으면 말일까지) */
  prevFrom: string;
  prevTo: string;
  prevMonth: number;
  /** 오늘이 이번 달 며칠째인가 */
  day: number;
}

export function monthSpan(today: Date = todayStart()): MonthSpan {
  const y = today.getFullYear();
  const m = today.getMonth();
  const day = today.getDate();
  const prevLastDay = new Date(y, m, 0).getDate();
  return {
    from: toISODate(new Date(y, m, 1)),
    to: toISODate(today),
    month: m + 1,
    prevFrom: toISODate(new Date(y, m - 1, 1)),
    prevTo: toISODate(new Date(y, m - 1, Math.min(day, prevLastDay))),
    prevMonth: ((m + 11) % 12) + 1,
    day,
  };
}

export interface MonthCompare {
  span: MonthSpan;
  current: PeriodSummary;
  /** 지난달 같은 기간 — 그 기간에 기록이 하나도 없으면 null (비교를 지어내지 않는다) */
  previous: PeriodSummary | null;
}

/** 이번 달(1일~오늘)과 지난달 같은 기간을 비교 — 날짜 수를 맞춰야 공정하다 */
export function monthCompare(logs: ConsumptionLog[], cooks: CookLog[], today: Date = todayStart()): MonthCompare {
  const span = monthSpan(today);
  const current = summaryBetween(logs, cooks, span.from, span.to);
  const prev = summaryBetween(logs, cooks, span.prevFrom, span.prevTo);
  return { span, current, previous: prev.usedCount + prev.wastedCount > 0 ? prev : null };
}

export interface FoodWaste {
  name: string;
  count: number;
  amount: number;
  /** 가장 많았던 버린 이유 */
  topReason: string | null;
}

/** 기간 안에 버린 식재료를 이름별로 (많이 버린 순) */
export function wasteByFood(logs: ConsumptionLog[], from: string, to: string): FoodWaste[] {
  const map = new Map<string, { count: number; amount: number; reasons: Map<string, number> }>();
  for (const l of logs) {
    if (l.type !== "discarded" || l.date < from || l.date > to) continue;
    const cur = map.get(l.ingredientName) ?? { count: 0, amount: 0, reasons: new Map<string, number>() };
    cur.count += 1;
    cur.amount += l.price;
    if (l.reason) cur.reasons.set(l.reason, (cur.reasons.get(l.reason) ?? 0) + 1);
    map.set(l.ingredientName, cur);
  }
  return [...map.entries()]
    .map(([name, v]) => ({
      name,
      count: v.count,
      amount: v.amount,
      topReason: [...v.reasons.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    }))
    .sort((a, b) => b.count - a.count || b.amount - a.amount);
}

/** 기간 안의 버린 이유별 횟수 */
export function wasteReasonsBetween(
  logs: ConsumptionLog[],
  from: string,
  to: string
): { reason: string; count: number; amount: number }[] {
  const map = new Map<string, { count: number; amount: number }>();
  for (const l of logs) {
    if (l.type !== "discarded" || l.date < from || l.date > to) continue;
    const key = l.reason ?? "기타";
    const cur = map.get(key) ?? { count: 0, amount: 0 };
    cur.count += 1;
    cur.amount += l.price;
    map.set(key, cur);
  }
  return [...map.entries()].map(([reason, v]) => ({ reason, ...v })).sort((a, b) => b.count - a.count);
}

/** 마지막으로 재료를 버린 뒤 며칠이 지났는가 (버린 기록이 없으면 null) */
export function daysSinceLastWaste(logs: ConsumptionLog[], today: Date = todayStart()): number | null {
  const last = logs
    .filter((l) => l.type === "discarded")
    .reduce<string | null>((m, l) => (!m || l.date > m ? l.date : m), null);
  if (!last) return null;
  const [y, mo, d] = last.split("-").map(Number);
  return Math.max(0, Math.round((today.getTime() - new Date(y, mo - 1, d).getTime()) / 86_400_000));
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
