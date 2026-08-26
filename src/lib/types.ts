export type StorageType = "fridge" | "freezer" | "pantry";

export type IngredientCategory =
  | "vegetable"
  | "fruit"
  | "meat"
  | "seafood"
  | "dairy"
  | "egg"
  | "sauce"
  | "processed"
  | "etc";

export type IngredientStatus =
  | "available"
  | "consume_soon"
  | "urgent"
  | "consumed"
  | "discarded";

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  storage: StorageType;
  purchasedAt: string; // ISO date
  expiresAt: string | null; // ISO date, null = 정보 없음
  memo?: string;
  price: number; // 예상 금액(원) — 절약 리포트 데모용
  status: IngredientStatus;
}

export interface RecipeIngredient {
  name: string; // 식재료명으로 매칭
  amount: string; // 표시용 (예: "1/2모")
  consume: number; // 요리 완료 시 차감 수량
  essential: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  minutes: number;
  difficulty: "쉬움" | "보통" | "어려움";
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  description: string;
}

export type WasteReason =
  | "유통기한 지남"
  | "너무 많이 구매"
  | "먹을 기회 없음"
  | "보관 실패"
  | "기타";

export interface ConsumptionLog {
  id: string;
  ingredientName: string;
  emoji: string;
  category: IngredientCategory;
  type: "consumed" | "discarded";
  date: string; // ISO date
  price: number;
  reason?: WasteReason;
  via?: string; // 레시피명 등
}

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  fromRecipe?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  kind: "expiry" | "recipe" | "tip";
}

export interface AppState {
  userName: string;
  ingredients: Ingredient[];
  logs: ConsumptionLog[];
  shopping: ShoppingItem[];
  notifications: AppNotification[];
  seededAt: string;
}

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  vegetable: "채소",
  fruit: "과일",
  meat: "육류",
  seafood: "수산",
  dairy: "유제품",
  egg: "계란",
  sauce: "소스",
  processed: "가공식품",
  etc: "기타",
};

export const CATEGORY_EMOJIS: Record<IngredientCategory, string> = {
  vegetable: "🥬",
  fruit: "🍎",
  meat: "🥩",
  seafood: "🐟",
  dairy: "🥛",
  egg: "🥚",
  sauce: "🧂",
  processed: "🥫",
  etc: "🧺",
};

export const STORAGE_LABELS: Record<StorageType, string> = {
  fridge: "냉장",
  freezer: "냉동",
  pantry: "실온",
};
