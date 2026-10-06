import type { Ingredient, Recipe } from "./types";
import { rankRecipes, type RecipeMatch } from "./recipe-matcher";

/**
 * 홈 화면 추천: 매칭율 + 우선소비 가중치 기반 상위 레시피.
 * 추후 LLM 기반 추천으로 교체할 수 있도록 Layer만 분리해둔다.
 */
export function recommendRecipes(recipes: Recipe[], fridge: Ingredient[], limit = 3): RecipeMatch[] {
  return rankRecipes(recipes, fridge)
    .filter((m) => m.matchPercent >= 40)
    .slice(0, limit);
}

/**
 * 향후 AI API(예: Claude API) 연동 지점.
 * 현재는 Rule Based 추천 결과를 그대로 반환한다.
 */
export async function generateRecipeSuggestion(recipes: Recipe[], fridge: Ingredient[]): Promise<RecipeMatch[]> {
  return recommendRecipes(recipes, fridge);
}
