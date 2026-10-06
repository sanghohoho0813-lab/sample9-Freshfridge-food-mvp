import type { Ingredient, Recipe, RecipeIngredient } from "./types";
import { daysLeft } from "./expiry-calculator";
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
  matchPercent: number; // 0~100
  missing: MatchedIngredient[];
  urgentOwned: MatchedIngredient[]; // 보유 중이면서 D-3 이내
  score: number; // 추천 정렬용
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
  const matchPercent = totalCount === 0 ? 0 : Math.round((ownedCount / totalCount) * 100);
  const missing = matched.filter((m) => !m.owned);
  const urgentOwned = matched.filter((m) => m.owned && m.dLeft !== null && m.dLeft <= 3);

  // 기본 점수 = 매칭율, 유통기한 임박 재료 가중치(D-1 이하 +30, D-2 +20, D-3 +10)
  let score = matchPercent;
  for (const m of urgentOwned) {
    if (m.dLeft === null) continue;
    if (m.dLeft <= 1) score += 30;
    else if (m.dLeft === 2) score += 20;
    else if (m.dLeft === 3) score += 10;
  }
  // 필수 재료가 없으면 감점
  const missingEssential = missing.filter((m) => m.essential).length;
  score -= missingEssential * 15;

  return { recipe, matched, ownedCount, totalCount, matchPercent, missing, urgentOwned, score };
}

export function rankRecipes(recipes: Recipe[], fridge: Ingredient[]): RecipeMatch[] {
  return recipes.map((r) => matchRecipe(r, fridge)).sort((a, b) => b.score - a.score);
}
