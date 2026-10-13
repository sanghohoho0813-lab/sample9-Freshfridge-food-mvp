/**
 * 홈·장보기·리포트에서 "지금 무엇을 하면 좋은지"를 고르는 규칙.
 * 모두 저장된 기록·재고에서 계산할 수 있는 사실만 쓴다 (추측해서 지어내지 않는다).
 */
import type { AppState, ConsumptionLog, Ingredient, IngredientCategory, Recipe } from "./types";
import { addDays, daysLeft, sortByExpiry, toISODate, todayStart } from "./expiry-calculator";
import { amountStep, formatAmount } from "./quantity";
import { rankRecipes, type RecipeMatch } from "./recipe-matcher";
import { wasteByFood, type FoodWaste } from "./stats";
import { josa } from "./text";

/* ------------------------------------------------------------------ */
/* 남은 양                                                              */
/* ------------------------------------------------------------------ */

/** 처음 양 대비 남은 비율 (0~1). 아직 손대지 않았으면 1 */
export function remainingRatio(i: Ingredient): number {
  const initial = i.initialQuantity ?? i.quantity;
  if (!(initial > 0)) return 1;
  return Math.max(0, Math.min(1, i.quantity / initial));
}

/**
 * 거의 다 먹었는가 — 처음보다 줄었고, 마지막 한 단위만 남았거나 1/4 이하일 때.
 * (처음부터 1팩만 산 재료를 "떨어져간다"고 하지 않는다)
 */
export function isRunningLow(i: Ingredient): boolean {
  const initial = i.initialQuantity ?? i.quantity;
  if (!(i.quantity > 0) || i.quantity >= initial) return false;
  return i.quantity <= amountStep(i.unit) || i.quantity / initial <= 0.25;
}

/** 최근 days 일 동안 먹은(또는 요리에 쓴) 횟수가 min 번 이상인 재료 */
export function frequentlyEaten(
  logs: ConsumptionLog[],
  { days = 60, min = 2, today = todayStart() }: { days?: number; min?: number; today?: Date } = {}
): Map<string, number> {
  const since = toISODate(addDays(today, -days));
  const counts = new Map<string, number>();
  for (const l of logs) {
    if (l.type !== "consumed" || l.date < since) continue;
    counts.set(l.ingredientName, (counts.get(l.ingredientName) ?? 0) + 1);
  }
  return new Map([...counts].filter(([, n]) => n >= min));
}

/* ------------------------------------------------------------------ */
/* 다시 사야 할 것                                                       */
/* ------------------------------------------------------------------ */

export interface RestockSuggestion {
  name: string;
  /** low: 거의 다 먹음 / out: 자주 먹는데 냉장고에 없음 */
  reason: "low" | "out";
  detail: string;
  ingredient?: Ingredient;
}

