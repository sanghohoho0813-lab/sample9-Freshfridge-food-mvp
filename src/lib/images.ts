/**
 * 식재료·레시피 이미지 경로 매핑.
 * 식재료 이미지는 1:1, 레시피 대표이미지는 4:3 / 16:9 슬롯에 사용한다.
 */

const INGREDIENT_SLUGS: Record<string, string> = {
  우유: "milk",
  두부: "tofu",
  새송이버섯: "king-oyster-mushroom",
  버섯: "king-oyster-mushroom",
  느타리버섯: "king-oyster-mushroom",
  시금치: "spinach",
  상추: "lettuce",
  대파: "green-onion",
  양파: "onion",
  감자: "potato",
  당근: "carrot",
  토마토: "tomato",
  애호박: "zucchini",
  청양고추: "chili-pepper",
  고추: "chili-pepper",
  김치: "kimchi",
  계란: "egg",
  체다치즈: "cheddar-cheese",
  치즈: "cheddar-cheese",
  요거트: "yogurt",
  버터: "butter",
  "돼지고기 앞다리살": "pork-shoulder",
  돼지고기: "pork-shoulder",
  닭가슴살: "chicken-breast",
  "다진 소고기": "ground-beef",
  소고기: "ground-beef",
  고등어: "mackerel",
  새우: "shrimp",
  사과: "apple",
  바나나: "banana",
  블루베리: "blueberry",
  레몬: "lemon",
  간장: "soy-sauce",
  고추장: "gochujang",
  된장: "doenjang",
  참기름: "sesame-oil",
  식빵: "bread",
  어묵: "fish-cake",
  우동면: "udon-noodle",
  쌀: "rice",
};

/** 식재료명으로 이미지 경로를 찾는다. 없으면 null (이모지 폴백). */
export function ingredientImage(name: string): string | null {
  const exact = INGREDIENT_SLUGS[name];
  if (exact) return `/images/ingredients/${exact}.png`;

  // 부분 일치 (예: "국내산 두부" → 두부)
  for (const [key, slug] of Object.entries(INGREDIENT_SLUGS)) {
    if (name.includes(key)) return `/images/ingredients/${slug}.png`;
  }
  return null;
}

export function recipeImage(slug: string): string {
  return `/images/recipes/${slug}.png`;
}
