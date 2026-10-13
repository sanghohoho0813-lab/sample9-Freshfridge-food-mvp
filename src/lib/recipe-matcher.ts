import type { Ingredient, Recipe, RecipeIngredient } from "./types";
import { daysLeft, dDayLabel } from "./expiry-calculator";
import { isInFridge } from "./state/ops";

export interface MatchedIngredient extends RecipeIngredient {
  owned: boolean;
  ingredient?: Ingredient;
  dLeft: number | null;
  /** 가지고는 있지만 레시피 분량보다 적은 경우 */
  short: boolean;
}

export interface RecipeMatch {
  recipe: Recipe;
  matched: MatchedIngredient[];
  ownedCount: number;
  totalCount: number;
  /** 보유 재료 비율 (표시보다는 내부 참고용) */
  matchPercent: number;
  /** 냉장고에 없는 재료 전체 */
  missing: MatchedIngredient[];
  /** 없으면 만들 수 없는 재료 — 사야 하는 것 */
  missingEssential: MatchedIngredient[];
  /** 기한이 3일 안으로 남은 보유 재료 중 이 요리에서 실제로 쓰는 것 (급한 순) */
  urgentOwned: MatchedIngredient[];
  /** 지금 있는 재료만으로 만들 수 있는가 */
  readyToCook: boolean;
  score: number;
}

/** 기한이 빠른 것 먼저 (기한 정보 없는 재료는 뒤로) */
const byExpiry = (a: Ingredient, b: Ingredient) =>
  (daysLeft(a.expiresAt) ?? Infinity) - (daysLeft(b.expiresAt) ?? Infinity);

/**
 * 레시피 재료명에 맞는 냉장고 재료를 찾는다.
 * 같은 이름이 우선이고("우유" 두 팩이면 기한이 빠른 것), 없을 때만 부분 일치("돼지고기" ↔ "돼지고기 앞다리살").
 */
export function findOwned(name: string, fridge: Ingredient[]): Ingredient | undefined {
  const usable = fridge.filter(isInFridge);
  const exact = usable.filter((i) => i.name === name).sort(byExpiry);
  if (exact.length > 0) return exact[0];
  return usable
    .filter((i) => Math.min(i.name.length, name.length) >= 2 && (i.name.includes(name) || name.includes(i.name)))
    .sort(byExpiry)[0];
}

/** 남은 일수별 "지금 써야 하는 정도" — 오늘·내일이 가장 크고, 이미 지난 재료는 권하지 않는다 */
export function urgencyWeight(d: number | null): number {
  if (d === null || d > 3) return 0;
  if (d < 0) return 1;
  if (d <= 1) return 3;
  return d === 2 ? 2 : 1;
}

/**
 * 추천 점수 — 설명할 수 있는 요소만 쓴다.
 *  1) 급한 재료를 얼마나 쓰는가 (가장 큰 비중)
 *  2) 꼭 필요한데 없는 재료(사야 하는 것)가 몇 개인가
 *  3) 있으면 좋은 재료가 몇 개 빠졌는가
 *  4) 조리 시간 (같은 조건이면 빠른 요리 먼저)
 */
export function scoreMatch(m: Pick<RecipeMatch, "urgentOwned" | "missingEssential" | "missing" | "recipe">): number {
  const urgency = m.urgentOwned.reduce((s, x) => s + urgencyWeight(x.dLeft), 0);
  const optionalMissing = m.missing.length - m.missingEssential.length;
  return urgency * 15 - m.missingEssential.length * 25 - optionalMissing * 3 - m.recipe.minutes / 10;
}

export function matchRecipe(recipe: Recipe, fridge: Ingredient[]): RecipeMatch {
  const matched: MatchedIngredient[] = recipe.ingredients.map((ri) => {
    const owned = findOwned(ri.name, fridge);
    return {
      ...ri,
      owned: Boolean(owned),
      ingredient: owned,
      dLeft: owned ? daysLeft(owned.expiresAt) : null,
      short: Boolean(owned && ri.consume > 0 && owned.quantity < ri.consume),
    };
  });

  const ownedCount = matched.filter((m) => m.owned).length;
  const totalCount = matched.length;
  const missing = matched.filter((m) => !m.owned);
  const missingEssential = missing.filter((m) => m.essential);
  // 양념처럼 차감하지 않는 재료는 "급한 재료를 쓴다"로 치지 않는다
  const urgentOwned = matched
    .filter((m) => m.owned && m.consume > 0 && urgencyWeight(m.dLeft) > 0)
    .sort((a, b) => (a.dLeft ?? 99) - (b.dLeft ?? 99));

  const base = {
    recipe,
    matched,
    ownedCount,
    totalCount,
    matchPercent: totalCount === 0 ? 0 : Math.round((ownedCount / totalCount) * 100),
    missing,
    missingEssential,
    urgentOwned,
    readyToCook: missingEssential.length === 0,
  };
  return { ...base, score: scoreMatch(base) };
}

export function rankRecipes(recipes: Recipe[], fridge: Ingredient[]): RecipeMatch[] {
  return recipes.map((r) => matchRecipe(r, fridge)).sort((a, b) => b.score - a.score);
}

export interface MatchReason {
  /** "두부 D-1 · 새송이버섯 D-2 사용" — 급한 재료가 없으면 null */
  urgent: string | null;
  /** "재료 다 있어요" / "바나나만 사면 돼요" / "바나나 외 1개 필요" */
  shopping: string;
  /** 사지 않아도 되는가 */
  ready: boolean;
  minutes: string;
}

/** 카드·상세에 보여줄 추천 근거 (데이터로 확인되는 사실만) */
export function explainMatch(m: RecipeMatch): MatchReason {
  const urgent =
    m.urgentOwned.length === 0
      ? null
      : `${m.urgentOwned
          .slice(0, 2)
          .map((x) => `${x.name} ${dDayLabel(x.ingredient?.expiresAt ?? null)}`)
          .join(" · ")}${m.urgentOwned.length > 2 ? ` 외 ${m.urgentOwned.length - 2}개` : ""} 사용`;
  const need = m.missingEssential;
  const shopping =
    need.length === 0
      ? "재료 다 있어요"
      : need.length === 1
        ? `${need[0].name}만 사면 돼요`
        : `${need[0].name} 외 ${need.length - 1}개 필요`;
  return { urgent, shopping, ready: need.length === 0, minutes: `${m.recipe.minutes}분` };
}
