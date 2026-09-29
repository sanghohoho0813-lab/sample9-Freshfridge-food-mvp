import type { Ingredient, Recipe, RecipeIngredient } from "./types";
import { daysLeft } from "./expiry-calculator";

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

function findOwned(name: string, fridge: Ingredient[]): Ingredient | undefined {
  return fridge.find(
    (i) => i.status === "available" && i.quantity > 0 && (i.name === name || i.name.includes(name) || name.includes(i.name))
  );
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
  const urgentOwned = matched.filter(
    (m) => m.owned && m.dLeft !== null && m.dLeft <= 3
  );

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
  return recipes
    .map((r) => matchRecipe(r, fridge))
    .sort((a, b) => b.score - a.score);
}
