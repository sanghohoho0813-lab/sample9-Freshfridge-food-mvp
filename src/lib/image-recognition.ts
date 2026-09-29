import type { IngredientCategory } from "./types";

export interface RecognizedIngredient {
  name: string;
  emoji: string;
  category: IngredientCategory;
  quantity: number;
  unit: string;
  suggestedExpiryDays: number;
}

/**
 * 식재료 사진 인식 Demo.
 * 추후 실제 Vision API(예: Claude Vision)로 교체할 수 있도록 함수만 분리해둔다.
 * 현재는 데모 인식 결과를 반환한다.
 */
export async function recognizeIngredientsFromImage(
  // 실제 Vision API 연동 시 사용할 인자 — 데모에서는 아직 읽지 않는다
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _file: File
): Promise<RecognizedIngredient[]> {
  // 실제 API 연동 전까지는 인식 데모 결과를 반환
  await new Promise((r) => setTimeout(r, 1400));
  return [
    { name: "우유", emoji: "🥛", category: "dairy", quantity: 1, unit: "팩", suggestedExpiryDays: 7 },
    { name: "계란", emoji: "🥚", category: "egg", quantity: 10, unit: "개", suggestedExpiryDays: 21 },
    { name: "토마토", emoji: "🍅", category: "vegetable", quantity: 3, unit: "개", suggestedExpiryDays: 5 },
  ];
}
