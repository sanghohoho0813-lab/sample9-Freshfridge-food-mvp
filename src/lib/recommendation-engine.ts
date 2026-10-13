import type { Ingredient, Recipe } from "./types";
import { rankRecipes, type RecipeMatch } from "./recipe-matcher";

/**
 * 추천 레이어 — 화면은 이 함수들만 쓴다.
 * 지금은 규칙 기반(recipe-matcher 의 scoreMatch)이고, 나중에 다른 추천 방식으로 바꿔도 화면은 그대로다.
 */
export function recommendRecipes(
  recipes: Recipe[],
  fridge: Ingredient[],
  limit = 3,
  { readyOnly = true }: { readyOnly?: boolean } = {}
): RecipeMatch[] {
  return rankRecipes(recipes, fridge)
    .filter((m) => (readyOnly ? m.readyToCook : m.ownedCount > 0))
    .slice(0, limit);
}

/** 특정 재료를 쓰는 요리 — 우선소비 화면의 "이걸로 만들 수 있어요" */
export function recipesUsing(name: string, recipes: Recipe[], fridge: Ingredient[], limit = 2): RecipeMatch[] {
  return rankRecipes(recipes, fridge)
    .filter((m) => m.matched.some((x) => x.owned && x.consume > 0 && x.ingredient?.name === name))
    .sort((a, b) => Number(b.readyToCook) - Number(a.readyToCook) || b.score - a.score)
    .slice(0, limit);
}