/** 장보기에 넣으면 좋은 재료 — 이미 장보기에 있는 것은 뺀다 */
export function restockSuggestions(state: AppState, fridge: Ingredient[], limit = 3): RestockSuggestion[] {
  const pending = new Set(state.shopping.filter((s) => !s.checked).map((s) => s.name));
  const frequent = frequentlyEaten(state.logs);
  const inFridge = new Set(fridge.map((i) => i.name));

  const low: RestockSuggestion[] = fridge
    .filter((i) => isRunningLow(i) && !pending.has(i.name))
    // 같은 재료를 따로 하나 더 가지고 있으면 떨어진 게 아니다
    .filter((i) => !fridge.some((o) => o.id !== i.id && o.name === i.name && !isRunningLow(o)))
    .sort((a, b) => (frequent.get(b.name) ?? 0) - (frequent.get(a.name) ?? 0))
    .map((i) => ({
      name: i.name,
      reason: "low" as const,
      detail: `${formatAmount(i.quantity, i.unit)}만 남았어요`,
      ingredient: i,
    }));

  const out: RestockSuggestion[] = [...frequent.entries()]
    .filter(([name]) => !inFridge.has(name) && !pending.has(name))
    .sort((a, b) => b[1] - a[1])
    .map(([name, n]) => ({ name, reason: "out" as const, detail: `최근 두 달 ${n}번 먹었는데 지금 없어요` }));

  const seen = new Set<string>();
  return [...low, ...out].filter((s) => !seen.has(s.name) && seen.add(s.name)).slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* 오늘 할 일 — 홈 맨 위에 하나만                                          */
/* ------------------------------------------------------------------ */

export type TodayFocus =
  | { kind: "expired"; items: Ingredient[] }
  | { kind: "cook"; when: "today" | "soon"; items: Ingredient[]; match: RecipeMatch }
  | { kind: "eat"; when: "today" | "soon"; items: Ingredient[] }
  | { kind: "restock"; suggestion: RestockSuggestion }
  | { kind: "relaxed"; match?: RecipeMatch };

/**
 * 가장 중요한 행동 하나를 고른다.
 * 1) 기한이 지난 재료 정리  2) 오늘·내일 재료 → 함께 쓸 요리  3) 2~3일 재료 → 요리
 * 4) 다 떨어져가는 재료 장보기  5) 여유
 */
export function todayFocus(state: AppState, fridge: Ingredient[], recipes: Recipe[]): TodayFocus {
  const withD = sortByExpiry(fridge).map((i) => ({ i, d: daysLeft(i.expiresAt) }));
  const expired = withD.filter((x) => x.d !== null && x.d < 0).map((x) => x.i);
  if (expired.length > 0) return { kind: "expired", items: expired };

  const ranked = rankRecipes(recipes, fridge);
  for (const [when, lo, hi] of [
    ["today", 0, 1],
    ["soon", 2, 3],
  ] as const) {
    const items = withD.filter((x) => x.d !== null && x.d >= lo && x.d <= hi).map((x) => x.i);
    if (items.length === 0) continue;
    const ids = new Set(items.map((i) => i.id));
    const uses = (m: RecipeMatch) => m.urgentOwned.filter((u) => u.ingredient && ids.has(u.ingredient.id)).length;
    const best = ranked
      .filter((m) => m.readyToCook && uses(m) > 0)
      .sort((a, b) => uses(b) - uses(a) || b.score - a.score)[0];
    return best ? { kind: "cook", when, items, match: best } : { kind: "eat", when, items };
  }

  const restock = restockSuggestions(state, fridge, 1)[0];
  if (restock) return { kind: "restock", suggestion: restock };
  return { kind: "relaxed", match: ranked.find((m) => m.readyToCook) };
}

/* ------------------------------------------------------------------ */
/* 다음 달에 줄일 수 있는 행동 — 낭비 리포트                                */
/* ------------------------------------------------------------------ */

const STORAGE_TIP: Partial<Record<IngredientCategory, string>> = {
  vegetable: "키친타월로 감싸 밀폐 용기에 넣으면 무르는 걸 늦출 수 있어요.",
  fruit: "씻지 않은 채 보관하고, 먹기 직전에 씻어주세요.",
  dairy: "온도 변화가 큰 문 칸보다 안쪽 칸에 두세요.",
  meat: "바로 먹지 않을 양은 한 번 먹을 만큼 나눠 냉동하세요.",
  seafood: "바로 먹지 않을 양은 한 번 먹을 만큼 나눠 냉동하세요.",
};

export interface WasteAction {
  /** 어떤 재료에 대한 행동인가 */
  name: string;
  title: string;
  detail: string;
  href?: string;
  linkLabel?: string;
}

/**
 * 최근 기록에서 자주 버린 재료와 그 이유를 보고, 다음에 할 수 있는 행동을 최대 3개 만든다.
 * 지금 냉장고에 같은 재료가 있으면 그 재료로 바로 이어준다.
 */
export function wasteActions(
  logs: ConsumptionLog[],
  fridge: Ingredient[],
  { days = 60, today = todayStart() }: { days?: number; today?: Date } = {}
): WasteAction[] {
  const foods: FoodWaste[] = wasteByFood(logs, toISODate(addDays(today, -(days - 1))), toISODate(today));
  const categoryOf = (name: string) => logs.find((l) => l.ingredientName === name)?.category;

  return foods.slice(0, 3).map((f) => {
    const have = sortByExpiry(fridge.filter((i) => i.name === f.name))[0];
    const times = f.count > 1 ? `${f.count}번` : "한 번";
    const linkToFridge = have
      ? {
          href: `/ingredient/${have.id}`,
          linkLabel: `지금 있는 ${f.name} 보기`,
        }
      : {};
    switch (f.topReason) {
      case "너무 많이 구매":
        return {
          name: f.name,
          title: `${josa(f.name, "은/는")} 다음 장보기 때 절반만 사기`,
          detail: `최근 ${times} 너무 많이 사서 버렸어요. 장보기 목록에 담기 전에 냉장고에 남은 양을 먼저 확인해요.`,
          ...linkToFridge,
        };
      case "먹을 기회 없음":
        return {
          name: f.name,
          title: `${josa(f.name, "은/는")} 먹을 날을 정해두고 사기`,
          detail: `최근 ${times} 먹을 기회를 놓쳐 버렸어요. 사 온 날 바로 쓸 요리를 하나 정해두면 좋아요.`,
          ...(have
            ? linkToFridge
            : { href: `/recipes?with=${encodeURIComponent(f.name)}`, linkLabel: `${f.name} 요리 찾아보기` }),
        };
      case "보관 실패":
        return {
          name: f.name,
          title: `${f.name} 보관 방법 바꾸기`,
          detail: STORAGE_TIP[categoryOf(f.name) ?? "etc"] ?? "보관 위치와 포장 상태를 한 번 확인해주세요.",
          ...linkToFridge,
        };
      default:
        return {
          name: f.name,
          title: `${josa(f.name, "은/는")} 기한 하루 전에 먼저 먹기`,
          detail: `최근 ${times} 기한을 넘겨 버렸어요. D-1이 되면 홈 맨 위에 뜨니, 그날 바로 써주세요.`,
          ...(have ? linkToFridge : { href: "/priority", linkLabel: "우선소비 보기" }),
        };
    }
  });
}
